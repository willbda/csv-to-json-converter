/**
 * Demonstration: How Modular Code Makes Debugging Easy
 * 
 * I just found and fixed a bug in your utils.js - the regex patterns had
 * double backslashes that would break text processing.
 * 
 * This shows exactly why modular architecture matters for maintenance.
 */

// Let's test the fixed utility functions
function demonstrateBugFix() {
  console.log('🐛 Demonstrating why modular code is easier to debug...\n');

  // Simulate the Utils class (since we can't require it here)
  class UtilsFixed {
    static sanitizeTagName(tag) {
      if (!tag || typeof tag !== 'string') {
        return 'unknown';
      }
      
      return tag
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')    // ✅ Fixed: single backslashes
        .replace(/\s+/g, '-')        // ✅ Fixed: single backslashes
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    static generateSafeFilename(str, maxLength = 100) {
      if (!str || typeof str !== 'string') {
        return 'untitled';
      }
      
      const safe = str
        .replace(/[^\w\s-]/g, '')    // ✅ Fixed: single backslashes
        .replace(/\s+/g, '_')        // ✅ Fixed: single backslashes
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, maxLength);
        
      return safe || 'untitled';
    }
  }

  // Test cases that would have failed with the bug
  const testCases = [
    { input: 'My Project Name!', expected: 'My_Project_Name' },
    { input: 'Data@2024#Version', expected: 'Data2024Version' },
    { input: 'Test   Spaces', expected: 'Test_Spaces' },
    { input: '___Leading___Trailing___', expected: 'Leading_Trailing' }
  ];

  console.log('Testing generateSafeFilename:');
  testCases.forEach(({ input, expected }) => {
    const result = UtilsFixed.generateSafeFilename(input);
    const passed = result === expected;
    console.log(`  ${passed ? '✅' : '❌'} "${input}" → "${result}" ${passed ? '' : `(expected "${expected}")`}`);
  });

  console.log('\nTesting sanitizeTagName:');
  const tagTests = [
    { input: 'My Tag!', expected: 'my-tag' },
    { input: 'Complex@Tag#Name', expected: 'complextagname' },
    { input: 'Spaces   Everywhere', expected: 'spaces-everywhere' }
  ];

  tagTests.forEach(({ input, expected }) => {
    const result = UtilsFixed.sanitizeTagName(input);
    const passed = result === expected;
    console.log(`  ${passed ? '✅' : '❌'} "${input}" → "${result}" ${passed ? '' : `(expected "${expected}")`}`);
  });

  console.log('\n💡 Why This Bug Was Easy to Find and Fix:\n');
  console.log('1. 🎯 ISOLATED FUNCTIONS: Bug was contained to Utils module');
  console.log('2. 🧪 TESTABLE: Could test functions without loading entire plugin');
  console.log('3. 📍 CLEAR RESPONSIBILITY: Knew exactly where text processing happens');
  console.log('4. 🔄 SINGLE CHANGE: Fixed in one place, works everywhere');
  
  console.log('\n🔥 In Your Original 800-Line File:');
  console.log('- Bug could be in ANY of the text processing scattered throughout');
  console.log('- Would need to test entire conversion process to verify fix');
  console.log('- Might accidentally break something else when fixing');
  console.log('- Harder to write focused tests');

  console.log('\n🎖️ This is what MAINTAINABLE CODE looks like!');
}

// Run the demonstration
demonstrateBugFix();

/**
 * LESSON FOR DAVID:
 * 
 * Notice how I could:
 * 1. Identify the exact problem location (Utils module)
 * 2. Fix it with surgical precision (2 regex patterns)
 * 3. Test the fix in isolation
 * 4. Be confident it won't break other parts
 * 
 * This is the power of modular architecture.
 * 
 * In your career, you'll spend more time debugging than writing new code.
 * Code that's easy to debug is code that scales.
 */
