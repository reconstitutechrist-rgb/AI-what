import Parser from 'tree-sitter';
import { CodeParser } from './treeSitterParser';
import type {
  Modification,
  ImportSpec,
  WrapperSpec,
  StateVariableSpec,
  ModificationResult,
  ASTModifierOptions,
  NodePosition,
  ModificationContext
} from './astModifierTypes';

/**
 * AST Modifier - Makes surgical modifications to code using Tree-sitter
 * 
 * Features:
 * - Precise position-based modifications
 * - Import deduplication
 * - Validation after modifications
 * - Preserves formatting where possible
 * 
 * @version 1.0.0
 */
export class ASTModifier {
  private parser: CodeParser;
  private originalCode: string;
  private tree: Parser.Tree | null = null;
  private modifications: Modification[] = [];
  private imports: Map<string, ImportSpec> = new Map();
  private options: Required<ASTModifierOptions>;
  private modificationCounter = 0;

  constructor(code: string, options: ASTModifierOptions = {}) {
    this.originalCode = code;
    this.parser = new CodeParser('typescript');
    this.options = {
      preserveFormatting: true,
      validateAfter: true,
      indentation: '  ',
      ...options
    };
  }

  /**
   * Initialize the modifier by parsing the code
   */
  async initialize(): Promise<void> {
    this.tree = await this.parser.parse(this.originalCode);
    if (!this.tree) {
      throw new Error('Failed to parse code');
    }
    
    // Extract existing imports
    this.extractExistingImports();
  }

  /**
   * Extract existing imports from the code
   */
  private extractExistingImports(): void {
    if (!this.tree) return;
    
    const importNodes = this.parser.findImports(this.tree);
    for (const importNode of importNodes) {
      const importInfo = this.parser.getImportInfo(importNode);
      if (importInfo) {
        // Build ImportSpec from existing import
        const spec: ImportSpec = {
          source: importInfo.source
        };
        
        for (const imp of importInfo.imports) {
          if (imp.isDefault) {
            spec.defaultImport = imp.name;
          } else if (imp.isNamespace) {
            spec.namespaceImport = imp.alias || imp.name;
          } else {
            if (!spec.namedImports) spec.namedImports = [];
            spec.namedImports.push(imp.alias ? `${imp.name} as ${imp.alias}` : imp.name);
          }
        }
        
        this.imports.set(importInfo.source, spec);
      }
    }
  }

  /**
   * Add an import (deduplicated)
   */
  addImport(spec: ImportSpec): this {
    const existing = this.imports.get(spec.source);
    
    if (existing) {
      // Merge with existing import
      if (spec.defaultImport && !existing.defaultImport) {
        existing.defaultImport = spec.defaultImport;
      }
      if (spec.namespaceImport && !existing.namespaceImport) {
        existing.namespaceImport = spec.namespaceImport;
      }
      if (spec.namedImports) {
        if (!existing.namedImports) {
          existing.namedImports = [];
        }
        // Add new named imports, avoiding duplicates
        for (const namedImport of spec.namedImports) {
          if (!existing.namedImports.includes(namedImport)) {
            existing.namedImports.push(namedImport);
          }
        }
      }
      
      // Will update existing import
      this.scheduleImportUpdate(spec.source);
    } else {
      // New import - add at the top
      this.imports.set(spec.source, spec);
      this.scheduleImportInsertion(spec);
    }
    
    return this;
  }

  /**
   * Schedule insertion of a new import
   */
  private scheduleImportInsertion(spec: ImportSpec): void {
    if (!this.tree) return;
    
    const importCode = this.generateImportCode(spec);
    
    // Find insertion point (after existing imports or at start)
    const existingImports = this.parser.findImports(this.tree);
    let insertPosition = 0;
    
    if (existingImports.length > 0) {
      // Insert after last import
      const lastImport = existingImports[existingImports.length - 1];
      insertPosition = lastImport.endIndex;
      
      // Add newline if not present
      if (this.originalCode[insertPosition] !== '\n') {
        insertPosition++;
      }
    }
    
    this.modifications.push({
      type: 'insert',
      start: insertPosition,
      end: insertPosition,
      newCode: importCode + '\n',
      priority: 1000, // High priority for imports
      description: `Add import from ${spec.source}`
    });
  }

  /**
   * Schedule update of an existing import
   */
  private scheduleImportUpdate(source: string): void {
    if (!this.tree) return;
    
    const importNodes = this.parser.findImports(this.tree);
    for (const importNode of importNodes) {
      const info = this.parser.getImportInfo(importNode);
      if (info && info.source === source) {
        const spec = this.imports.get(source);
        if (spec) {
          const newImportCode = this.generateImportCode(spec);
          
          this.modifications.push({
            type: 'replace',
            start: importNode.startIndex,
            end: importNode.endIndex,
            newCode: newImportCode,
            priority: 1000,
            description: `Update import from ${source}`
          });
        }
        break;
      }
    }
  }

  /**
   * Generate import code from spec
   */
  private generateImportCode(spec: ImportSpec): string {
    const parts: string[] = [];
    
    if (spec.defaultImport) {
      parts.push(spec.defaultImport);
    }
    
    if (spec.namespaceImport) {
      parts.push(`* as ${spec.namespaceImport}`);
    }
    
    if (spec.namedImports && spec.namedImports.length > 0) {
      parts.push(`{ ${spec.namedImports.join(', ')} }`);
    }
    
    const importClause = parts.join(', ');
    return `import ${importClause} from '${spec.source}';`;
  }

