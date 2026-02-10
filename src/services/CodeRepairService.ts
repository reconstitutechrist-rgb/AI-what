/**
 * Code Repair Service
 *
 * AI-powered service that takes broken code + error messages and returns
 * fixed code. Uses Gemini Pro with code-only system instruction to
 * generate minimal, targeted fixes.
 * 
 * V2: Tiered Repair Strategy (Surgical -> Import Fix -> Rebuild)
 *
 * Called by the validation pipeline when WebContainer detects errors
 * in generated code. Operates server-side via the /api/layout/repair route.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { withGeminiRetry } from '@/utils/geminiRetry';
import { extractCode } from '@/utils/extractCode';
import type { AppFile } from '@/types/railway';
import type { SandboxError, RepairRequest, RepairResult } from '@/types/sandbox';

// ============================================================================
// CONFIGURATION
// ============================================================================

const REPAIR_MODEL = 'gemini-1.5-pro-latest';

/** Maximum number of repair attempts before giving up */
const MAX_REPAIR_ATTEMPTS = 5;

const REPAIR_SYSTEM_INSTRUCTION =
  'You are a code repair specialist. You receive broken TypeScript/React code ' +
  'along with specific error messages. Your ONLY job is to fix the errors ' +
  'while preserving as much of the original code as possible. ' +
  '\n\nCommon React Three Fiber / 3D errors:\n' +
  '- Missing imports: Add @react-three/fiber, @react-three/drei, @react-three/rapier as needed\n' +
  '- THREE namespace: Import * as THREE from "three" for THREE.Mesh, THREE.Vector3, etc.\n' +
  '- Physics errors: Wrap physics objects in <Physics> component, RigidBody must have mesh children\n' +
  '- useGLTF errors: Import from @react-three/drei, use useGLTF.preload for static URLs\n' +
  '- PointerLockControls: Import from @react-three/drei, must be inside <Canvas> but outside <Physics>\n' +
  '\nOutput ONLY the complete, fixed code file. No explanations, no markdown fences.';

function getApiKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Gemini API key missing');
  return key;
}

// ============================================================================
// ERROR FORMATTING
// ============================================================================

/**
 * Format sandbox errors into a human-readable string for the AI prompt.
 */
function formatErrors(errors: SandboxError[]): string {
  return errors
    .map((e, i) => {
      const location = e.file
        ? `${e.file}${e.line ? `:${e.line}` : ''}${e.column ? `:${e.column}` : ''}`
        : 'unknown location';
      return `${i + 1}. [${e.type}] ${e.message} (at ${location})`;
    })
    .join('\n');
}

/**
 * Build the repair prompt for a single-file fix.
 */
function buildRepairPrompt(
  code: string,
  filePath: string,
  errors: SandboxError[],
  attempt: number,
  originalInstructions?: string
): string {
  const intentSection = originalInstructions
    ? `\n### Original User Intent\n"${originalInstructions.slice(0, 500)}"\nKeep the repaired code aligned with this intent.\n`
    : '';

  return `### Code File: ${filePath}
\`\`\`tsx
${code}
\`\`\`

### Errors to Fix
${formatErrors(errors)}

### Repair Attempt: ${attempt}
${attempt > 1 ? 'The previous repair attempt did not fully resolve the issues. Try a different approach.' : ''}
${intentSection}
### Instructions
1. Fix ALL listed errors
2. Keep the original code structure and functionality intact
3. If an import cannot be resolved, either:
   a. Replace with an alternative package that provides similar functionality
   b. Implement the missing functionality inline
4. Do NOT add new features or change the design
5. Output the COMPLETE fixed file (not just the changed parts)`;
}

// ============================================================================
// SERVICE
// ============================================================================

class CodeRepairServiceInstance {
  private genAI: GoogleGenerativeAI | null = null;

