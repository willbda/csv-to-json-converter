# CSV to JSON Converter - Changelog

## Version 1.1.0 (May 28, 2025)

### 🎉 New Features

#### Dataview Integration

- **Multiple Output Formats**: Choose between JSON, Markdown, or Dataview-optimized formats
- **Markdown Generation**: Creates individual markdown files with YAML frontmatter
- **Dataview Optimization**: Automatically adds type fields and tags for easy querying
- **Field Name Sanitization**: Converts column names to Dataview-friendly formats

#### Template System

- **Save Structure Templates**: Save your column arrangements for reuse
- **Load Templates**: Quickly apply saved structures to new CSV files
- **Template Management**: Delete templates you no longer need

#### Better CSV Parsing

- **Robust Parser**: Replaced simple parser with PapaParse-lite for better handling of:
  - Quoted fields containing commas
  - Line breaks within fields
  - Various delimiters
  - Empty fields
- **Dynamic Typing**: Automatically detects numbers and booleans
- **Error Reporting**: Shows parsing errors with helpful messages

#### Enhanced UI

- **Format Selection Step**: Clear choice between output formats
- **Dataview Warnings**: Alerts for reserved field names or problematic characters
- **Better Visual Feedback**: Improved styling and status indicators

### 🔧 Improvements

- **Error Handling**: More robust error handling throughout
- **Field Validation**: Warns about Dataview reserved fields (file, tags, aliases)
- **Performance**: Better memory management for large files
- **User Experience**: Clearer process flow and helpful tooltips

### 🐛 Bug Fixes

- Fixed CSV parsing issues with special characters
- Improved handling of empty cells in structure columns
- Better filename sanitization for markdown output

## Version 1.0.0 (Initial Release)

- Core drag-and-drop interface
- JSON structure builder
- Basic CSV parsing
- Vault integration

---

## For Users

The new Dataview integration features are specifically designed to help with vault reorganization:

1. **Import Organizations**: Convert your organization CSV directly to Obsidian notes with proper frontmatter
2. **Automatic Tagging**: Tags are generated from your structure columns
3. **Consistent Formatting**: Field names are automatically sanitized for Dataview queries
4. **Batch Processing**: Convert entire CSV files to individual notes in one operation

Example Dataview query for imported organizations:

```dataview
TABLE type, website, category
FROM "Imported/Organizations"
WHERE type = "nonprofit"
SORT name ASC
```
