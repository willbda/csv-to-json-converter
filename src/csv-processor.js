const { parse } = require('papaparse');
const Utils = require('./utils');
const CONSTANTS = require('./constants');

/**
 * CSV Processing and Data Management
 * Handles CSV parsing, validation, and data structure operations
 */
class CSVProcessor {
  constructor() {
    this.csvData = null;
    this.csvColumns = [];
    this.fileName = '';
    this.parseErrors = [];
    this.parseWarnings = [];
  }

  /**
   * Parse CSV content
   * @param {string} content - Raw CSV content
   * @param {string} fileName - Name of the source file
   * @returns {Promise<object>} Parse results
   */
  async parseCSV(content, fileName) {
    try {
      this.fileName = fileName;
      
      // Validate content
      if (!content || typeof content !== 'string') {
        throw new Error('Invalid CSV content provided');
      }

      if (content.trim().length === 0) {
        throw new Error('CSV file is empty');
      }

      // Parse with PapaParse
      const parseResult = parse(content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        delimitersToGuess: [',', '\\t', '|', ';']
      });

      // Store results
      this.csvData = parseResult.data;
      this.csvColumns = parseResult.meta.fields || [];
      this.parseErrors = parseResult.errors || [];
      
      // Process warnings
      this.parseWarnings = [];
      if (parseResult.errors.length > 0) {
        this.parseWarnings = parseResult.errors
          .filter(error => error.type !== 'Delimiter')
          .map(error => `Row ${error.row}: ${error.message}`);
      }

      // Validate columns
      const validation = Utils.validateDataviewColumns(this.csvColumns);
      this.parseWarnings.push(...validation.warnings);

      // Additional validations
      this._validateData();

      return {
        success: true,
        rowCount: this.csvData.length,
        columnCount: this.csvColumns.length,
        warnings: this.parseWarnings,
        errors: this.parseErrors
      };

    } catch (error) {
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
   * Validate parsed data
   * @private
   */
  _validateData() {
    if (!this.csvData || this.csvData.length === 0) {
      throw new Error('No data rows found in CSV');
    }

    if (!this.csvColumns || this.csvColumns.length === 0) {
      throw new Error('No column headers found in CSV');
    }

    // Check for duplicate column names
    const duplicates = this._findDuplicateColumns();
    if (duplicates.length > 0) {
      this.parseWarnings.push(`Duplicate column names found: ${duplicates.join(', ')}`);
    }

    // Check data consistency
    const inconsistencies = this._checkDataConsistency();
    if (inconsistencies.length > 0) {
      this.parseWarnings.push(...inconsistencies);
    }
  }

  /**
   * Find duplicate column names
   * @private
   * @returns {string[]} Array of duplicate column names
   */
  _findDuplicateColumns() {
    const seen = new Set();
    const duplicates = new Set();

    this.csvColumns.forEach(col => {
      if (seen.has(col)) {
        duplicates.add(col);
      } else {
        seen.add(col);
      }
    });

    return Array.from(duplicates);
  }

  /**
   * Check data consistency
   * @private
   * @returns {string[]} Array of consistency warnings
   */
  _checkDataConsistency() {
    const warnings = [];
    
    // Check for completely empty columns
    const emptyColumns = this.csvColumns.filter(col => {
      return this.csvData.every(row => Utils.isEmpty(row[col]));
    });
    
    if (emptyColumns.length > 0) {
      warnings.push(`Empty columns detected: ${emptyColumns.join(', ')}`);
    }

    // Check for mostly empty columns (>90% empty)
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
   * Generate preview data for structure building
   * @param {number} maxRows - Maximum rows to include in preview
   * @returns {object} Preview data
   */
  generatePreview(maxRows = CONSTANTS.MAX_PREVIEW_ROWS) {
    if (!this.csvData || this.csvData.length === 0) {
      return { columns: [], preview: [], totalRows: 0 };
    }

    const previewRows = this.csvData.slice(0, maxRows);
    
    return {
      columns: this.csvColumns,
      preview: previewRows,
      totalRows: this.csvData.length,
      fileName: this.fileName
    };
  }

  /**
   * Process data according to structure configuration
   * @param {object} config - Processing configuration
   * @returns {object} Processed data
   */
  processData(config) {
    const { structure, excludedColumns, outputFormat } = config;
    
    if (!this.csvData || structure.length === 0) {
      throw new Error('No data or structure configuration provided');
    }

    // Validate structure columns exist
    const missingColumns = structure.filter(col => !this.csvColumns.includes(col));
    if (missingColumns.length > 0) {
      throw new Error(`Structure references missing columns: ${missingColumns.join(', ')}`);
    }

    // Get data columns (not in structure or excluded)
    const dataColumns = this.csvColumns.filter(col => 
      !structure.includes(col) && !excludedColumns.includes(col)
    );

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
   * Process data to JSON structure
   * @private
   */
  _processToJSON(structure, dataColumns, excludedColumns) {
    const result = {
      metadata: {
        sourceFile: this.fileName,
        structure: structure.join(' → '),
        dataColumns: dataColumns,
        excludedColumns: excludedColumns,
        totalEntries: this.csvData.length,
        generated: new Date().toISOString()
      },
      data: {}
    };

    // Process each row
    this.csvData.forEach((row, index) => {
      let current = result.data;

      // Navigate/create structure
      structure.forEach((col, level) => {
        const key = this._generateKey(row[col], col, index);

        if (level === structure.length - 1) {
          // Leaf level - store data
          const dataObject = {};
          
          dataColumns.forEach(dataCol => {
            dataObject[dataCol] = row[dataCol];
          });
          
          dataObject._metadata = { 
            sourceRow: index + 1,
            structurePath: structure.map(structCol => row[structCol]).join(' → ')
          };
          
          current[key] = dataObject;
        } else {
          // Intermediate level
          current[key] = current[key] || {};
          current = current[key];
        }
      });
    });

    return result;
  }

  /**
   * Process data for markdown generation
   * @private
   */
  _processToMarkdownData(structure, dataColumns, excludedColumns, outputFormat) {
    const markdownData = [];

    this.csvData.forEach((row, index) => {
      // Generate filename components
      const filenameParts = structure.map(col => {
        const value = row[col] || `Empty_${col}`;
        return Utils.generateSafeFilename(String(value));
      });

      const filename = filenameParts.join(' - ') + '.md';

      // Prepare data for markdown generation
      const rowData = {
        filename,
        sourceRow: index + 1,
        structureData: {},
        contentData: {},
        allData: { ...row }
      };

      // Structure data
      structure.forEach(col => {
        rowData.structureData[col] = row[col];
      });

      // Content data  
      dataColumns.forEach(col => {
        rowData.contentData[col] = row[col];
      });

      markdownData.push(rowData);
    });

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
   * Generate a safe key for JSON structure
   * @private
   */
  _generateKey(value, columnName, rowIndex) {
    if (Utils.isEmpty(value)) {
      return `Empty_${columnName}_${rowIndex}`;
    }
    
    const str = String(value).trim();
    return str || `Empty_${columnName}_${rowIndex}`;
  }

  /**
   * Get current data statistics
   * @returns {object} Statistics object
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
   * Clear all data
   */
  clear() {
    this.csvData = null;
    this.csvColumns = [];
    this.fileName = '';
    this.parseErrors = [];
    this.parseWarnings = [];
  }

  // Getters
  get data() { return this.csvData; }
  get columns() { return this.csvColumns; }
  get name() { return this.fileName; }
  get errors() { return this.parseErrors; }
  get warnings() { return this.parseWarnings; }
  get hasData() { return this.csvData && this.csvData.length > 0; }
}

module.exports = CSVProcessor;
