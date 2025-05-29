/**
 * LEARNING: Simple Test Runner for Modular Code
 * 
 * This shows how modular code is easier to test because each piece
 * can be tested in isolation without loading the entire application.
 * 
 * Run with: node test-modules.js
 */

// LEARNING: We can test individual modules without loading Obsidian
const Utils = require('./src/utils');
const CONSTANTS = require('./src/constants');

function runTests() {
  console.log('🧪 Testing CSV Converter Modules...\n');

  testConstants();
  testUtils();
  testErrorHandling();
  testEdgeCases();

  console.log('✅ All tests completed!\n');
  console.log('💡 Notice how easy it is to test modular code!');
  console.log('   Each function has clear inputs and outputs.');
  console.log('   No UI dependencies, no file system dependencies.');
  console.log('   This is why separation of concerns matters.\n');
}

function testConstants() {
  console.log('📋 Testing Constants module...');

  // LEARNING: Test that our constants exist and have expected values
  assert(Array.isArray(CONSTANTS.DATAVIEW_RESERVED_FIELDS), 'Reserved fields should be an array');
  assert(CONSTANTS.DATAVIEW_RESERVED_FIELDS.includes('file'), 'Should include "file" as reserved');
  assert(CONSTANTS.OUTPUT_FORMATS.JSON === 'json', 'JSON format should be "json"');
  assert(typeof CONSTANTS.MAX_FILE_SIZE === 'number', 'Max file size should be a number');

  console.log('✓ Constants tests passed\n');
}

function testUtils() {
  console.log('🔧 Testing Utils module...');

  // LEARNING: Test sanitizeFieldName function
  console.log('  Testing sanitizeFieldName...');
  assert(Utils.sanitizeFieldName('First Name') === 'first_name', 'Should convert spaces to underscores');
  assert(Utils.sanitizeFieldName('Email@Address!') === 'email_address_', 'Should remove special characters');
  assert(Utils.sanitizeFieldName('') === 'unknown_field', 'Should handle empty strings');
  assert(Utils.sanitizeFieldName(null) === 'unknown_field', 'Should handle null values');
  assert(Utils.sanitizeFieldName('123Number') === '123number', 'Should handle numbers at start');

  // LEARNING: Test validateDataviewColumns function
  console.log('  Testing validateDataviewColumns...');
  const validation1 = Utils.validateDataviewColumns(['file', 'normalColumn', 'Bad@Column']);
  assert(validation1.warnings.length === 2, 'Should detect reserved field and special characters');
  assert(validation1.isValid === true, 'Should be valid despite warnings');

  const validation2 = Utils.validateDataviewColumns(['', 'goodColumn']);
  assert(validation2.errors.length === 1, 'Should detect empty column name as error');
  assert(validation2.isValid === false, 'Should be invalid due to error');

  // LEARNING: Test escapeYAMLString function
  console.log('  Testing escapeYAMLString...');
  assert(Utils.escapeYAMLString('Hello "World"') === 'Hello \\"World\\"', 'Should escape quotes');
  assert(Utils.escapeYAMLString(null) === '', 'Should handle null values');
  assert(Utils.escapeYAMLString('Line 1\nLine 2') === 'Line 1\\nLine 2', 'Should escape newlines');

  // LEARNING: Test isEmpty function
  console.log('  Testing isEmpty...');
  assert(Utils.isEmpty('') === true, 'Empty string should be empty');
  assert(Utils.isEmpty('  ') === true, 'Whitespace-only string should be empty');
  assert(Utils.isEmpty([]) === true, 'Empty array should be empty');
  assert(Utils.isEmpty({}) === true, 'Empty object should be empty');
  assert(Utils.isEmpty('hello') === false, 'Non-empty string should not be empty');
  assert(Utils.isEmpty([1, 2, 3]) === false, 'Non-empty array should not be empty');
  assert(Utils.isEmpty({ key: 'value' }) === false, 'Non-empty object should not be empty');

  // LEARNING: Test generateSafeFilename function
  console.log('  Testing generateSafeFilename...');
  assert(Utils.generateSafeFilename('My File!@#') === 'My_File', 'Should generate safe filename');
  assert(Utils.generateSafeFilename('') === 'untitled', 'Should handle empty filename');
  assert(Utils.generateSafeFilename('Valid_File-Name') === 'Valid_File-Name', 'Should keep valid characters');

  // LEARNING: Test formatFileSize function
  console.log('  Testing formatFileSize...');
  assert(Utils.formatFileSize(0) === '0 Bytes', 'Should handle zero bytes');
  assert(Utils.formatFileSize(1024) === '1 KB', 'Should convert to KB');
  assert(Utils.formatFileSize(1024 * 1024) === '1 MB', 'Should convert to MB');

  console.log('✓ Utils tests passed\n');
}

