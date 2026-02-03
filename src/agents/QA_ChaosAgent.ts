/**
 * QA Chaos Agent
 *
 * The "Chaos Monkey" — generates and executes integration tests to find bugs
 * in loaded codebases. Used by Dream Mode's MaintenanceCampaign to stress-test
 * apps before and after patches.
 *
 * CRITICAL CONSTRAINT: WebContainers cannot run Puppeteer/Playwright because
 * they cannot launch a browser binary inside a browser.
 *
 * Dual-Strategy Approach:
 *
 * Strategy A — Vitest + happy-dom (Primary):
 *   Generates vitest test files that run in Node.js inside the WebContainer.
 *   Uses happy-dom for DOM simulation. No real browser needed.
 *
 * Strategy B — Iframe Injection (Secondary):
 *   Injects vanilla JS test scripts into the LayoutCanvas iframe via postMessage.
 *   Tests run against the real rendered DOM for CSS/interaction bugs.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { withGeminiRetry } from '@/utils/geminiRetry';
import type { AppFile } from '@/types/railway';
import type {
  ChaosProfile,
  CrashReport,
  CrashEntry,
  InteractableElement,
  InteractableType,
} from '@/types/dream';

// ============================================================================
// CONFIGURATION
// ============================================================================

const TEST_GEN_MODEL = 'gemini-3-flash-preview';

/** Vitest config template written into the WebContainer */
const VITEST_CONFIG = `
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    reporters: ['json'],
    outputFile: './test-results.json',
  },
});
`;

function getApiKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Gemini API key missing');
  return key;
}

// ============================================================================
// UI ANALYSIS (Static — no AI needed)
// ============================================================================

