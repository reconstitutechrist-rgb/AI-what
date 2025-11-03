import type Parser from 'tree-sitter';

/**
 * Error information from syntax tree
 */
export interface ErrorInfo {
  line: number;
  column: number;
  text: string;
  nodeType: string;
}

/**
 * Function match result with metadata
 */
export interface FunctionMatch {
  node: Parser.SyntaxNode;
  type: 'function_declaration' | 'arrow_function' | 'function_expression';
  declarator?: Parser.SyntaxNode; // For arrow/expression functions
  name?: string;
}

/**
 * Variable match result with pattern type
 */
export interface VariableMatch {
  node: Parser.SyntaxNode;
  type: 'simple' | 'array_destructure' | 'object_destructure' | 'object_destructure_renamed';
  nameNode: Parser.SyntaxNode;
  element?: Parser.SyntaxNode; // For array destructuring
  property?: Parser.SyntaxNode; // For object destructuring
  originalName?: string; // For renamed destructuring { name: userName }
}

/**
 * State variable information (useState pattern)
 */
export interface StateVariable {
  stateVar: string; // e.g., 'count'
  setterVar: string; // e.g., 'setCount'
  initialValue?: string;
  node: Parser.SyntaxNode;
}

/**
 * Event handler information
 */
export interface EventHandler {
  eventType: string; // e.g., 'onClick', 'onChange'
  handlerName?: string; // If named function
  isInline: boolean;
  node: Parser.SyntaxNode;
}

/**
 * Import information
 */
export interface ImportInfo {
  source: string; // e.g., 'react'
  imports: {
    name: string;
    alias?: string;
    isDefault?: boolean;
    isNamespace?: boolean;
  }[];
  node: Parser.SyntaxNode;
}

/**
 * Parser configuration options
 */
export interface ParserOptions {
  language?: 'javascript' | 'typescript';
  throwOnError?: boolean;
  logErrors?: boolean;
}
