/**
 * Code Validator - AST-based validation
 *
 * Uses Tree-sitter for comprehensive syntax validation.
 * Catches ALL syntax errors including template literals, JSX issues, etc.
 *
 * Phase 2 (original): Regex-based validation
 * Phase 6.2+: AST-based validation using Tree-sitter
 */

import { getDefaultParser } from './treeSitterParser';

export interface ValidationError {
  type:
    | 'NESTED_FUNCTION'
    | 'UNBALANCED_JSX'
    | 'TYPESCRIPT_IN_JSX'
    | 'UNCLOSED_STRING'
    | 'SYNTAX_ERROR'
    | 'AST_PARSE_ERROR';
  message: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning';
  fix?: string;
  code?: string;
}

export type ValidationLevel = 'strict' | 'loose' | 'syntax-only';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Detects nested function declarations which are invalid in strict mode (React uses strict mode)
 *
 * INVALID: function App() { function Helper() {} }
 * VALID: const Helper = () => {}  (arrow function inside)
 * VALID: function Helper() {} \n function App() {}  (declared before)
 */
export function hasNestedFunctionDeclarations(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  // Strategy: Track function declaration depth
  // If we're inside a function (depth > 0) and encounter another function declaration, that's an error

  let depth = 0;
  let currentFunction: { name: string; line: number } | null = null;
  const functionStack: Array<{ name: string; line: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Remove strings and comments to avoid false positives
    const cleanedLine = line
      .replace(/"(?:[^"\\]|\\.)*"/g, '""') // Remove double-quoted strings
      .replace(/'(?:[^'\\]|\\.)*'/g, "''") // Remove single-quoted strings
      .replace(/`(?:[^`\\]|\\.)*`/g, '``') // Remove template literals
      .replace(/\/\/.*$/g, '') // Remove line comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments

    // Detect function declarations (not arrow functions, not methods)
    // Pattern: function <name>( or function(<name>)
    const functionDeclMatch = cleanedLine.match(/\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);

    if (functionDeclMatch) {
      const functionName = functionDeclMatch[1];

      // If we're already inside a function, this is a nested function declaration - ERROR!
      if (depth > 0 && currentFunction) {
        errors.push({
          type: 'NESTED_FUNCTION',
          message: `Nested function declaration '${functionName}' inside '${currentFunction.name}' will cause SyntaxError in strict mode`,
          line: lineNum,
          severity: 'error',
          fix: `Move function ${functionName} above the ${currentFunction.name} function, or use an arrow function: const ${functionName} = () => {}`,
          code: line.trim(),
        });
      }

      // Track this function
      functionStack.push({ name: functionName, line: lineNum });
      currentFunction = { name: functionName, line: lineNum };
      depth++;
    }

    // Count opening braces (entering function body)
    const openBraces = (cleanedLine.match(/\{/g) || []).length;
    const closeBraces = (cleanedLine.match(/\}/g) || []).length;

    // Adjust depth
    depth += openBraces - closeBraces;

    // If depth goes back to 0, we've exited all functions
    if (depth <= 0) {
      depth = 0;
      currentFunction = null;
      functionStack.length = 0;
    } else if (closeBraces > 0 && functionStack.length > 0) {
      // Pop functions as we exit their scope
      for (let j = 0; j < closeBraces; j++) {
        functionStack.pop();
      }
      currentFunction = functionStack[functionStack.length - 1] || null;
    }
  }

  return errors;
}

/**
 * Checks for balanced JSX tags
 *
 * INVALID: <div><span></div></span>  (wrong order)
 * INVALID: <div><span></div>  (missing closing tag)
 * VALID: <div><span></span></div>
 */
export function hasBalancedJSXTags(code: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Find all JSX tags (opening, closing, self-closing)
  // This is a simplified check - doesn't handle all JSX edge cases but catches most issues

  const lines = code.split('\n');
  const tagStack: Array<{ tag: string; line: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Remove strings to avoid false matches
    const cleanedLine = line
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/'(?:[^'\\]|\\.)*'/g, "''")
      .replace(/`(?:[^`\\]|\\.)*`/g, '``');

    // Find self-closing tags first and remove them (they're balanced by definition)
    const withoutSelfClosing = cleanedLine.replace(/<([A-Z][a-zA-Z0-9]*)[^>]*\/>/g, '');

    // Find opening tags: <ComponentName
    const openingTags = withoutSelfClosing.match(/<([A-Z][a-zA-Z0-9]*)[^/>]*>/g) || [];
    for (const match of openingTags) {
      const tagName = match.match(/<([A-Z][a-zA-Z0-9]*)/)?.[1];
      if (tagName) {
        tagStack.push({ tag: tagName, line: lineNum });
      }
    }

    // Find closing tags: </ComponentName>
    const closingTags = withoutSelfClosing.match(/<\/([A-Z][a-zA-Z0-9]*)>/g) || [];
    for (const match of closingTags) {
      const tagName = match.match(/<\/([A-Z][a-zA-Z0-9]*)/)?.[1];
      if (tagName) {
        if (tagStack.length === 0) {
          errors.push({
            type: 'UNBALANCED_JSX',
            message: `Closing tag </${tagName}> found without matching opening tag`,
            line: lineNum,
            severity: 'error',
            fix: `Add opening <${tagName}> tag or remove closing </${tagName}> tag`,
            code: line.trim(),
          });
        } else {
          const last = tagStack[tagStack.length - 1];
          if (last.tag !== tagName) {
            errors.push({
              type: 'UNBALANCED_JSX',
              message: `Mismatched JSX tags: expected </${last.tag}> but found </${tagName}>`,
              line: lineNum,
              severity: 'error',
              fix: `Change </${tagName}> to </${last.tag}> or fix tag nesting`,
              code: line.trim(),
            });
          }
          tagStack.pop();
        }
      }
    }
  }

  // Check for unclosed tags
  if (tagStack.length > 0) {
    for (const unclosed of tagStack) {
      errors.push({
        type: 'UNBALANCED_JSX',
        message: `Unclosed JSX tag <${unclosed.tag}> opened at line ${unclosed.line}`,
        line: unclosed.line,
        severity: 'error',
        fix: `Add closing </${unclosed.tag}> tag`,
        code: `<${unclosed.tag}>`,
      });
    }
  }

  return errors;
}

