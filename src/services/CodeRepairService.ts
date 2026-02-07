/**
 * Code Repair Service
 *
 * AI-powered service that takes broken code + error messages and returns
 * fixed code. Uses Gemini Pro with code-only system instruction to
 * generate minimal, targeted fixes.
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

const REPAIR_MODEL = 'gemini-3-pro-preview';

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
   * Currently handles single-file repairs (App.tsx).
   * For multi-file projects, repairs each file that has errors.
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
      systemInstruction: REPAIR_SYSTEM_INSTRUCTION,
      generationConfig: { temperature: 0.1, maxOutputTokens: 16384 },
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
        const prompt = buildRepairPrompt(file.content, file.path, fileErrors, attempt, originalInstructions);
        const result = await withGeminiRetry(() => model.generateContent(prompt));
        const repairedCode = extractCode(result.response.text());

        const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
        if (repairedCode && repairedCode.length > 10 && normalize(repairedCode) !== normalize(file.content)) {
          repairedFiles.push({ path: file.path, content: repairedCode });
          fixes.push(`Attempted repair of ${fileErrors.length} error(s) in ${file.path} (unverified)`);
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
