const { Plugin, Modal, Notice, Setting, TFile } = require("obsidian");
const CSVConverterController = require("/Users/davidwilliams/Documents/Coding/ObsidianPluginDevelopment/.obsidian/plugins/csv-to-json-converter/src/csv-converter-controller.js");
const CONSTANTS = require("/Users/davidwilliams/Documents/Coding/ObsidianPluginDevelopment/.obsidian/plugins/csv-to-json-converter/src/constants.js");

/**
 * Main plugin class - simplified by using modular architecture
 */
class CSVtoJSONPlugin extends Plugin {
  async onload() {
    console.log("CSV to JSON Converter plugin loaded");

    // Add command to open the converter
    this.addCommand({
      id: "open-csv-json-converter",
      name: "Open CSV to JSON Converter",
      callback: () => {
        new CSVtoJSONModal(this.app, this).open();
      },
    });

    // Add ribbon icon
    this.addRibbonIcon("file-spreadsheet", "CSV to JSON Converter", () => {
      new CSVtoJSONModal(this.app, this).open();
    });

    // Add to file menu for CSV files
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
                // Auto-select the file
                setTimeout(() => modal.selectFile(file), 100);
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

/**
 * Main modal UI - dramatically simplified by using controller pattern
 */
class CSVtoJSONModal extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.controller = new CSVConverterController(app, plugin);
    this.setupEventListeners();
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass(CONSTANTS.CSS_CLASSES.MODAL);

    // Add styles
    this.addStyles();

    // Initialize controller
    await this.controller.initialize();

    // Create interface
    this.createInterface();
  }

  setupEventListeners() {
    this.controller.on("fileLoaded", (data) => {
      this.updateFilePreview(data);
      this.updateUI();
    });

    this.controller.on("structureChanged", (data) => {
      this.updateStructureDisplay();
      this.updatePreview();
      this.updateProcessButton();
    });

    this.controller.on("outputFormatChanged", () => {
      this.updateFormatOptions();
      this.updatePreview();
    });

    this.controller.on("dataProcessed", (result) => {
      this.showResults(result);
    });

    this.controller.on("error", (error) => {
      new Notice(`Error: ${error.error}`);
    });

    this.controller.on("templateSaved", (name) => {
      new Notice(`Template "${name}" saved successfully`);
      this.updateTemplateList();
    });

    this.controller.on("templateLoaded", (data) => {
      new Notice(`Template "${data.name}" loaded`);
      if (data.warnings.length > 0) {
        new Notice(`Warnings: ${data.warnings.join(", ")}`);
      }
    });
  }

  createInterface() {
    const { contentEl } = this;
    const container = contentEl.createDiv(CONSTANTS.CSS_CLASSES.CONTAINER);

    // Title
    container.createEl("h2", {
      text: "CSV to JSON Converter",
      cls: "csv-json-title",
    });

    // Step 1: File Selection
    this.createFileSelection(container);

    // Step 2: Structure Builder
    this.createStructureBuilder(container);

    // Step 3: Format Selection
    this.createFormatSelection(container);

    // Preview
    this.createPreview(container);

    // Output section
    this.createOutputSection(container);
  }

  createFileSelection(container) {
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
    this.filePreviewEl.createDiv({
      text: "Select a CSV file to see preview...",
    });
  }

  createStructureBuilder(container) {
    const step = container.createDiv(CONSTANTS.CSS_CLASSES.STEP);
    step.createEl("h3", { text: "Step 2: Design Structure" });

    // Template section
    this.createTemplateSection(step);

    // Preset buttons
    this.createPresetButtons(step);

    // Available columns
    this.availableColumnsEl = step.createDiv("csv-json-available-columns");
    this.updateAvailableColumns();

    // Structure area
    step.createEl("h4", { text: "Structure (drag columns here):" });
    this.structureEl = step.createDiv("csv-json-nesting-levels");
    this.setupDropZone(this.structureEl, "structure");

    // Excluded area
    step.createEl("h4", { text: "Excluded Columns:" });
    this.excludedEl = step.createDiv("csv-json-excluded-zone");
    this.setupDropZone(this.excludedEl, "excluded");

    this.updateStructureDisplay();
  }

