// LEARNING NOTE: Constants vs Magic Numbers
// This file demonstrates "configuration over magic numbers" - a key principle
// Instead of scattering literal values throughout code, we centralize them here

const CONSTANTS = {
  // LEARNING: These are "reserved words" in Dataview - using them causes conflicts
  // This is why we validate column names against this list
  DATAVIEW_RESERVED_FIELDS: ["file", "tags", "aliases"],
  
  // LEARNING: Having a folder constant means if we want to change the default,
  // we change it in ONE place, not hunt through the entire codebase
  TEMPLATE_FOLDER: "CSV Templates",
  
  // LEARNING: Enum pattern - instead of comparing strings everywhere,
  // we use these constants. Typos become compile-time errors instead of runtime bugs
  OUTPUT_FORMATS: {
    JSON: "json",
    MARKDOWN: "markdown", 
    DATAVIEW: "dataview"
  },
  
  // LEARNING: Configuration objects make it easy to add new presets
  // Notice how each preset is self-describing with id, name, and expected columns
  PRESETS: {
    HIERARCHICAL: {
      id: "hierarchical",
      name: "Hierarchical",
      columns: ["Subject", "Type", "Project", "Item"] // These are column names to look for
    },
    PROJECT: {
      id: "project", 
      name: "Project-Based",
      columns: ["Project", "Type", "Item"]
    },
    SIMPLE: {
      id: "simple",
      name: "Simple Grouping", 
      columns: [] // Empty means "use first 2 columns of whatever CSV we load"
    }
  },
  
  // LEARNING: CSS class names as constants prevent typos and make refactoring easier
  // If you need to rename a class, you change it here, not in 15 different files
  CSS_CLASSES: {
    MODAL: "csv-json-modal",
    CONTAINER: "csv-json-container",
    STEP: "csv-json-step",
    COLUMN_TAG: "csv-json-column-tag",
    LEVEL: "csv-json-level",
    DRAGGING: "dragging",        // State classes
    USED: "used",                // for visual feedback
    EXCLUDED: "excluded",
    ACTIVE: "active"
  },
  
  // LEARNING: Configuration values that might need tweaking
  // By putting them here, non-programmers can adjust them without touching logic
  SUPPORTED_EXTENSIONS: ["csv"],
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB - notice the readable math
  
  // LEARNING: UI/UX constants that affect user experience
  MAX_PREVIEW_ROWS: 5,    // How many rows to show in preview
  BATCH_SIZE: 1000        // Process large files in chunks of this size
};

// LEARNING: CommonJS export pattern
// This makes all our constants available to other files via require('./constants')
module.exports = CONSTANTS;
