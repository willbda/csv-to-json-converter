const Utils = require('./utils');
const CONSTANTS = require('./constants');

/**
 * Output Generation for different formats
 * Handles JSON, Markdown, and Dataview output generation
 */
class OutputGenerator {
  constructor(app) {
    this.app = app;
  }

  /**
   * Generate JSON output
   * @param {object} processedData - Data from CSVProcessor
   * @returns {string} JSON string
   */
  generateJSON(processedData) {
    try {
      return JSON.stringify(processedData, null, 2);
    } catch (error) {
      throw new Error(`Failed to generate JSON: ${Utils.getErrorMessage(error)}`);
    }
  }

  /**
   * Generate markdown files and return summary
   * @param {object} processedData - Data from CSVProcessor
   * @param {string} outputFolder - Target folder for files
   * @returns {Promise<object>} Generation results
   */
  async generateMarkdownFiles(processedData, outputFolder) {
    const results = {
      successCount: 0,
      errorCount: 0,
      files: [],
      errors: []
    };

    // Ensure output folder exists
    try {
      await this.app.vault.createFolder(outputFolder);
    } catch (e) {
      // Folder might already exist, ignore error
    }

    // Process each data item
    for (const item of processedData.data) {
      try {
        const content = this._generateMarkdownContent(item, processedData);
        const filepath = `${outputFolder}/${item.filename}`;

        // Check if file already exists
        const existingFile = this.app.vault.getAbstractFileByPath(filepath);
        if (existingFile) {
          // File exists, append number to filename
          const newFilepath = this._generateUniqueFilename(outputFolder, item.filename);
          await this.app.vault.create(newFilepath, content);
          results.files.push({ original: item.filename, created: newFilepath });
        } else {
          await this.app.vault.create(filepath, content);
          results.files.push({ original: item.filename, created: filepath });
        }

        results.successCount++;
      } catch (error) {
        results.errorCount++;
        results.errors.push({
          filename: item.filename,
          error: Utils.getErrorMessage(error)
        });
      }
    }

    return results;
  }

  /**
   * Generate unique filename if file already exists
   * @private
   */
  _generateUniqueFilename(folder, filename) {
    const baseName = filename.replace('.md', '');
    let counter = 1;
    let newFilename;

    do {
      newFilename = `${folder}/${baseName}_${counter}.md`;
      counter++;
    } while (this.app.vault.getAbstractFileByPath(newFilename));

    return newFilename;
  }

  /**
   * Generate markdown content for a single item
   * @private
   */
  _generateMarkdownContent(item, processedData) {
    const isDataview = processedData.format === CONSTANTS.OUTPUT_FORMATS.DATAVIEW;
    
    // Generate frontmatter
    const frontmatter = this._generateFrontmatter(item, processedData, isDataview);
    
    // Generate body content
    const bodyContent = this._generateMarkdownBody(item, processedData);
    
    return frontmatter + bodyContent;
  }

  /**
   * Generate YAML frontmatter
   * @private
   */
  _generateFrontmatter(item, processedData, isDataview) {
    let frontmatter = '---\\n';

    // Add structure fields
    processedData.structure.forEach(col => {
      const fieldName = Utils.sanitizeFieldName(col);
      const value = item.structureData[col] || '';
      frontmatter += `${fieldName}: "${Utils.escapeYAMLString(value)}"\\n`;
    });

    // Add data fields
    processedData.dataColumns.forEach(col => {
      const fieldName = Utils.sanitizeFieldName(col);
      const value = item.contentData[col] || '';

      // Handle different data types
      if (typeof value === 'boolean') {
        frontmatter += `${fieldName}: ${value}\\n`;
      } else if (typeof value === 'number') {
        frontmatter += `${fieldName}: ${value}\\n`;
      } else {
        frontmatter += `${fieldName}: "${Utils.escapeYAMLString(value)}"\\n`;
      }
    });

    // Add metadata
    frontmatter += `source_file: "${processedData.sourceFile}"\\n`;
    frontmatter += `source_row: ${item.sourceRow}\\n`;
    frontmatter += `imported: ${processedData.generated}\\n`;

    // Add Dataview-specific fields
    if (isDataview) {
      frontmatter += `type: "${Utils.sanitizeFieldName(processedData.structure[0] || 'item')}"\\n`;
      
      // Add tags
      frontmatter += 'tags:\\n';
      frontmatter += '  - imported\\n';
      
      processedData.structure.forEach(col => {
        const value = item.structureData[col];
        if (value && !Utils.isEmpty(value)) {
          const tagName = Utils.sanitizeTagName(String(value));
          if (tagName) {
            frontmatter += `  - "${tagName}"\\n`;
          }
        }
      });
    }

    frontmatter += '---\\n\\n';
    return frontmatter;
  }

