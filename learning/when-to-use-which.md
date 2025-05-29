# When to Use CommonJS vs ES Modules: A Decision Guide

## Quick Decision Tree

```
Is it an Obsidian plugin?
├─ Yes → Use CommonJS (required)
└─ No → Is it a new project?
    ├─ Yes → Use ES Modules
    └─ No → Are you maintaining existing code?
        ├─ Yes → Match what's already there
        └─ No → Use ES Modules
```

## Practical Scenarios

### Use CommonJS When:

1. **Working with Obsidian Plugins** (like your current project)
   ```javascript
   const { Plugin } = require('obsidian');
   module.exports = MyPlugin;
   ```

2. **Older Node.js Projects** (pre-2020)
   ```javascript
   const express = require('express');
   const path = require('path');
   ```

3. **Quick Scripts** without configuration
   ```javascript
   // Just works in Node.js without setup
   const fs = require('fs');
   ```

### Use ES Modules When:

1. **Learning Modern JavaScript**
   ```javascript
   import { useState } from 'react';
   import axios from 'axios';
   ```

2. **Browser-Based Projects**
   ```html
   <script type="module">
     import { myFunction } from './utils.js';
   </script>
   ```

3. **New Node.js Projects** (with package.json)
   ```json
   {
     "type": "module"
   }
   ```

## Migration Path for Learning

### Month 1-2: Master CommonJS (Current)
- ✅ Understand require/module.exports
- ✅ Complete your Obsidian plugin
- ✅ Get comfortable with the patterns

### Month 3-4: Learn ES Modules
- 📚 Read modern JavaScript tutorials
- 🔨 Build a small web project
- 🔄 Practice converting between formats

### Month 5-6: Use Build Tools
- 📦 Learn esbuild or Vite
- 🔧 Set up a project that compiles ESM → CJS
- 🚀 Use modern syntax everywhere

## Your Current Project Strategy

### Keep Using CommonJS Because:
1. Obsidian requires it
2. Your code already works
3. You can focus on features, not configuration

### But Learn ES Modules Because:
1. Every modern tutorial uses them
2. Better for your career long-term
3. Cleaner, more intuitive syntax

## Code Example: Same Logic, Both Ways

### Your Current Approach (CommonJS)
```javascript
// csvHelpers.js
function sanitizeFieldName(field) {
    return field.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function validateColumns(columns) {
    return columns.filter(col => col.length > 0);
}

module.exports = {
    sanitizeFieldName,
    validateColumns
};

// main.js
const { sanitizeFieldName, validateColumns } = require('./csvHelpers');
```

### Future Approach (ES Modules)
```javascript
// csvHelpers.js
export function sanitizeFieldName(field) {
    return field.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

export function validateColumns(columns) {
    return columns.filter(col => col.length > 0);
}

// main.js
import { sanitizeFieldName, validateColumns } from './csvHelpers.js';
```

## The Bridge: TypeScript

When you're ready for TypeScript (maybe in 6-12 months), it uses ES Module syntax but can compile to CommonJS:

```typescript
// Write this (ES Modules style)
import { Plugin } from 'obsidian';
export default class MyPlugin extends Plugin { }

// TypeScript compiles to CommonJS for Obsidian
const { Plugin } = require('obsidian');
module.exports = MyPlugin;
```

## Action Items for You

1. **Today**: Keep using CommonJS in your plugin
2. **This Week**: Run the practice.js file I created
3. **Next Month**: Try a small ES Modules project
4. **Future**: Learn a build tool to use both

## Remember

- CommonJS = Current necessity (Obsidian)
- ES Modules = Future investment (everything else)
- Both = Well-rounded developer

The best developers understand both systems and know when to use each!
