// Application constants and configuration
const CONSTANTS = {
  // Dataview integration
  DATAVIEW_RESERVED_FIELDS: ["file", "tags", "aliases"],
  
  // Template configuration
  TEMPLATE_FOLDER: "CSV Templates",
  
  // Output formats
  OUTPUT_FORMATS: {
    JSON: "json",
    MARKDOWN: "markdown", 
    DATAVIEW: "dataview"
  },
  
  // Preset configurations
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
      columns: [] // Will use first 2 columns
    }
  },
  
  // UI Classes
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
  
  // File validation
  SUPPORTED_EXTENSIONS: ["csv"],
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  
  // Processing limits
  MAX_PREVIEW_ROWS: 5,
  BATCH_SIZE: 1000
};

module.exports = CONSTANTS;