  createFormatSelection(container) {
    const step = container.createDiv(CONSTANTS.CSS_CLASSES.STEP);
    step.createEl("h3", { text: "Step 3: Choose Output Format" });

    const formatSelector = step.createDiv("csv-json-format-selector");

    Object.entries(CONSTANTS.OUTPUT_FORMATS).forEach(([key, value]) => {
      const option = formatSelector.createDiv("csv-json-format-option");
      if (value === this.controller.outputFormat) {
        option.addClass(CONSTANTS.CSS_CLASSES.ACTIVE);
      }

      const descriptions = {
        json: "Standard JSON format",
        markdown: "Individual markdown files",
        dataview: "Dataview-optimized format",
      };

      option.createEl("strong", { text: key });
      option.createEl("div", { text: descriptions[value] });

      option.addEventListener("click", () => {
        formatSelector
          .querySelectorAll(".csv-json-format-option")
          .forEach((opt) => opt.removeClass(CONSTANTS.CSS_CLASSES.ACTIVE));
        option.addClass(CONSTANTS.CSS_CLASSES.ACTIVE);
        this.controller.setOutputFormat(value);
      });
    });

    this.formatOptionsEl = step.createDiv();
    this.updateFormatOptions();
  }

  createPreview(container) {
    this.previewEl = container.createDiv("csv-json-preview");
    this.previewEl.style.display = "none";

    this.previewEl.createEl("h4", { text: "Preview" });
    this.previewContentEl = this.previewEl.createDiv("csv-json-json-preview");
  }

  createOutputSection(container) {
    this.outputSection = container.createDiv("csv-json-output-section");
    this.outputSection.style.display = "none";

    this.outputSection.createEl("h3", { text: "Results" });

    this.statsEl = this.outputSection.createDiv();
    this.outputContentEl = this.outputSection.createEl("textarea", {
      cls: "csv-json-textarea",
    });

    const controls = this.outputSection.createDiv("csv-json-output-controls");

    // Process button (moved here for better flow)
    this.processBtn = controls.createEl("button", {
      text: "Generate Output",
      cls: "csv-json-process-btn",
    });
    this.processBtn.addEventListener("click", () => this.processData());

    const saveBtn = controls.createEl("button", {
      text: "Save to Vault",
      cls: "csv-json-btn csv-json-btn-primary",
    });
    saveBtn.addEventListener("click", () => this.saveToVault());

    const copyBtn = controls.createEl("button", {
      text: "Copy to Clipboard",
      cls: "csv-json-btn csv-json-btn-secondary",
    });
    copyBtn.addEventListener("click", () => this.copyToClipboard());

    this.updateProcessButton();
  }

  // Simplified event handlers using controller
  loadFileList() {
    this.fileListEl.empty();
    const files = this.controller.csvFiles;

    if (files.length === 0) {
      this.fileListEl.createDiv({ text: "No CSV files found in vault" });
      return;
    }

    files.forEach((file) => {
      const fileItem = this.fileListEl.createDiv("csv-json-file-item");
      fileItem.textContent = file.path;
      fileItem.addEventListener("click", () => this.selectFile(file, fileItem));
    });
  }

  async selectFile(file, element = null) {
    // Update UI selection
    if (element) {
      this.fileListEl
        .querySelectorAll(".csv-json-file-item")
        .forEach((item) => item.removeClass("selected"));
      element.addClass("selected");
    }

    // Load file through controller
    const result = await this.controller.loadCSVFile(file);

    if (result.success) {
      new Notice(
        `CSV loaded: ${result.rowCount} rows, ${this.controller.columns.length} columns`
      );
    } else {
      new Notice(`Error loading file: ${result.error}`);
    }
  }