  /**
   * Generate markdown body content
   * @private
   */
  _generateMarkdownBody(item, processedData) {
    // Generate title
    const titleParts = processedData.structure.map(col => 
      item.structureData[col] || 'Unknown'
    );
    let content = `# ${titleParts.join(' - ')}\\n\\n`;

    // Add overview section
    content += '## Overview\\n\\n';
    processedData.structure.forEach(col => {
      const value = item.structureData[col] || 'N/A';
      content += `- **${col}**: ${value}\\n`;
    });
    content += '\\n';

    // Add details section if there are data columns
    if (processedData.dataColumns.length > 0) {
      content += '## Details\\n\\n';
      processedData.dataColumns.forEach(col => {
        const value = item.contentData[col];
        if (!Utils.isEmpty(value)) {
          content += `- **${col}**: ${value}\\n`;
        }
      });
      content += '\\n';
    }

    // Add footer
    content += `---\\n\\n`;
    content += `*This note was automatically imported from ${processedData.sourceFile} on ${new Date().toLocaleDateString()}.*\\n`;

    return content;
  }

  /**
   * Generate preview content for different formats
   * @param {object} structure - Current structure configuration
   * @param {string[]} dataColumns - Available data columns
   * @param {string} outputFormat - Target output format
   * @returns {string} Preview content
   */
  generatePreview(structure, dataColumns, outputFormat) {
    switch (outputFormat) {
      case CONSTANTS.OUTPUT_FORMATS.JSON:
        return this._generateJSONPreview(structure, dataColumns);
      case CONSTANTS.OUTPUT_FORMATS.MARKDOWN:
      case CONSTANTS.OUTPUT_FORMATS.DATAVIEW:
        return this._generateMarkdownPreview(structure, dataColumns, outputFormat);
      default:
        return 'Preview not available for this format';
    }
  }

  /**
   * Generate JSON preview
   * @private
   */
  _generateJSONPreview(structure, dataColumns) {
    if (structure.length === 0) {
      return '{}';
    }

    let example = {};
    let current = example;

    structure.forEach((col, index) => {
      const exampleValue = `Example_${col}_Value`;
      if (index === structure.length - 1) {
        // Leaf level
        current[exampleValue] = {};
        dataColumns.forEach(dataCol => {
          current[exampleValue][dataCol] = `Sample ${dataCol} data`;
        });
        current[exampleValue]._metadata = { 
          sourceRow: 1,
          structurePath: structure.map(c => `Example_${c}_Value`).join(' → ')
        };
      } else {
        // Intermediate level
        current[exampleValue] = {};
        current = current[exampleValue];
      }
    });

    return JSON.stringify({
      metadata: {
        structure: structure.join(' → '),
        dataColumns: dataColumns,
        totalEntries: '...',
        generated: new Date().toISOString()
      },
      data: example
    }, null, 2);
  }

  /**
   * Generate markdown preview
   * @private
   */
  _generateMarkdownPreview(structure, dataColumns, outputFormat) {
    const isDataview = outputFormat === CONSTANTS.OUTPUT_FORMATS.DATAVIEW;
    
    let frontmatter = '---\\n';

    // Structure fields
    structure.forEach(col => {
      const fieldName = Utils.sanitizeFieldName(col);
      frontmatter += `${fieldName}: "Example_${col}_Value"\\n`;
    });

    // Data fields
    dataColumns.forEach(col => {
      const fieldName = Utils.sanitizeFieldName(col);
      frontmatter += `${fieldName}: "Sample ${col} data"\\n`;
    });

    // Metadata
    frontmatter += `source_file: "example.csv"\\n`;
    frontmatter += `imported: ${new Date().toISOString()}\\n`;

    // Dataview-specific
    if (isDataview) {
      frontmatter += `type: ${Utils.sanitizeFieldName(structure[0] || 'item')}\\n`;
      frontmatter += 'tags:\\n';
      frontmatter += '  - imported\\n';
      structure.forEach(col => {
        frontmatter += `  - ${Utils.sanitizeFieldName(col)}\\n`;
      });
    }

    frontmatter += '---\\n\\n';

    // Body content
    const titleParts = structure.map(col => `{{${Utils.sanitizeFieldName(col)}}}`);
    frontmatter += `# ${titleParts.join(' - ')}\\n\\n`;
    frontmatter += `This note was imported from {{source_file}} on {{imported}}.\\n`;

    return frontmatter;
  }

  /**
   * Create summary report for markdown generation
   * @param {object} results - Generation results
   * @param {string} outputFolder - Output folder path
   * @returns {string} Summary content
   */
  createSummaryReport(results, outputFolder) {
    let summary = `# Markdown Generation Results\\n\\n`;
    summary += `**Output Folder**: ${outputFolder}\\n`;
    summary += `**Total Processed**: ${results.files.length}\\n`;
    summary += `**Successful**: ${results.successCount}\\n`;
    summary += `**Errors**: ${results.errorCount}\\n\\n`;

    if (results.errorCount > 0) {
      summary += `## Errors\\n\\n`;
      results.errors.forEach(error => {
        summary += `- ${error.filename}: ${error.error}\\n`;
      });
      summary += '\\n';
    }

    summary += `## Created Files\\n\\n`;
    results.files.forEach(file => {
      summary += `- ${file.created}\\n`;
    });

    return summary;
  }
}

module.exports = OutputGenerator;