function testErrorHandling() {
  console.log('⚠️  Testing Error Handling...');

  // LEARNING: Test that functions handle invalid input gracefully
  console.log('  Testing graceful error handling...');
  
  // These should not throw errors, but return sensible defaults
  assert(Utils.sanitizeFieldName(undefined) === 'unknown_field', 'Should handle undefined input');
  assert(Utils.sanitizeTagName(123) === 'unknown', 'Should handle number input');
  assert(Utils.generateSafeFilename(null) === 'untitled', 'Should handle null input');
  assert(Utils.getErrorMessage('Simple error') === 'Simple error', 'Should handle string errors');
  assert(Utils.getErrorMessage(new Error('Test error')).includes('Test error'), 'Should handle Error objects');

  console.log('✓ Error handling tests passed\n');
}

function testEdgeCases() {
  console.log('🔍 Testing Edge Cases...');

  // LEARNING: Test unusual but valid inputs
  console.log('  Testing edge cases...');

  // Very long field names
  const longName = 'a'.repeat(200);
  const sanitized = Utils.sanitizeFieldName(longName);
  assert(sanitized.length === longName.length, 'Should preserve length for valid characters');

  // Filename with maximum length
  const longFilename = 'a'.repeat(200);
  const safeFilename = Utils.generateSafeFilename(longFilename, 50);
  assert(safeFilename.length <= 50, 'Should respect max length parameter');

  // Unicode characters
  const unicodeName = 'Héllo_Wörld';
  const unicodeSanitized = Utils.sanitizeFieldName(unicodeName);
  assert(typeof unicodeSanitized === 'string', 'Should handle unicode input');

  // Deep clone with complex object
  const complexObj = {
    str: 'hello',
    num: 42,
    arr: [1, 2, { nested: true }],
    date: new Date('2024-01-01'),
    nested: {
      deep: {
        value: 'test'
      }
    }
  };
  const cloned = Utils.deepClone(complexObj);
  assert(cloned !== complexObj, 'Clone should be different object');
  assert(cloned.str === complexObj.str, 'Clone should have same string values');
  assert(cloned.date instanceof Date, 'Clone should preserve Date objects');
  assert(cloned.nested.deep.value === 'test', 'Clone should handle deep nesting');

  console.log('✓ Edge case tests passed\n');
}

// LEARNING: Simple assertion function
function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ Test failed: ${message}`);
  }
}

// LEARNING: Only run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  try {
    runTests();
    
    console.log('🎉 All tests passed!');
    console.log('\n🎓 What You Just Learned:');
    console.log('1. How to test individual functions in isolation');
    console.log('2. Why modular code is easier to verify and debug');
    console.log('3. The importance of testing edge cases and error conditions');
    console.log('4. How pure functions (like Utils methods) are predictable and reliable');
    console.log('\n💡 Try modifying a Utils function and running the tests again');
    console.log('   You\'ll see immediately if you broke something!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    console.error('\n🐛 This is actually good! You found a bug.');
    console.error('   In modular code, bugs are easier to isolate and fix.');
    process.exit(1);
  }
}

module.exports = { runTests };
