# Method

Using Anthropic Claude to meet in the middle between continuing to learn js while also deploying usable tools that meet my day-to-day needs.

I plan to read the entire repository for my growth/knowledge, but as of first commit, I have not read this, I have not used it on my main vault, and I don't know if it is safe or best practices.

# CSV to JSON Converter - Obsidian Plugin

A powerful Obsidian plugin that transforms CSV files into custom nested JSON structures using an intuitive visual drag-and-drop interface.

## Features

### 📊 Multiple Output Formats (NEW!)

- **JSON Export**: Original nested JSON structure format
- **Markdown Notes**: Individual .md files with YAML frontmatter
- **Dataview Optimized**: Markdown notes with Dataview-friendly fields and tags
- **Batch Processing**: Convert entire CSV files to individual notes

### 🎨 Visual Structure Builder

- **Drag & Drop Interface**: Visually design your JSON structure by dragging column names
- **Real-time Preview**: See example JSON output as you build your structure
- **Structure Validation**: Intelligent validation of your hierarchy design
- **Level Indicators**: Clear visual feedback showing nesting levels and data storage points

### 📋 Smart Presets & Templates

- **Built-in Presets**:
  - Hierarchical: Subject → Type → Project → Item (perfect for organizational data)
  - Project-Based: Project → Type → Item (ideal for project management)
  - Simple Grouping: First two columns as grouping levels
- **Custom Templates**: Save and reuse your own structure configurations
- **Template Management**: Load, save, and delete structure templates
- **Clear All**: Reset and start fresh

### 🔧 Enhanced Processing

- **Robust CSV Parsing**: Handles quoted fields, special characters, and various delimiters
- **Dynamic Type Detection**: Automatically recognizes numbers, booleans, and dates
- **Field Validation**: Warns about Dataview reserved fields and special characters
- **Smart Error Reporting**: Detailed feedback on processing issues
- **Metadata Preservation**: Includes source row numbers and structure paths
- **Performance Optimized**: Handles large datasets efficiently

### 📁 Obsidian Integration

- **Vault File Access**: Automatically detects and lists CSV files in your vault
- **File Context Menu**: Right-click CSV files to convert them
- **Save to Vault**: Generated JSON files are saved directly to your vault
- **Command Palette**: Access via command palette or ribbon icon

## How to Use

### 1. Install the Plugin

1. Copy the plugin folder to your `.obsidian/plugins/` directory
2. Enable the plugin in Obsidian Settings → Community Plugins
3. Restart Obsidian if needed

### 2. Access the Converter

- **Command Palette**: Search for "Open CSV to JSON Converter"
- **Ribbon Icon**: Click the spreadsheet icon in the left sidebar
- **File Menu**: Right-click any CSV file and select "Convert to JSON"

### 3. Convert Your Data

#### Step 1: Select Your CSV File

1. The plugin automatically lists all CSV files in your vault
2. Click on a file to select it
3. Preview the available columns
4. Check for any Dataview compatibility warnings

#### Step 2: Design Your Structure

1. **Use Presets**: Click preset buttons for common structures
2. **Load Template**: Apply a saved structure template
3. **Custom Design**: Drag column tags to the structure area
4. **Exclude Columns**: Drag unwanted columns to the exclusion area
5. **Save Template**: Save your structure for future use
6. **Preview**: Watch the live example update as you build

#### Step 3: Choose Output Format

- **JSON**: Traditional nested JSON structure
- **Markdown**: Individual notes with frontmatter
- **Dataview**: Optimized markdown for Dataview queries

#### Step 4: Process & Export

1. Click "Generate Output"
2. Review processing statistics
3. Save to vault or copy to clipboard

## Output Examples

### JSON Output

The plugin generates structured JSON with metadata:

```json
{
  "metadata": {
    "sourceFile": "your-data",
    "structure": "Level1 → Level2 → Level3",
    "dataColumns": ["DataCol1", "DataCol2"],
    "excludedColumns": ["ExcludedCol"],
    "totalEntries": 1500,
    "generated": "2025-05-28T..."
  },
  "data": {
    "Level1Value": {
      "Level2Value": {
        "Level3Value": {
          "DataCol1": "actual data",
          "DataCol2": "actual data",
          "_metadata": {
            "sourceRow": 42
          }
        }
      }
    }
  }
}
```

### Markdown/Dataview Output

Creates individual notes with frontmatter:

```markdown
---
organization_name: "ServeMN"
type: "nonprofit"
category: "volunteer coordination"
website: "https://servemn.org"
phone: "555-1234"
source_file: "organizations.csv"
source_row: 42
imported: 2025-05-28T10:30:00Z
tags:
  - imported
  - nonprofit
  - volunteer-coordination
---

# ServeMN - nonprofit - volunteer coordination

## Overview

- **Organization Name**: ServeMN
- **Type**: nonprofit
- **Category**: volunteer coordination

## Details

- **Website**: https://servemn.org
- **Phone**: 555-1234

---

*This note was automatically imported from organizations.csv on 5/28/2025.*
```

## Structure Design Rules

- **Nesting Order**: Top-to-bottom determines outer-to-inner nesting
- **Data Storage**: Non-structure columns become data at the deepest level
- **Value Requirements**: All structure column values must be present (no empty cells)
- **Flexible Hierarchy**: Create 1-10+ levels of nesting as needed

## Technical Details

### Supported CSV Formats

- **Headers Required**: First row must contain column names
- **Flexible Encoding**: UTF-8, ASCII, and other common encodings
- **Any Structure**: No required column names - design your own hierarchy
- **Large Files**: Optimized for datasets with thousands of rows

### Performance

- Handles large CSV files efficiently
- Real-time preview updates
- Minimal memory footprint
- Fast processing with progress indicators

## Development

This plugin is based on the standalone CSV to JSON converter and adapted for Obsidian's plugin architecture. Key adaptations include:

- Integration with Obsidian's file system APIs
- Modal-based UI using Obsidian's styling system
- Command palette and ribbon integration
- File menu context integration
- Vault-aware file handling

## Roadmap

### What's New in v1.1.0

- ✅ **Dataview Integration**: Generate Dataview-compatible markdown notes
- ✅ **Template System**: Save and reuse structure configurations
- ✅ **Robust CSV Parser**: Better handling of complex CSV files
- ✅ **Multiple Output Formats**: JSON, Markdown, and Dataview-optimized
- ✅ **Field Validation**: Warnings for problematic column names
- ✅ **Batch Markdown Generation**: Convert entire CSVs to individual notes

### Future Improvements

- **XLSX Support**: Direct Excel file support
- **Advanced Filtering**: Row filtering based on conditions
- **Data Transformation**: Built-in functions for data cleaning
- **Multiple File Processing**: Convert multiple CSVs at once
- **Export Formats**: YAML, XML output options

## License

Open source - feel free to modify and distribute.

## Contributing

Contributions welcome! Areas for improvement:

- Additional export formats
- Performance optimizations
- UI/UX enhancements
- Data validation features
- Mobile support improvements

---

**Built with ❤️ for the Obsidian community**
