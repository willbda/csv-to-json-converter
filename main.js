const { Plugin, Modal, Notice, Setting, TFile } = require("obsidian");
const {
  parse,
} = require("/Users/davidwilliams/Documents/Coding/ObsidianPluginDevelopment/.obsidian/plugins/csv-to-json-converter/node_modules/papaparse/papaparse.js");

// Constants for Dataview integration
const DATAVIEW_RESERVED_FIELDS = ["file", "tags", "aliases"];
const TEMPLATE_FOLDER = "CSV Templates";

class CSVtoJSONModal extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.csvData = null;
    this.csvColumns = [];
    this.jsonData = null;
    this.fileName = "";
    this.currentStructure = [];
    this.excludedColumns = [];
    this.filterRules = [];
    this.outputFormat = "json"; // New: json, markdown, or dataview
    this.savedTemplates = {}; // New: store structure templates
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("csv-json-modal");

    // Add custom styles
    this.addStyles();

    // Load saved templates
    this.loadTemplates();

    // Create the main interface
    this.createInterface();
  }

  addStyles() {
    const style = document.createElement("style");
    style.textContent = `
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
			
			.csv-json-file-section {
				display: flex;
				flex-direction: column;
				gap: 15px;
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
				cursor: move;
				display: flex;
				align-items: center;
				justify-content: space-between;
				transition: all 0.3s ease;
			}
			
			.csv-json-level:hover {
				transform: translateY(-2px);
				box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
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
			
			.csv-json-level-content, .csv-json-excluded-content {
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
				font-size: 14px;
			}
			
			.csv-json-excluded-icon {
				background: var(--text-error);
				color: var(--text-on-accent);
				border-radius: 50%;
				width: 25px;
				height: 25px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-weight: bold;
				font-size: 12px;
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
				font-style: italic;
				text-align: center;
			}
			
			.csv-json-excluded-drop-zone {
				border: 2px dashed var(--text-error);
				border-radius: 6px;
				padding: 10px;
				text-align: center;
				color: var(--text-error);
				background: var(--background-primary);
				transition: all 0.3s ease;
				min-height: 50px;
				display: flex;
				align-items: center;
				justify-content: center;
			}
			
			.csv-json-excluded-drop-zone.drag-over {
				background: var(--background-modifier-hover);
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
				font-size: 14px;
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
				width: 100%;
				margin-top: 20px;
			}
			
			.csv-json-process-btn:hover {
				opacity: 0.8;
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
			}
			
			.csv-json-format-option {
				padding: 8px 16px;
				background: var(--background-modifier-border);
				border: 2px solid transparent;
				border-radius: 6px;
				cursor: pointer;
				transition: all 0.2s;
			}
			
			.csv-json-format-option:hover {
				background: var(--background-modifier-hover);
			}
			
			.csv-json-format-option.active {
				background: var(--interactive-accent);
				color: var(--text-on-accent);
				border-color: var(--interactive-accent);
			}
			
			.csv-json-warning {
				background: var(--background-modifier-warning);
				color: var(--text-warning);
				padding: 10px;
				border-radius: 6px;
				margin: 10px 0;
				font-size: 0.9em;
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

  createInterface() {
    const { contentEl } = this;

    const container = contentEl.createDiv("csv-json-container");

    // Title
    container.createEl("h2", {
      text: "CSV to JSON Converter",
      cls: "csv-json-title",
    });

    // Step 1: File Selection
    this.createFileSelection(container);

    // Step 2: Structure Builder
    this.createStructureBuilder(container);

    // Step 3: Output Format Selection (NEW)
    this.createFormatSelection(container);

    // Preview
    this.createPreview(container);

    // Output section
    this.createOutputSection(container);
  }

  createFileSelection(container) {
    const step = container.createDiv("csv-json-step");
    step.createEl("h3", { text: "Step 1: Select CSV File from Vault" });

    const fileGrid = step.createDiv("csv-json-file-grid");

    // File list
    const fileSection = fileGrid.createDiv("csv-json-file-section");
    fileSection.createEl("h4", { text: "CSV Files in Vault:" });

    this.fileListEl = fileSection.createDiv("csv-json-file-list");
    this.loadVaultFiles();

    // File preview
    const previewSection = fileGrid.createDiv();
    previewSection.createEl("h4", { text: "File Preview:" });
    this.filePreviewEl = previewSection.createDiv("csv-json-columns-preview");
    this.filePreviewEl.createDiv({
      text: "Select a CSV file to see preview...",
    });
  }

  async loadVaultFiles() {
    const files = this.app.vault
      .getFiles()
      .filter((file) => file.extension === "csv");

    this.fileListEl.empty();

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

  async selectFile(file, element) {
    // Update UI
    this.fileListEl.querySelectorAll(".csv-json-file-item").forEach((item) => {
      item.removeClass("selected");
    });
    element.addClass("selected");

    try {
      // Read file content
      const content = await this.app.vault.read(file);
      this.fileName = file.basename;

      // Parse CSV with better parser
      const parseResult = parse(content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });

      if (parseResult.errors.length > 0) {
        // Show parsing errors
        const errorMsg = parseResult.errors.map((e) => e.message).join(", ");
        new Notice(`CSV parsing warnings: ${errorMsg}`);
      }

      this.csvColumns = parseResult.meta.fields || [];
      this.csvData = parseResult.data;

      // Validate column names for Dataview
      this.validateDataviewColumns();

      // Update UI
      this.displayColumns();
      this.updateAllDisplays();

      new Notice(
        `CSV loaded: ${this.csvData.length} rows, ${this.csvColumns.length} columns`
      );
    } catch (error) {
      new Notice(`Error reading file: ${error.message}`);
    }
  }

  validateDataviewColumns() {
    // Check for Dataview reserved field names and special characters
    const warnings = [];

    this.csvColumns.forEach((col) => {
      if (DATAVIEW_RESERVED_FIELDS.includes(col.toLowerCase())) {
        warnings.push(`"${col}" is a reserved Dataview field name`);
      }

      // Check for special characters that might cause issues
      if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(col)) {
        warnings.push(
          `"${col}" contains special characters that may cause issues`
        );
      }
    });

    if (warnings.length > 0) {
      // Show warnings in the preview area
      this.showDataviewWarnings(warnings);
    }
  }

  showDataviewWarnings(warnings) {
    const warningDiv = this.filePreviewEl.createDiv("csv-json-warning");
    warningDiv.createEl("strong", {
      text: "⚠️ Dataview Compatibility Warnings:",
    });
    const list = warningDiv.createEl("ul");
    warnings.forEach((warning) => {
      list.createEl("li", { text: warning });
    });
  }

  displayColumns() {
    this.filePreviewEl.empty();
    this.filePreviewEl.createEl("h4", { text: "Available Columns:" });

    const display = this.filePreviewEl.createDiv();
    this.csvColumns.forEach((col) => {
      const span = display.createSpan();
      span.textContent = col;
      span.style.background = "var(--background-modifier-border)";
      span.style.padding = "4px 8px";
      span.style.margin = "2px";
      span.style.borderRadius = "4px";
      span.style.display = "inline-block";

      // Highlight problematic column names
      if (
        DATAVIEW_RESERVED_FIELDS.includes(col.toLowerCase()) ||
        !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(col)
      ) {
        span.style.background = "var(--background-modifier-warning)";
        span.title = "This column name may cause issues with Dataview";
      }
    });

    // Update draggable columns
    this.updateAvailableColumns();
  }

  createStructureBuilder(container) {
    const step = container.createDiv("csv-json-step");
    step.createEl("h3", { text: "Step 2: Design JSON Structure" });

    // Template management section
    this.createTemplateSection(step);

    // Preset buttons
    const presetButtons = step.createDiv("csv-json-preset-buttons");

    const hierarchicalBtn = presetButtons.createEl("button", {
      text: "Hierarchical",
      cls: "csv-json-preset-btn",
    });
    hierarchicalBtn.addEventListener("click", () =>
      this.loadPreset("hierarchical")
    );

    const projectBtn = presetButtons.createEl("button", {
      text: "Project-Based",
      cls: "csv-json-preset-btn",
    });
    projectBtn.addEventListener("click", () => this.loadPreset("project"));

    const simpleBtn = presetButtons.createEl("button", {
      text: "Simple Grouping",
      cls: "csv-json-preset-btn",
    });
    simpleBtn.addEventListener("click", () => this.loadPreset("simple"));

    const clearBtn = presetButtons.createEl("button", {
      text: "Clear All",
      cls: "csv-json-preset-btn",
    });
    clearBtn.style.background = "var(--text-error)";
    clearBtn.addEventListener("click", () => this.clearStructure());

    // Save template button
    const saveTemplateBtn = presetButtons.createEl("button", {
      text: "💾 Save as Template",
      cls: "csv-json-preset-btn save-template",
    });
    saveTemplateBtn.addEventListener("click", () => this.saveCurrentTemplate());

    // Available columns
    this.availableColumnsEl = step.createDiv("csv-json-available-columns");
    this.updateAvailableColumns();

    // Structure area
    step.createEl("h4", { text: "JSON Structure (drag columns here):" });
    this.nestingLevelsEl = step.createDiv("csv-json-nesting-levels");
    this.updateStructureDisplay();

    // Excluded area
    step.createEl("h4", {
      text: "Excluded Columns (drag columns here to exclude):",
    });
    this.excludedZoneEl = step.createDiv("csv-json-excluded-zone");
    this.updateExcludedDisplay();

    // Process button
    this.processBtn = step.createEl("button", {
      text: "Generate Output",
      cls: "csv-json-process-btn",
    });
    this.processBtn.disabled = true;
    this.processBtn.addEventListener("click", () => this.processData());
  }

  createTemplateSection(container) {
    const templateDiv = container.createDiv();
    templateDiv.createEl("h4", { text: "Saved Templates:" });

    this.templateListEl = templateDiv.createDiv("csv-json-template-list");
    this.updateTemplateList();
  }

  async loadTemplates() {
    // Load templates from plugin data
    const saved = await this.plugin.loadData();
    if (saved && saved.templates) {
      this.savedTemplates = saved.templates;
    }
  }

  async saveCurrentTemplate() {
    if (this.currentStructure.length === 0) {
      new Notice("No structure to save as template");
      return;
    }

    const templateName = await this.promptForTemplateName();
    if (!templateName) return;

    this.savedTemplates[templateName] = {
      structure: [...this.currentStructure],
      excluded: [...this.excludedColumns],
      created: new Date().toISOString(),
    };

    // Save to plugin data
    await this.plugin.saveData({ templates: this.savedTemplates });

    this.updateTemplateList();
    new Notice(`Template "${templateName}" saved`);
  }

  async promptForTemplateName() {
    return new Promise((resolve) => {
      const modal = new Modal(this.app);
      modal.titleEl.setText("Save Structure Template");

      let inputValue = "";
      new Setting(modal.contentEl)
        .setName("Template Name")
        .setDesc("Enter a name for this structure template")
        .addText((text) => {
          text
            .setPlaceholder("e.g., Organization Import")
            .onChange((value) => (inputValue = value));

          // Auto-focus and add enter key handler
          setTimeout(() => {
            text.inputEl.focus();
            text.inputEl.addEventListener("keypress", (e) => {
              if (e.key === "Enter" && inputValue) {
                modal.close();
                resolve(inputValue);
              }
            });
          }, 50);
        });

      new Setting(modal.contentEl)
        .addButton((btn) =>
          btn
            .setButtonText("Save")
            .setCta()
            .onClick(() => {
              if (inputValue) {
                modal.close();
                resolve(inputValue);
              } else {
                new Notice("Please enter a template name");
              }
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

  updateTemplateList() {
    this.templateListEl.empty();

    if (Object.keys(this.savedTemplates).length === 0) {
      this.templateListEl.createDiv({
        text: "No saved templates yet",
        cls: "csv-json-empty-message",
      });
      return;
    }

    Object.entries(this.savedTemplates).forEach(([name, template]) => {
      const item = this.templateListEl.createDiv("csv-json-template-item");

      const nameSpan = item.createSpan({ text: name });
      nameSpan.addEventListener("click", () => this.loadTemplate(name));

      const deleteBtn = item.createSpan({
        text: "✕",
        cls: "csv-json-template-delete",
      });
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm(`Delete template "${name}"?`)) {
          delete this.savedTemplates[name];
          await this.plugin.saveData({ templates: this.savedTemplates });
          this.updateTemplateList();
          new Notice(`Template "${name}" deleted`);
        }
      });
    });
  }

  loadTemplate(templateName) {
    const template = this.savedTemplates[templateName];
    if (!template) return;

    // Check if all columns in template exist in current CSV
    const missingColumns = template.structure.filter(
      (col) => !this.csvColumns.includes(col)
    );
    if (missingColumns.length > 0) {
      new Notice(
        `Warning: Template references missing columns: ${missingColumns.join(
          ", "
        )}`
      );
    }

    // Apply template
    this.currentStructure = template.structure.filter((col) =>
      this.csvColumns.includes(col)
    );
    this.excludedColumns = template.excluded.filter((col) =>
      this.csvColumns.includes(col)
    );

    this.updateAllDisplays();
    new Notice(`Template "${templateName}" loaded`);
  }

  createFormatSelection(container) {
    const step = container.createDiv("csv-json-step");
    step.createEl("h3", { text: "Step 3: Choose Output Format" });

    const formatSelector = step.createDiv("csv-json-format-selector");

    const formats = [
      { id: "json", label: "JSON", desc: "Standard JSON format" },
      {
        id: "markdown",
        label: "Markdown",
        desc: "Individual markdown files with frontmatter",
      },
      {
        id: "dataview",
        label: "Dataview",
        desc: "Optimized for Dataview queries",
      },
    ];

    formats.forEach((format) => {
      const option = formatSelector.createDiv("csv-json-format-option");
      if (format.id === this.outputFormat) {
        option.addClass("active");
      }

      option.createEl("strong", { text: format.label });
      option.createEl("div", { text: format.desc, cls: "format-desc" });

      option.addEventListener("click", () => {
        // Update selection
        formatSelector
          .querySelectorAll(".csv-json-format-option")
          .forEach((opt) => {
            opt.removeClass("active");
          });
        option.addClass("active");
        this.outputFormat = format.id;
        this.updatePreview();
      });
    });

    // Format-specific options
    this.formatOptionsEl = step.createDiv();
    this.updateFormatOptions();
  }

  updateFormatOptions() {
    this.formatOptionsEl.empty();

    if (this.outputFormat === "markdown" || this.outputFormat === "dataview") {
      const setting = new Setting(this.formatOptionsEl)
        .setName("Output Folder")
        .setDesc("Where to save the generated markdown files")
        .addText((text) => {
          text
            .setPlaceholder("e.g., Imported/Organizations")
            .setValue(this.outputFolder || "")
            .onChange((value) => (this.outputFolder = value));
        });
    }
  }

  updateAvailableColumns() {
    this.availableColumnsEl.empty();
    this.availableColumnsEl.createEl("h4", {
      text: "Available Columns (drag to configure):",
    });

    if (this.csvColumns.length === 0) {
      this.availableColumnsEl.createDiv({
        text: "Select a file first to see columns...",
      });
      return;
    }

    this.csvColumns.forEach((col) => {
      const tag = this.availableColumnsEl.createSpan({
        text: col,
        cls: "csv-json-column-tag",
      });
      tag.draggable = true;
      tag.dataset.column = col;

      // Update tag appearance
      if (this.currentStructure.includes(col)) {
        tag.addClass("used");
      } else if (this.excludedColumns.includes(col)) {
        tag.addClass("excluded");
      }

      tag.addEventListener("dragstart", (e) => this.handleDragStart(e));
      tag.addEventListener("dragend", (e) => this.handleDragEnd(e));
    });
  }

  updateStructureDisplay() {
    this.nestingLevelsEl.empty();

    if (this.currentStructure.length === 0) {
      const emptyZone = this.nestingLevelsEl.createDiv(
        "csv-json-empty-drop-zone"
      );
      emptyZone.innerHTML = `
				Drag column tags here to build your JSON structure<br>
				<small>The order determines nesting levels (top = outermost)</small>
			`;
    } else {
      this.currentStructure.forEach((col, index) => {
        const level = this.nestingLevelsEl.createDiv("csv-json-level");
        level.draggable = true;
        level.dataset.level = index;

        const content = level.createDiv("csv-json-level-content");

        const levelNumber = content.createDiv("csv-json-level-number");
        levelNumber.textContent = (index + 1).toString();

        const nameEl = content.createEl("strong");
        nameEl.textContent = col;

        const description = content.createEl("small");
        description.textContent =
          index === this.currentStructure.length - 1
            ? "Data Level"
            : `Grouping Level ${index + 1}`;
        description.style.color = "var(--text-muted)";
        description.style.marginLeft = "10px";

        const removeBtn = level.createEl("button", {
          text: "✕",
          cls: "csv-json-remove-btn",
        });
        removeBtn.addEventListener("click", () =>
          this.removeFromStructure(col)
        );
      });
    }

    // Setup drop zone
    this.nestingLevelsEl.addEventListener("dragover", (e) =>
      this.handleDragOver(e, "structure")
    );
    this.nestingLevelsEl.addEventListener("drop", (e) =>
      this.handleDrop(e, "structure")
    );
  }

  updateExcludedDisplay() {
    this.excludedZoneEl.empty();

    const dropZone = this.excludedZoneEl.createDiv(
      "csv-json-excluded-drop-zone"
    );

    if (this.excludedColumns.length === 0) {
      dropZone.textContent =
        "Drag columns here to exclude them from the output";
    } else {
      dropZone.empty();
      this.excludedColumns.forEach((col) => {
        const item = dropZone.createDiv("csv-json-excluded-item");

        const content = item.createDiv("csv-json-excluded-content");

        const icon = content.createDiv("csv-json-excluded-icon");
        icon.textContent = "✕";

        const nameEl = content.createEl("strong");
        nameEl.textContent = col;

        const description = content.createEl("small");
        description.textContent = "Excluded";
        description.style.color = "var(--text-muted)";
        description.style.marginLeft = "10px";

        const restoreBtn = item.createEl("button", {
          text: "Restore",
          cls: "csv-json-remove-btn",
        });
        restoreBtn.addEventListener("click", () =>
          this.removeFromExcluded(col)
        );
      });
    }

    // Setup drop zone
    dropZone.addEventListener("dragover", (e) =>
      this.handleDragOver(e, "excluded")
    );
    dropZone.addEventListener("drop", (e) => this.handleDrop(e, "excluded"));
  }

  createPreview(container) {
    this.previewEl = container.createDiv("csv-json-preview");
    this.previewEl.style.display = "none";

    this.previewEl.createEl("h4", { text: "Structure Preview & Example" });
    this.structureDescriptionEl = this.previewEl.createDiv();
    this.jsonPreviewEl = this.previewEl.createDiv("csv-json-json-preview");
  }

  createOutputSection(container) {
    this.outputSection = container.createDiv("csv-json-output-section");
    this.outputSection.style.display = "none";

    this.outputSection.createEl("h3", { text: "Generated Output" });

    this.statsEl = this.outputSection.createDiv();

    this.jsonOutputEl = this.outputSection.createEl("textarea", {
      cls: "csv-json-textarea",
    });
    this.jsonOutputEl.readOnly = true;

    const controls = this.outputSection.createDiv("csv-json-output-controls");

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
  }

  // Drag and drop functionality
  handleDragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.dataset.column);
    e.target.addClass("dragging");
  }

  handleDragEnd(e) {
    e.target.removeClass("dragging");
  }

  handleDragOver(e, type) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  handleDrop(e, type) {
    e.preventDefault();
    const column = e.dataTransfer.getData("text/plain");
    if (!column) return;

    if (
      type === "structure" &&
      !this.currentStructure.includes(column) &&
      !this.excludedColumns.includes(column)
    ) {
      this.addToStructure(column);
    } else if (
      type === "excluded" &&
      !this.excludedColumns.includes(column) &&
      !this.currentStructure.includes(column)
    ) {
      this.addToExcluded(column);
    }
  }

  addToStructure(column) {
    this.currentStructure.push(column);
    this.updateAllDisplays();
  }

  removeFromStructure(column) {
    this.currentStructure = this.currentStructure.filter(
      (col) => col !== column
    );
    this.updateAllDisplays();
  }

  addToExcluded(column) {
    this.excludedColumns.push(column);
    this.updateAllDisplays();
  }

  removeFromExcluded(column) {
    this.excludedColumns = this.excludedColumns.filter((col) => col !== column);
    this.updateAllDisplays();
  }

  updateAllDisplays() {
    this.updateStructureDisplay();
    this.updateExcludedDisplay();
    this.updateAvailableColumns();
    this.updatePreview();
    this.updateProcessButton();
  }

  updatePreview() {
    if (this.currentStructure.length === 0) {
      this.previewEl.style.display = "none";
      return;
    }

    this.previewEl.style.display = "block";

    // Generate structure description
    const structureText = this.currentStructure.join(" → ");
    const remainingColumns = this.csvColumns.filter(
      (col) =>
        !this.currentStructure.includes(col) &&
        !this.excludedColumns.includes(col)
    );

    this.structureDescriptionEl.innerHTML = `
			<strong>Structure:</strong> ${structureText}<br>
			<strong>Data Columns:</strong> ${
        remainingColumns.length > 0 ? remainingColumns.join(", ") : "None"
      }<br>
			<strong>Excluded Columns:</strong> ${
        this.excludedColumns.length > 0
          ? this.excludedColumns.join(", ")
          : "None"
      }<br>
			<strong>Output Format:</strong> ${this.outputFormat.toUpperCase()}
		`;

    // Generate example based on format
    let example;
    if (this.outputFormat === "markdown" || this.outputFormat === "dataview") {
      example = this.generateMarkdownExample();
    } else {
      example = this.generateJSONExample();
    }

    this.jsonPreviewEl.textContent = example;
  }

  generateJSONExample() {
    if (this.currentStructure.length === 0) return "{}";

    const remainingColumns = this.csvColumns.filter(
      (col) =>
        !this.currentStructure.includes(col) &&
        !this.excludedColumns.includes(col)
    );

    let example = {};
    let current = example;

    this.currentStructure.forEach((col, index) => {
      const exampleValue = `Example_${col}_Value`;
      if (index === this.currentStructure.length - 1) {
        current[exampleValue] = {};
        remainingColumns.forEach((remainingCol) => {
          current[exampleValue][remainingCol] = `Sample ${remainingCol} data`;
        });
        current[exampleValue]._metadata = { sourceRow: 1 };
      } else {
        current[exampleValue] = {};
        current = current[exampleValue];
      }
    });

    return JSON.stringify(
      {
        metadata: {
          structure: this.currentStructure.join(" → "),
          dataColumns: remainingColumns,
          excludedColumns: this.excludedColumns,
          totalEntries: "...",
          generated: new Date().toISOString(),
        },
        data: example,
      },
      null,
      2
    );
  }

  generateMarkdownExample() {
    const remainingColumns = this.csvColumns.filter(
      (col) =>
        !this.currentStructure.includes(col) &&
        !this.excludedColumns.includes(col)
    );

    let frontmatter = "---\n";

    // Add structure fields
    this.currentStructure.forEach((col) => {
      const fieldName = this.sanitizeFieldName(col);
      frontmatter += `${fieldName}: "Example_${col}_Value"\n`;
    });

    // Add data fields
    remainingColumns.forEach((col) => {
      const fieldName = this.sanitizeFieldName(col);
      frontmatter += `${fieldName}: "Sample ${col} data"\n`;
    });

    // Add metadata
    frontmatter += `source_file: "${this.fileName}"\n`;
    frontmatter += `imported: ${new Date().toISOString()}\n`;

    if (this.outputFormat === "dataview") {
      frontmatter += `type: ${this.currentStructure[0] || "item"}\n`;
      frontmatter += "tags:\n";
      this.currentStructure.forEach((col) => {
        frontmatter += `  - ${this.sanitizeFieldName(col)}\n`;
      });
    }

    frontmatter += "---\n\n";

    // Add content
    frontmatter += `# ${this.currentStructure
      .map((col) => "{{" + this.sanitizeFieldName(col) + "}}")
      .join(" - ")}\n\n`;
    frontmatter += `This note was imported from ${this.fileName} on {{imported}}.\n`;

    return frontmatter;
  }

  sanitizeFieldName(fieldName) {
    // Convert to lowercase and replace spaces/special chars with underscores
    return fieldName
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  }

  updateProcessButton() {
    this.processBtn.disabled =
      !this.csvData || this.currentStructure.length === 0;

    if (this.processBtn.disabled) {
      this.processBtn.textContent =
        this.currentStructure.length === 0
          ? "Add columns to structure first"
          : "Select CSV file first";
    } else {
      const formatText = {
        json: "Generate JSON",
        markdown: "Generate Markdown Notes",
        dataview: "Generate Dataview Notes",
      };
      this.processBtn.textContent =
        formatText[this.outputFormat] || "Generate Output";
    }
  }

  loadPreset(type) {
    if (this.csvColumns.length === 0) {
      new Notice("Please select a CSV file first to see available columns.");
      return;
    }

    this.currentStructure = [];
    this.excludedColumns = [];

    switch (type) {
      case "hierarchical":
        ["Subject", "Type", "Project", "Item"].forEach((col) => {
          if (this.csvColumns.includes(col)) {
            this.currentStructure.push(col);
          }
        });
        break;

      case "project":
        ["Project", "Type", "Item"].forEach((col) => {
          if (this.csvColumns.includes(col)) {
            this.currentStructure.push(col);
          }
        });
        break;

      case "simple":
        if (this.csvColumns.length >= 1)
          this.currentStructure.push(this.csvColumns[0]);
        if (this.csvColumns.length >= 2)
          this.currentStructure.push(this.csvColumns[1]);
        break;
    }

    this.updateAllDisplays();

    if (this.currentStructure.length > 0) {
      new Notice(
        `Applied ${type} preset with ${this.currentStructure.length} levels`
      );
    } else {
      new Notice(`No matching columns found for ${type} preset`);
    }
  }

  clearStructure() {
    this.currentStructure = [];
    this.excludedColumns = [];
    this.updateAllDisplays();
    new Notice("Structure cleared");
  }

  async processData() {
    if (!this.csvData || this.currentStructure.length === 0) return;

    try {
      if (
        this.outputFormat === "markdown" ||
        this.outputFormat === "dataview"
      ) {
        await this.processToMarkdown();
      } else {
        this.processToJSON();
      }
    } catch (error) {
      new Notice(`Error processing data: ${error.message}`);
      console.error("Processing error:", error);
    }
  }

  processToJSON() {
    const result = {
      metadata: {
        sourceFile: this.fileName,
        structure: this.currentStructure.join(" → "),
        dataColumns: this.csvColumns.filter(
          (col) =>
            !this.currentStructure.includes(col) &&
            !this.excludedColumns.includes(col)
        ),
        excludedColumns: this.excludedColumns,
        totalEntries: this.csvData.length,
        generated: new Date().toISOString(),
      },
      data: {},
    };

    // Process each row
    this.csvData.forEach((row, index) => {
      let current = result.data;

      this.currentStructure.forEach((col, level) => {
        const key = String(row[col] || "").trim() || `Empty_${col}_${index}`;

        if (level === this.currentStructure.length - 1) {
          const dataObject = {};

          this.csvColumns.forEach((column) => {
            if (
              !this.currentStructure.includes(column) &&
              !this.excludedColumns.includes(column)
            ) {
              dataObject[column] = row[column];
            }
          });

          dataObject._metadata = { sourceRow: index + 1 };
          current[key] = current[key] || dataObject;
        } else {
          current[key] = current[key] || {};
          current = current[key];
        }
      });
    });

    this.jsonData = result;
    this.showJSONOutput();
    new Notice(`Successfully processed ${this.csvData.length} rows to JSON`);
  }

  async processToMarkdown() {
    const outputFolder = this.outputFolder || `Imported/${this.fileName}`;
    const processedRows = [];
    let successCount = 0;
    let errorCount = 0;

    // Ensure output folder exists
    try {
      await this.app.vault.createFolder(outputFolder);
    } catch (e) {
      // Folder might already exist
    }

    // Process each row
    for (let i = 0; i < this.csvData.length; i++) {
      const row = this.csvData[i];

      try {
        // Generate filename from structure columns
        const filenameParts = this.currentStructure.map((col) => {
          const value = String(row[col] || "").trim() || `Empty_${col}`;
          // Sanitize for filename
          return value.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
        });

        const filename = filenameParts.join(" - ") + ".md";
        const filepath = `${outputFolder}/${filename}`;

        // Generate frontmatter
        const frontmatter = this.generateFrontmatter(row, i);

        // Generate content
        const content = this.generateMarkdownContent(row);

        // Combine
        const fullContent = frontmatter + content;

        // Create file
        await this.app.vault.create(filepath, fullContent);

        processedRows.push({
          row: i + 1,
          filename: filename,
          status: "success",
        });
        successCount++;
      } catch (error) {
        processedRows.push({
          row: i + 1,
          error: error.message,
          status: "error",
        });
        errorCount++;
      }
    }

    // Show results
    this.showMarkdownResults(
      processedRows,
      successCount,
      errorCount,
      outputFolder
    );
  }

  generateFrontmatter(row, index) {
    const remainingColumns = this.csvColumns.filter(
      (col) =>
        !this.currentStructure.includes(col) &&
        !this.excludedColumns.includes(col)
    );

    let frontmatter = "---\n";

    // Add structure fields
    this.currentStructure.forEach((col) => {
      const fieldName = this.sanitizeFieldName(col);
      const value = row[col] || "";
      frontmatter += `${fieldName}: "${this.escapeYAMLString(value)}"\n`;
    });

    // Add data fields
    remainingColumns.forEach((col) => {
      const fieldName = this.sanitizeFieldName(col);
      const value = row[col] || "";

      // Handle different data types
      if (typeof value === "boolean") {
        frontmatter += `${fieldName}: ${value}\n`;
      } else if (typeof value === "number") {
        frontmatter += `${fieldName}: ${value}\n`;
      } else {
        frontmatter += `${fieldName}: "${this.escapeYAMLString(value)}"\n`;
      }
    });

    // Add metadata
    frontmatter += `source_file: "${this.fileName}"\n`;
    frontmatter += `source_row: ${index + 1}\n`;
    frontmatter += `imported: ${new Date().toISOString()}\n`;

    if (this.outputFormat === "dataview") {
      // Add Dataview-specific fields
      frontmatter += `type: "${this.sanitizeFieldName(
        this.currentStructure[0] || "item"
      )}"\n`;

      // Add tags based on structure
      frontmatter += "tags:\n";
      frontmatter += "  - imported\n";
      this.currentStructure.forEach((col) => {
        const value = row[col] || "";
        if (value) {
          frontmatter += `  - "${this.sanitizeTagName(value)}"\n`;
        }
      });
    }

    frontmatter += "---\n\n";
    return frontmatter;
  }

  escapeYAMLString(str) {
    // Escape special characters for YAML
    return String(str)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r");
  }

  sanitizeTagName(tag) {
    // Convert to valid Obsidian tag format
    return tag
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  generateMarkdownContent(row) {
    // Generate title from structure columns
    const titleParts = this.currentStructure.map(
      (col) => row[col] || "Unknown"
    );
    const title = `# ${titleParts.join(" - ")}\n\n`;

    // Add basic content
    let content = title;

    // Add structure information
    content += "## Overview\n\n";
    this.currentStructure.forEach((col) => {
      content += `- **${col}**: ${row[col] || "N/A"}\n`;
    });
    content += "\n";

    // Add data section if there are remaining columns
    const remainingColumns = this.csvColumns.filter(
      (col) =>
        !this.currentStructure.includes(col) &&
        !this.excludedColumns.includes(col)
    );

    if (remainingColumns.length > 0) {
      content += "## Details\n\n";
      remainingColumns.forEach((col) => {
        const value = row[col];
        if (value) {
          content += `- **${col}**: ${value}\n`;
        }
      });
      content += "\n";
    }

    // Add import note
    content += `---\n\n`;
    content += `*This note was automatically imported from ${
      this.fileName
    } on ${new Date().toLocaleDateString()}.*\n`;

    return content;
  }

  showJSONOutput() {
    this.outputSection.style.display = "block";
    this.jsonOutputEl.value = JSON.stringify(this.jsonData, null, 2);

    const metadata = this.jsonData.metadata;
    this.statsEl.innerHTML = `
			<h4>Processing Statistics</h4>
			<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
				<div><strong>Total Rows:</strong> ${metadata.totalEntries}</div>
				<div><strong>Structure:</strong> ${metadata.structure}</div>
				<div><strong>Data Columns:</strong> ${metadata.dataColumns.length}</div>
				<div><strong>Excluded Columns:</strong> ${metadata.excludedColumns.length}</div>
			</div>
		`;
  }

  showMarkdownResults(processedRows, successCount, errorCount, outputFolder) {
    this.outputSection.style.display = "block";

    // Generate summary
    let summary = `# Markdown Generation Results\n\n`;
    summary += `**Output Folder**: ${outputFolder}\n`;
    summary += `**Total Processed**: ${processedRows.length}\n`;
    summary += `**Successful**: ${successCount}\n`;
    summary += `**Errors**: ${errorCount}\n\n`;

    if (errorCount > 0) {
      summary += `## Errors\n\n`;
      processedRows
        .filter((r) => r.status === "error")
        .forEach((r) => {
          summary += `- Row ${r.row}: ${r.error}\n`;
        });
      summary += "\n";
    }

    summary += `## Created Files\n\n`;
    processedRows
      .filter((r) => r.status === "success")
      .forEach((r) => {
        summary += `- ${r.filename}\n`;
      });

    this.jsonOutputEl.value = summary;

    this.statsEl.innerHTML = `
			<h4>Processing Complete</h4>
			<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
				<div><strong>Files Created:</strong> ${successCount}</div>
				<div><strong>Errors:</strong> ${errorCount}</div>
				<div><strong>Output Folder:</strong> ${outputFolder}</div>
				<div><strong>Format:</strong> ${this.outputFormat.toUpperCase()}</div>
			</div>
		`;

    new Notice(`Created ${successCount} markdown files in ${outputFolder}`);
  }

  async saveToVault() {
    if (!this.jsonData && this.outputFormat === "json") return;

    try {
      if (this.outputFormat === "json") {
        const fileName = `${this.fileName || "data"}_structured.json`;
        const content = JSON.stringify(this.jsonData, null, 2);

        await this.app.vault.create(fileName, content);
        new Notice(`JSON saved as ${fileName}`);
      } else {
        // For markdown output, create a summary file
        const summaryFile = `${
          this.outputFolder || "Imported"
        }/_import_summary.md`;
        await this.app.vault.create(summaryFile, this.jsonOutputEl.value);
        new Notice(`Import summary saved to ${summaryFile}`);
      }
    } catch (error) {
      new Notice(`Error saving file: ${error.message}`);
    }
  }

  async copyToClipboard() {
    if (!this.jsonOutputEl.value) return;

    try {
      await navigator.clipboard.writeText(this.jsonOutputEl.value);
      new Notice("Output copied to clipboard!");
    } catch (error) {
      new Notice(`Failed to copy: ${error.message}`);
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

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
                setTimeout(() => {
                  const fileItems = modal.fileListEl.querySelectorAll(
                    ".csv-json-file-item"
                  );
                  fileItems.forEach((item) => {
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
