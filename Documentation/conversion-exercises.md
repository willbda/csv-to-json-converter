# Try It Yourself: Module Conversion Exercise

## Exercise 1: Convert CommonJS to ES Modules

### Given this CommonJS code:

```javascript
// dataValidator.js
const VALID_TYPES = ['string', 'number', 'boolean'];

function validateField(value, type) {
    if (!VALID_TYPES.includes(type)) {
        throw new Error(`Invalid type: ${type}`);
    }
    return typeof value === type;
}

function sanitizeString(str) {
    return str.trim().toLowerCase();
}

module.exports = {
    validateField,
    sanitizeString,
    VALID_TYPES
};

// main.js
const { validateField, sanitizeString } = require('./dataValidator');
const validator = require('./dataValidator');

console.log(validateField('hello', 'string'));
console.log(validator.VALID_TYPES);
```

### Convert it to ES Modules:

<details>
<summary>Click for answer</summary>

```javascript
// dataValidator.js
export const VALID_TYPES = ['string', 'number', 'boolean'];

export function validateField(value, type) {
    if (!VALID_TYPES.includes(type)) {
        throw new Error(`Invalid type: ${type}`);
    }
    return typeof value === type;
}

export function sanitizeString(str) {
    return str.trim().toLowerCase();
}

// main.js
import { validateField, sanitizeString, VALID_TYPES } from './dataValidator.js';
// OR for everything:
import * as validator from './dataValidator.js';

console.log(validateField('hello', 'string'));
console.log(validator.VALID_TYPES);
```

</details>

## Exercise 2: Your CSV Parser Functions

### Current CommonJS version:

```javascript
// csvUtils.js
function parseRow(row, columns) {
    const result = {};
    columns.forEach((col, index) => {
        result[col] = row[index] || '';
    });
    return result;
}

function sanitizeFieldName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .replace(/_+/g, '_');
}

const DATAVIEW_RESERVED = ['file', 'tags', 'aliases'];

module.exports = {
    parseRow,
    sanitizeFieldName,
    DATAVIEW_RESERVED
};
```

### Your task: Convert to ES Modules

Write your answer here:
```javascript
// Your solution:




```

<details>
<summary>Click for answer</summary>

```javascript
// csvUtils.js
export function parseRow(row, columns) {
    const result = {};
    columns.forEach((col, index) => {
        result[col] = row[index] || '';
    });
    return result;
}

export function sanitizeFieldName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .replace(/_+/g, '_');
}

export const DATAVIEW_RESERVED = ['file', 'tags', 'aliases'];

// Usage:
import { parseRow, sanitizeFieldName, DATAVIEW_RESERVED } from './csvUtils.js';
```

</details>

## Exercise 3: Mixed Exports

### Convert this complex CommonJS pattern:

```javascript
// templateManager.js
class TemplateManager {
    constructor() {
        this.templates = {};
    }
    
    save(name, template) {
        this.templates[name] = template;
    }
    
    load(name) {
        return this.templates[name];
    }
}

// Helper functions
function validateTemplate(template) {
    return template && template.structure && Array.isArray(template.structure);
}

function createDefaultTemplate() {
    return {
        structure: [],
        excluded: [],
        created: new Date()
    };
}

// CommonJS exports
module.exports = TemplateManager;
module.exports.validateTemplate = validateTemplate;
module.exports.createDefaultTemplate = createDefaultTemplate;
```

### Convert to ES Modules with default and named exports:

<details>
<summary>Click for answer</summary>

```javascript
// templateManager.js
export default class TemplateManager {
    constructor() {
        this.templates = {};
    }
    
    save(name, template) {
        this.templates[name] = template;
    }
    
    load(name) {
        return this.templates[name];
    }
}

// Named exports for helper functions
export function validateTemplate(template) {
    return template && template.structure && Array.isArray(template.structure);
}

export function createDefaultTemplate() {
    return {
        structure: [],
        excluded: [],
        created: new Date()
    };
}

// Usage:
import TemplateManager, { validateTemplate, createDefaultTemplate } from './templateManager.js';
```

</details>

## Bonus Challenge: Dynamic Import

### Convert this CommonJS dynamic require:

```javascript
// CommonJS
async function loadParser(type) {
    let parser;
    
    if (type === 'csv') {
        parser = require('./parsers/csvParser');
    } else if (type === 'json') {
        parser = require('./parsers/jsonParser');
    }
    
    return parser;
}
```

### To ES Modules dynamic import:

<details>
<summary>Click for answer</summary>

```javascript
// ES Modules
async function loadParser(type) {
    let parser;
    
    if (type === 'csv') {
        parser = await import('./parsers/csvParser.js');
    } else if (type === 'json') {
        parser = await import('./parsers/jsonParser.js');
    }
    
    return parser;
}

// Even cleaner:
async function loadParser(type) {
    const parserModule = await import(`./parsers/${type}Parser.js`);
    return parserModule.default; // or parserModule.parse, depending on export
}
```

</details>

## Testing Your Knowledge

1. Run the practice files: `node learning/module-comparison.js`
2. Try converting parts of your plugin to ES Modules syntax (just for practice)
3. Create a new small project using ES Modules to get comfortable

Remember: You'll keep using CommonJS for Obsidian, but understanding ES Modules will help you with:
- Reading modern tutorials
- Contributing to open source
- Building web applications
- Future-proofing your skills
