const CONSTANTS = require('./constants');

/**
 * Utility functions for data processing and validation
 */
class Utils {
  /**
   * Sanitize field name for use in YAML frontmatter and Dataview
   * @param {string} fieldName - The field name to sanitize
   * @returns {string} Sanitized field name
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

  /**
   * Sanitize tag name for Obsidian tags
   * @param {string} tag - The tag to sanitize
   * @returns {string} Sanitized tag
   */
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

  /**
   * Escape string for safe YAML usage
   * @param {*} str - Value to escape
   * @returns {string} Escaped string
   */
  static escapeYAMLString(str) {
    if (str === null || str === undefined) {
      return '';
    }
    
    return String(str)
      .replace(/\\\\/g, '\\\\\\\\')
      .replace(/"/g, '\\\\"')
      .replace(/\\n/g, '\\\\n')
      .replace(/\\r/g, '\\\\r');
  }

  /**
   * Validate column names for Dataview compatibility
   * @param {string[]} columns - Array of column names
   * @returns {object} Validation results
   */
  static validateDataviewColumns(columns) {
    const warnings = [];
    const errors = [];
    
    columns.forEach(col => {
      // Check for reserved field names
      if (CONSTANTS.DATAVIEW_RESERVED_FIELDS.includes(col.toLowerCase())) {
        warnings.push(`"${col}" is a reserved Dataview field name`);
      }
      
      // Check for problematic characters
      if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(col)) {
        warnings.push(`"${col}" contains characters that may cause issues`);
      }
      
      // Check for empty column names
      if (!col || col.trim().length === 0) {
        errors.push('Found empty column name');
      }
    });
    
    return { warnings, errors, isValid: errors.length === 0 };
  }

  /**
   * Generate safe filename from string
   * @param {string} str - Input string
   * @param {number} maxLength - Maximum filename length
   * @returns {string} Safe filename
   */
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

  /**
   * Deep clone an object
   * @param {*} obj - Object to clone
   * @returns {*} Cloned object
   */
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

  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Format file size for display
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size string
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get error message from various error types
   * @param {*} error - Error object or message
   * @returns {string} Error message
   */
  static getErrorMessage(error) {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && error.message) {
      return error.message;
    }
    
    return 'An unknown error occurred';
  }

  /**
   * Check if value is empty or whitespace
   * @param {*} value - Value to check
   * @returns {boolean} True if empty
   */
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
}

module.exports = Utils;
