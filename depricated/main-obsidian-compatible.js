/**
 * OBSIDIAN-COMPATIBLE MODULAR VERSION
 * 
 * This version demonstrates modular patterns while working within
 * Obsidian's constraint that you can only require('obsidian') and external packages
 * 
 * Key differences from full modular version:
 * - All modules are in one file but clearly separated
 * - Classes are still focused on single responsibilities  
 * - Easy to split into separate files when you learn bundling
 */

const { Plugin, Modal, Notice, Setting, TFile } = require("obsidian");
const { parse } = require("papaparse");

// =============================================================================
// CONSTANTS MODULE - Configuration and settings
// =============================================================================
const CONSTANTS = {
  DATAVIEW_RESERVED_FIELDS: ["file", "tags", "aliases"],
  TEMPLATE_FOLDER: "CSV Templates",
  OUTPUT_FORMATS: {
    JSON: "json",
    MARKDOWN: "markdown", 
    DATAVIEW: "dataview"
  },
  PRESETS: {
    HIERARCHICAL: {
      id: "hierarchical",
      name: "Hierarchical",
      columns: ["Subject", "Type", "Project", "Item"]
    },
    PROJECT: {
      id: "project", 
      name: "Project-Based",
      columns: ["Project", "Type", "Item"]
    },
    SIMPLE: {
      id: "simple",
      name: "Simple Grouping", 
      columns: []
    }
  },
  CSS_CLASSES: {
    MODAL: "csv-json-modal",
    CONTAINER: "csv-json-container",
    STEP: "csv-json-step",
    COLUMN_TAG: "csv-json-column-tag",
    LEVEL: "csv-json-level",
    DRAGGING: "dragging",
    USED: "used",
    EXCLUDED: "excluded",
    ACTIVE: "active"
  },
  SUPPORTED_EXTENSIONS: ["csv"],
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  MAX_PREVIEW_ROWS: 5,
  BATCH_SIZE: 1000
};

// =============================================================================
// UTILS MODULE - Pure utility functions
// =============================================================================
class Utils {
  /**
   * LEARNING: Static utility methods - no instance needed
   * These are "pure functions" - same input always gives same output
   */
  static sanitizeFieldName(fieldName) {
    if (!fieldName || typeof fieldName !== 'string') {
      return 'unknown_field';
    }
    
    return fieldName
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  static sanitizeTagName(tag) {
    if (!tag || typeof tag !== 'string') {
      return 'unknown';
    }
    
    return tag
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  static escapeYAMLString(str) {
    if (str === null || str === undefined) {
      return '';
    }
    
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }

  static validateDataviewColumns(columns) {
    const warnings = [];
    const errors = [];
    
    columns.forEach(col => {
      if (CONSTANTS.DATAVIEW_RESERVED_FIELDS.includes(col.toLowerCase())) {
        warnings.push(`"${col}" is a reserved Dataview field name`);
      }
      
      if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(col)) {
        warnings.push(`"${col}" contains characters that may cause issues`);
      }
      
      if (!col || col.trim().length === 0) {
        errors.push('Found empty column name');
      }
    });
    
    return { warnings, errors, isValid: errors.length === 0 };
  }

  static generateSafeFilename(str, maxLength = 100) {
    if (!str || typeof str !== 'string') {
      return 'untitled';
    }
    
    const safe = str
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, maxLength);
      
    return safe || 'untitled';
  }

  static isEmpty(value) {
    if (value === null || value === undefined) {
      return true;
    }
    
    if (typeof value === 'string') {
      return value.trim().length === 0;
    }
    
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    
    return false;
  }

  static getErrorMessage(error) {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && error.message) {
      return error.message;
    }
    
    return 'An unknown error occurred';
  }

  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => Utils.deepClone(item));
    }
    
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = Utils.deepClone(obj[key]);
      }
    }
    
    return cloned;
  }
}

// =============================================================================
// CSV PROCESSOR MODULE - Data processing logic
// =============================================================================
class CSVProcessor {
  /**
   * LEARNING: This class has INSTANCE variables because each CSV file
   * needs its own data storage
   */
  constructor() {
    this.csvData = null;
    this.csvColumns = [];
    this.fileName = '';
    this.parseErrors = [];
    this.parseWarnings = [];
  }

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