  private getGenAI(): GoogleGenerativeAI {
    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(getApiKey());
    }
    return this.genAI;
  }

  /**
   * Attempt to repair code files based on validation errors.
   *
   * Strategies:
   * 1. REBUILD: If error count > 20 or critical syntax failures -> full rewrite
   * 2. IMPORT_FIX: If mostly import errors -> fix package.json/imports
   * 3. SURGICAL: Standard precise repair for small issues
   */
  async repair(request: RepairRequest): Promise<RepairResult> {
    const { files, errors, originalInstructions, attempt } = request;

    if (errors.length === 0) {
      return { attempted: false, files, fixes: [], remainingErrors: [] };
    }

    // Guard against infinite repair loops from buggy clients
    if (attempt > MAX_REPAIR_ATTEMPTS) {
      console.warn(`[CodeRepairService] Max repair attempts (${MAX_REPAIR_ATTEMPTS}) exceeded, giving up`);
      return {
        attempted: false,
        files,
        fixes: [],
        remainingErrors: errors,
      };
    }

    const model = this.getGenAI().getGenerativeModel({
      model: REPAIR_MODEL,
    });

    const fixes: string[] = [];
    const repairedFiles: AppFile[] = [];
    const remainingErrors: SandboxError[] = [];

    // Group errors by file
    const errorsByFile = this.groupErrorsByFile(errors, files);

    for (const file of files) {
      const fileErrors = errorsByFile.get(file.path) || [];

      if (fileErrors.length === 0) {
        // No errors for this file, keep as-is
        repairedFiles.push(file);
        continue;
      }

      try {
        // --- STRATEGY SELECTION ---
        const errorCount = fileErrors.length;
        const hasSyntaxErrors = fileErrors.some(e => e.type === 'syntax');
        const hasImportErrors = fileErrors.some(e => e.type === 'import' || e.message.includes('resolve'));
        
        let strategy: 'REBUILD' | 'IMPORT_FIX' | 'SURGICAL' = 'SURGICAL';
        
        if (errorCount > 20 || (hasSyntaxErrors && errorCount > 10)) {
          strategy = 'REBUILD';
        } else if (hasImportErrors && errorCount > 5) {
          strategy = 'IMPORT_FIX';
        }

        console.log(`[CodeRepair] Fixing ${file.path} with strategy: ${strategy} (${errorCount} errors)`);

        const prompt = this.buildStrategyPrompt(
          strategy, 
          file.content, 
          file.path, 
          fileErrors, 
          attempt, 
          originalInstructions
        );

        // Dynamic system instruction based on strategy (or default)
        // Note: We use one model instance but adjust generationConfig usually.
        // For distinct system instructions we'd need distinct getGenerativeModel calls,
        // but here we just pass everything in the prompt context or rely on a generic system instruction.
        // To keep it simple, we use the prompt to drive behavior heavily.
        
        const result = await withGeminiRetry(() => model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: strategy === 'REBUILD' ? 0.4 : 0.1, // Higher temp for rebuilds to allow creative fixes
            maxOutputTokens: 16384 
          },
        }));
        
        const repairedCode = extractCode(result.response.text());

        const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
        if (repairedCode && repairedCode.length > 20 && normalize(repairedCode) !== normalize(file.content)) {
          repairedFiles.push({ path: file.path, content: repairedCode });
          fixes.push(`Fixed ${file.path} using ${strategy} strategy (${errorCount} errors)`);
        } else {
          // Repair produced empty, identical, or whitespace-only-changed code
          if (repairedCode && normalize(repairedCode) === normalize(file.content)) {
            console.warn(`[CodeRepair] Repair returned unchanged code for ${file.path}`);
          }
          repairedFiles.push(file);
          remainingErrors.push(...fileErrors);
        }
      } catch (error) {
        console.error(`[CodeRepairService] Failed to repair ${file.path}:`, error);
        repairedFiles.push(file);
        remainingErrors.push(...fileErrors);
      }
    }

    return {
      attempted: true,
      files: repairedFiles,
      fixes,
      remainingErrors,
    };
  }

  /**
   * Build specific prompts based on the repair strategy.
   */
  private buildStrategyPrompt(
    strategy: 'REBUILD' | 'IMPORT_FIX' | 'SURGICAL',
    code: string,
    filePath: string,
    errors: SandboxError[],
    attempt: number,
    originalInstructions?: string
  ): string {
    const errorList = formatErrors(errors);
    const intent = originalInstructions ? `\nOriginal Intent: "${originalInstructions.slice(0, 400)}..."` : '';

    if (strategy === 'REBUILD') {
      return `### CRITICAL REPAIR TASK: REBUILD FILE
The file ${filePath} has ${errors.length} errors and is structurally broken.
DO NOT try to patch it line-by-line.
RE-GENERATE the entire file from scratch, fulfilling the Original Intent, but fixing the errors.

### Original Code (Broken)
\`\`\`tsx
${code}
\`\`\`

### Errors
${errorList}

${intent}

### REBUILD INSTRUCTIONS
1. Ignore the broken parts of the original code.
2. Rewrite the component using clean, standard React/TypeScript patterns.
3. Ensure all imports are valid (use lucide-react for icons, framer-motion for animation).
4. If this is a 3D scene, ensure strict adherence to @react-three/fiber rules.
5. Output ONLY the complete, valid code file.`;
    }

    if (strategy === 'IMPORT_FIX') {
        return `### REPAIR TASK: FIX IMPORTS
The file ${filePath} has missing or invalid imports.
Focus ONLY on resolving these import errors.

\`\`\`tsx
${code}
\`\`\`

### Import Errors
${errorList}

### INSTRUCTIONS
1. Check if 'lucide-react', 'framer-motion', or 'three' are missing.
2. If a local import (./components/...) is missing, remove it or mock it.
3. Ensure named exports match what is actually imported.
4. Output the COMPLETE file with fixed imports.`;
    }

    // SURGICAL (Standard)
    return buildRepairPrompt(code, filePath, errors, attempt, originalInstructions);
  }

  /**
   * Group errors by the file they belong to.
   * Errors without a file are assigned to the main App.tsx.
   */
  private groupErrorsByFile(
    errors: SandboxError[],
    files: AppFile[]
  ): Map<string, SandboxError[]> {
    const map = new Map<string, SandboxError[]>();

    // Find the main file path
    const mainFile =
      files.find((f) => f.path.endsWith('App.tsx'))?.path || files[0]?.path || '/src/App.tsx';

    for (const error of errors) {
      const filePath = error.file
        ? this.resolveFilePath(error.file, files)
        : mainFile;

      const existing = map.get(filePath) || [];
      existing.push(error);
      map.set(filePath, existing);
    }

    return map;
  }

  /**
   * Resolve an error's file reference to an actual AppFile path.
   * Error files may be relative or use different path formats.
   */
  private resolveFilePath(errorFile: string, files: AppFile[]): string {
    // Direct match
    const direct = files.find((f) => f.path === errorFile);
    if (direct) return direct.path;

    // Try with /src/ prefix
    const withSrc = files.find((f) => f.path === `/src/${errorFile}`);
    if (withSrc) return withSrc.path;

    // Try matching by filename
    const byName = files.find((f) => f.path.endsWith(`/${errorFile}`));
    if (byName) return byName.path;

    // Fallback to main file
    return files.find((f) => f.path.endsWith('App.tsx'))?.path || files[0]?.path || errorFile;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: CodeRepairServiceInstance | null = null;

export function getCodeRepairService(): CodeRepairServiceInstance {
  if (!_instance) {
    _instance = new CodeRepairServiceInstance();
  }
  return _instance;
}
