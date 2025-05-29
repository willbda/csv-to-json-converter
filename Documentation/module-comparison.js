// Side-by-Side Comparison: CommonJS vs ES Modules
// Run this with: node module-comparison.js

console.log('🎯 Module Systems: Side-by-Side Comparison\n');

// ============================================
// Example 1: Basic Import/Export
// ============================================
console.log('1️⃣ Basic Import/Export\n');

console.log('CommonJS:');
console.log(`// math.js
exports.add = (a, b) => a + b;
exports.PI = 3.14159;

// main.js  
const math = require('./math');
console.log(math.add(2, 3));     // 5
console.log(math.PI);             // 3.14159`);

console.log('\nES Modules:');
console.log(`// math.js
export const add = (a, b) => a + b;
export const PI = 3.14159;

// main.js
import { add, PI } from './math.js';
console.log(add(2, 3));           // 5
console.log(PI);                  // 3.14159`);

// ============================================
// Example 2: Default Exports
// ============================================
console.log('\n\n2️⃣ Default Exports\n');

console.log('CommonJS:');
console.log(`// calculator.js
class Calculator {
  add(a, b) { return a + b; }
}
module.exports = Calculator;

// main.js
const Calculator = require('./calculator');
const calc = new Calculator();`);

console.log('\nES Modules:');
console.log(`// calculator.js
export default class Calculator {
  add(a, b) { return a + b; }
}

// main.js
import Calculator from './calculator.js';
const calc = new Calculator();`);

// ============================================
// Example 3: Your Plugin Pattern
// ============================================
console.log('\n\n3️⃣ Your Obsidian Plugin Pattern\n');

console.log('Current (CommonJS):');
console.log(`const { Plugin, Modal } = require('obsidian');

class MyPlugin extends Plugin {
  onload() {
    console.log('Plugin loaded');
  }
}

module.exports = MyPlugin;`);

console.log('\nIf Obsidian supported ES Modules:');
console.log(`import { Plugin, Modal } from 'obsidian';

export default class MyPlugin extends Plugin {
  onload() {
    console.log('Plugin loaded');
  }
}`);

// ============================================
// Example 4: Mixed Exports
// ============================================
console.log('\n\n4️⃣ Mixed Named and Default Exports\n');

console.log('CommonJS (awkward):');
console.log(`// utils.js
function helperOne() { }
function helperTwo() { }
class MainUtil { }

module.exports = MainUtil;
module.exports.helperOne = helperOne;
module.exports.helperTwo = helperTwo;

// main.js
const MainUtil = require('./utils');
const { helperOne, helperTwo } = require('./utils');`);

console.log('\nES Modules (clean):');
console.log(`// utils.js
export function helperOne() { }
export function helperTwo() { }
export default class MainUtil { }

// main.js
import MainUtil, { helperOne, helperTwo } from './utils.js';`);

// ============================================
// Example 5: Dynamic Imports
// ============================================
console.log('\n\n5️⃣ Dynamic/Conditional Imports\n');

console.log('CommonJS:');
console.log(`if (needsFeature) {
  const feature = require('./feature');
  feature.doSomething();
}`);

console.log('\nES Modules:');
console.log(`if (needsFeature) {
  const { doSomething } = await import('./feature.js');
  doSomething();
}`);

// ============================================
// Key Takeaways
// ============================================
console.log('\n\n📚 Key Takeaways:\n');

const takeaways = [
  'CommonJS uses require() and module.exports',
  'ES Modules use import and export keywords',
  'ES Modules have cleaner syntax for mixed exports',
  'ES Modules support async dynamic imports',
  'CommonJS works everywhere in Node.js today',
  'ES Modules are the standard going forward'
];

takeaways.forEach((point, i) => {
  console.log(`${i + 1}. ${point}`);
});

// ============================================
// Your Learning Path
// ============================================
console.log('\n\n🎓 Your Learning Path:\n');

console.log('1. NOW: Keep using CommonJS for your Obsidian plugin');
console.log('2. SOON: Try this exercise with ES Modules:');
console.log('   - Create a new folder');
console.log('   - Add package.json with {"type": "module"}');
console.log('   - Convert some of your utility functions');
console.log('3. LATER: Use ES Modules for all new projects');
console.log('4. EVENTUALLY: Learn build tools to convert when needed');

console.log('\n✨ Remember: Understanding both makes you versatile!');
