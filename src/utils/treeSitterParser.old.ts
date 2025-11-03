import Parser from 'tree-sitter';

export interface ErrorInfo {
  line: number;
  column: number;
  text: string;
}

export class CodeParser {
  private parser: Parser;
  private language: 'javascript' | 'typescript';

  constructor(language: 'javascript' | 'typescript' = 'typescript') {
    this.parser = new Parser();
    this.language = language;
    
    // Note: Language setup will be done at runtime
    // Tree-sitter languages need to be loaded differently in Node.js
    try {
      if (language === 'typescript') {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const TypeScript = require('tree-sitter-typescript');
        this.parser.setLanguage(TypeScript.tsx);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const JavaScript = require('tree-sitter-javascript');
        this.parser.setLanguage(JavaScript);
      }
    } catch (error) {
      console.error('Failed to load tree-sitter language:', error);
      throw new Error('Tree-sitter language loading failed. Please ensure tree-sitter packages are installed.');
    }
  }

  /**
   * Parse code into a syntax tree
   */
  parse(code: string): Parser.Tree | null {
    try {
      const tree = this.parser.parse(code);
      
      if (tree.rootNode.hasError) {
        console.warn('Parse tree has errors:', this.getErrors(tree));
        // Still return tree - can work with partial results
      }
      
      return tree;
    } catch (error) {
      console.error('Failed to parse code:', error);
      return null;
    }
  }

  /**
   * Find all nodes of a given type
   */
  findNodes(tree: Parser.Tree, nodeType: string): Parser.SyntaxNode[] {
    const nodes: Parser.SyntaxNode[] = [];
    
    const traverse = (node: Parser.SyntaxNode) => {
      if (node.type === nodeType) {
        nodes.push(node);
      }
      for (const child of node.children) {
        traverse(child);
      }
    };
    
    traverse(tree.rootNode);
    return nodes;
  }

  /**
   * Find a specific variable declaration by name
   */
  findVariable(tree: Parser.Tree, varName: string): Parser.SyntaxNode | null {
    const declarations = this.findNodes(tree, 'variable_declaration');
    
    for (const decl of declarations) {
      // Look for variable_declarator child
      for (const child of decl.children) {
        if (child.type === 'variable_declarator') {
          const nameNode = child.childForFieldName('name');
          if (nameNode && nameNode.text === varName) {
            return decl;
          }
          
          // Handle array destructuring: const [todos, setTodos] = useState([])
          if (nameNode && nameNode.type === 'array_pattern') {
            const elements = nameNode.namedChildren;
            for (const element of elements) {
              if (element.text === varName) {
                return decl;
              }
            }
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Find a function declaration by name
   */
  findFunction(tree: Parser.Tree, funcName: string): Parser.SyntaxNode | null {
    const functions = this.findNodes(tree, 'function_declaration');
    
    for (const func of functions) {
      const name = func.childForFieldName('name');
      if (name && name.text === funcName) {
        return func;
      }
    }
    
    // Also check arrow functions and function expressions
    const arrowFunctions = this.findNodes(tree, 'arrow_function');
    const functionExpressions = this.findNodes(tree, 'function');
    
    return null;
  }

  /**
   * Find JSX component by tag name
   */
  findComponent(tree: Parser.Tree, componentName: string): Parser.SyntaxNode | null {
    const jsxElements = this.findNodes(tree, 'jsx_element');
    
    for (const element of jsxElements) {
      const openingElement = element.childForFieldName('opening_element');
      if (openingElement) {
        const name = openingElement.childForFieldName('name');
        if (name && name.text === componentName) {
          return element;
        }
      }
    }
    
    // Also check self-closing elements
    const selfClosing = this.findNodes(tree, 'jsx_self_closing_element');
    for (const element of selfClosing) {
      const name = element.childForFieldName('name');
      if (name && name.text === componentName) {
        return element;
      }
    }
    
    return null;
  }

  /**
   * Find all import statements
   */
  findImports(tree: Parser.Tree): Parser.SyntaxNode[] {
    return this.findNodes(tree, 'import_statement');
  }

  /**
   * Find the export default declaration
   */
  findDefaultExport(tree: Parser.Tree): Parser.SyntaxNode | null {
    const exports = this.findNodes(tree, 'export_statement');
    
    for (const exp of exports) {
      // Check if it has 'default' keyword
      for (const child of exp.children) {
        if (child.type === 'default' || child.text === 'default') {
          return exp;
        }
      }
    }
    
    return null;
  }

  /**
   * Get all error nodes in the tree
   */
  private getErrors(tree: Parser.Tree): ErrorInfo[] {
    const errors: ErrorInfo[] = [];
    
    const traverse = (node: Parser.SyntaxNode) => {
      if (node.hasError) {
        if (node.type === 'ERROR' || node.isMissing) {
          errors.push({
            line: node.startPosition.row + 1, // 1-indexed for humans
            column: node.startPosition.column + 1,
            text: node.text.slice(0, 50) // First 50 chars
          });
        }
      }
      for (const child of node.children) {
        traverse(child);
      }
    };
    
    traverse(tree.rootNode);
    return errors;
  }

  /**
   * Get a human-readable representation of the tree structure
   * Useful for debugging
   */
  printTree(tree: Parser.Tree, maxDepth: number = 3): string {
    let result = '';
    
    const traverse = (node: Parser.SyntaxNode, depth: number, prefix: string) => {
      if (depth > maxDepth) return;
      
      const indent = '  '.repeat(depth);
      const nodeInfo = `${indent}${prefix}${node.type}`;
      const text = node.text.length > 30 ? node.text.slice(0, 30) + '...' : node.text;
      result += `${nodeInfo} "${text}"\n`;
      
      node.children.forEach((child, index) => {
        const isLast = index === node.children.length - 1;
        const childPrefix = isLast ? '└─ ' : '├─ ';
        traverse(child, depth + 1, childPrefix);
      });
    };
    
    traverse(tree.rootNode, 0, '');
    return result;
  }

  /**
   * Check if code has syntax errors
   */
  hasErrors(tree: Parser.Tree): boolean {
    return tree.rootNode.hasError;
  }

  /**
   * Get the text content of a node
   */
  getNodeText(node: Parser.SyntaxNode): string {
    return node.text;
  }

  /**
   * Get line and column position of a node
   */
  getNodePosition(node: Parser.SyntaxNode): { line: number; column: number } {
    return {
      line: node.startPosition.row + 1, // 1-indexed
      column: node.startPosition.column + 1
    };
  }
}

// Export a singleton instance for common use
export const parser = new CodeParser('typescript');
