/**
 * LEARNING NOTE: The Controller Pattern
 * 
 * This is the "brain" of the application. It doesn't do the work itself,
 * but it coordinates between different modules and manages state.
 * 
 * Think of it like a conductor of an orchestra:
 * - CSVProcessor = violin section (handles CSV data)
 * - OutputGenerator = brass section (creates outputs)
 * - TemplateManager = percussion (handles templates)
 * - Controller = conductor (coordinates everything)
 * 
 * Benefits:
 * - UI doesn't need to know about CSV parsing details
 * - CSV parsing doesn't need to know about UI state
 * - Each piece can be tested independently
 * - Easy to swap out implementations
 */

const CSVProcessor = require('./csv-processor');
const OutputGenerator = require('./output-generator');
const TemplateManager = require('./template-manager');
const Utils = require('./utils');
const CONSTANTS = require('./constants');

class CSVConverterController {
  constructor(app, plugin) {
    this.app = app;      // Obsidian app reference
    this.plugin = plugin; // Plugin instance
    
    // LEARNING: Composition over inheritance
    // Instead of making Controller extend CSVProcessor, we compose it with instances
    this.csvProcessor = new CSVProcessor();
    this.outputGenerator = new OutputGenerator(app);
    this.templateManager = new TemplateManager(plugin);
    
    // LEARNING: State management in controller
    // The controller keeps track of user choices and current state
    this.state = {
      currentStructure: [],                           // User's column arrangement
      excludedColumns: [],                            // Columns to ignore
      outputFormat: CONSTANTS.OUTPUT_FORMATS.JSON,   // Default output format
      outputFolder: '',                               // Where to save files
      lastProcessedData: null                         // Cache of last result
    };
    
    // LEARNING: Event system for loose coupling
    // Instead of tight coupling, we use events to notify interested parties
    this.listeners = new Map();
  }

  /**
   * LEARNING: Initialization pattern
   * Some setup needs to happen after construction (like loading saved data)
   */
  async initialize() {
    await this.templateManager.loadTemplates();
    this.emit('initialized');  // Tell anyone listening that we're ready
  }