/**
 * Detects TypeScript syntax in plain JSX files
 *
 * Files ending in .jsx should not have TypeScript syntax
 * Files ending in .tsx can have TypeScript syntax
 */
export function hasTypeScriptInJSX(code: string, filePath: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // If file is .tsx, TypeScript is expected - no errors
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    return errors;
  }

  // If file is .jsx or .js, check for TypeScript syntax
  if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) {
    return errors; // Not a JS/JSX file
  }

  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Check for TypeScript-specific syntax

    // 1. interface declarations
    if (/\binterface\s+[A-Z][a-zA-Z0-9]*/.test(line)) {
      errors.push({
        type: 'TYPESCRIPT_IN_JSX',
        message: 'Interface declaration found in plain JSX file',
        line: lineNum,
        severity: 'error',
        fix: 'Remove interface or rename file to .tsx',
        code: line.trim(),
      });
    }

    // 2. type aliases
    if (/\btype\s+[A-Z][a-zA-Z0-9]*\s*=/.test(line)) {
      errors.push({
        type: 'TYPESCRIPT_IN_JSX',
        message: 'Type alias found in plain JSX file',
        line: lineNum,
        severity: 'error',
        fix: 'Remove type alias or rename file to .tsx',
        code: line.trim(),
      });
    }

    // 3. type annotations (: string, : number, etc.) - but avoid false positives with object properties
    // Look for function parameters or variable declarations with type annotations
    if (
      /\(([^)]*:\s*(string|number|boolean|any|void|object)[^)]*)\)/.test(line) ||
      /\b(const|let|var)\s+\w+\s*:\s*(string|number|boolean|any|void|object)/.test(line)
    ) {
      errors.push({
        type: 'TYPESCRIPT_IN_JSX',
        message: 'Type annotation found in plain JSX file',
        line: lineNum,
        severity: 'error',
        fix: 'Remove type annotations or rename file to .tsx',
        code: line.trim(),
      });
    }

    // 4. as assertions
    if (/\bas\s+(string|number|boolean|any|const|unknown)/.test(line)) {
      errors.push({
        type: 'TYPESCRIPT_IN_JSX',
        message: 'TypeScript "as" assertion found in plain JSX file',
        line: lineNum,
        severity: 'error',
        fix: 'Remove type assertion or rename file to .tsx',
        code: line.trim(),
      });
    }

    // 5. Generic type syntax in function declarations
    if (/\bfunction\s+\w+<[A-Z]/.test(line) || /\bconst\s+\w+\s*=\s*<[A-Z]/.test(line)) {
      errors.push({
        type: 'TYPESCRIPT_IN_JSX',
        message: 'Generic type syntax found in plain JSX file',
        line: lineNum,
        severity: 'error',
        fix: 'Remove generic types or rename file to .tsx',
        code: line.trim(),
      });
    }
  }

  return errors;
}