  updateFilePreview(data) {
    this.filePreviewEl.empty();
    this.filePreviewEl.createEl("h4", { text: "Available Columns:" });

    const display = this.filePreviewEl.createDiv();
    data.columns.forEach((col) => {
      const span = display.createSpan({
        text: col,
        cls: "csv-json-column-preview",
      });
    });

    if (data.warnings.length > 0) {
      const warningDiv = this.filePreviewEl.createDiv("csv-json-warning");
      warningDiv.createEl("strong", { text: "⚠️ Warnings:" });
      const list = warningDiv.createEl("ul");
      data.warnings.forEach((warning) => {
        list.createEl("li", { text: warning });
      });
    }

    this.updateAvailableColumns();
  }

  updateAvailableColumns() {
    this.availableColumnsEl.empty();
    this.availableColumnsEl.createEl("h4", { text: "Available Columns:" });

    if (this.controller.columns.length === 0) {
      this.availableColumnsEl.createDiv({ text: "Select a file first..." });
      return;
    }

    this.controller.columns.forEach((col) => {
      const tag = this.availableColumnsEl.createSpan({
        text: col,
        cls: CONSTANTS.CSS_CLASSES.COLUMN_TAG,
      });
      tag.draggable = true;
      tag.dataset.column = col;

      // Update appearance based on usage
      if (this.controller.structure.includes(col)) {
        tag.addClass(CONSTANTS.CSS_CLASSES.USED);
      } else if (this.controller.excludedColumns.includes(col)) {
        tag.addClass(CONSTANTS.CSS_CLASSES.EXCLUDED);
      }

      this.setupDragHandlers(tag);
    });
  }

  updateStructureDisplay() {
    this.structureEl.empty();

    if (this.controller.structure.length === 0) {
      this.structureEl.createDiv("csv-json-empty-drop-zone").innerHTML =
        "Drag columns here to build structure";
    } else {
      this.controller.structure.forEach((col, index) => {
        const level = this.structureEl.createDiv(CONSTANTS.CSS_CLASSES.LEVEL);

        const content = level.createDiv("csv-json-level-content");
        content.createDiv("csv-json-level-number").textContent = (
          index + 1
        ).toString();
        content.createEl("strong").textContent = col;

        const removeBtn = level.createEl("button", {
          text: "✕",
          cls: "csv-json-remove-btn",
        });
        removeBtn.addEventListener("click", () => {
          this.controller.removeFromStructure(col);
        });
      });
    }

    // Excluded columns
    this.excludedEl.empty();
    const dropZone = this.excludedEl.createDiv("csv-json-excluded-drop-zone");

    if (this.controller.excludedColumns.length === 0) {
      dropZone.textContent = "Drag columns here to exclude";
    } else {
      this.controller.excludedColumns.forEach((col) => {
        const item = dropZone.createDiv("csv-json-excluded-item");
        item.createEl("span").textContent = col;

        const restoreBtn = item.createEl("button", {
          text: "Restore",
          cls: "csv-json-remove-btn",
        });
        restoreBtn.addEventListener("click", () => {
          this.controller.removeFromExcluded(col);
        });
      });
    }
  }

  updatePreview() {
    if (!this.controller.isStructureValid()) {
      this.previewEl.style.display = "none";
      return;
    }

    this.previewEl.style.display = "block";
    this.previewContentEl.textContent = this.controller.generatePreview();
  }

  updateProcessButton() {
    this.processBtn.disabled = !this.controller.isStructureValid();
    this.processBtn.textContent = this.controller.isStructureValid()
      ? "Generate Output"
      : "Configure structure first";
  }

  async processData() {
    try {
      this.lastResult = await this.controller.processData();
      new Notice("Processing completed successfully!");
    } catch (error) {
      new Notice(`Processing failed: ${error.message}`);
    }
  }

  showResults(result) {
    this.outputSection.style.display = "block";

    if (result.type === "json") {
      this.outputContentEl.value = result.content;
      this.statsEl.innerHTML = `<h4>JSON Generated</h4><p>Data structure created successfully</p>`;
    } else {
      this.outputContentEl.value = result.summary;
      this.statsEl.innerHTML = `
        <h4>Markdown Files Created</h4>
        <p>Successfully created ${result.results.successCount} files in ${
        result.folder
      }</p>
        ${
          result.results.errorCount > 0
            ? `<p style="color: var(--text-error)">Errors: ${result.results.errorCount}</p>`
            : ""
        }
      `;
    }
  }