/** Regex patterns for finding interactive React elements */
const ELEMENT_PATTERNS: { type: InteractableType; pattern: RegExp }[] = [
  { type: 'button', pattern: /<button\b[^>]*>|<Button\b[^>]*/g },
  { type: 'input', pattern: /<input\b[^>]*/g },
  { type: 'textarea', pattern: /<textarea\b[^>]*/g },
  { type: 'select', pattern: /<select\b[^>]*/g },
  { type: 'form', pattern: /<form\b[^>]*/g },
  { type: 'link', pattern: /<a\b[^>]*href/g },
  { type: 'checkbox', pattern: /type=["']checkbox["']/g },
  { type: 'radio', pattern: /type=["']radio["']/g },
];

/** Regex for extracting handler names */
const HANDLER_PATTERN = /on(Click|Submit|Change|Focus|Blur|KeyDown|KeyUp|MouseEnter|MouseLeave)=\{/g;

/** Regex for extracting identifiers (id, data-testid, aria-label) */
const ID_PATTERNS = [
  /id=["']([^"']+)["']/,
  /data-testid=["']([^"']+)["']/,
  /aria-label=["']([^"']+)["']/,
  /name=["']([^"']+)["']/,
  /placeholder=["']([^"']+)["']/,
];

// ============================================================================
// SERVICE
// ============================================================================

class QA_ChaosAgentInstance {
  /**
   * Analyze React code to find all interactive UI elements.
   * Uses static regex analysis — no AI calls needed.
   */
  analyzeUI(files: AppFile[]): InteractableElement[] {
    const elements: InteractableElement[] = [];

    for (const file of files) {
      if (!file.path.endsWith('.tsx') && !file.path.endsWith('.jsx')) continue;

      const lines = file.content.split('\n');

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];

        for (const { type, pattern } of ELEMENT_PATTERNS) {
          pattern.lastIndex = 0;
          if (pattern.test(line)) {
            // Extract a broader context (current line + next 2 lines for multi-line elements)
            const context = lines.slice(lineIdx, lineIdx + 3).join(' ');

            // Find selector/label
            let selector = '';
            let label = '';
            for (const idPattern of ID_PATTERNS) {
              const match = context.match(idPattern);
              if (match) {
                selector = match[1];
                label = match[1];
                break;
              }
            }

            // Extract button text content
            if (type === 'button' && !label) {
              const textMatch = context.match(/>([^<]+)</);
              if (textMatch) label = textMatch[1].trim();
            }

            // Find handlers
            const handlers: string[] = [];
            HANDLER_PATTERN.lastIndex = 0;
            let handlerMatch;
            while ((handlerMatch = HANDLER_PATTERN.exec(context)) !== null) {
              handlers.push(`on${handlerMatch[1]}`);
            }

            if (selector || handlers.length > 0 || label) {
              elements.push({
                type,
                selector: selector || `${type}[${lineIdx}]`,
                label: label || `${type} at line ${lineIdx + 1}`,
                file: file.path,
                line: lineIdx + 1,
                handlers,
              });
            }
          }
        }
      }
    }

    return elements;
  }

  /**
   * Generate a vitest test suite for the given interactive elements.
   * Uses Gemini to create intelligent, targeted tests.
   *
   * Strategy A: Runs in WebContainer via vitest + happy-dom.
   */
  async generateTestSuite(
    elements: InteractableElement[],
    files: AppFile[],
    profile: ChaosProfile
  ): Promise<string> {
    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: TEST_GEN_MODEL,
      generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
    });

    // Build element summary for the prompt
    const elementSummary = elements.slice(0, 30).map((el) =>
      `- ${el.type} "${el.label}" in ${el.file}:${el.line} [handlers: ${el.handlers.join(', ') || 'none'}]`
    ).join('\n');

    // Find the main App file content for context
    const appFile = files.find((f) => f.path.endsWith('App.tsx') || f.path.endsWith('App.jsx'));
    const appCode = appFile ? appFile.content.slice(0, 3000) : 'No App.tsx found';

    const prompt = `You are a QA Chaos Monkey. Generate a vitest test suite that aggressively tries to BREAK this React application.

## App Code (truncated)
\`\`\`tsx
${appCode}
\`\`\`

## Interactive Elements Found
${elementSummary}

## Test Requirements
- Use vitest globals (test, expect, describe) — no imports needed for these
- Import { render, fireEvent, screen } from '@testing-library/react'
- Import App from './src/App' (or the correct path)
- Each test should try to CRASH the app, not just verify it works
- Test categories to cover:
  1. Rapid-fire clicking (10+ clicks on same button)
  2. Empty form submissions
  3. Overflow text in inputs (100,000+ chars)
  4. Special characters and XSS attempts in inputs
  5. Rapid state changes (toggle on/off 20 times)
  6. Missing data scenarios (undefined props)
  7. Double-submit prevention
- Action delay between interactions: ${profile.actionDelay}ms
- Generate ${Math.min(elements.length * 2, 15)} tests maximum
- Wrap each test body in try/catch to capture errors without stopping the suite

## Output Format
Output ONLY the complete test file. No markdown fences, no explanations.
The file should start with import statements and contain describe/test blocks.`;

    const result = await withGeminiRetry(() => model.generateContent(prompt));
    let testCode = result.response.text();

    // Clean any markdown fences if present
    testCode = testCode
      .replace(/^```(?:typescript|tsx|ts|javascript|js)?\n?/gm, '')
      .replace(/```$/gm, '')
      .trim();

    return testCode;
  }

  /**
   * Generate a test specifically for a newly built feature.
   * Used after a DreamGoal is completed to verify it works.
   */
  async generateTestForFeature(
    goalPrompt: string,
    files: AppFile[]
  ): Promise<string> {
    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: TEST_GEN_MODEL,
      generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
    });

    const appFile = files.find((f) => f.path.endsWith('App.tsx') || f.path.endsWith('App.jsx'));
    const appCode = appFile ? appFile.content.slice(0, 4000) : '';

    const prompt = `Generate a vitest integration test that verifies this feature works correctly.

## Feature Description
"${goalPrompt}"

## App Code
\`\`\`tsx
${appCode}
\`\`\`

## Requirements
- Use vitest globals + @testing-library/react
- Test that the feature is present and functional
- Test basic interactions (click, input, submit)
- Test that it doesn't crash with edge case inputs
- Generate 3-5 focused tests

Output ONLY the test file code. No markdown, no explanations.`;

    const result = await withGeminiRetry(() => model.generateContent(prompt));
    let testCode = result.response.text();
    testCode = testCode
      .replace(/^```(?:typescript|tsx|ts|javascript|js)?\n?/gm, '')
      .replace(/```$/gm, '')
      .trim();

    return testCode;
  }

  /**
   * Generate a vanilla JS script for iframe injection testing.
   * Strategy B: Runs in the real browser DOM via LayoutCanvas iframe.
   */
  async generateIframeScript(
    elements: InteractableElement[],
    profile: ChaosProfile
  ): Promise<string> {
    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: TEST_GEN_MODEL,
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
    });

    const elementSummary = elements.slice(0, 20).map((el) =>
      `- ${el.type} "${el.label}" selector="${el.selector}"`
    ).join('\n');

    const prompt = `Generate a vanilla JavaScript script that stress-tests a web page by interacting with its DOM elements.

## Available Elements
${elementSummary}

## Requirements
- The script runs INSIDE an iframe, injected via eval()
- Use document.querySelector / querySelectorAll to find elements
- Simulate: clicks, input typing, form submits, rapid interactions
- Delay ${profile.actionDelay}ms between actions using setTimeout chains
- Capture ALL errors via window.onerror and unhandled promise rejections
- When done, post results back to parent: window.parent.postMessage({ type: 'chaos-results', errors: [...], completed: true }, '*')
- Each error should include: { message, source, line, stack }
- The script should be self-contained (no imports)
- Run for approximately ${Math.min(profile.sessionDuration, 60)} seconds

Output ONLY the JavaScript code. No markdown, no explanations.`;

    const result = await withGeminiRetry(() => model.generateContent(prompt));
    let script = result.response.text();
    script = script
      .replace(/^```(?:javascript|js)?\n?/gm, '')
      .replace(/```$/gm, '')
      .trim();

    return script;
  }

  /**
   * Run vitest tests inside a WebContainer and parse results.
   * Strategy A execution.
   */
  async runTests(
    executeShell: (cmd: string, args: string[], timeout?: number) => Promise<{ output: string; exitCode: number }>,
    testCode: string,
    options: { delay: number; writeFile?: (path: string, content: string) => Promise<void> }
  ): Promise<CrashReport> {
    const startTime = Date.now();
    const reportId = `chaos_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      // 1. Install test dependencies (if not already installed)
      await executeShell('npm', [
        'install', '-D',
        'vitest', 'happy-dom', '@testing-library/react', '@testing-library/jest-dom',
      ], 60000);

      if (options.writeFile) {
        // Use filesystem API (safe — no heredoc injection risk)
        await options.writeFile('/vitest.config.ts', VITEST_CONFIG.trim());
        await options.writeFile('/__tests__/chaos.test.tsx', testCode);
      } else {
        // Fallback: use shell with base64 encoding to avoid heredoc issues
        const configB64 = btoa(VITEST_CONFIG.trim());
        await executeShell('sh', ['-c', `echo "${configB64}" | base64 -d > vitest.config.ts`], 5000);

        const testB64 = btoa(unescape(encodeURIComponent(testCode)));
        await executeShell('sh', ['-c', `mkdir -p __tests__ && echo "${testB64}" | base64 -d > __tests__/chaos.test.tsx`], 5000);
      }

      // 4. Run vitest with JSON reporter
      const { output, exitCode } = await executeShell(
        'npx',
        ['vitest', 'run', '--reporter=json'],
        options.delay * 100 + 60000 // Generous timeout
      );

      // 5. Parse results
      return this.parseVitestOutput(output, exitCode, reportId, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        id: reportId,
        crashes: [{
          error: `Chaos test execution failed: ${message}`,
          stepsToReproduce: ['Test framework setup failed'],
          severity: 'high',
        }],
        timestamp: startTime,
        duration: Date.now() - startTime,
        strategy: 'vitest',
        testsRun: 0,
        testsPassed: 0,
      };
    }
  }

  /**
   * Run tests by injecting a script into an iframe.
   * Strategy B execution.
   *
   * @param iframe - The LayoutCanvas iframe element
   * @param script - The vanilla JS test script to inject
   * @returns CrashReport with any errors found
   */
  runIframeTests(
    iframe: HTMLIFrameElement,
    script: string
  ): Promise<CrashReport> {
    const startTime = Date.now();
    const reportId = `iframe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return new Promise((resolve) => {
      const errors: CrashEntry[] = [];
      const timeout = setTimeout(() => {
        cleanup();
        resolve({
          id: reportId,
          crashes: errors,
          timestamp: startTime,
          duration: Date.now() - startTime,
          strategy: 'iframe',
          testsRun: 1,
          testsPassed: errors.length === 0 ? 1 : 0,
        });
      }, 120000); // 2-minute max

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type !== 'chaos-results') return;

        if (event.data.errors) {
          for (const err of event.data.errors) {
            errors.push({
              error: err.message || 'Unknown iframe error',
              stackTrace: err.stack,
              stepsToReproduce: [`Iframe interaction at ${err.source || 'unknown'}:${err.line || '?'}`],
              severity: 'medium',
            });
          }
        }

        if (event.data.completed) {
          cleanup();
          resolve({
            id: reportId,
            crashes: errors,
            timestamp: startTime,
            duration: Date.now() - startTime,
            strategy: 'iframe',
            testsRun: 1,
            testsPassed: errors.length === 0 ? 1 : 0,
          });
        }
      };

      const cleanup = () => {
        clearTimeout(timeout);
        window.removeEventListener('message', handleMessage);
      };

      window.addEventListener('message', handleMessage);

      // Inject the script into the iframe
      try {
        const iframeWindow = iframe.contentWindow;
        if (iframeWindow) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (iframeWindow as any).eval(script);
        } else {
          cleanup();
          resolve({
            id: reportId,
            crashes: [{
              error: 'Cannot access iframe contentWindow',
              stepsToReproduce: ['Iframe not accessible'],
              severity: 'high',
            }],
            timestamp: startTime,
            duration: Date.now() - startTime,
            strategy: 'iframe',
            testsRun: 0,
            testsPassed: 0,
          });
        }
      } catch (err) {
        cleanup();
        resolve({
          id: reportId,
          crashes: [{
            error: `Script injection failed: ${err instanceof Error ? err.message : String(err)}`,
            stepsToReproduce: ['Failed to inject test script into iframe'],
            severity: 'high',
          }],
          timestamp: startTime,
          duration: Date.now() - startTime,
          strategy: 'iframe',
          testsRun: 0,
          testsPassed: 0,
        });
      }
    });
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  /**
   * Parse vitest JSON reporter output into a CrashReport.
   */
  private parseVitestOutput(
    output: string,
    exitCode: number,
    reportId: string,
    startTime: number
  ): CrashReport {
    const crashes: CrashEntry[] = [];
    let testsRun = 0;
    let testsPassed = 0;

    // Try to parse JSON output — find the outermost JSON object containing "testResults"
    try {
      const trIdx = output.indexOf('"testResults"');
      if (trIdx !== -1) {
        // Walk backwards from "testResults" to find the opening brace
        let jsonStart = -1;
        let depth = 0;
        for (let i = trIdx; i >= 0; i--) {
          if (output[i] === '}') depth++;
          if (output[i] === '{') {
            if (depth === 0) { jsonStart = i; break; }
            depth--;
          }
        }

        if (jsonStart !== -1) {
          // Find the matching closing brace
          depth = 0;
          let jsonEnd = -1;
          for (let i = jsonStart; i < output.length; i++) {
            if (output[i] === '{') depth++;
            if (output[i] === '}') {
              depth--;
              if (depth === 0) { jsonEnd = i + 1; break; }
            }
          }

          if (jsonEnd !== -1) {
            const results = JSON.parse(output.slice(jsonStart, jsonEnd));
            if (results.testResults) {
              for (const suite of results.testResults) {
                for (const test of suite.assertionResults || []) {
                  testsRun++;
                  if (test.status === 'passed') {
                    testsPassed++;
                  } else if (test.status === 'failed') {
                    crashes.push({
                      error: test.failureMessages?.join('\n') || 'Test failed',
                      stackTrace: test.failureMessages?.join('\n'),
                      stepsToReproduce: [`Test: ${test.fullName || test.title}`],
                      severity: 'medium',
                      testName: test.fullName || test.title,
                    });
                  }
                }
              }
            }
          }
        }
      }
    } catch {
      // JSON parse failed — fall back to text parsing
    }

    // If no JSON parsed, extract errors from text output
    if (testsRun === 0 && exitCode !== 0) {
      const errorLines = output.split('\n').filter(
        (line) => line.includes('FAIL') || line.includes('Error') || line.includes('error')
      );
      if (errorLines.length > 0) {
        crashes.push({
          error: errorLines.slice(0, 5).join('\n'),
          stepsToReproduce: ['Vitest execution failed'],
          severity: 'high',
        });
      }
    }

    return {
      id: reportId,
      crashes,
      timestamp: startTime,
      duration: Date.now() - startTime,
      strategy: 'vitest',
      testsRun,
      testsPassed,
    };
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: QA_ChaosAgentInstance | null = null;

export function getQAChaosAgent(): QA_ChaosAgentInstance {
  if (!_instance) {
    _instance = new QA_ChaosAgentInstance();
  }
  return _instance;
}

export type { QA_ChaosAgentInstance };