      // LEARNING: PapaParse configuration
      const parseResult = parse(content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        delimitersToGuess: [',', '\t', '|', ';']
      });

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

      // Additional validation
      const validation = Utils.validateDataviewColumns(this.csvColumns);
      this.parseWarnings.push(...validation.warnings);

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

  _validateData() {
    if (!this.csvData || this.csvData.length === 0) {
      throw new Error('No data rows found in CSV');
    }

    if (!this.csvColumns || this.csvColumns.length === 0) {
      throw new Error('No column headers found in CSV');
    }
  }

  processToJSON(structure, excludedColumns) {
    const dataColumns = this.csvColumns.filter(col => 
      !structure.includes(col) && !excludedColumns.includes(col)
    );

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

    // LEARNING: Build nested JSON structure
    this.csvData.forEach((row, index) => {
      let current = result.data;

      structure.forEach((col, level) => {
        const key = String(row[col] || '').trim() || `Empty_${col}_${index}`;

        if (level === structure.length - 1) {
          // Leaf level - store data
          const dataObject = {};
          dataColumns.forEach(dataCol => {
            dataObject[dataCol] = row[dataCol];
          });
          dataObject._metadata = { sourceRow: index + 1 };
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

  get hasData() { 
    return this.csvData && this.csvData.length > 0; 
  }

  get columns() { 
    return this.csvColumns; 
  }

  get name() { 
    return this.fileName; 
  }

  clear() {
    this.csvData = null;
    this.csvColumns = [];
    this.fileName = '';
    this.parseErrors = [];
    this.parseWarnings = [];
  }
}

// =============================================================================
// TEMPLATE MANAGER MODULE - Template operations
// =============================================================================
class TemplateManager {
  constructor(plugin) {
    this.plugin = plugin;
    this.templates = {};
  }

  async loadTemplates() {
    try {
      const saved = await this.plugin.loadData();
      this.templates = (saved && saved.templates) ? saved.templates : {};
    } catch (error) {
      console.error('Failed to load templates:', error);
      this.templates = {};
    }
  }

  async saveTemplate(name, config) {
    if (!name || typeof name !== 'string') {
      throw new Error('Template name must be a non-empty string');
    }

    if (!config || !config.structure || !Array.isArray(config.structure)) {
      throw new Error('Template must include a valid structure array');
    }

    const template = {
      name: name.trim(),
      structure: [...config.structure],
      excluded: [...(config.excluded || [])],
      created: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      description: config.description || ''
    };

    this.templates[name] = template;
    return await this.saveTemplates();
  }

  async saveTemplates() {
    try {
      await this.plugin.saveData({ templates: this.templates });
      return true;
    } catch (error) {
      console.error('Failed to save templates:', error);
      return false;
    }
  }

  getTemplate(name) {
    const template = this.templates[name];
    if (template) {
      template.lastUsed = new Date().toISOString();
      this.saveTemplates();
      return template;
    }
    return null;
  }

  async deleteTemplate(name) {
    if (this.templates[name]) {
      delete this.templates[name];
      return await this.saveTemplates();
    }
    return true;
  }

  getAllTemplates() {
    return Object.entries(this.templates).map(([name, template]) => ({
      name,
      ...template
    })).sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));
  }
}

// =============================================================================
// MAIN MODAL CLASS - UI and coordination
// =============================================================================
class CSVtoJSONModal extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    
    // LEARNING: Composition - each modal gets its own processor and template manager
    this.csvProcessor = new CSVProcessor();
    this.templateManager = new TemplateManager(plugin);
    
    // State management
    this.currentStructure = [];
    this.excludedColumns = [];
    this.outputFormat = CONSTANTS.OUTPUT_FORMATS.JSON;
    this.outputFolder = '';
    this.lastResult = null;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass(CONSTANTS.CSS_CLASSES.MODAL);

    // LEARNING: Initialize template manager
    await this.templateManager.loadTemplates();

    this.addStyles();
    this.createInterface();
  }

  createInterface() {
    const { contentEl } = this;
    const container = contentEl.createDiv(CONSTANTS.CSS_CLASSES.CONTAINER);

    // Title
    container.createEl("h2", {
      text: "CSV to JSON Converter",
      cls: "csv-json-title",
    });

    // File Selection
    this.createFileSection(container);

    // Structure Builder
    this.createStructureSection(container);

    // Format Selection
    this.createFormatSection(container);

    // Preview
    this.createPreviewSection(container);

    // Output
    this.createOutputSection(container);
  }

  createFileSection(container) {
    const step = container.createDiv(CONSTANTS.CSS_CLASSES.STEP);
    step.createEl("h3", { text: "Step 1: Select CSV File" });

    const fileGrid = step.createDiv("csv-json-file-grid");

    // File list
    const fileSection = fileGrid.createDiv("csv-json-file-section");
    fileSection.createEl("h4", { text: "CSV Files in Vault:" });

    this.fileListEl = fileSection.createDiv("csv-json-file-list");
    this.loadFileList();

    // File preview
    const previewSection = fileGrid.createDiv();
    previewSection.createEl("h4", { text: "File Preview:" });
    this.filePreviewEl = previewSection.createDiv("csv-json-columns-preview");
    this.filePreviewEl.createDiv({ text: "Select a CSV file to see preview..." });
  }

  createStructureSection(container) {
    const step = container.createDiv(CONSTANTS.CSS_CLASSES.STEP);
    step.createEl("h3", { text: "Step 2: Design Structure" });

    // Templates
    this.createTemplateSection(step);

    // Presets
    this.createPresetButtons(step);

    // Available columns
    this.availableColumnsEl = step.createDiv("csv-json-available-columns");
    this.updateAvailableColumns();

    // Structure area
    step.createEl("h4", { text: "Structure (drag columns here):" });
    this.structureEl = step.createDiv("csv-json-nesting-levels");
    this.setupDropZone(this.structureEl, 'structure');

    // Excluded area
    step.createEl("h4", { text: "Excluded Columns:" });
    this.excludedEl = step.createDiv("csv-json-excluded-zone");
    this.setupDropZone(this.excludedEl, 'excluded');

    this.updateStructureDisplay();
  }

  createFormatSection(container) {
    const step = container.createDiv(CONSTANTS.CSS_CLASSES.STEP);
    step.createEl("h3", { text: "Step 3: Choose Output Format" });

    const formatSelector = step.createDiv("csv-json-format-selector");

    Object.entries(CONSTANTS.OUTPUT_FORMATS).forEach(([key, value]) => {
      const option = formatSelector.createDiv("csv-json-format-option");
      if (value === this.outputFormat) {
        option.addClass(CONSTANTS.CSS_CLASSES.ACTIVE);
      }

      const descriptions = {
        json: "Standard JSON format",
        markdown: "Individual markdown files",
        dataview: "Dataview-optimized format"
      };

      option.createEl("strong", { text: key });
      option.createEl("div", { text: descriptions[value] });

      option.addEventListener("click", () => {
        formatSelector.querySelectorAll(".csv-json-format-option")
          .forEach(opt => opt.removeClass(CONSTANTS.CSS_CLASSES.ACTIVE));
        option.addClass(CONSTANTS.CSS_CLASSES.ACTIVE);
        this.outputFormat = value;
        this.updateFormatOptions();
        this.updatePreview();
      });
    });

    this.formatOptionsEl = step.createDiv();
    this.updateFormatOptions();
  }

  createPreviewSection(container) {
    this.previewEl = container.createDiv("csv-json-preview");
    this.previewEl.style.display = "none";

    this.previewEl.createEl("h4", { text: "Preview" });
    this.previewContentEl = this.previewEl.createDiv("csv-json-json-preview");
  }

  createOutputSection(container) {
    this.outputSection = container.createDiv("csv-json-output-section");
    this.outputSection.style.display = "none";

    this.outputSection.createEl("h3", { text: "Generated Output" });

    this.statsEl = this.outputSection.createDiv();
    this.outputContentEl = this.outputSection.createEl("textarea", {
      cls: "csv-json-textarea",
    });
    this.outputContentEl.readOnly = true;

    const controls = this.outputSection.createDiv("csv-json-output-controls");

    // Process button
    this.processBtn = controls.createEl("button", {
      text: "Generate Output",
      cls: "csv-json-process-btn",
    });
    this.processBtn.addEventListener("click", () => this.processData());

    // Save button
    const saveBtn = controls.createEl("button", {
      text: "Save to Vault",
      cls: "csv-json-btn csv-json-btn-primary",
    });
    saveBtn.addEventListener("click", () => this.saveToVault());

    // Copy button
    const copyBtn = controls.createEl("button", {
      text: "Copy to Clipboard",
      cls: "csv-json-btn csv-json-btn-secondary",
    });
    copyBtn.addEventListener("click", () => this.copyToClipboard());

    this.updateProcessButton();
  }

  loadFileList() {
    this.fileListEl.empty();
    const files = this.app.vault.getFiles()
      .filter(file => file.extension === 'csv')
      .sort((a, b) => a.path.localeCompare(b.path));

    if (files.length === 0) {
      this.fileListEl.createDiv({ text: "No CSV files found in vault" });
      return;
    }

    files.forEach(file => {
      const fileItem = this.fileListEl.createDiv("csv-json-file-item");
      fileItem.textContent = file.path;
      fileItem.addEventListener("click", () => this.selectFile(file, fileItem));
    });
  }

  async selectFile(file, element) {
    // Update UI selection
    this.fileListEl.querySelectorAll(".csv-json-file-item")
      .forEach(item => item.removeClass("selected"));
    element.addClass("selected");

    // Load file
    try {
      const content = await this.app.vault.read(file);
      const result = await this.csvProcessor.parseCSV(content, file.basename);
      
      if (result.success) {
        this.currentStructure = [];
        this.excludedColumns = [];
        this.updateFilePreview();
        this.updateUI();
        new Notice(`CSV loaded: ${result.rowCount} rows, ${this.csvProcessor.columns.length} columns`);
      } else {
        new Notice(`Error loading file: ${result.error}`);
      }
    } catch (error) {
      new Notice(`Error reading file: ${error.message}`);
    }
  }

  updateFilePreview() {
    this.filePreviewEl.empty();
    this.filePreviewEl.createEl("h4", { text: "Available Columns:" });

    const display = this.filePreviewEl.createDiv();
    this.csvProcessor.columns.forEach(col => {
      const span = display.createSpan();
      span.textContent = col;
      span.style.background = "var(--background-modifier-border)";
      span.style.padding = "4px 8px";
      span.style.margin = "2px";
      span.style.borderRadius = "4px";
      span.style.display = "inline-block";
    });

    this.updateAvailableColumns();
  }

  // Additional methods for templates, presets, drag/drop, processing, etc.
  // ... (continuing with the essential methods)

  createTemplateSection(container) {
    const templateDiv = container.createDiv();
    templateDiv.createEl("h4", { text: "Templates:" });
    
    this.templateListEl = templateDiv.createDiv("csv-json-template-list");
    this.updateTemplateList();

    const saveBtn = templateDiv.createEl("button", {
      text: "💾 Save Template",
      cls: "csv-json-preset-btn save-template",
    });
    saveBtn.addEventListener("click", () => this.saveCurrentTemplate());
  }

  updateTemplateList() {
    this.templateListEl.empty();
    const templates = this.templateManager.getAllTemplates();

    if (templates.length === 0) {
      this.templateListEl.createDiv({ text: "No saved templates" });
      return;
    }

    templates.forEach(template => {
      const item = this.templateListEl.createDiv("csv-json-template-item");
      
      const nameSpan = item.createSpan({ text: template.name });
      nameSpan.addEventListener("click", () => {
        this.loadTemplate(template.name);
      });

      const deleteBtn = item.createSpan({
        text: "✕",
        cls: "csv-json-template-delete",
      });
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm(`Delete template "${template.name}"?`)) {
          await this.templateManager.deleteTemplate(template.name);
          this.updateTemplateList();
        }
      });
    });
  }

  createPresetButtons(container) {
    const presetButtons = container.createDiv("csv-json-preset-buttons");

    Object.entries(CONSTANTS.PRESETS).forEach(([key, preset]) => {
      const btn = presetButtons.createEl("button", {
        text: preset.name,
        cls: "csv-json-preset-btn",
      });
      btn.addEventListener("click", () => {
        this.applyPreset(preset.id);
      });
    });

    const clearBtn = presetButtons.createEl("button", {
      text: "Clear All",
      cls: "csv-json-preset-btn",
    });
    clearBtn.style.background = "var(--text-error)";
    clearBtn.addEventListener("click", () => {
      this.currentStructure = [];
      this.excludedColumns = [];
      this.updateUI();
    });
  }

  applyPreset(presetId) {
    if (this.csvProcessor.columns.length === 0) {
      new Notice("Please select a CSV file first");
      return;
    }

    this.currentStructure = [];
    this.excludedColumns = [];

    const preset = CONSTANTS.PRESETS[presetId.toUpperCase()];
    if (!preset) return;

    if (preset.id === 'simple') {
      this.currentStructure = this.csvProcessor.columns.slice(0, 2);
    } else {
      preset.columns.forEach(col => {
        if (this.csvProcessor.columns.includes(col)) {
          this.currentStructure.push(col);
        }
      });
    }

    this.updateUI();
    new Notice(`Applied ${preset.name} preset`);
  }

  updateAvailableColumns() {
    this.availableColumnsEl.empty();
    this.availableColumnsEl.createEl("h4", { text: "Available Columns:" });

    if (this.csvProcessor.columns.length === 0) {
      this.availableColumnsEl.createDiv({ text: "Select a file first..." });
      return;
    }

    this.csvProcessor.columns.forEach(col => {
      const tag = this.availableColumnsEl.createSpan({
        text: col,
        cls: CONSTANTS.CSS_CLASSES.COLUMN_TAG,
      });
      tag.draggable = true;
      tag.dataset.column = col;

      if (this.currentStructure.includes(col)) {
        tag.addClass(CONSTANTS.CSS_CLASSES.USED);
      } else if (this.excludedColumns.includes(col)) {
        tag.addClass(CONSTANTS.CSS_CLASSES.EXCLUDED);
      }

      this.setupDragHandlers(tag);
    });
  }

  updateStructureDisplay() {
    this.structureEl.empty();
    
    if (this.currentStructure.length === 0) {
      this.structureEl.createDiv("csv-json-empty-drop-zone")
        .innerHTML = "Drag columns here to build structure";
    } else {
      this.currentStructure.forEach((col, index) => {
        const level = this.structureEl.createDiv(CONSTANTS.CSS_CLASSES.LEVEL);
        
        const content = level.createDiv("csv-json-level-content");
        content.createDiv("csv-json-level-number").textContent = (index + 1).toString();
        content.createEl("strong").textContent = col;
        
        const removeBtn = level.createEl("button", {
          text: "✕",
          cls: "csv-json-remove-btn",
        });
        removeBtn.addEventListener("click", () => {
          this.currentStructure = this.currentStructure.filter(c => c !== col);
          this.updateUI();
        });
      });
    }

    // Excluded columns
    this.excludedEl.empty();
    const dropZone = this.excludedEl.createDiv("csv-json-excluded-drop-zone");
    
    if (this.excludedColumns.length === 0) {
      dropZone.textContent = "Drag columns here to exclude";
    } else {
      this.excludedColumns.forEach(col => {
        const item = dropZone.createDiv("csv-json-excluded-item");
        item.createEl("span").textContent = col;
        
        const restoreBtn = item.createEl("button", {
          text: "Restore",
          cls: "csv-json-remove-btn",
        });
        restoreBtn.addEventListener("click", () => {
          this.excludedColumns = this.excludedColumns.filter(c => c !== col);
          this.updateUI();
        });
      });
    }
  }

  updateFormatOptions() {
    this.formatOptionsEl.empty();
    
    if (this.outputFormat !== CONSTANTS.OUTPUT_FORMATS.JSON) {
      new Setting(this.formatOptionsEl)
        .setName("Output Folder")
        .setDesc("Where to save the generated files")
        .addText(text => {
          text
            .setPlaceholder("e.g., Imported/Data")
            .setValue(this.outputFolder)
            .onChange(value => this.outputFolder = value);
        });
    }
  }

  updatePreview() {
    if (!this.isStructureValid()) {
      this.previewEl.style.display = "none";
      return;
    }

    this.previewEl.style.display = "block";
    
    const dataColumns = this.csvProcessor.columns.filter(col =>
      !this.currentStructure.includes(col) && !this.excludedColumns.includes(col)
    );

    // Generate preview based on format
    let preview;
    if (this.outputFormat === CONSTANTS.OUTPUT_FORMATS.JSON) {
      preview = this.generateJSONPreview(dataColumns);
    } else {
      preview = this.generateMarkdownPreview(dataColumns);
    }

    this.previewContentEl.textContent = preview;
  }

  generateJSONPreview(dataColumns) {
    if (this.currentStructure.length === 0) return '{}';

    let example = {};
    let current = example;

    this.currentStructure.forEach((col, index) => {
      const exampleValue = `Example_${col}_Value`;
      if (index === this.currentStructure.length - 1) {
        current[exampleValue] = {};
        dataColumns.forEach(dataCol => {
          current[exampleValue][dataCol] = `Sample ${dataCol} data`;
        });
        current[exampleValue]._metadata = { sourceRow: 1 };
      } else {
        current[exampleValue] = {};
        current = current[exampleValue];
      }
    });

    return JSON.stringify({
      metadata: {
        structure: this.currentStructure.join(' → '),
        dataColumns: dataColumns,
        totalEntries: '...',
        generated: new Date().toISOString()
      },
      data: example
    }, null, 2);
  }

  generateMarkdownPreview(dataColumns) {
    let frontmatter = '---\n';

    this.currentStructure.forEach(col => {
      const fieldName = Utils.sanitizeFieldName(col);
      frontmatter += `${fieldName}: "Example_${col}_Value"\n`;
    });

    dataColumns.forEach(col => {
      const fieldName = Utils.sanitizeFieldName(col);
      frontmatter += `${fieldName}: "Sample ${col} data"\n`;
    });

    frontmatter += `source_file: "${this.csvProcessor.name}"\n`;
    frontmatter += `imported: ${new Date().toISOString()}\n`;
    frontmatter += '---\n\n';

    const titleParts = this.currentStructure.map(col => `{{${Utils.sanitizeFieldName(col)}}}`);
    frontmatter += `# ${titleParts.join(' - ')}\n\n`;
    frontmatter += `This note was imported from {{source_file}} on {{imported}}.\n`;

    return frontmatter;
  }

  updateProcessButton() {
    this.processBtn.disabled = !this.isStructureValid();
    this.processBtn.textContent = this.isStructureValid() 
      ? "Generate Output" 
      : "Configure structure first";
  }

  isStructureValid() {
    return this.csvProcessor.hasData && this.currentStructure.length > 0;
  }

  updateUI() {
    this.updateAvailableColumns();
    this.updateStructureDisplay();
    this.updatePreview();
    this.updateProcessButton();
  }

  async processData() {
    if (!this.isStructureValid()) return;

    try {
      if (this.outputFormat === CONSTANTS.OUTPUT_FORMATS.JSON) {
        const result = this.csvProcessor.processToJSON(this.currentStructure, this.excludedColumns);
        this.lastResult = {
          type: 'json',
          content: JSON.stringify(result, null, 2),
          data: result
        };
      } else {
        // For now, we'll just generate a summary for markdown formats
        const summary = `# Markdown Generation\n\nWould generate ${this.csvProcessor.csvData.length} markdown files\nStructure: ${this.currentStructure.join(' → ')}\nOutput folder: ${this.outputFolder || 'Imported'}`;
        this.lastResult = {
          type: 'markdown',
          content: summary
        };
      }

      this.showResults();
      new Notice("Processing completed successfully!");
    } catch (error) {
      new Notice(`Processing failed: ${error.message}`);
    }
  }

  showResults() {
    this.outputSection.style.display = "block";
    this.outputContentEl.value = this.lastResult.content;

    if (this.lastResult.type === 'json') {
      this.statsEl.innerHTML = `<h4>JSON Generated</h4><p>Data structure created successfully</p>`;
    } else {
      this.statsEl.innerHTML = `<h4>Markdown Summary</h4><p>Ready to generate markdown files</p>`;
    }
  }

  async saveToVault() {
    if (!this.lastResult) return;
    
    try {
      if (this.lastResult.type === 'json') {
        const fileName = `${this.csvProcessor.name || 'data'}_structured.json`;
        await this.app.vault.create(fileName, this.lastResult.content);
        new Notice(`JSON saved as ${fileName}`);
      } else {
        const summaryFile = `${this.outputFolder || 'Imported'}/_summary.md`;
        await this.app.vault.create(summaryFile, this.lastResult.content);
        new Notice(`Summary saved to ${summaryFile}`);
      }
    } catch (error) {
      new Notice(`Save failed: ${error.message}`);
    }
  }

  async copyToClipboard() {
    if (!this.outputContentEl.value) return;
    
    try {
      await navigator.clipboard.writeText(this.outputContentEl.value);
      new Notice("Copied to clipboard!");
    } catch (error) {
      new Notice("Failed to copy to clipboard");
    }
  }

  async saveCurrentTemplate() {
    if (!this.isStructureValid()) {
      new Notice("No structure to save as template");
      return;
    }

    const name = await this.promptForTemplateName();
    if (name) {
      const success = await this.templateManager.saveTemplate(name, {
        structure: this.currentStructure,
        excluded: this.excludedColumns
      });
      
      if (success) {
        new Notice(`Template "${name}" saved successfully`);
        this.updateTemplateList();
      }
    }
  }

  async promptForTemplateName() {
    return new Promise((resolve) => {
      const modal = new Modal(this.app);
      modal.titleEl.setText("Save Template");

      let inputValue = "";
      new Setting(modal.contentEl)
        .setName("Template Name")
        .addText(text => {
          text.onChange(value => inputValue = value);
          setTimeout(() => text.inputEl.focus(), 50);
        });

      new Setting(modal.contentEl)
        .addButton(btn => btn.setButtonText("Save").setCta().onClick(() => {
          modal.close();
          resolve(inputValue || null);
        }))
        .addButton(btn => btn.setButtonText("Cancel").onClick(() => {
          modal.close();
          resolve(null);
        }));

      modal.open();
    });
  }

  loadTemplate(name) {
    const template = this.templateManager.getTemplate(name);
    if (!template) return;

    // Filter template columns to only those available in current CSV
    const availableStructure = template.structure.filter(col => 
      this.csvProcessor.columns.includes(col)
    );
    const availableExcluded = template.excluded.filter(col => 
      this.csvProcessor.columns.includes(col)
    );

    if (availableStructure.length === 0) {
      new Notice(`Template "${name}" has no matching columns in current CSV`);
      return;
    }

    this.currentStructure = availableStructure;
    this.excludedColumns = availableExcluded;
    this.updateUI();
    new Notice(`Template "${name}" loaded`);
  }

  // Drag and drop handlers
  setupDragHandlers(element) {
    element.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", e.target.dataset.column);
      e.target.addClass(CONSTANTS.CSS_CLASSES.DRAGGING);
    });

    element.addEventListener("dragend", (e) => {
      e.target.removeClass(CONSTANTS.CSS_CLASSES.DRAGGING);
    });
  }

  setupDropZone(element, type) {
    element.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    });

    element.addEventListener("drop", (e) => {
      e.preventDefault();
      const column = e.dataTransfer.getData("text/plain");
      if (!column) return;

      if (type === 'structure') {
        if (!this.currentStructure.includes(column) && !this.excludedColumns.includes(column)) {
          this.currentStructure.push(column);
          this.excludedColumns = this.excludedColumns.filter(col => col !== column);
          this.updateUI();
        }
      } else if (type === 'excluded') {
        if (!this.excludedColumns.includes(column) && !this.currentStructure.includes(column)) {
          this.excludedColumns.push(column);
          this.currentStructure = this.currentStructure.filter(col => col !== column);
          this.updateUI();
        }
      }
    });
  }

  addStyles() {
    if (document.querySelector('#csv-converter-styles')) return;
    
    const style = document.createElement("style");
    style.id = 'csv-converter-styles';
    style.textContent = `
      .csv-json-modal {
        width: 95vw !important;
        max-width: 1400px !important;
        height: 90vh !important;
        max-height: 90vh !important;
        overflow-y: auto;
      }
      
      .csv-json-container {
        padding: 20px;
        font-family: var(--font-ui);
        max-width: none;
      }
      
      .csv-json-title {
        text-align: center;
        margin-bottom: 30px;
        color: var(--text-normal);
        font-size: 1.8rem;
      }
      
      .csv-json-step {
        margin-bottom: 30px;
        padding: 20px;
        background: var(--background-secondary);
        border-radius: 8px;
        border-left: 4px solid var(--interactive-accent);
      }
      
      .csv-json-step h3 {
        margin-top: 0;
        color: var(--interactive-accent);
        font-size: 1.2rem;
      }
      
      .csv-json-file-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      
      .csv-json-file-list {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        padding: 10px;
      }
      
      .csv-json-file-item {
        padding: 8px;
        cursor: pointer;
        border-radius: 4px;
        margin-bottom: 5px;
      }
      
      .csv-json-file-item:hover {
        background: var(--background-modifier-hover);
      }
      
      .csv-json-file-item.selected {
        background: var(--interactive-accent);
        color: var(--text-on-accent);
      }
      
      .csv-json-columns-preview {
        background: var(--background-primary);
        padding: 15px;
        border-radius: 6px;
        border: 2px dashed var(--background-modifier-border);
        min-height: 100px;
      }
      
      .csv-json-available-columns {
        background: var(--background-modifier-border);
        padding: 15px;
        border-radius: 6px;
        margin-bottom: 20px;
      }
      
      .csv-json-column-tag {
        display: inline-block;
        background: var(--text-muted);
        color: var(--text-on-accent);
        padding: 6px 12px;
        margin: 4px;
        border-radius: 15px;
        cursor: grab;
        font-size: 12px;
        transition: all 0.3s ease;
      }
      
      .csv-json-column-tag:hover {
        background: var(--interactive-accent);
        transform: translateY(-1px);
      }
      
      .csv-json-column-tag.dragging {
        opacity: 0.5;
      }
      
      .csv-json-column-tag.used {
        background: var(--text-success);
      }
      
      .csv-json-column-tag.excluded {
        background: var(--text-error);
      }
      
      .csv-json-nesting-levels {
        min-height: 150px;
        border: 2px dashed var(--interactive-accent);
        border-radius: 8px;
        padding: 20px;
        background: var(--background-primary);
        margin-bottom: 20px;
      }
      
      .csv-json-excluded-zone {
        min-height: 100px;
        border: 2px dashed var(--text-error);
        border-radius: 8px;
        padding: 15px;
        background: var(--background-primary);
        margin-bottom: 20px;
      }
      
      .csv-json-level {
        background: var(--background-primary);
        margin: 10px 0;
        padding: 15px;
        border-radius: 6px;
        border: 2px solid var(--interactive-accent);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .csv-json-excluded-item {
        background: var(--background-primary);
        margin: 5px 0;
        padding: 10px 15px;
        border-radius: 6px;
        border: 2px solid var(--text-error);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .csv-json-level-content {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .csv-json-level-number {
        background: var(--interactive-accent);
        color: var(--text-on-accent);
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }
      
      .csv-json-remove-btn {
        background: var(--text-error);
        color: var(--text-on-accent);
        border: none;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .csv-json-empty-drop-zone {
        padding: 20px;
        color: var(--text-muted);
        text-align: center;
        font-style: italic;
      }
      
      .csv-json-excluded-drop-zone {
        min-height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
        text-align: center;
      }
      
      .csv-json-preset-buttons {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }
      
      .csv-json-preset-btn {
        padding: 8px 16px;
        background: var(--text-muted);
        color: var(--text-on-accent);
        border: none;
        border-radius: 6px;
        cursor: pointer;
      }
      
      .csv-json-preset-btn:hover {
        background: var(--interactive-accent);
      }
      
      .csv-json-preset-btn.save-template {
        background: var(--text-success);
      }
      
      .csv-json-process-btn {
        background: var(--text-success);
        color: var(--text-on-accent);
        border: none;
        padding: 15px 30px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        margin: 10px;
      }
      
      .csv-json-process-btn:disabled {
        background: var(--text-muted);
        cursor: not-allowed;
      }
      
      .csv-json-preview {
        background: var(--background-secondary);
        padding: 20px;
        border-radius: 8px;
        margin-top: 20px;
        border-left: 4px solid var(--text-success);
      }
      
      .csv-json-json-preview {
        background: var(--background-primary);
        color: var(--text-normal);
        padding: 15px;
        border-radius: 6px;
        font-family: var(--font-monospace);
        font-size: 12px;
        overflow-x: auto;
        white-space: pre;
        max-height: 300px;
        overflow-y: auto;
      }
      
      .csv-json-output-section {
        margin-top: 30px;
      }
      
      .csv-json-output-controls {
        display: flex;
        gap: 10px;
        margin: 20px 0;
        flex-wrap: wrap;
      }
      
      .csv-json-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
      }
      
      .csv-json-btn-primary {
        background: var(--interactive-accent);
        color: var(--text-on-accent);
      }
      
      .csv-json-btn-secondary {
        background: var(--text-muted);
        color: var(--text-on-accent);
      }
      
      .csv-json-textarea {
        width: 100%;
        height: 300px;
        padding: 15px;
        border: 2px solid var(--background-modifier-border);
        border-radius: 6px;
        font-family: var(--font-monospace);
        font-size: 12px;
        resize: vertical;
        background: var(--background-primary);
        color: var(--text-normal);
      }
      
      .csv-json-format-selector {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
        flex-wrap: wrap;
      }
      
      .csv-json-format-option {
        padding: 12px 20px;
        background: var(--background-modifier-border);
        border: 2px solid transparent;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 120px;
      }
      
      .csv-json-format-option:hover {
        background: var(--background-modifier-hover);
      }
      
      .csv-json-format-option.active {
        background: var(--interactive-accent);
        color: var(--text-on-accent);
        border-color: var(--interactive-accent);
      }
      
      .csv-json-template-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }
      
      .csv-json-template-item {
        padding: 6px 12px;
        background: var(--background-modifier-hover);
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9em;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .csv-json-template-item:hover {
        background: var(--interactive-accent-hover);
      }
      
      .csv-json-template-delete {
        color: var(--text-error);
        cursor: pointer;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    this.csvProcessor.clear();
  }
}

// =============================================================================
// MAIN PLUGIN CLASS
// =============================================================================
class CSVtoJSONPlugin extends Plugin {
  async onload() {
    console.log("CSV to JSON Converter plugin loaded");

    this.addCommand({
      id: "open-csv-json-converter",
      name: "Open CSV to JSON Converter",
      callback: () => {
        new CSVtoJSONModal(this.app, this).open();
      },
    });

    this.addRibbonIcon("file-spreadsheet", "CSV to JSON Converter", () => {
      new CSVtoJSONModal(this.app, this).open();
    });

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (file instanceof TFile && file.extension === "csv") {
          menu.addItem((item) => {
            item
              .setTitle("Convert to JSON")
              .setIcon("file-spreadsheet")
              .onClick(async () => {
                const modal = new CSVtoJSONModal(this.app, this);
                modal.open();
                setTimeout(() => {
                  const fileItems = modal.fileListEl?.querySelectorAll(".csv-json-file-item");
                  fileItems?.forEach((item) => {
                    if (item.textContent === file.path) {
                      item.click();
                    }
                  });
                }, 100);
              });
          });
        }
      })
    );
  }

  onunload() {
    console.log("CSV to JSON Converter plugin unloaded");
  }
}

module.exports = CSVtoJSONPlugin;
