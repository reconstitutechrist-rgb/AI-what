/**
 * Comprehensive AST Operations Test Suite
 * Tests all 12 AST operations for correctness
 * 
 * Run with: npx tsx tests/ast-operations.test.mjs
 */

// Import without .ts extension for proper module resolution
import { executeASTOperation } from '../src/utils/astExecutor.js';

// Minimal test component
const MINIMAL_COMPONENT = `export default function TestComponent() {
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
}`;

// Test results accumulator
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, error = null) {
  results.tests.push({ name, passed, error });
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}`);
    if (error) console.log(`   Error: ${error}`);
  }
}

// Helper to check if string contains substring
function contains(str, substr) {
  return str.includes(substr);
}

// Helper to check if code is valid (has no obvious syntax errors)
function isValidJS(code) {
  try {
    // Basic validation - check for balanced braces and common patterns
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    
    return openBraces === closeBraces && openParens === closeParens;
  } catch (e) {
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting AST Operations Test Suite\n');
  console.log('Testing all 12 AST operations...\n');

  // TEST 1: AST_ADD_STATE
  console.log('1️⃣  Testing AST_ADD_STATE (useState)...');
  try {
    const result = await executeASTOperation(MINIMAL_COMPONENT, {
      type: 'AST_ADD_STATE',
      name: 'count',
      setter: 'setCount',
      initialValue: '0'
    });
    
    logTest('AST_ADD_STATE: Success', result.success && result.code);
    logTest('AST_ADD_STATE: Contains useState', contains(result.code, 'useState'));
    logTest('AST_ADD_STATE: Contains state variable', contains(result.code, 'const [count, setCount]'));
    logTest('AST_ADD_STATE: Valid syntax', isValidJS(result.code));
  } catch (e) {
    logTest('AST_ADD_STATE', false, e.message);
  }

  // TEST 2: AST_ADD_USEEFFECT
  console.log('\n2️⃣  Testing AST_ADD_USEEFFECT...');
  try {
    const result = await executeASTOperation(MINIMAL_COMPONENT, {
      type: 'AST_ADD_USEEFFECT',
      body: 'console.log("Effect running");',
      dependencies: ['count']
    });
    
    logTest('AST_ADD_USEEFFECT: Success', result.success && result.code);
    logTest('AST_ADD_USEEFFECT: Contains useEffect', contains(result.code, 'useEffect'));
    logTest('AST_ADD_USEEFFECT: Contains effect body', contains(result.code, 'console.log("Effect running")'));
    logTest('AST_ADD_USEEFFECT: Valid syntax', isValidJS(result.code));
  } catch (e) {
    logTest('AST_ADD_USEEFFECT', false, e.message);
  }

  // TEST 3: AST_ADD_REF (NEW)
  console.log('\n3️⃣  Testing AST_ADD_REF (useRef)...');
  try {
    const result = await executeASTOperation(MINIMAL_COMPONENT, {
      type: 'AST_ADD_REF',
      name: 'inputRef',
      initialValue: 'null'
    });
    
    logTest('AST_ADD_REF: Success', result.success && result.code);
    logTest('AST_ADD_REF: Contains useRef', contains(result.code, 'useRef'));
    logTest('AST_ADD_REF: Contains ref variable', contains(result.code, 'const inputRef = useRef(null)'));
    logTest('AST_ADD_REF: Valid syntax', isValidJS(result.code));
  } catch (e) {
    logTest('AST_ADD_REF', false, e.message);
  }

  // TEST 4: AST_ADD_MEMO (NEW)
  console.log('\n4️⃣  Testing AST_ADD_MEMO (useMemo)...');
  try {
    const result = await executeASTOperation(MINIMAL_COMPONENT, {
      type: 'AST_ADD_MEMO',
      name: 'doubleCount',
      computation: 'count * 2',
      dependencies: ['count']
    });
    
    logTest('AST_ADD_MEMO: Success', result.success && result.code);
    logTest('AST_ADD_MEMO: Contains useMemo', contains(result.code, 'useMemo'));
    logTest('AST_ADD_MEMO: Contains computation', contains(result.code, 'count * 2'));
    logTest('AST_ADD_MEMO: Valid syntax', isValidJS(result.code));
  } catch (e) {
    logTest('AST_ADD_MEMO', false, e.message);
  }

  // TEST 5: AST_ADD_CALLBACK (NEW)
  console.log('\n5️⃣  Testing AST_ADD_CALLBACK (useCallback)...');
  try {
    const result = await executeASTOperation(MINIMAL_COMPONENT, {
      type: 'AST_ADD_CALLBACK',
      name: 'handleClick',
      params: ['id'],
      body: 'console.log(id);',
      dependencies: ['count']
    });
    
    logTest('AST_ADD_CALLBACK: Success', result.success && result.code);
    logTest('AST_ADD_CALLBACK: Contains useCallback', contains(result.code, 'useCallback'));
    logTest('AST_ADD_CALLBACK: Contains callback name', contains(result.code, 'const handleClick'));
    logTest('AST_ADD_CALLBACK: Valid syntax', isValidJS(result.code));
  } catch (e) {
    logTest('AST_ADD_CALLBACK', false, e.message);
  }

  // TEST 6: AST_ADD_REDUCER (NEW)
  console.log('\n6️⃣  Testing AST_ADD_REDUCER (useReducer)...');
  try {
    const result = await executeASTOperation(MINIMAL_COMPONENT, {
      type: 'AST_ADD_REDUCER',
      name: 'state',
      dispatchName: 'dispatch',
      reducerName: 'reducer',
      initialState: '{ count: 0 }',
      actions: [
        { type: 'INCREMENT', handler: 'return { ...state, count: state.count + 1 }' },
        { type: 'DECREMENT', handler: 'return { ...state, count: state.count - 1 }' }
      ]
    });
    
    logTest('AST_ADD_REDUCER: Success', result.success && result.code);
    logTest('AST_ADD_REDUCER: Contains useReducer', contains(result.code, 'useReducer'));
    logTest('AST_ADD_REDUCER: Contains reducer function', contains(result.code, 'function reducer'));
    logTest('AST_ADD_REDUCER: Contains switch statement', contains(result.code, 'switch (action.type)'));
    logTest('AST_ADD_REDUCER: Contains INCREMENT case', contains(result.code, "case 'INCREMENT'"));
    logTest('AST_ADD_REDUCER: Valid syntax', isValidJS(result.code));
  } catch (e) {
    logTest('AST_ADD_REDUCER', false, e.message);
  }

  // TEST 7: AST_ADD_IMPORT
  console.log('\n7️⃣  Testing AST_ADD_IMPORT...');
  try {
    const result = await executeASTOperation(MINIMAL_COMPONENT, {
      type: 'AST_ADD_IMPORT',
      source: 'axios',
      defaultImport: 'axios'
    });
    
    logTest('AST_ADD_IMPORT: Success', result.success && result.code);
    logTest('AST_ADD_IMPORT: Contains import', contains(result.code, "import axios from 'axios'"));
    logTest('AST_ADD_IMPORT: Valid syntax', isValidJS(result.code));
  } catch (e) {
    logTest('AST_ADD_IMPORT', false, e.message);
  }

  // TEST 8: AST_WRAP_ELEMENT
  console.log('\n8️⃣  Testing AST_WRAP_ELEMENT...');
  try {
    const result = await executeASTOperation(MINIMAL_COMPONENT, {
      type: 'AST_WRAP_ELEMENT',
      targetElement: 'div',
      wrapperComponent: 'ErrorBoundary'
    });
    
    logTest('AST_WRAP_ELEMENT: Success', result.success && result.code);
    logTest('AST_WRAP_ELEMENT: Contains wrapper', contains(result.code, '<ErrorBoundary>'));
    logTest('AST_WRAP_ELEMENT: Valid syntax', isValidJS(result.code));
  } catch (e) {
    logTest('AST_WRAP_ELEMENT', false, e.message);
  }

  // TEST 9: AST_MODIFY_CLASSNAME
  console.log('\n9️⃣  Testing AST_MODIFY_CLASSNAME...');
  try {
    const result = await executeASTOperation(MINIMAL_COMPONENT, {
      type: 'AST_MODIFY_CLASSNAME',
      targetElement: 'div',
      staticClasses: ['container', 'mx-auto']
    });
    
    logTest('AST_MODIFY_CLASSNAME: Success', result.success && result.code);
    logTest('AST_MODIFY_CLASSNAME: Contains className', contains(result.code, 'className'));
    logTest('AST_MODIFY_CLASSNAME: Valid syntax', isValidJS(result.code));
  } catch (e) {
    logTest('AST_MODIFY_CLASSNAME', false, e.message);
  }

  // TEST 10: AST_INSERT_JSX
  console.log('\n🔟 Testing AST_INSERT_JSX...');
  try {
    const result = await executeASTOperation(MINIMAL_COMPONENT, {
      type: 'AST_INSERT_JSX',
      targetElement: 'div',
      jsx: '<p>Inserted paragraph</p>',
      position: 'inside_end'
    });
    
    logTest('AST_INSERT_JSX: Success', result.success && result.code);
    logTest('AST_INSERT_JSX: Contains inserted JSX', contains(result.code, 'Inserted paragraph'));
    logTest('AST_INSERT_JSX: Valid syntax', isValidJS(result.code));
  } catch (e) {
    logTest('AST_INSERT_JSX', false, e.message);
  }

  // TEST 11: AST_MODIFY_PROP
  console.log('\n1️⃣1️⃣  Testing AST_MODIFY_PROP...');
  try {
    const result = await executeASTOperation(MINIMAL_COMPONENT, {
      type: 'AST_MODIFY_PROP',
      targetElement: 'h1',
      propName: 'id',
      propValue: '"main-title"',
      action: 'add'
    });
    
    logTest('AST_MODIFY_PROP: Success', result.success && result.code);
    logTest('AST_MODIFY_PROP: Contains prop', contains(result.code, 'id={'));
    logTest('AST_MODIFY_PROP: Valid syntax', isValidJS(result.code));
  } catch (e) {
    logTest('AST_MODIFY_PROP', false, e.message);
  }

  // TEST 12: Priority Ordering Test (Multiple Hooks)
  console.log('\n1️⃣2️⃣  Testing PRIORITY ORDERING (All Hooks Together)...');
  try {
    let code = MINIMAL_COMPONENT;
    
    // Add hooks in REVERSE order to test priority system
    const operations = [
      { type: 'AST_ADD_CALLBACK', name: 'handleClick', body: 'console.log("click");', dependencies: [] },
      { type: 'AST_ADD_MEMO', name: 'memoVal', computation: '42', dependencies: [] },
      { type: 'AST_ADD_REF', name: 'myRef', initialValue: 'null' },
      { type: 'AST_ADD_STATE', name: 'count', setter: 'setCount', initialValue: '0' }
    ];
    
    for (const op of operations) {
      const result = await executeASTOperation(code, op);
      if (!result.success) {
        throw new Error(`Failed at ${op.type}`);
      }
      code = result.code;
    }
    
    // Verify order: useState should appear before useRef, useRef before useMemo, useMemo before useCallback
    const stateIndex = code.indexOf('useState');
    const refIndex = code.indexOf('useRef');
    const memoIndex = code.indexOf('useMemo');
    const callbackIndex = code.indexOf('useCallback');
    
    logTest('PRIORITY: All hooks added successfully', true);
    logTest('PRIORITY: useState before useRef', stateIndex < refIndex && stateIndex > 0);
    logTest('PRIORITY: useRef before useMemo', refIndex < memoIndex && refIndex > 0);
    logTest('PRIORITY: useMemo before useCallback', memoIndex < callbackIndex && memoIndex > 0);
    logTest('PRIORITY: Valid final syntax', isValidJS(code));
    
    console.log('\n📊 Hook Order in Generated Code:');
    console.log(`   useState at position ${stateIndex}`);
    console.log(`   useRef at position ${refIndex}`);
    console.log(`   useMemo at position ${memoIndex}`);
    console.log(`   useCallback at position ${callbackIndex}`);
  } catch (e) {
    logTest('PRIORITY ORDERING', false, e.message);
  }

  // FINAL RESULTS
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Total: ${results.tests.length}`);
  console.log(`🎯 Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests.filter(t => !t.passed).forEach(t => {
      console.log(`   - ${t.name}`);
      if (t.error) console.log(`     Error: ${t.error}`);
    });
  }

  return results.failed === 0;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
