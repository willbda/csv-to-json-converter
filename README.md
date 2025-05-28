# Method

Using Anthropic Claude to meet in the middle between continuing to learn js while also deploying usable tools that meet my day-to-day needs.

I plan to read the entire repository for my growth/knowledge, but as of first commit, I have not read this, I have not used it on my main vault, and I don't know if it is safe or best practices.

# CSV to JSON Converter - Obsidian Plugin

A powerful Obsidian plugin that transforms CSV files into custom nested JSON structures using an intuitive visual drag-and-drop interface.

## Features

### 🎨 Visual Structure Builder

- **Drag & Drop Interface**: Visually design your JSON structure by dragging column names
- **Real-time Preview**: See example JSON output as you build your structure
- **Structure Validation**: Intelligent validation of your hierarchy design
- **Level Indicators**: Clear visual feedback showing nesting levels and data storage points

### 📋 Smart Presets

- **Hierarchical**: Subject → Type → Project → Item (perfect for organizational data)
- **Project-Based**: Project → Type → Item (ideal for project management)
- **Simple Grouping**: First two columns as grouping levels
- **Clear All**: Reset and start fresh

### 🔧 Enhanced Processing

- **Flexible Column Handling**: Automatically detects and handles any CSV structure
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

#### Step 2: Design Your Structure

1. **Use Presets**: Click preset buttons for common structures
2. **Custom Design**: Drag column tags to the structure area
3. **Exclude Columns**: Drag unwanted columns to the exclusion area
4. **Preview**: Watch the live example update as you build

#### Step 3: Process & Export

1. Click "Generate JSON with Custom Structure"
2. Review processing statistics
3. Save to vault or copy to clipboard

## JSON Output Structure

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

### Future Improvements

- **XLSX Support**: Support for Excel files
- **Filtering System**: Advanced row filtering capabilities
- **Template System**: Save and reuse structure templates
- **Batch Processing**: Convert multiple files at once
- **Export Formats**: Additional output formats (YAML, XML, etc.)

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
