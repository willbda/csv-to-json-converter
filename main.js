const { Plugin, Modal, Notice, Setting, TFile } = require("obsidian");

// Embedded PapaParse - simplified version for CSV parsing
const Papa = {
	parse: function(input, config = {}) {
		const lines = input.split('\n').filter(line => line.trim());
		if (lines.length === 0) return { data: [], meta: { fields: [] } };
		
		const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
		const data = [];
		
		for (let i = 1; i < lines.length; i++) {
			const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
			const row = {};
			headers.forEach((header, index) => {
				row[header] = values[index] || '';
			});
			data.push(row);
		}
		
		return {
			data: data,
			meta: { fields: headers }
		};
	}
};

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
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('csv-json-modal');
		
		// Add custom styles
		this.addStyles();
		
		// Create the main interface
		this.createInterface();
	}

	addStyles() {
		const style = document.createElement('style');
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
		`;
		document.head.appendChild(style);
	}

	createInterface() {
		const { contentEl } = this;
		
		const container = contentEl.createDiv('csv-json-container');
		
		// Title
		container.createEl('h2', { 
			text: 'CSV to JSON Converter',
			cls: 'csv-json-title'
		});
		
		// Step 1: File Selection
		this.createFileSelection(container);
		
		// Step 2: Structure Builder
		this.createStructureBuilder(container);
		
		// Preview
		this.createPreview(container);
		
		// Output section
		this.createOutputSection(container);
	}

	createFileSelection(container) {
		const step = container.createDiv('csv-json-step');
		step.createEl('h3', { text: 'Step 1: Select CSV File from Vault' });
		
		const fileGrid = step.createDiv('csv-json-file-grid');
		
		// File list
		const fileSection = fileGrid.createDiv('csv-json-file-section');
		fileSection.createEl('h4', { text: 'CSV Files in Vault:' });
		
		this.fileListEl = fileSection.createDiv('csv-json-file-list');
		this.loadVaultFiles();
		
		// File preview
		const previewSection = fileGrid.createDiv();
		previewSection.createEl('h4', { text: 'File Preview:' });
		this.filePreviewEl = previewSection.createDiv('csv-json-columns-preview');
		this.filePreviewEl.createDiv({ text: 'Select a CSV file to see preview...' });
	}

	async loadVaultFiles() {
		const files = this.app.vault.getFiles()
			.filter(file => file.extension === 'csv');
		
		this.fileListEl.empty();
		
		if (files.length === 0) {
			this.fileListEl.createDiv({ text: 'No CSV files found in vault' });
			return;
		}
		
		files.forEach(file => {
			const fileItem = this.fileListEl.createDiv('csv-json-file-item');
			fileItem.textContent = file.path;
			fileItem.addEventListener('click', () => this.selectFile(file, fileItem));
		});
	}

	async selectFile(file, element) {
		// Update UI
		this.fileListEl.querySelectorAll('.csv-json-file-item').forEach(item => {
			item.removeClass('selected');
		});
		element.addClass('selected');
		
		try {
			// Read file content
			const content = await this.app.vault.read(file);
			this.fileName = file.basename;
			
			// Parse CSV to get structure
			const previewResult = Papa.parse(content);
			this.csvColumns = previewResult.meta.fields || [];
			
			// Parse full data for processing
			this.csvData = previewResult.data;
			
			// Update UI
			this.displayColumns();
			this.updateAllDisplays();
			
			new Notice(`CSV loaded: ${this.csvData.length} rows, ${this.csvColumns.length} columns`);
		} catch (error) {
			new Notice(`Error reading file: ${error.message}`);
		}
	}

	displayColumns() {
		this.filePreviewEl.empty();
		this.filePreviewEl.createEl('h4', { text: 'Available Columns:' });
		
		const display = this.filePreviewEl.createDiv();
		this.csvColumns.forEach(col => {
			const span = display.createSpan();
			span.textContent = col;
			span.style.background = 'var(--background-modifier-border)';
			span.style.padding = '4px 8px';
			span.style.margin = '2px';
			span.style.borderRadius = '4px';
			span.style.display = 'inline-block';
		});
		
		// Update draggable columns
		this.updateAvailableColumns();
	}

	createStructureBuilder(container) {
		const step = container.createDiv('csv-json-step');
		step.createEl('h3', { text: 'Step 2: Design JSON Structure' });
		
		// Preset buttons
		const presetButtons = step.createDiv('csv-json-preset-buttons');
		
		const hierarchicalBtn = presetButtons.createEl('button', { 
			text: 'Hierarchical',
			cls: 'csv-json-preset-btn'
		});
		hierarchicalBtn.addEventListener('click', () => this.loadPreset('hierarchical'));
		
		const projectBtn = presetButtons.createEl('button', { 
			text: 'Project-Based',
			cls: 'csv-json-preset-btn'
		});
		projectBtn.addEventListener('click', () => this.loadPreset('project'));
		
		const simpleBtn = presetButtons.createEl('button', { 
			text: 'Simple Grouping',
			cls: 'csv-json-preset-btn'
		});
		simpleBtn.addEventListener('click', () => this.loadPreset('simple'));
		
		const clearBtn = presetButtons.createEl('button', { 
			text: 'Clear All',
			cls: 'csv-json-preset-btn'
		});
		clearBtn.style.background = 'var(--text-error)';
		clearBtn.addEventListener('click', () => this.clearStructure());
		
		// Available columns
		this.availableColumnsEl = step.createDiv('csv-json-available-columns');
		this.updateAvailableColumns();
		
		// Structure area
		step.createEl('h4', { text: 'JSON Structure (drag columns here):' });
		this.nestingLevelsEl = step.createDiv('csv-json-nesting-levels');
		this.updateStructureDisplay();
		
		// Excluded area
		step.createEl('h4', { text: 'Excluded Columns (drag columns here to exclude):' });
		this.excludedZoneEl = step.createDiv('csv-json-excluded-zone');
		this.updateExcludedDisplay();
		
		// Process button
		this.processBtn = step.createEl('button', {
			text: 'Generate JSON with Custom Structure',
			cls: 'csv-json-process-btn'
		});
		this.processBtn.disabled = true;
		this.processBtn.addEventListener('click', () => this.processData());
	}

	updateAvailableColumns() {
		this.availableColumnsEl.empty();
		this.availableColumnsEl.createEl('h4', { text: 'Available Columns (drag to configure):' });
		
		if (this.csvColumns.length === 0) {
			this.availableColumnsEl.createDiv({ text: 'Select a file first to see columns...' });
			return;
		}
		
		this.csvColumns.forEach(col => {
			const tag = this.availableColumnsEl.createSpan({
				text: col,
				cls: 'csv-json-column-tag'
			});
			tag.draggable = true;
			tag.dataset.column = col;
			
			// Update tag appearance
			if (this.currentStructure.includes(col)) {
				tag.addClass('used');
			} else if (this.excludedColumns.includes(col)) {
				tag.addClass('excluded');
			}
			
			tag.addEventListener('dragstart', (e) => this.handleDragStart(e));
			tag.addEventListener('dragend', (e) => this.handleDragEnd(e));
		});
	}

	updateStructureDisplay() {
		this.nestingLevelsEl.empty();
		
		if (this.currentStructure.length === 0) {
			const emptyZone = this.nestingLevelsEl.createDiv('csv-json-empty-drop-zone');
			emptyZone.innerHTML = `
				Drag column tags here to build your JSON structure<br>
				<small>The order determines nesting levels (top = outermost)</small>
			`;
		} else {
			this.currentStructure.forEach((col, index) => {
				const level = this.nestingLevelsEl.createDiv('csv-json-level');
				level.draggable = true;
				level.dataset.level = index;
				
				const content = level.createDiv('csv-json-level-content');
				
				const levelNumber = content.createDiv('csv-json-level-number');
				levelNumber.textContent = (index + 1).toString();
				
				const nameEl = content.createEl('strong');
				nameEl.textContent = col;
				
				const description = content.createEl('small');
				description.textContent = index === this.currentStructure.length - 1 
					? 'Data Level' 
					: `Grouping Level ${index + 1}`;
				description.style.color = 'var(--text-muted)';
				description.style.marginLeft = '10px';
				
				const removeBtn = level.createEl('button', {
					text: '✕',
					cls: 'csv-json-remove-btn'
				});
				removeBtn.addEventListener('click', () => this.removeFromStructure(col));
			});
		}
		
		// Setup drop zone
		this.nestingLevelsEl.addEventListener('dragover', (e) => this.handleDragOver(e, 'structure'));
		this.nestingLevelsEl.addEventListener('drop', (e) => this.handleDrop(e, 'structure'));
	}

	updateExcludedDisplay() {
		this.excludedZoneEl.empty();
		
		const dropZone = this.excludedZoneEl.createDiv('csv-json-excluded-drop-zone');
		
		if (this.excludedColumns.length === 0) {
			dropZone.textContent = 'Drag columns here to exclude them from the output JSON';
		} else {
			dropZone.empty();
			this.excludedColumns.forEach(col => {
				const item = dropZone.createDiv('csv-json-excluded-item');
				
				const content = item.createDiv('csv-json-excluded-content');
				
				const icon = content.createDiv('csv-json-excluded-icon');
				icon.textContent = '✕';
				
				const nameEl = content.createEl('strong');
				nameEl.textContent = col;
				
				const description = content.createEl('small');
				description.textContent = 'Excluded';
				description.style.color = 'var(--text-muted)';
				description.style.marginLeft = '10px';
				
				const restoreBtn = item.createEl('button', {
					text: 'Restore',
					cls: 'csv-json-remove-btn'
				});
				restoreBtn.addEventListener('click', () => this.removeFromExcluded(col));
			});
		}
		
		// Setup drop zone
		dropZone.addEventListener('dragover', (e) => this.handleDragOver(e, 'excluded'));
		dropZone.addEventListener('drop', (e) => this.handleDrop(e, 'excluded'));
	}

	createPreview(container) {
		this.previewEl = container.createDiv('csv-json-preview');
		this.previewEl.style.display = 'none';
		
		this.previewEl.createEl('h4', { text: 'Structure Preview & Example' });
		this.structureDescriptionEl = this.previewEl.createDiv();
		this.jsonPreviewEl = this.previewEl.createDiv('csv-json-json-preview');
	}

	createOutputSection(container) {
		this.outputSection = container.createDiv('csv-json-output-section');
		this.outputSection.style.display = 'none';
		
		this.outputSection.createEl('h3', { text: 'Generated JSON' });
		
		this.statsEl = this.outputSection.createDiv();
		
		this.jsonOutputEl = this.outputSection.createEl('textarea', {
			cls: 'csv-json-textarea'
		});
		this.jsonOutputEl.readOnly = true;
		
		const controls = this.outputSection.createDiv('csv-json-output-controls');
		
		const saveBtn = controls.createEl('button', {
			text: 'Save to Vault',
			cls: 'csv-json-btn csv-json-btn-primary'
		});
		saveBtn.addEventListener('click', () => this.saveToVault());
		
		const copyBtn = controls.createEl('button', {
			text: 'Copy to Clipboard',
			cls: 'csv-json-btn csv-json-btn-secondary'
		});
		copyBtn.addEventListener('click', () => this.copyToClipboard());
	}

	// Drag and drop functionality
	handleDragStart(e) {
		e.dataTransfer.setData('text/plain', e.target.dataset.column);
		e.target.addClass('dragging');
	}

	handleDragEnd(e) {
		e.target.removeClass('dragging');
	}

	handleDragOver(e, type) {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
	}

	handleDrop(e, type) {
		e.preventDefault();
		const column = e.dataTransfer.getData('text/plain');
		if (!column) return;

		if (type === 'structure' && 
			!this.currentStructure.includes(column) && 
			!this.excludedColumns.includes(column)) {
			this.addToStructure(column);
		} else if (type === 'excluded' && 
			!this.excludedColumns.includes(column) && 
			!this.currentStructure.includes(column)) {
			this.addToExcluded(column);
		}
	}

	addToStructure(column) {
		this.currentStructure.push(column);
		this.updateAllDisplays();
	}

	removeFromStructure(column) {
		this.currentStructure = this.currentStructure.filter(col => col !== column);
		this.updateAllDisplays();
	}

	addToExcluded(column) {
		this.excludedColumns.push(column);
		this.updateAllDisplays();
	}

	removeFromExcluded(column) {
		this.excludedColumns = this.excludedColumns.filter(col => col !== column);
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
			this.previewEl.style.display = 'none';
			return;
		}

		this.previewEl.style.display = 'block';

		// Generate structure description
		const structureText = this.currentStructure.join(' → ');
		const remainingColumns = this.csvColumns.filter(col => 
			!this.currentStructure.includes(col) && !this.excludedColumns.includes(col)
		);

		this.structureDescriptionEl.innerHTML = `
			<strong>Structure:</strong> ${structureText}<br>
			<strong>Data Columns:</strong> ${remainingColumns.length > 0 ? remainingColumns.join(', ') : 'None'}<br>
			<strong>Excluded Columns:</strong> ${this.excludedColumns.length > 0 ? this.excludedColumns.join(', ') : 'None'}
		`;

		// Generate example JSON
		const example = this.generateExampleJSON();
		this.jsonPreviewEl.textContent = JSON.stringify(example, null, 2);
	}

	generateExampleJSON() {
		if (this.currentStructure.length === 0) return {};

		const remainingColumns = this.csvColumns.filter(col => 
			!this.currentStructure.includes(col) && !this.excludedColumns.includes(col)
		);

		let example = {};
		let current = example;

		this.currentStructure.forEach((col, index) => {
			const exampleValue = `Example_${col}_Value`;
			if (index === this.currentStructure.length - 1) {
				current[exampleValue] = {};
				remainingColumns.forEach(remainingCol => {
					current[exampleValue][remainingCol] = `Sample ${remainingCol} data`;
				});
				current[exampleValue]._metadata = { sourceRow: 1 };
			} else {
				current[exampleValue] = {};
				current = current[exampleValue];
			}
		});

		return {
			metadata: {
				structure: this.currentStructure.join(' → '),
				dataColumns: remainingColumns,
				excludedColumns: this.excludedColumns,
				totalEntries: '...',
				generated: new Date().toISOString()
			},
			data: example
		};
	}

	updateProcessButton() {
		this.processBtn.disabled = !this.csvData || this.currentStructure.length === 0;
		
		if (this.processBtn.disabled) {
			this.processBtn.textContent = this.currentStructure.length === 0 
				? 'Add columns to structure first'
				: 'Select CSV file first';
		} else {
			this.processBtn.textContent = 'Generate JSON with Custom Structure';
		}
	}

	loadPreset(type) {
		if (this.csvColumns.length === 0) {
			new Notice('Please select a CSV file first to see available columns.');
			return;
		}

		this.currentStructure = [];
		this.excludedColumns = [];

		switch (type) {
			case 'hierarchical':
				['Subject', 'Type', 'Project', 'Item'].forEach(col => {
					if (this.csvColumns.includes(col)) {
						this.currentStructure.push(col);
					}
				});
				break;

			case 'project':
				['Project', 'Type', 'Item'].forEach(col => {
					if (this.csvColumns.includes(col)) {
						this.currentStructure.push(col);
					}
				});
				break;

			case 'simple':
				if (this.csvColumns.length >= 1) this.currentStructure.push(this.csvColumns[0]);
				if (this.csvColumns.length >= 2) this.currentStructure.push(this.csvColumns[1]);
				break;
		}

		this.updateAllDisplays();

		if (this.currentStructure.length > 0) {
			new Notice(`Applied ${type} preset with ${this.currentStructure.length} levels`);
		} else {
			new Notice(`No matching columns found for ${type} preset`);
		}
	}

	clearStructure() {
		this.currentStructure = [];
		this.excludedColumns = [];
		this.updateAllDisplays();
		new Notice('Structure cleared');
	}

	processData() {
		if (!this.csvData || this.currentStructure.length === 0) return;

		try {
			const result = {
				metadata: {
					sourceFile: this.fileName,
					structure: this.currentStructure.join(' → '),
					dataColumns: this.csvColumns.filter(col => 
						!this.currentStructure.includes(col) && !this.excludedColumns.includes(col)
					),
					excludedColumns: this.excludedColumns,
					totalEntries: this.csvData.length,
					generated: new Date().toISOString()
				},
				data: {}
			};

			// Process each row
			this.csvData.forEach((row, index) => {
				let current = result.data;

				this.currentStructure.forEach((col, level) => {
					const key = String(row[col] || '').trim() || `Empty_${col}_${index}`;

					if (level === this.currentStructure.length - 1) {
						const dataObject = {};

						this.csvColumns.forEach(column => {
							if (!this.currentStructure.includes(column) && 
								!this.excludedColumns.includes(column)) {
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
			this.showOutputPreview();
			new Notice(`Successfully processed ${this.csvData.length} rows`);
		} catch (error) {
			new Notice(`Error processing data: ${error.message}`);
		}
	}

	showOutputPreview() {
		this.outputSection.style.display = 'block';
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

	async saveToVault() {
		if (!this.jsonData) return;

		try {
			const fileName = `${this.fileName || 'data'}_structured.json`;
			const content = JSON.stringify(this.jsonData, null, 2);
			
			await this.app.vault.create(fileName, content);
			new Notice(`JSON saved as ${fileName}`);
		} catch (error) {
			new Notice(`Error saving file: ${error.message}`);
		}
	}

	async copyToClipboard() {
		if (!this.jsonData) return;

		try {
			await navigator.clipboard.writeText(this.jsonOutputEl.value);
			new Notice('JSON copied to clipboard!');
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
	onload() {
		console.log('CSV to JSON Converter plugin loaded');

		// Add command to open the converter
		this.addCommand({
			id: 'open-csv-json-converter',
			name: 'Open CSV to JSON Converter',
			callback: () => {
				new CSVtoJSONModal(this.app, this).open();
			}
		});

		// Add ribbon icon
		this.addRibbonIcon('file-spreadsheet', 'CSV to JSON Converter', () => {
			new CSVtoJSONModal(this.app, this).open();
		});

		// Add to file menu for CSV files
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (file instanceof TFile && file.extension === 'csv') {
					menu.addItem((item) => {
						item
							.setTitle('Convert to JSON')
							.setIcon('file-spreadsheet')
							.onClick(async () => {
								const modal = new CSVtoJSONModal(this.app, this);
								modal.open();
								// Auto-select the file
								setTimeout(() => {
									const fileItems = modal.fileListEl.querySelectorAll('.csv-json-file-item');
									fileItems.forEach(item => {
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
		console.log('CSV to JSON Converter plugin unloaded');
	}
}

module.exports = CSVtoJSONPlugin;