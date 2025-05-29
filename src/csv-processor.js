/**
 * LEARNING NOTE: Why This Architecture Matters
 * 
 * This file shows a key pattern: separating DATA PROCESSING from UI
 * The CSVProcessor class doesn't know about modals, buttons, or DOM elements
 * It just handles CSV data - this makes it:
 * - Testable (no UI dependencies)
 * - Reusable (could work in Node.js, web workers, etc.)
 * - Focused (single responsibility)
 */

const { parse } = require('papaparse');  // LEARNING: Destructuring import
const Utils = require('./utils');
const CONSTANTS = require('./constants');

/**
 * LEARNING: Class-based organization
 * This class has INSTANCE variables (not static) because each CSV file
 * needs its own data storage. Multiple CSVProcessor instances can exist.
 */
class CSVProcessor {
  constructor() {
    // LEARNING: Instance variables - each instance gets its own copy
    this.csvData = null;        // Parsed CSV rows
    this.csvColumns = [];       // Column names from header row
    this.fileName = '';         // Source filename for reference
    this.parseErrors = [];      // Parsing errors from PapaParse
    this.parseWarnings = [];    // Our custom warnings
  }

  /**
   * LEARNING: Async/await pattern for file processing
   * CSV parsing might be slow for large files, so we make it async
   * This prevents blocking the UI thread
   */
  async parseCSV(content, fileName) {
    try {
      this.fileName = fileName;
      
      // LEARNING: Input validation - fail fast with clear messages
      if (!content || typeof content !== 'string') {
        throw new Error('Invalid CSV content provided');
      }

      if (content.trim().length === 0) {
        throw new Error('CSV file is empty');
      }

      // LEARNING: PapaParse configuration object
      // Each option solves a common CSV parsing problem
      const parseResult = parse(content, {
        header: true,              // First row becomes column names
        dynamicTyping: true,       // Convert "123" to number 123
        skipEmptyLines: true,      // Ignore blank rows
        transformHeader: (header) => header.trim(), // Clean column names
        delimitersToGuess: [',', '\t', '|', ';']   // Try different separators
      });

      // LEARNING: Store results in instance variables
      this.csvData = parseResult.data;
      this.csvColumns = parseResult.meta.fields || [];
      this.parseErrors = parseResult.errors || [];
      
      // LEARNING: Process warnings separately from errors
      this.parseWarnings = [];
      if (parseResult.errors.length > 0) {
        // LEARNING: Array methods - filter and map
        this.parseWarnings = parseResult.errors
          .filter(error => error.type !== 'Delimiter') // Skip delimiter warnings
          .map(error => `Row ${error.row}: ${error.message}`);
      }

      // LEARNING: Additional validation using our Utils
      const validation = Utils.validateDataviewColumns(this.csvColumns);
      this.parseWarnings.push(...validation.warnings); // ...spread operator

      // LEARNING: Private method call - method starts with _
      this._validateData();

      // LEARNING: Return structured result instead of just throwing/not throwing
      return {
        success: true,
        rowCount: this.csvData.length,
        columnCount: this.csvColumns.length,
        warnings: this.parseWarnings,
        errors: this.parseErrors
      };

    } catch (error) {
      // LEARNING: Error handling - reset state and return error info
      this.csvData = null;
      this.csvColumns = [];
      return {
        success: false,
        error: Utils.getErrorMessage(error),
        warnings: [],
        errors: [error]
      };
    }
  }

  /**
   * LEARNING: Private method pattern (convention, not enforced)
   * Methods starting with _ are meant for internal use only
   */
  _validateData() {
    if (!this.csvData || this.csvData.length === 0) {
      throw new Error('No data rows found in CSV');
    }

    if (!this.csvColumns || this.csvColumns.length === 0) {
      throw new Error('No column headers found in CSV');
    }

    // LEARNING: Call other private methods to organize validation
    const duplicates = this._findDuplicateColumns();
    if (duplicates.length > 0) {
      this.parseWarnings.push(`Duplicate column names found: ${duplicates.join(', ')}`);
    }

    const inconsistencies = this._checkDataConsistency();
    if (inconsistencies.length > 0) {
      this.parseWarnings.push(...inconsistencies);
    }
  }

