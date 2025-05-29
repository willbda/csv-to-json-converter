const Utils = require('./utils');

/**
 * Template Management System
 * Handles saving, loading, and managing structure templates
 */
class TemplateManager {
  constructor(plugin) {
    this.plugin = plugin;
    this.templates = {};
  }

  /**
   * Load templates from plugin data
   * @returns {Promise<void>}
   */
  async loadTemplates() {
    try {
      const saved = await this.plugin.loadData();
      this.templates = (saved && saved.templates) ? saved.templates : {};
    } catch (error) {
      console.error('Failed to load templates:', error);
      this.templates = {};
    }
  }

  /**
   * Save current templates to plugin data
   * @returns {Promise<boolean>} Success status
   */
  async saveTemplates() {
    try {
      await this.plugin.saveData({ templates: this.templates });
      return true;
    } catch (error) {
      console.error('Failed to save templates:', error);
      return false;
    }
  }

  /**
   * Save a new template
   * @param {string} name - Template name
   * @param {object} config - Template configuration
   * @returns {Promise<boolean>} Success status
   */
  async saveTemplate(name, config) {
    if (!name || typeof name !== 'string') {
      throw new Error('Template name must be a non-empty string');
    }

    if (!config || !config.structure || !Array.isArray(config.structure)) {
      throw new Error('Template must include a valid structure array');
    }

    // Validate template configuration
    this._validateTemplateConfig(config);

    // Create template object
    const template = {
      name: name.trim(),
      structure: [...config.structure],
      excluded: [...(config.excluded || [])],
      created: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      description: config.description || '',
      metadata: {
        version: '1.0',
        columnCount: config.structure.length,
        excludedCount: (config.excluded || []).length
      }
    };

    this.templates[name] = template;
    return await this.saveTemplates();
  }

  /**
   * Load a template by name
   * @param {string} name - Template name
   * @returns {object|null} Template configuration or null if not found
   */
  getTemplate(name) {
    const template = this.templates[name];
    if (template) {
      // Update last used timestamp
      template.lastUsed = new Date().toISOString();
      this.saveTemplates(); // Fire and forget
      return Utils.deepClone(template);
    }
    return null;
  }

  /**
   * Delete a template
   * @param {string} name - Template name
   * @returns {Promise<boolean>} Success status
   */
  async deleteTemplate(name) {
    if (this.templates[name]) {
      delete this.templates[name];
      return await this.saveTemplates();
    }
    return true; // Already doesn't exist
  }

  /**
   * Get all template names
   * @returns {string[]} Array of template names
   */
  getTemplateNames() {
    return Object.keys(this.templates).sort();
  }

  /**
   * Get all templates with metadata
   * @returns {object[]} Array of template objects
   */
  getAllTemplates() {
    return Object.entries(this.templates).map(([name, template]) => ({
      name,
      ...template
    })).sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));
  }

  /**
   * Check if template name exists
   * @param {string} name - Template name
   * @returns {boolean} True if template exists
   */
  templateExists(name) {
    return this.templates.hasOwnProperty(name);
  }

  /**
   * Validate template against current CSV columns
   * @param {string} templateName - Name of template to validate
   * @param {string[]} availableColumns - Currently available CSV columns
   * @returns {object} Validation results
   */
  validateTemplate(templateName, availableColumns) {
    const template = this.templates[templateName];
    if (!template) {
      return {
        valid: false,
        error: 'Template not found',
        missingColumns: [],
        warnings: []
      };
    }

    const missingColumns = template.structure.filter(col => 
      !availableColumns.includes(col)
    );

    const missingExcluded = template.excluded.filter(col => 
      !availableColumns.includes(col)
    );

    const warnings = [];
    if (missingExcluded.length > 0) {
      warnings.push(`Excluded columns no longer available: ${missingExcluded.join(', ')}`);
    }

    return {
      valid: missingColumns.length === 0,
      error: missingColumns.length > 0 ? `Missing columns: ${missingColumns.join(', ')}` : null,
      missingColumns,
      warnings,
      availableColumns: template.structure.filter(col => availableColumns.includes(col)),
      availableExcluded: template.excluded.filter(col => availableColumns.includes(col))
    };
  }

  /**
   * Export templates to JSON string
   * @returns {string} JSON representation of all templates
   */
  exportTemplates() {
    return JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      templates: this.templates
    }, null, 2);
  }

  /**
   * Import templates from JSON string
   * @param {string} jsonString - JSON string containing templates
   * @returns {Promise<object>} Import results
   */
  async importTemplates(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      
      if (!data.templates || typeof data.templates !== 'object') {
        throw new Error('Invalid template file format');
      }

      const results = {
        imported: 0,
        skipped: 0,
        errors: []
      };

      for (const [name, template] of Object.entries(data.templates)) {
        try {
          // Validate template structure
          this._validateTemplateConfig(template);
          
          // Check if template already exists
          if (this.templates[name]) {
            results.skipped++;
            continue;
          }

          // Import template
          this.templates[name] = {
            ...template,
            imported: new Date().toISOString()
          };
          results.imported++;

        } catch (error) {
          results.errors.push(`Template "${name}": ${Utils.getErrorMessage(error)}`);
        }
      }

      await this.saveTemplates();
      return results;

    } catch (error) {
      throw new Error(`Failed to import templates: ${Utils.getErrorMessage(error)}`);
    }
  }

  /**
   * Get template usage statistics
   * @returns {object} Usage statistics
   */
  getUsageStatistics() {
    const templates = this.getAllTemplates();
    const now = new Date();

    return {
      total: templates.length,
      mostRecentlyUsed: templates.length > 0 ? templates[0].name : null,
      usedThisWeek: templates.filter(t => {
        const lastUsed = new Date(t.lastUsed);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return lastUsed > weekAgo;
      }).length,
      averageStructureLength: templates.length > 0 
        ? Math.round(templates.reduce((sum, t) => sum + t.structure.length, 0) / templates.length)
        : 0
    };
  }

  /**
   * Validate template configuration
   * @private
   * @param {object} config - Template configuration to validate
   */
  _validateTemplateConfig(config) {
    if (!config.structure || !Array.isArray(config.structure)) {
      throw new Error('Template structure must be an array');
    }

    if (config.structure.length === 0) {
      throw new Error('Template structure cannot be empty');
    }

    if (config.excluded && !Array.isArray(config.excluded)) {
      throw new Error('Template excluded columns must be an array');
    }

    // Check for duplicate structure columns
    const duplicates = config.structure.filter((col, index) => 
      config.structure.indexOf(col) !== index
    );

    if (duplicates.length > 0) {
      throw new Error(`Duplicate columns in structure: ${duplicates.join(', ')}`);
    }

    // Check for columns in both structure and excluded
    const structureSet = new Set(config.structure);
    const conflictingColumns = (config.excluded || []).filter(col => 
      structureSet.has(col)
    );

    if (conflictingColumns.length > 0) {
      throw new Error(`Columns cannot be both in structure and excluded: ${conflictingColumns.join(', ')}`);
    }
  }

  /**
   * Clear all templates
   * @returns {Promise<boolean>} Success status
   */
  async clearAllTemplates() {
    this.templates = {};
    return await this.saveTemplates();
  }
}

module.exports = TemplateManager;