/**
 * Checks for unclosed strings
 */
export function hasUnclosedStrings(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Check for unbalanced quotes on this line
    // Note: This is a simplified check - doesn't handle multi-line strings well

    // Count unescaped double quotes
    let doubleQuotes = 0;
    let singleQuotes = 0;
    let backticks = 0;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const prevChar = j > 0 ? line[j - 1] : '';

      // Skip escaped quotes
      if (prevChar === '\\') continue;

      if (char === '"') doubleQuotes++;
      if (char === "'") singleQuotes++;
      if (char === '`') backticks++;
    }

    // If odd number of quotes, they're unbalanced
    if (doubleQuotes % 2 !== 0) {
      errors.push({
        type: 'UNCLOSED_STRING',
        message: 'Unclosed double-quoted string',
        line: lineNum,
        severity: 'error',
        fix: 'Add closing double quote (") at end of string',
        code: line.trim(),
      });
    }

    if (singleQuotes % 2 !== 0) {
      errors.push({
        type: 'UNCLOSED_STRING',
        message: 'Unclosed single-quoted string',
        line: lineNum,
        severity: 'error',
        fix: "Add closing single quote (') at end of string",
        code: line.trim(),
      });
    }

    if (backticks % 2 !== 0) {
      errors.push({
        type: 'UNCLOSED_STRING',
        message: 'Unclosed template literal',
        line: lineNum,
        severity: 'error',
        fix: 'Add closing backtick (`) at end of template literal',
        code: line.trim(),
      });
    }
  }

  return errors;
}

/**
 * Checks for malformed nested template literals (common AI error)
 *
 * INVALID: className={`... ${`...`} ...`}  (extra backtick inside interpolation)
 * VALID: className={`... ${...} ...`}
 */
export function hasMalformedTemplateLiterals(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Pattern: ${ followed immediately by `
    // This is almost always a mistake in AI generation where it tries to nest interpolation erroneously
    const match = line.match(/\$\{\s*`/);

    if (match) {
      errors.push({
        type: 'SYNTAX_ERROR',
        message: 'Malformed template literal: extra backtick inside interpolation',
        line: lineNum,
        severity: 'error',
        fix: 'Remove the extra backtick inside ${...}',
        code: line.trim(),
      });
    }
  }

  return errors;
}

/**
 * Main validation function - AST-based comprehensive validation
 *
 * Uses Tree-sitter to catch ALL syntax errors including:
 * - Template literal syntax errors
 * - JSX tag mismatches
 * - Unclosed strings, brackets, parentheses
 * - Invalid JavaScript/TypeScript syntax
 * - Everything else
 */