  /**
   * LEARNING: Set-based duplicate detection
   * Sets automatically handle uniqueness for us
   */
  _findDuplicateColumns() {
    const seen = new Set();        // Track what we've seen
    const duplicates = new Set();  // Track duplicates

    this.csvColumns.forEach(col => {
      if (seen.has(col)) {
        duplicates.add(col);  // Already seen = duplicate
      } else {
        seen.add(col);        // First time seeing this
      }
    });

    return Array.from(duplicates); // Convert Set back to Array
  }

  /**
   * LEARNING: Data quality analysis
   * This method shows functional programming patterns
   */
  _checkDataConsistency() {
    const warnings = [];
    
    // LEARNING: Array.filter and Array.every combination
    // Find columns where EVERY row is empty
    const emptyColumns = this.csvColumns.filter(col => {
      return this.csvData.every(row => Utils.isEmpty(row[col]));
    });
    
    if (emptyColumns.length > 0) {
      warnings.push(`Empty columns detected: ${emptyColumns.join(', ')}`);
    }

    // LEARNING: More complex filtering - columns >90% empty
    const sparseColumns = this.csvColumns.filter(col => {
      const emptyCount = this.csvData.filter(row => Utils.isEmpty(row[col])).length;
      return (emptyCount / this.csvData.length) > 0.9;
    });

    if (sparseColumns.length > 0) {
      warnings.push(`Sparse columns (>90% empty): ${sparseColumns.join(', ')}`);
    }

    return warnings;
  }

  /**
   * LEARNING: Data preview for UI
   * Limit the amount of data returned to avoid UI slowdown
   */
  generatePreview(maxRows = CONSTANTS.MAX_PREVIEW_ROWS) {
    if (!this.csvData || this.csvData.length === 0) {
      return { columns: [], preview: [], totalRows: 0 };
    }

    // LEARNING: Array.slice for safe copying
    const previewRows = this.csvData.slice(0, maxRows);
    
    return {
      columns: this.csvColumns,
      preview: previewRows,
      totalRows: this.csvData.length,
      fileName: this.fileName
    };
  }

  /**
   * LEARNING: Main processing method - this is where the magic happens
   * Takes configuration and returns structured data
   */
  processData(config) {
    const { structure, excludedColumns, outputFormat } = config;
    
    if (!this.csvData || structure.length === 0) {
      throw new Error('No data or structure configuration provided');
    }

    // LEARNING: Validation before processing
    const missingColumns = structure.filter(col => !this.csvColumns.includes(col));
    if (missingColumns.length > 0) {
      throw new Error(`Structure references missing columns: ${missingColumns.join(', ')}`);
    }

    // LEARNING: Calculate data columns (columns not used for structure or excluded)
    const dataColumns = this.csvColumns.filter(col => 
      !structure.includes(col) && !excludedColumns.includes(col)
    );

    // LEARNING: Strategy pattern - different processing based on output format
    switch (outputFormat) {
      case CONSTANTS.OUTPUT_FORMATS.JSON:
        return this._processToJSON(structure, dataColumns, excludedColumns);
      case CONSTANTS.OUTPUT_FORMATS.MARKDOWN:
      case CONSTANTS.OUTPUT_FORMATS.DATAVIEW:
        return this._processToMarkdownData(structure, dataColumns, excludedColumns, outputFormat);
      default:
        throw new Error(`Unsupported output format: ${outputFormat}`);
    }
  }