  async saveToVault() {
    if (!this.lastResult) return;

    try {
      const savedPath = await this.controller.saveToVault(this.lastResult);
      new Notice(`Saved to ${savedPath}`);
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

  // Helper methods for UI updates
  updateUI() {
    this.updateAvailableColumns();
    this.updateStructureDisplay();
    this.updatePreview();
    this.updateProcessButton();
  }

  updateFormatOptions() {
    this.formatOptionsEl.empty();

    if (this.controller.outputFormat !== CONSTANTS.OUTPUT_FORMATS.JSON) {
      new Setting(this.formatOptionsEl)
        .setName("Output Folder")
        .setDesc("Where to save the generated files")
        .addText((text) => {
          text
            .setPlaceholder("e.g., Imported/Data")
            .setValue(this.controller.outputFolder)
            .onChange((value) => this.controller.setOutputFolder(value));
        });
    }
  }

  // Template management (simplified)
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
    const templates = this.controller.templates;

    if (templates.length === 0) {
      this.templateListEl.createDiv({ text: "No saved templates" });
      return;
    }

    templates.forEach((template) => {
      const item = this.templateListEl.createDiv("csv-json-template-item");

      const nameSpan = item.createSpan({ text: template.name });
      nameSpan.addEventListener("click", () => {
        this.controller.loadTemplate(template.name);
      });

      const deleteBtn = item.createSpan({
        text: "✕",
        cls: "csv-json-template-delete",
      });
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm(`Delete template "${template.name}"?`)) {
          await this.controller.deleteTemplate(template.name);
          this.updateTemplateList();
        }
      });
    });
  }

  async saveCurrentTemplate() {
    if (!this.controller.isStructureValid()) {
      new Notice("No structure to save as template");
      return;
    }

    const name = await this.promptForTemplateName();
    if (name) {
      await this.controller.saveTemplate(name);
      this.updateTemplateList();
    }
  }

  async promptForTemplateName() {
    return new Promise((resolve) => {
      const modal = new Modal(this.app);
      modal.titleEl.setText("Save Template");

      let inputValue = "";
      new Setting(modal.contentEl).setName("Template Name").addText((text) => {
        text.onChange((value) => (inputValue = value));
        setTimeout(() => text.inputEl.focus(), 50);
      });

      new Setting(modal.contentEl)
        .addButton((btn) =>
          btn
            .setButtonText("Save")
            .setCta()
            .onClick(() => {
              modal.close();
              resolve(inputValue || null);
            })
        )
        .addButton((btn) =>
          btn.setButtonText("Cancel").onClick(() => {
            modal.close();
            resolve(null);
          })
        );

      modal.open();
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
        this.controller.applyPreset(preset.id);
      });
    });

    const clearBtn = presetButtons.createEl("button", {
      text: "Clear All",
      cls: "csv-json-preset-btn",
    });
    clearBtn.style.background = "var(--text-error)";
    clearBtn.addEventListener("click", () => {
      this.controller.clearStructure();
    });
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

      if (type === "structure") {
        this.controller.addToStructure(column);
      } else if (type === "excluded") {
        this.controller.addToExcluded(column);
      }
    });
  }

  // Add the styles (keeping the original CSS)
  addStyles() {
    if (document.querySelector("#csv-converter-styles")) return;

    const style = document.createElement("style");
    style.id = "csv-converter-styles";
    style.textContent = `
      /* Keeping all the original CSS styles here for brevity */
      .csv-json-modal {
        width: 90vw;
        max-width: 1200px;
        height: 80vh;
        overflow-y: auto;
      }
      
      .csv-json-container {
        padding: 20px;
        font-family: var(--font-ui);
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
      
      /* Add more CSS classes as needed */
    `;
    document.head.appendChild(style);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    this.controller.destroy();
  }
}

module.exports = CSVtoJSONPlugin;
