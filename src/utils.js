const CONSTANTS = require('./constants');

/**
 * LEARNING NOTE: Static Utility Class Pattern
 * 
 * This class contains only static methods - no instance variables, no constructor.
 * Why? Because these are "pure functions" - they take input, return output, 
 * and don't modify anything else. This makes them:
 * - Easy to test (no setup required)
 * - Easy to reuse (just call Utils.methodName())
 * - Predictable (same input always gives same output)
 */
class Utils {
  /**
   * LEARNING: Input validation pattern
   * Notice how EVERY method starts by checking if the input is valid
   * This prevents the dreaded "undefined is not a function" errors
   * 
   * @param {string} fieldName - The field name to sanitize
   * @returns {string} Sanitized field name
   */
  static sanitizeFieldName(fieldName) {
    // LEARNING: Guard clause pattern - handle the error cases first
    if (!fieldName || typeof fieldName !== 'string') {
      return 'unknown_field'; // Sensible default instead of throwing error
    }
    
    // LEARNING: Method chaining for string transformations
    // Each step is clear and does ONE thing
    return fieldName
      .toLowerCase()                    // Convert to lowercase
      .replace(/[^a-z0-9_-]/g, '_')    // Replace invalid chars with underscore
      .replace(/_+/g, '_')             // Multiple underscores become one
      .replace(/^_|_$/g, '');          // Remove leading/trailing underscores
  }

  /**
   * LEARNING: Similar function, different rules
   * Tags and field names have different requirements in Obsidian
   * Instead of one "sanitize everything" function, we have specific ones
   */
  static sanitizeTagName(tag) {
    if (!tag || typeof tag !== 'string') {
      return 'unknown';
    }
    
    return tag
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')        // Allow word chars, spaces, hyphens
      .replace(/\s+/g, '-')            // Spaces become hyphens (tag style)
      .replace(/-+/g, '-')             // Multiple hyphens become one
      .replace(/^-|-$/g, '');          // Remove leading/trailing hyphens
  }

  /**
   * LEARNING: YAML escaping - why this is necessary
   * YAML is picky about quotes, newlines, and special characters
   * This function makes any string safe to put in YAML frontmatter
   */
  static escapeYAMLString(str) {
    // LEARNING: Handle null/undefined gracefully - don't just crash
    if (str === null || str === undefined) {
      return '';
    }
    
    // LEARNING: String() coercion - handles numbers, booleans, etc.
    return String(str)
      .replace(/\\/g, '\\\\')          // Escape backslashes first (important order!)
      .replace(/"/g, '\\"')            // Escape quotes
      .replace(/\n/g, '\\n')           // Escape newlines
      .replace(/\r/g, '\\r');          // Escape carriage returns
  }

  /**
   * LEARNING: Validation function pattern
   * Instead of returning true/false, return an object with details
   * This gives the caller much more useful information
   */
  static validateDataviewColumns(columns) {
    const warnings = [];  // Things that work but might cause problems
    const errors = [];    // Things that will definitely break
    
    // LEARNING: forEach with fat arrow function - modern JS iteration
    columns.forEach(col => {
      // Check for reserved field names (from our constants file)
      if (CONSTANTS.DATAVIEW_RESERVED_FIELDS.includes(col.toLowerCase())) {
        warnings.push(`"${col}" is a reserved Dataview field name`);
      }
      
      // LEARNING: Regex pattern to match valid identifiers
      // ^[a-zA-Z] = must start with letter
      // [a-zA-Z0-9_-]* = followed by letters, numbers, underscore, or hyphen
      // $ = end of string
      if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(col)) {
        warnings.push(`"${col}" contains characters that may cause issues`);
      }
      
      // LEARNING: Check for empty/whitespace - different from null check
      if (!col || col.trim().length === 0) {
        errors.push('Found empty column name');
      }
    });
    
    // LEARNING: Return structured data instead of just boolean
    return { 
      warnings, 
      errors, 
      isValid: errors.length === 0  // Computed property based on errors
    };
  }

  /**
   * LEARNING: Filename sanitization with length limits
   * File systems have limits on filename length and allowed characters
   */
  static generateSafeFilename(str, maxLength = 100) {
    if (!str || typeof str !== 'string') {
      return 'untitled'; // Always return something usable
    }
    
    const safe = str
      .replace(/[^\w\s-]/g, '')        // Only word chars, spaces, hyphens
      .replace(/\s+/g, '_')            // Spaces to underscores for filenames
      .replace(/_+/g, '_')             // Clean up multiple underscores
      .replace(/^_|_$/g, '')           // Remove leading/trailing underscores
      .substring(0, maxLength);        // Respect length limits
      
    // LEARNING: Fallback for edge case where sanitization removes everything
    return safe || 'untitled';
  }

  /**
   * LEARNING: Deep cloning - why JSON.parse(JSON.stringify()) isn't enough
   * This handles dates, functions, and circular references properly
   */
  static deepClone(obj) {
    // LEARNING: Handle primitive types first
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    // LEARNING: Special case for Date objects
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    
    // LEARNING: Arrays need special handling
    if (Array.isArray(obj)) {
      return obj.map(item => Utils.deepClone(item)); // Recursive call
    }
    
    // LEARNING: Handle regular objects
    const cloned = {};
    for (const key in obj) {
      // LEARNING: hasOwnProperty check - avoid inherited properties
      if (obj.hasOwnProperty(key)) {
        cloned[key] = Utils.deepClone(obj[key]); // Recursive call
      }
    }
    
    return cloned;
  }

  /**
   * LEARNING: Debounce pattern - prevent function from being called too often
   * Useful for search boxes, resize handlers, etc.
   */
  static debounce(func, wait) {
    let timeout; // LEARNING: Closure captures this variable
    
    // LEARNING: Return function that uses the closure
    return function executedFunction(...args) { // ...args = rest parameters
      const later = () => {
        clearTimeout(timeout);
        func(...args); // ...args = spread operator (same syntax, different use)
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * LEARNING: Human-readable file sizes
   * Converts bytes to KB, MB, GB with proper units
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;  // Binary units (not 1000)
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    // LEARNING: Math.log to determine which unit to use
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    // LEARNING: Math.pow for exponentiation, parseFloat to remove trailing zeros
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * LEARNING: Error message extraction - handle different error types
   * Errors can be strings, Error objects, or other types
   */
  static getErrorMessage(error) {
    if (typeof error === 'string') {
      return error;
    }
    
    // LEARNING: Optional property access - error.message might not exist
    if (error && error.message) {
      return error.message;
    }
    
    return 'An unknown error occurred'; // Fallback
  }

  /**
   * LEARNING: Universal "emptiness" checker
   * Different types have different meanings of "empty"
   */
  static isEmpty(value) {
    // LEARNING: Explicit null/undefined check
    if (value === null || value === undefined) {
      return true;
    }
    
    // LEARNING: String emptiness includes whitespace-only strings
    if (typeof value === 'string') {
      return value.trim().length === 0;
    }
    
    // LEARNING: Array emptiness
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    
    // LEARNING: Object emptiness - no own properties
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    
    return false; // Numbers, booleans, functions are not "empty"
  }
}

// LEARNING: Export the class so other files can use it
module.exports = Utils;