  /**
   * LEARNING: File loading with error handling
   * Notice how this method handles both success and failure gracefully
   */
  async loadCSVFile(file) {
    try {
      // LEARNING: Delegate file reading to Obsidian API
      const content = await this.app.vault.read(file);
      
      // LEARNING: Delegate CSV processing to our CSVProcessor
      const result = await this.csvProcessor.parseCSV(content, file.basename);
      
      if (result.success) {
        // LEARNING: Reset state when loading new file
        this.state.currentStructure = [];
        this.state.excludedColumns = [];
        
        // LEARNING: Emit event with data - UI can listen and update itself
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
   * LEARNING: Simple delegation method
   * Controller doesn't need to know HOW to get CSV files, just that it needs them
   */
  getCSVFiles() {
    return this.app.vault.getFiles()
      .filter(file => file.extension === 'csv')
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  /**
   * LEARNING: State management with event notification
   * When state changes, notify anyone who cares
   */
  updateStructure(structure, excluded = []) {
    // LEARNING: Array spread operator for safe copying
    this.state.currentStructure = [...structure];
    this.state.excludedColumns = [...excluded];
    
    // LEARNING: Emit structured event data
    this.emit('structureChanged', {
      structure: this.state.currentStructure,
      excluded: this.state.excludedColumns,
      isValid: this.isStructureValid()
    });
  }

  /**
   * LEARNING: Command pattern methods
   * Each user action becomes a method that modifies state and emits events
   */
  addToStructure(column, position = -1) {
    // LEARNING: Input validation
    if (!this.csvProcessor.columns.includes(column)) {
      throw new Error(`Column "${column}" not found in CSV data`);
    }

    // LEARNING: Remove from excluded if present (mutual exclusivity)
    this.state.excludedColumns = this.state.excludedColumns.filter(col => col !== column);

    // LEARNING: Array insertion at specific position
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

  removeFromStructure(column) {
    this.state.currentStructure = this.state.currentStructure.filter(col => col !== column);
    
    this.emit('structureChanged', {
      structure: this.state.currentStructure,
      excluded: this.state.excludedColumns,
      isValid: this.isStructureValid()
    });
  }

  addToExcluded(column) {
    if (!this.csvProcessor.columns.includes(column)) {
      throw new Error(`Column "${column}" not found in CSV data`);
    }

    // LEARNING: Remove from structure if present
    this.state.currentStructure = this.state.currentStructure.filter(col => col !== column);

    // LEARNING: Avoid duplicates
    if (!this.state.excludedColumns.includes(column)) {
      this.state.excludedColumns.push(column);
    }

    this.emit('structureChanged', {
      structure: this.state.currentStructure,
      excluded: this.state.excludedColumns,
      isValid: this.isStructureValid()
    });
  }

  removeFromExcluded(column) {
    this.state.excludedColumns = this.state.excludedColumns.filter(col => col !== column);
    
    this.emit('structureChanged', {
      structure: this.state.currentStructure,
      excluded: this.state.excludedColumns,
      isValid: this.isStructureValid()
    });
  }

  /**
   * LEARNING: Preset application
   * Shows how to use constants for configuration
   */
  applyPreset(presetId) {
    const preset = CONSTANTS.PRESETS[presetId.toUpperCase()];
    if (!preset) {
      throw new Error(`Unknown preset: ${presetId}`);
    }

    let structure = [];
    
    if (preset.id === 'simple') {
      // LEARNING: Array.slice for taking first N elements
      structure = this.csvProcessor.columns.slice(0, 2);
    } else {
      // LEARNING: Array.filter to find matching columns
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

  clearStructure() {
    this.updateStructure([], []);
  }

  /**
   * LEARNING: Format selection with validation
   */
  setOutputFormat(format) {
    if (!Object.values(CONSTANTS.OUTPUT_FORMATS).includes(format)) {
      throw new Error(`Invalid output format: ${format}`);
    }

    this.state.outputFormat = format;
    this.emit('outputFormatChanged', format);
  }

  setOutputFolder(folder) {
    this.state.outputFolder = folder;
  }

  /**
   * LEARNING: Delegation to appropriate module
   * Controller doesn't generate previews, it delegates to OutputGenerator
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
   * LEARNING: Main processing coordination
   * Controller orchestrates the work but doesn't do it
   */
  async processData() {
    if (!this.csvProcessor.hasData) {
      throw new Error('No CSV data loaded');
    }

    if (!this.isStructureValid()) {
      throw new Error('Invalid structure configuration');
    }

    try {
      // LEARNING: Delegate processing to CSVProcessor
      const processedData = this.csvProcessor.processData({
        structure: this.state.currentStructure,
        excludedColumns: this.state.excludedColumns,
        outputFormat: this.state.outputFormat
      });

      this.state.lastProcessedData = processedData;

      let result;
      if (this.state.outputFormat === CONSTANTS.OUTPUT_FORMATS.JSON) {
        // LEARNING: Delegate JSON generation to OutputGenerator
        result = {
          type: 'json',
          content: this.outputGenerator.generateJSON(processedData),
          data: processedData
        };
      } else {
        // LEARNING: Delegate markdown generation
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
   * LEARNING: File saving coordination
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
   * LEARNING: Template management delegation
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

  loadTemplate(name) {
    const template = this.templateManager.getTemplate(name);
    if (!template) {
      return false;
    }

    // LEARNING: Template validation against current data
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

  async deleteTemplate(name) {
    const success = await this.templateManager.deleteTemplate(name);
    if (success) {
      this.emit('templateDeleted', name);
    }
    return success;
  }

  // LEARNING: Getter properties for clean access to state
  get csvFiles() { return this.getCSVFiles(); }
  get currentFile() { return this.csvProcessor.name; }
  get columns() { return this.csvProcessor.columns; }
  get hasData() { return this.csvProcessor.hasData; }
  get structure() { return [...this.state.currentStructure]; }  // Safe copy
  get excludedColumns() { return [...this.state.excludedColumns]; }
  get outputFormat() { return this.state.outputFormat; }
  get outputFolder() { return this.state.outputFolder; }
  get templates() { return this.templateManager.getAllTemplates(); }

  /**
   * LEARNING: Computed properties
   * These calculate values based on current state
   */
  getDataColumns() {
    return this.csvProcessor.columns.filter(col =>
      !this.state.currentStructure.includes(col) &&
      !this.state.excludedColumns.includes(col)
    );
  }

  isStructureValid() {
    return this.csvProcessor.hasData && this.state.currentStructure.length > 0;
  }

  getStatistics() {
    const csvStats = this.csvProcessor.getStatistics();
    
    return {
      ...csvStats,  // LEARNING: Spread operator to merge objects
      structureLength: this.state.currentStructure.length,
      excludedCount: this.state.excludedColumns.length,
      dataColumns: this.getDataColumns().length,
      isReady: this.isStructureValid()
    };
  }

  /**
   * LEARNING: Event system implementation
   * This is a simple observer pattern - objects can listen for events
   */
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
    
    // LEARNING: Error handling in event callbacks
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * LEARNING: Cleanup method
   * Good practice to clean up resources when done
   */
  destroy() {
    this.listeners.clear();
    this.csvProcessor.clear();
    this.state.lastProcessedData = null;
  }
}

module.exports = CSVConverterController;
