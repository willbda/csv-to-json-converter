/**
 * Simple test runner for CSV Converter modules
 * Run with: node test-modules.js
 */

const Utils = require('./src/utils');
const CONSTANTS = require('./src/constants');

// Test runner
function runTests() {
  console.log('🧪 Running CSV Converter Module Tests...\n');

  testUtils();
  testConstants();

  console.log('✅ All tests completed!\n');
}

function testUtils() {
  console.log('Testing Utils module...');

  // Test sanitizeFieldName
  assert(Utils.sanitizeFieldName('First Name') === 'first_name', 'sanitizeFieldName should handle spaces');
  assert(Utils.sanitizeFieldName('Email@Address!') === 'email_address_', 'sanitizeFieldName should handle special chars');
  assert(Utils.sanitizeFieldName('') === 'unknown_field', 'sanitizeFieldName should handle empty string');

  // Test validateDataviewColumns
  const validation = Utils.validateDataviewColumns(['file', 'normalColumn', 'Bad@Column']);
  assert(validation.warnings.length === 2, 'Should detect reserved and problematic columns');
  assert(validation.isValid === true, 'Should be valid despite warnings');

  // Test escapeYAMLString
  assert(Utils.escapeYAMLString('Hello "World"') === 'Hello \\"World\\"', 'Should escape quotes');
  assert(Utils.escapeYAMLString(null) === '', 'Should handle null values');

  // Test isEmpty
  assert(Utils.isEmpty('') === true, 'Should detect empty string');
  assert(Utils.isEmpty('  ') === true, 'Should detect whitespace-only string');
  assert(Utils.isEmpty([]) === true, 'Should detect empty array');
  assert(Utils.isEmpty({}) === true, 'Should detect empty object');
  assert(Utils.isEmpty('hello') === false, 'Should not detect non-empty string');

  // Test generateSafeFilename
  assert(Utils.generateSafeFilename('My File!@#') === 'My_File', 'Should generate safe filename');
  assert(Utils.generateSafeFilename('') === 'untitled', 'Should handle empty filename');

  console.log('✓ Utils tests passed');
}

function testConstants() {
  console.log('Testing Constants module...');

  // Test that constants are defined
  assert(CONSTANTS.DATAVIEW_RESERVED_FIELDS.includes('file'), 'Should include Dataview reserved fields');
  assert(Object.values(CONSTANTS.OUTPUT_FORMATS).includes('json'), 'Should include output formats');
  assert(CONSTANTS.PRESETS.HIERARCHICAL.name === 'Hierarchical', 'Should include presets');

  console.log('✓ Constants tests passed');
}

// Simple assertion function
function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
}

// Mock objects for modules that need them
if (typeof require !== 'undefined' && require.main === module) {
  // Only run tests if this file is executed directly
  try {
    runTests();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

module.exports = { runTests };
