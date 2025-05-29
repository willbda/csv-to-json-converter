// Learning Exercise: Module System Comparison
// Save this as practice.js and experiment with both styles

console.log('=== Module Systems Learning Exercise ===\n');

// ================================================
// PART 1: CommonJS Style (What you're using now)
// ================================================

console.log('1. CommonJS Examples:');

// Simulating CommonJS exports
const myCommonJSModule = {
    // This is like module.exports = { ... }
    greeting: 'Hello from CommonJS!',
    
    add: function(a, b) {
        return a + b;
    },
    
    multiply: function(a, b) {
        return a * b;
    }
};

// Simulating CommonJS require
const { greeting, add } = myCommonJSModule;  // Like require('./module')
console.log(greeting);
console.log('Add result:', add(5, 3));

// ================================================
// PART 2: ES Modules Style (The future)
// ================================================

console.log('\n2. ES Modules Examples (simulated):');

// ES Modules would look like this:
// export const greeting = 'Hello from ES Modules!';
// export function add(a, b) { return a + b; }
// export function multiply(a, b) { return a * b; }

// And importing would be:
// import { greeting, add } from './module.js';

// For this exercise, we'll simulate it:
const myESModule = {
    greeting: 'Hello from ES Modules!',
    add: (a, b) => a + b,
    multiply: (a, b) => a * b
};

console.log(myESModule.greeting);
console.log('Add result:', myESModule.add(5, 3));

// ================================================
// PART 3: Key Differences Demonstrated
// ================================================

console.log('\n3. Key Differences:');

// CommonJS loads synchronously
console.log('CommonJS loads everything at once (synchronous)');

// ES Modules can be loaded asynchronously
console.log('ES Modules can load on-demand (asynchronous)');

// CommonJS: module.exports can be dynamic
const dynamicExport = {
    value: Math.random() > 0.5 ? 'heads' : 'tails'
};
console.log('CommonJS dynamic export:', dynamicExport.value);

// ES Modules: exports are static (determined at compile time)
// This helps with tree-shaking and optimization

// ================================================
// PART 4: Real-World Example - Your CSV Parser
// ================================================

console.log('\n4. Your CSV Parser Module:');

// CommonJS version (current)
const PapaCommonJS = {
    parse: function(csvString) {
        console.log('Parsing CSV with CommonJS style...');
        return { data: [], errors: [] };
    }
};

// How you use it now:
const parseResult = PapaCommonJS.parse('some,csv,data');

// ES Modules version (future)
// In a separate file: papaparse.js
// export function parse(csvString) {
//     console.log('Parsing CSV with ES Modules style...');
//     return { data: [], errors: [] };
// }

// How you'd use it:
// import { parse } from './papaparse.js';
// const result = parse('some,csv,data');

// ================================================
// PART 5: Try This Yourself
// ================================================

console.log('\n5. Exercise - Convert this CommonJS to ES Modules:');

// CommonJS style
const utilities = {
    formatDate: function(date) {
        return date.toLocaleDateString();
    },
    
    sanitizeFieldName: function(name) {
        return name.toLowerCase().replace(/\s+/g, '_');
    }
};

module.exports = utilities;

console.log('\nYour task: Rewrite the above as ES Modules');
console.log('Hint: Each function becomes an export');
console.log('Answer is in the comments below...');

/*
ES Modules version:

export function formatDate(date) {
    return date.toLocaleDateString();
}

export function sanitizeFieldName(name) {
    return name.toLowerCase().replace(/\s+/g, '_');
}

// Or as a single export:
export const utilities = {
    formatDate: (date) => date.toLocaleDateString(),
    sanitizeFieldName: (name) => name.toLowerCase().replace(/\s+/g, '_')
};
*/

// ================================================
// PART 6: Why This Matters for Your Learning
// ================================================

console.log('\n6. Why ES Modules are better for learning:');
console.log('- Most modern tutorials use ES Modules');
console.log('- React, Vue, and modern frameworks use them');
console.log('- Better tooling support (autocomplete, refactoring)');
console.log('- Cleaner syntax that\'s easier to read');
console.log('- Native browser support (no bundler needed for simple projects)');

// ================================================
// TESTING THIS FILE
// ================================================

console.log('\n=== How to run this exercise ===');
console.log('1. In terminal: node practice.js');
console.log('2. Try modifying the examples');
console.log('3. Create your own module conversions');

// Bonus: Create a package.json with {"type": "module"} 
// to try real ES Modules in Node.js!
