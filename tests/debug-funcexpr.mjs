// Debug function expression
import Parser from 'tree-sitter';

(async () => {
  const parser = new Parser();
  const TypeScript = await import('tree-sitter-typescript');
  parser.setLanguage(TypeScript.default.tsx);
  
  const code = `const App3 = function() { return <div>3</div>; };`;
  const tree = parser.parse(code);
  
  console.log('Code:', code);
  console.log('\nFull tree:');
  
  function printTree(node, depth) {
    const indent = '  '.repeat(depth);
    console.log(`${indent}${node.type} "${node.text.slice(0, 50)}"`);
    for (const child of node.children) {
      printTree(child, depth + 1);
    }
  }
  
  printTree(tree.rootNode, 0);
})();
