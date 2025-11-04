// Debug script to see actual tree structure
import Parser from 'tree-sitter';

(async () => {
  const parser = new Parser();
  const TypeScript = await import('tree-sitter-typescript');
  parser.setLanguage(TypeScript.default.tsx);
  
  console.log('🔍 DEBUGGING TREE STRUCTURE\n');
  
  // Test 1: Arrow function
  const code1 = `const App = () => { return <div>1</div>; };`;
  const tree1 = parser.parse(code1);
  
  console.log('TEST: Arrow Function');
  console.log('Code:', code1);
  console.log('\nTree structure:');
  printTree(tree1.rootNode, 0, 3);
  
  // Test 2: Object destructuring  
  const code2 = `const { name, age } = person;`;
  const tree2 = parser.parse(code2);
  
  console.log('\n\nTEST: Object Destructuring');
  console.log('Code:', code2);
  console.log('\nTree structure:');
  printTree(tree2.rootNode, 0, 4);
  
  // Test 3: useState
  const code3 = `const [count, setCount] = useState(0);`;
  const tree3 = parser.parse(code3);
  
  console.log('\n\nTEST: useState Pattern');
  console.log('Code:', code3);
  console.log('\nTree structure:');
  printTree(tree3.rootNode, 0, 5);
  
  function printTree(node, depth, maxDepth) {
    if (depth > maxDepth) return;
    
    const indent = '  '.repeat(depth);
    const text = node.text.length > 40 ? node.text.slice(0, 40) + '...' : node.text;
    console.log(`${indent}${node.type} "${text}"`);
    
    for (const child of node.children) {
      printTree(child, depth + 1, maxDepth);
    }
  }
})();
