// Basic AST Modifier Tests
// Run with: node tests/modifier-basic.test.mjs

import { ASTModifier, modifyCode } from '../src/utils/astModifier.js';

let testsRun = 0;
let testsPassed = 0;

function assert(condition, message) {
  testsRun++;
  if (condition) {
    console.log(`  ✅ ${message}`);
    testsPassed++;
  } else {
    console.log(`  ❌ ${message}`);
  }
}

console.log('🔧 AST MODIFIER - BASIC TESTS\n');
console.log('═'.repeat(60));

// TEST 1: Add Import to Empty File
console.log('\n📝 TEST 1: Add Import');
console.log('-'.repeat(60));

(async () => {
  const code = `
export default function App() {
  return <div>Hello</div>;
}
`;

  const result = await modifyCode(code, async (modifier) => {
    modifier.addImport({
      source: 'react',
      namedImports: ['useState']
    });
  });

  assert(result.success, 'Modification successful');
  assert(result.code?.includes("import { useState } from 'react';"), 'Import added');
  assert(result.code?.includes('export default function App()'), 'Original code preserved');

  console.log('\nResult preview:');
  console.log(result.code?.split('\n').slice(0, 5).join('\n'));

  // TEST 2: Add Import to File with Existing Import
  console.log('\n📝 TEST 2: Merge Imports');
  console.log('-'.repeat(60));

  const codeWithImport = `
import { useState } from 'react';

export default function App() {
  return <div>Hello</div>;
}
`;

  const result2 = await modifyCode(codeWithImport, async (modifier) => {
    modifier.addImport({
      source: 'react',
      namedImports: ['useEffect']
    });
  });

  assert(result2.success, 'Modification successful');
  assert(result2.code?.includes('useState'), 'Original import preserved');
  assert(result2.code?.includes('useEffect'), 'New import added');
  assert(!result2.code?.includes('import { useState } from'), 'Not duplicated');

  console.log('\nResult preview:');
  console.log(result2.code?.split('\n').slice(0, 5).join('\n'));

  // TEST 3: Add State Variable
  console.log('\n📝 TEST 3: Add State Variable');
  console.log('-'.repeat(60));

  const simpleCode = `
export default function App() {
  return <div>Hello</div>;
}
`;

  const result3 = await modifyCode(simpleCode, async (modifier) => {
    modifier.addStateVariable({
      name: 'count',
      setter: 'setCount',
      initialValue: '0'
    });
  });

  assert(result3.success, 'Modification successful');
  assert(result3.code?.includes('const [count, setCount] = useState(0)'), 'State variable added');
  assert(result3.code?.includes("import { useState } from 'react'"), 'useState imported');

  console.log('\nResult preview:');
  console.log(result3.code?.split('\n').slice(0, 8).join('\n'));

  // TEST 4: Wrap Element
  console.log('\n📝 TEST 4: Wrap JSX Element');
  console.log('-'.repeat(60));

  const jsxCode = `
export default function App() {
  return (
    <div className="container">
      <h1>Hello</h1>
    </div>
  );
}
`;

  const result4 = await modifyCode(jsxCode, async (modifier) => {
    const tree = modifier.getTree();
    const parser = modifier.getParser();
    
    if (tree) {
      // Find the div element
      const divElement = parser.findComponent(tree, 'div');
      
      if (divElement) {
        modifier.wrapElement(divElement, {
          component: 'AuthGuard',
          import: {
            source: '@/components/AuthGuard',
            defaultImport: 'AuthGuard'
          }
        });
      }
    }
  });

  assert(result4.success, 'Modification successful');
  assert(result4.code?.includes('<AuthGuard>'), 'Wrapper opening added');
  assert(result4.code?.includes('</AuthGuard>'), 'Wrapper closing added');
  assert(result4.code?.includes("import AuthGuard from '@/components/AuthGuard'"), 'Wrapper imported');

  console.log('\nResult preview:');
  console.log(result4.code?.split('\n').slice(0, 12).join('\n'));

  // TEST 5: Multiple Modifications
  console.log('\n📝 TEST 5: Multiple Modifications');
  console.log('-'.repeat(60));

  const result5 = await modifyCode(simpleCode, async (modifier) => {
    // Add multiple imports
    modifier.addImport({
      source: 'react',
      namedImports: ['useState', 'useEffect']
    });
    
    modifier.addImport({
      source: '@/components/Button',
      defaultImport: 'Button'
    });
    
    // Add state
    modifier.addStateVariable({
      name: 'isOpen',
      setter: 'setIsOpen',
      initialValue: 'false'
    });
  });

  assert(result5.success, 'Multiple modifications successful');
  assert(result5.code?.includes('useState'), 'First import added');
  assert(result5.code?.includes('useEffect'), 'Second import added');
  assert(result5.code?.includes('Button'), 'Third import added');
  assert(result5.code?.includes('[isOpen, setIsOpen]'), 'State added');

  console.log('\nResult preview:');
  console.log(result5.code?.split('\n').slice(0, 10).join('\n'));

  // TEST 6: Validation Catches Errors
  console.log('\n📝 TEST 6: Validation');
  console.log('-'.repeat(60));

  const modifier = new ASTModifier(simpleCode);
  await modifier.initialize();
  
  // Manually create a bad modification
  modifier['modifications'].push({
    type: 'replace',
    start: 0,
    end: 10,
    newCode: 'INVALID SYNTAX {{{{',
    priority: 1,
    description: 'Bad modification'
  });
  
  const result6 = await modifier.generate();
  
  assert(!result6.success, 'Detects invalid syntax');
  assert(result6.errors && result6.errors.length > 0, 'Returns error messages');

  console.log('Error detected:', result6.errors?.[0]);

  // FINAL REPORT
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST RESULTS');
  console.log('═'.repeat(60));
  console.log(`\nTotal Tests: ${testsRun}`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsRun - testsPassed}`);
  console.log(`Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

  if (testsPassed === testsRun) {
    console.log('\n🎉 ALL BASIC TESTS PASSED!');
    console.log('✅ AST Modifier core functionality works');
    console.log('✅ Ready for advanced features\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed\n');
    process.exit(1);
  }
})();
