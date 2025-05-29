const CSVProcessor = require('./csv-processor');
const OutputGenerator = require('./output-generator');
const TemplateManager = require('./template-manager');
const Utils = require('./utils');
const CONSTANTS = require('./constants');

/**
 * Main controller that orchestrates CSV processing workflow
 * Separates business logic from UI components
 */
class CSVConverterController {
  constructor(app, plugin) {
    this.app = app;
    this.plugin = plugin;
    
    // Initialize components
    this.csvProcessor = new CSVProcessor();
    this.outputGenerator = new OutputGenerator(app);
    this.templateManager = new TemplateManager(plugin);
    
    // State management
    this.state = {
      currentStructure: [],
      excludedColumns: [],
      outputFormat: CONSTANTS.OUTPUT_FORMATS.JSON,
      outputFolder: '',
      lastProcessedData: null
    };
    
    // Event listeners
    this.listeners = new Map();
  }

  /**
   * Initialize the controller
   * @returns {Promise<void>}
   */
  async initialize() {
    await this.templateManager.loadTemplates();
    this.emit('initialized');
  }

  /**
   * Load CSV file from vault
   * @param {TFile} file - Obsidian file object
   * @returns {Promise<object>} Load results
   */
  async loadCSVFile(file) {
    try {
      const content = await this.app.vault.read(file);
      const result = await this.csvProcessor.parseCSV(content, file.basename);
      
      if (result.success) {
        // Reset state for new file
        this.state.currentStructure = [];
        this.state.excludedColumns = [];
        this.emit('fileLoaded', {
          file: file,
          columns: this.csvProcessor.columns,
          rowCount: result.rowCount,
          warnings: result.warnings
        });
      }
      
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        error: Utils.getErrorMessage(error)
      };
      this.emit('error', errorResult);
      return errorResult;
    }
  }

  /**
   * Get list of CSV files in vault
   * @returns {TFile[]} Array of CSV files
   */
  getCSVFiles() {
    return this.app.vault.getFiles()
      .filter(file => file.extension === 'csv')
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  /**
   * Update structure configuration
   * @param {string[]} structure - Column names in order
   * @param {string[]} excluded - Excluded column names
   */
  updateStructure(structure, excluded = []) {
    this.state.currentStructure = [...structure];
    this.state.excludedColumns = [...excluded];
    
    this.emit('structureChanged', {
      structure: this.state.currentStructure,
      excluded: this.state.excludedColumns,
      isValid: this.isStructureValid()
    });
  }

  /**
   * Add column to structure
   * @param {string} column - Column name to add
   * @param {number} position - Position to insert (optional)
   */
  addToStructure(column, position = -1) {
    if (!this.csvProcessor.columns.includes(column)) {
      throw new Error(`Column "${column}" not found in CSV data`);
    }

    // Remove from excluded if present
    this.state.excludedColumns = this.state.excludedColumns.filter(col => col !== column);

    // Add to structure
    if (position >= 0 && position < this.state.currentStructure.length) {
      this.state.currentStructure.splice(position, 0, column);
    } else {
      this.state.currentStructure.push(column);
    }

    this.emit('structureChanged', {
      structure: this.state.currentStructure,
      excluded: this.state.excludedColumns,
      isValid: this.isStructureValid()
    });
  }

  /**
   * Remove column from structure
   * @param {string} column - Column name to remove
   */
  removeFromStructure(column) {
    this.state.currentStructure = this.state.currentStructure.filter(col => col !== column);
    
    this.emit('structureChanged', {
      structure: this.state.currentStructure,
      excluded: this.state.excludedColumns,
      isValid: this.isStructureValid()
    });
  }

  /**
   * Add column to excluded list
   * @param {string} column - Column name to exclude
   */
  addToExcluded(column) {
    if (!this.csvProcessor.columns.includes(column)) {
      throw new Error(`Column "${column}" not found in CSV data`);
    }

    // Remove from structure if present
    this.state.currentStructure = this.state.currentStructure.filter(col => col !== column);

    // Add to excluded
    if (!this.state.excludedColumns.includes(column)) {
      this.state.excludedColumns.push(column);
    }

    this.emit('structureChanged', {
      structure: this.state.currentStructure,
      excluded: this.state.excludedColumns,
      isValid: this.isStructureValid()
    });
  }

  /**
   * Remove column from excluded list
   * @param {string} column - Column name to restore
   */
  removeFromExcluded(column) {
    this.state.excludedColumns = this.state.excludedColumns.filter(col => col !== column);
    
    this.emit('structureChanged', {
      structure: this.state.currentStructure,
      excluded: this.state.excludedColumns,
      isValid: this.isStructureValid()
    });
  }

  /**
   * Apply a preset configuration
   * @param {string} presetId - Preset identifier
   */
  applyPreset(presetId) {
    const preset = CONSTANTS.PRESETS[presetId.toUpperCase()];
    if (!preset) {
      throw new Error(`Unknown preset: ${presetId}`);
    }

    let structure = [];
    
    if (preset.id === 'simple') {
      // Simple preset uses first two available columns
      structure = this.csvProcessor.columns.slice(0, 2);
    } else {
      // Other presets try to match specific column names
      structure = preset.columns.filter(col => 
        this.csvProcessor.columns.includes(col)
      );
    }

    this.updateStructure(structure, []);
    
    this.emit('presetApplied', {
      presetId,
      structure,
      matchedColumns: structure.length
    });
  }

  /**
   * Clear all structure configuration
   */
  clearStructure() {
    this.updateStructure([], []);
  }

  /**
   * Set output format
   * @param {string} format - Output format
   */
  setOutputFormat(format) {
    if (!Object.values(CONSTANTS.OUTPUT_FORMATS).includes(format)) {
      throw new Error(`Invalid output format: ${format}`);
    }

    this.state.outputFormat = format;
    this.emit('outputFormatChanged', format);
  }

  /**
   * Set output folder
   * @param {string} folder - Folder path
   */
  setOutputFolder(folder) {
    this.state.outputFolder = folder;
  }

  /**
   * Generate preview content
   * @returns {string} Preview content
   */
  generatePreview() {
    if (!this.isStructureValid()) {
      return 'Configure structure to see preview...';
    }

    const dataColumns = this.getDataColumns();
    return this.outputGenerator.generatePreview(
      this.state.currentStructure,
      dataColumns,
      this.state.outputFormat
    );
  }

  /**
   * Process CSV data with current configuration
   * @returns {Promise<object>} Processing results
   */
  async processData() {
    if (!this.csvProcessor.hasData) {
      throw new Error('No CSV data loaded');
    }

    if (!this.isStructureValid()) {
      throw new Error('Invalid structure configuration');
    }

    try {
      const processedData = this.csvProcessor.processData({
        structure: this.state.currentStructure,
        excludedColumns: this.state.excludedColumns,
        outputFormat: this.state.outputFormat
      });

      this.state.lastProcessedData = processedData;

      let result;
      if (this.state.outputFormat === CONSTANTS.OUTPUT_FORMATS.JSON) {
        result = {
          type: 'json',
          content: this.outputGenerator.generateJSON(processedData),
          data: processedData
        };
      } else {
        // Markdown/Dataview
        const outputFolder = this.state.outputFolder || `Imported/${this.csvProcessor.name}`;
        const markdownResults = await this.outputGenerator.generateMarkdownFiles(processedData, outputFolder);
        
        result = {
          type: 'markdown',
          folder: outputFolder,
          results: markdownResults,
          summary: this.outputGenerator.createSummaryReport(markdownResults, outputFolder)
        };
      }

      this.emit('dataProcessed', result);
      return result;

    } catch (error) {
      const errorResult = {
        success: false,
        error: Utils.getErrorMessage(error)
      };
      this.emit('error', errorResult);
      throw error;
    }
  }

  /**
   * Save output to vault
   * @param {object} processResult - Result from processData()
   * @returns {Promise<string>} Path of saved file
   */
  async saveToVault(processResult) {
    try {
      let savedPath;
      
      if (processResult.type === 'json') {
        const fileName = `${this.csvProcessor.name || 'data'}_structured.json`;
        await this.app.vault.create(fileName, processResult.content);
        savedPath = fileName;
      } else {
        // Markdown - create summary file
        const summaryFile = `${processResult.folder}/_import_summary.md`;
        await this.app.vault.create(summaryFile, processResult.summary);
        savedPath = summaryFile;
      }

      this.emit('fileSaved', savedPath);
      return savedPath;

    } catch (error) {
      throw new Error(`Failed to save to vault: ${Utils.getErrorMessage(error)}`);
    }
  }

  /**
   * Save current structure as template
   * @param {string} name - Template name
   * @param {string} description - Template description
   * @returns {Promise<boolean>} Success status
   */
  async saveTemplate(name, description = '') {
    if (!this.isStructureValid()) {
      throw new Error('Cannot save invalid structure as template');
    }

    const success = await this.templateManager.saveTemplate(name, {
      structure: this.state.currentStructure,
      excluded: this.state.excludedColumns,
      description
    });

    if (success) {
      this.emit('templateSaved', name);
    }

    return success;
  }

  /**
   * Load template by name
   * @param {string} name - Template name
   * @returns {boolean} Success status
   */
  loadTemplate(name) {
    const template = this.templateManager.getTemplate(name);
    if (!template) {
      return false;
    }

    // Validate template against current columns
    const validation = this.templateManager.validateTemplate(name, this.csvProcessor.columns);
    if (!validation.valid) {
      this.emit('templateValidationFailed', {
        name,
        error: validation.error,
        missingColumns: validation.missingColumns
      });
      return false;
    }

    // Apply template
    this.updateStructure(
      validation.availableColumns,
      validation.availableExcluded
    );

    this.emit('templateLoaded', {
      name,
      warnings: validation.warnings
    });

    return true;
  }

  /**
   * Delete template
   * @param {string} name - Template name
   * @returns {Promise<boolean>} Success status
   */
  async deleteTemplate(name) {
    const success = await this.templateManager.deleteTemplate(name);
    if (success) {
      this.emit('templateDeleted', name);
    }
    return success;
  }

  // Getters for state
  get csvFiles() { return this.getCSVFiles(); }
  get currentFile() { return this.csvProcessor.name; }
  get columns() { return this.csvProcessor.columns; }
  get hasData() { return this.csvProcessor.hasData; }
  get structure() { return [...this.state.currentStructure]; }
  get excludedColumns() { return [...this.state.excludedColumns]; }
  get outputFormat() { return this.state.outputFormat; }
  get outputFolder() { return this.state.outputFolder; }
  get templates() { return this.templateManager.getAllTemplates(); }

  /**
   * Get available data columns (not in structure or excluded)
   * @returns {string[]} Available data columns
   */
  getDataColumns() {
    return this.csvProcessor.columns.filter(col =>
      !this.state.currentStructure.includes(col) &&
      !this.state.excludedColumns.includes(col)
    );
  }

  /**
   * Check if current structure is valid
   * @returns {boolean} True if structure is valid
   */
  isStructureValid() {
    return this.csvProcessor.hasData && this.state.currentStructure.length > 0;
  }

  /**
   * Get processing statistics
   * @returns {object} Statistics object
   */
  getStatistics() {
    const csvStats = this.csvProcessor.getStatistics();
    
    return {
      ...csvStats,
      structureLength: this.state.currentStructure.length,
      excludedCount: this.state.excludedColumns.length,
      dataColumns: this.getDataColumns().length,
      isReady: this.isStructureValid()
    };
  }

  // Event system
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.listeners.clear();
    this.csvProcessor.clear();
    this.state.lastProcessedData = null;
  }
}

module.exports = CSVConverterController;