export async function validateGeneratedCode(
  code: string,
  filePath: string = 'src/App.tsx',
  level: ValidationLevel = 'strict'
): Promise<ValidationResult> {
  const allErrors: ValidationError[] = [];

  try {
    // Get Tree-sitter parser
    const parser = getDefaultParser();

    // Parse code into AST
    const tree = await parser.parse(code);

    if (!tree || !tree.rootNode) {
      return {
        valid: false,
        errors: [
          {
            type: 'AST_PARSE_ERROR',
            message: 'Failed to parse code - parser returned null',
            severity: 'error',
            line: 0,
            column: 0,
          },
        ],
      };
    }

    // Check if AST has any syntax errors
    if (parser.hasErrors(tree)) {
      const astErrors = parser.getErrors(tree);

      // Convert AST errors to ValidationErrors
      for (const error of astErrors) {
        allErrors.push({
          type: 'SYNTAX_ERROR',
          message: `Syntax error detected: ${error.nodeType}`,
          line: error.line,
          column: error.column,
          severity: 'error',
          code: error.text,
          fix: 'Review syntax at this location - likely missing bracket, quote, or invalid syntax',
        });
      }
    }

    // If syntax-only, return early
    if (level === 'syntax-only') {
      return {
        valid: allErrors.length === 0,
        errors: allErrors,
      };
    }

    // Still run semantic validators for additional checks
    // These catch logical issues that AST doesn't flag
    allErrors.push(...hasNestedFunctionDeclarations(code));

    // Loose validation stops here (skips strict type usage checks in JS/JSX)
    if (level === 'loose') {
      return {
        valid: allErrors.filter((e) => e.severity === 'error').length === 0,
        errors: allErrors,
      };
    }

    // Strict validation continues...
    if (level === 'strict') {
      // Legacy validators for specific patterns not fully covered by basic AST checks
      allErrors.push(...hasBalancedJSXTags(code));
      allErrors.push(...hasTypeScriptInJSX(code, filePath));
      allErrors.push(...hasUnclosedStrings(code));
      allErrors.push(...hasMalformedTemplateLiterals(code));
    }
  } catch (error) {
    // Fallback if Tree-sitter fails
    console.error('AST validation failed, falling back to regex validation:', error);

    // Run legacy validators as fallback
    allErrors.push(...hasNestedFunctionDeclarations(code));
    allErrors.push(...hasBalancedJSXTags(code));
    allErrors.push(...hasTypeScriptInJSX(code, filePath));
    allErrors.push(...hasUnclosedStrings(code));
    allErrors.push(...hasMalformedTemplateLiterals(code));
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Synchronous version for backward compatibility
 * Note: Less reliable as it can't use async parser initialization
 */
export function validateGeneratedCodeSync(
  code: string,
  filePath: string = 'src/App.tsx'
): ValidationResult {
  const allErrors: ValidationError[] = [];

  try {
    const parser = getDefaultParser();

    // Check if parser is initialized
    if (!parser.isInitialized()) {
      console.warn('Parser not initialized, using fallback validation');
      throw new Error('Parser not initialized');
    }

    const tree = parser.parseSync(code);

    if (!tree || !tree.rootNode) {
      return {
        valid: false,
        errors: [
          {
            type: 'AST_PARSE_ERROR',
            message: 'Failed to parse code',
            severity: 'error',
          },
        ],
      };
    }

    if (parser.hasErrors(tree)) {
      const astErrors = parser.getErrors(tree);

      for (const error of astErrors) {
        allErrors.push({
          type: 'SYNTAX_ERROR',
          message: `Syntax error: ${error.nodeType}`,
          line: error.line,
          column: error.column,
          severity: 'error',
          code: error.text,
        });
      }
    }

    allErrors.push(...hasNestedFunctionDeclarations(code));
  } catch {
    // Fallback to legacy validators
    allErrors.push(...hasNestedFunctionDeclarations(code));
    allErrors.push(...hasBalancedJSXTags(code));
    allErrors.push(...hasTypeScriptInJSX(code, filePath));
    allErrors.push(...hasUnclosedStrings(code));
    allErrors.push(...hasMalformedTemplateLiterals(code));
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Attempts to automatically fix common issues
 */
export function autoFixCode(code: string, errors: ValidationError[]): string {
  let fixedCode = code;

  // Sort errors by line number (descending) to avoid index shifting
  const sortedErrors = [...errors].sort((a, b) => (b.line || 0) - (a.line || 0));

  for (const error of sortedErrors) {
    switch (error.type) {
      case 'UNCLOSED_STRING':
        // Auto-fix: Add closing quote at end of line
        if (error.line) {
          const lines = fixedCode.split('\n');
          const lineIndex = error.line - 1;
          if (lineIndex >= 0 && lineIndex < lines.length) {
            const line = lines[lineIndex];

            // Determine which quote type to add
            if (error.message.includes('double')) {
              lines[lineIndex] = line.trimEnd() + '"';
            } else if (error.message.includes('single')) {
              lines[lineIndex] = line.trimEnd() + "'";
            } else if (error.message.includes('template')) {
              lines[lineIndex] = line.trimEnd() + '`';
            }

            fixedCode = lines.join('\n');
          }
        }
        break;

      case 'NESTED_FUNCTION':
        // This is complex to auto-fix - would need to move entire function
        // For now, just log that manual fix is needed
        console.warn(`Manual fix needed for nested function at line ${error.line}`);
        break;

      case 'UNBALANCED_JSX':
        // Complex to auto-fix - would need to understand JSX structure
        console.warn(`Manual fix needed for unbalanced JSX at line ${error.line}`);
        break;

      case 'TYPESCRIPT_IN_JSX':
        // Could potentially strip TypeScript syntax, but risky
        // Better to let AI regenerate without TypeScript
        console.warn(`Manual fix needed for TypeScript syntax at line ${error.line}`);
        break;
    }
  }

  return fixedCode;
}

/**
 * Fix 9: Validate backend structural integrity
 * Checks validation of Prisma schema, API routes, and Auth config
 */
export interface BackendValidationError {
  type: 'PRISMA_SCHEMA' | 'API_ROUTE' | 'AUTH_CONFIG' | 'ENV_VAR';
  message: string;
  severity: 'critical' | 'warning';
}

export function validateBackendIntegrity(
  files: Map<string, string>,
  requirements: { needsAuth: boolean; needsDatabase: boolean }
): BackendValidationError[] {
  const errors: BackendValidationError[] = [];

  // 1. Prisma Schema Validation
  if (requirements.needsDatabase) {
    const prismaSchema = Array.from(files.entries()).find(([path]) =>
      path.endsWith('schema.prisma')
    );
    if (!prismaSchema) {
      errors.push({
        type: 'PRISMA_SCHEMA',
        message: 'Missing prisma/schema.prisma file',
        severity: 'critical',
      });
    } else {
      const content = prismaSchema[1];
      if (!content.includes('generator client')) {
        errors.push({
          type: 'PRISMA_SCHEMA',
          message: 'Prisma schema missing generator client',
          severity: 'critical',
        });
      }
      if (!content.includes('datasource db')) {
        errors.push({
          type: 'PRISMA_SCHEMA',
          message: 'Prisma schema missing datasource configuration',
          severity: 'critical',
        });
      }
    }
  }

  // 2. Auth Configuration Validation
  if (requirements.needsAuth) {
    const authOptions = Array.from(files.keys()).some(
      (path) => path.includes('auth.ts') || path.includes('route.ts')
    );
    if (!authOptions) {
      errors.push({
        type: 'AUTH_CONFIG',
        message: 'Missing NextAuth configuration (auth.ts or route.ts)',
        severity: 'critical',
      });
    }

    const envFile = files.get('.env') || files.get('.env.local');
    if (!envFile || !envFile.includes('NEXTAUTH_SECRET')) {
      errors.push({
        type: 'ENV_VAR',
        message: 'Missing NEXTAUTH_SECRET in environment variables',
        severity: 'critical',
      });
    }
  }

  return errors;
}