  /**
   * LEARNING: JSON structure building
   * This is the core algorithm that creates nested JSON from flat CSV data
   */
  _processToJSON(structure, dataColumns, excludedColumns) {
    // LEARNING: Create metadata object first
    const result = {
      metadata: {
        sourceFile: this.fileName,
        structure: structure.join(' → '),  // Human-readable structure description
        dataColumns: dataColumns,
        excludedColumns: excludedColumns,
        totalEntries: this.csvData.length,
        generated: new Date().toISOString()
      },
      data: {}
    };

    // LEARNING: Process each CSV row
    this.csvData.forEach((row, index) => {
      let current = result.data;  // Start at the root of our data structure

      // LEARNING: Build nested structure level by level
      structure.forEach((col, level) => {
        const key = this._generateKey(row[col], col, index);

        if (level === structure.length - 1) {
          // LEARNING: Leaf level - this is where we store the actual data
          const dataObject = {};
          
          // Add all the data columns
          dataColumns.forEach(dataCol => {
            dataObject[dataCol] = row[dataCol];
          });
          
          // LEARNING: Add metadata to each data object
          dataObject._metadata = { 
            sourceRow: index + 1,  // 1-based row numbers for humans
            structurePath: structure.map(structCol => row[structCol]).join(' → ')
          };
          
          current[key] = dataObject;
        } else {
          // LEARNING: Intermediate level - create nested object and traverse into it
          current[key] = current[key] || {};  // Create if doesn't exist
          current = current[key];             // Move deeper into structure
        }
      });
    });

    return result;
  }

  /**
   * LEARNING: Markdown data preparation
   * Instead of generating markdown here, we prepare data for the OutputGenerator
   * This separation keeps each class focused on its responsibility
   */
  _processToMarkdownData(structure, dataColumns, excludedColumns, outputFormat) {
    const markdownData = [];

    this.csvData.forEach((row, index) => {
      // LEARNING: Generate filename from structure columns
      const filenameParts = structure.map(col => {
        const value = row[col] || `Empty_${col}`;
        return Utils.generateSafeFilename(String(value));
      });

      const filename = filenameParts.join(' - ') + '.md';

      // LEARNING: Organize data by purpose
      const rowData = {
        filename,
        sourceRow: index + 1,
        structureData: {},  // Data used for structure/hierarchy
        contentData: {},    // Data that goes in content
        allData: { ...row } // Complete row data for reference
      };

      // LEARNING: Separate structure data from content data
      structure.forEach(col => {
        rowData.structureData[col] = row[col];
      });

      dataColumns.forEach(col => {
        rowData.contentData[col] = row[col];
      });

      markdownData.push(rowData);
    });

    // LEARNING: Return structured data package
    return {
      format: outputFormat,
      structure,
      dataColumns,
      excludedColumns,
      sourceFile: this.fileName,
      generated: new Date().toISOString(),
      data: markdownData
    };
  }

  /**
   * LEARNING: Key generation for JSON structure
   * Handles empty/null values gracefully
   */
  _generateKey(value, columnName, rowIndex) {
    if (Utils.isEmpty(value)) {
      return `Empty_${columnName}_${rowIndex}`;  // Unique key for empty values
    }
    
    const str = String(value).trim();
    return str || `Empty_${columnName}_${rowIndex}`;
  }

  /**
   * LEARNING: Statistics for UI display
   * Returns useful information about the current state
   */
  getStatistics() {
    if (!this.csvData) {
      return { hasData: false };
    }

    return {
      hasData: true,
      rowCount: this.csvData.length,
      columnCount: this.csvColumns.length,
      fileName: this.fileName,
      parseWarnings: this.parseWarnings.length,
      parseErrors: this.parseErrors.length
    };
  }

  /**
   * LEARNING: Cleanup method
   * Good practice to provide a way to reset state
   */
  clear() {
    this.csvData = null;
    this.csvColumns = [];
    this.fileName = '';
    this.parseErrors = [];
    this.parseWarnings = [];
  }

  // LEARNING: Getter methods provide clean access to internal state
  // These are read-only properties that external code can access
  get data() { return this.csvData; }
  get columns() { return this.csvColumns; }
  get name() { return this.fileName; }
  get errors() { return this.parseErrors; }
  get warnings() { return this.parseWarnings; }
  get hasData() { return this.csvData && this.csvData.length > 0; }
}

module.exports = CSVProcessor;