  /**
   * Wrap a JSX element in another component
   */
  wrapElement(elementNode: Parser.SyntaxNode, wrapper: WrapperSpec): this {
    if (!this.tree) return this;
    
    // Add import if specified
    if (wrapper.import) {
      this.addImport(wrapper.import);
    }
    
    // Generate wrapper opening and closing
    const propsStr = wrapper.props 
      ? ' ' + Object.entries(wrapper.props)
          .map(([key, value]) => `${key}={${value}}`)
          .join(' ')
      : '';
    
    const opening = `<${wrapper.component}${propsStr}>`;
    const closing = `</${wrapper.component}>`;
    
    // Get indentation of the element
    const elementLine = this.originalCode.substring(0, elementNode.startIndex).split('\n').pop() || '';
    const indentation = elementLine.match(/^\s*/)?.[0] || '';
    
    // Insert opening before element
    this.modifications.push({
      type: 'insert',
      start: elementNode.startIndex,
      end: elementNode.startIndex,
      newCode: opening + '\n' + indentation + this.options.indentation,
      priority: 500,
      description: `Wrap element in ${wrapper.component} (opening)`
    });
    
    // Insert closing after element
    this.modifications.push({
      type: 'insert',
      start: elementNode.endIndex,
      end: elementNode.endIndex,
      newCode: '\n' + indentation + closing,
      priority: 500,
      description: `Wrap element in ${wrapper.component} (closing)`
    });
    
    return this;
  }

  /**
   * Add a state variable (useState)
   */
  addStateVariable(spec: StateVariableSpec): this {
    if (!this.tree) return this;
    
    // Ensure useState is imported
    this.addImport({
      source: 'react',
      namedImports: ['useState']
    });
    
    // Find the function body to insert into
    const functionNode = this.parser.findDefaultExportedFunction(this.tree);
    if (!functionNode) {
      console.warn('Could not find function to add state variable to');
      return this;
    }
    
    // Find the function body
    let bodyNode = functionNode.childForFieldName('body');
    if (!bodyNode) {
      // Try to find statement_block child
      for (const child of functionNode.children) {
        if (child.type === 'statement_block') {
          bodyNode = child;
          break;
        }
      }
    }
    
    if (!bodyNode) {
      console.warn('Could not find function body');
      return this;
    }
    
    // Find insertion point (after opening brace, before first statement)
    const openBrace = bodyNode.children.find(c => c.type === '{');
    if (!openBrace) return this;
    
    const insertPosition = openBrace.endIndex;
    
    // Generate state variable code
    const stateCode = `\n${this.options.indentation}const [${spec.name}, ${spec.setter}] = useState(${spec.initialValue});`;
    
    this.modifications.push({
      type: 'insert',
      start: insertPosition,
      end: insertPosition,
      newCode: stateCode,
      priority: 800,
      description: `Add state variable ${spec.name}`
    });
    
    return this;
  }

  /**
   * Get position info for a node
   */
  getNodePosition(node: Parser.SyntaxNode): NodePosition {
    return {
      start: node.startIndex,
      end: node.endIndex,
      line: node.startPosition.row + 1,
      column: node.startPosition.column + 1
    };
  }

  /**
   * Apply all modifications and generate new code
   */
  async generate(): Promise<ModificationResult> {
    try {
      // Sort modifications by position (reverse order so positions stay valid)
      const sortedMods = [...this.modifications].sort((a, b) => {
        // First by priority (higher first)
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        // Then by position (later first, so we can apply without position shifts)
        return b.start - a.start;
      });
      
      // Apply modifications
      let modifiedCode = this.originalCode;
      for (const mod of sortedMods) {
        modifiedCode = this.applyModification(modifiedCode, mod);
      }
      
      // Validate if requested
      if (this.options.validateAfter) {
        const validationResult = await this.validate(modifiedCode);
        if (!validationResult.success) {
          return validationResult;
        }
      }
      
      return {
        success: true,
        code: modifiedCode
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Apply a single modification to code
   */
  private applyModification(code: string, mod: Modification): string {
    switch (mod.type) {
      case 'insert':
        return code.substring(0, mod.start) + mod.newCode + code.substring(mod.start);
      
      case 'replace':
        return code.substring(0, mod.start) + mod.newCode + code.substring(mod.end);
      
      case 'delete':
        return code.substring(0, mod.start) + code.substring(mod.end);
      
      default:
        return code;
    }
  }

  /**
   * Validate the modified code
   */
  private async validate(code: string): Promise<ModificationResult> {
    try {
      const tree = await this.parser.parse(code);
      
      if (!tree) {
        return {
          success: false,
          errors: ['Failed to parse modified code']
        };
      }
      
      if (this.parser.hasErrors(tree)) {
        const errors = this.parser.getErrors(tree);
        return {
          success: false,
          errors: errors.map(e => `Syntax error at ${e.line}:${e.column}: ${e.text}`)
        };
      }
      
      return {
        success: true,
        code
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Validation error']
      };
    }
  }

  /**
   * Get the current tree (useful for finding elements)
   */
  getTree(): Parser.Tree | null {
    return this.tree;
  }

  /**
   * Get the parser (useful for finding elements)
   */
  getParser(): CodeParser {
    return this.parser;
  }

  /**
   * Reset all modifications
   */
  reset(): void {
    this.modifications = [];
    this.imports.clear();
    this.extractExistingImports();
  }
}

/**
 * Convenience function to modify code
 */
export async function modifyCode(
  code: string,
  modifications: (modifier: ASTModifier) => void | Promise<void>,
  options?: ASTModifierOptions
): Promise<ModificationResult> {
  const modifier = new ASTModifier(code, options);
  await modifier.initialize();
  await modifications(modifier);
  return await modifier.generate();
}
