/**
 * Verification Service
 *
 * Parses and interprets test runner output (Vitest/Jest/npm test)
 * to provide structured feedback for the Verified Autonomy loop.
 *
 * This service bridges the gap between raw CLI output and
 * actionable data that the Builder agent can use to fix issues.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration?: number; // ms
  error?: {
    message: string;
    stack?: string;
    expected?: string;
    actual?: string;
  };
}

export interface TestSuiteResult {
  file: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  skipped: number;
  duration: number; // ms
}

export interface VerificationResult {
  success: boolean;
  exitCode: number;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number; // ms
  };
  suites: TestSuiteResult[];
  /** Formatted feedback for the Builder agent */
  builderFeedback: string;
  /** Raw output for debugging */
  rawOutput: string;
}

// ============================================================================
// PARSING UTILITIES
// ============================================================================

/**
 * Parse Vitest/Jest TAP-like output into structured results.
 * This is a best-effort parser that handles common formats.
 */
function parseTestOutput(output: string, exitCode: number): VerificationResult {
  const lines = output.split('\n');
  const suites: TestSuiteResult[] = [];
  let currentSuite: TestSuiteResult | null = null;

  // Regex patterns for common test runner formats
  const suiteStartRegex = /^\s*(PASS|FAIL|RUN)\s+(.+\.(?:test|spec)\.[jt]sx?)$/i;
  const testPassRegex = /^\s*✓\s+(.+?)(?:\s+\((\d+)\s*ms\))?$/;
  const testFailRegex = /^\s*✕\s+(.+?)(?:\s+\((\d+)\s*ms\))?$/;
  const testSkipRegex = /^\s*○\s+(.+)$/;
  const errorBlockRegex = /^\s*●\s+(.+)$/;

  let currentError: TestResult['error'] | null = null;
  let capturingError = false;
  const errorLines: string[] = [];

  for (const line of lines) {
    // Detect suite start
    const suiteMatch = line.match(suiteStartRegex);
    if (suiteMatch) {
      if (currentSuite) {
        suites.push(currentSuite);
      }
      currentSuite = {
        file: suiteMatch[2],
        tests: [],
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
      };
      continue;
    }

    if (!currentSuite) continue;

    // Detect passed test
    const passMatch = line.match(testPassRegex);
    if (passMatch) {
      currentSuite.tests.push({
        name: passMatch[1].trim(),
        status: 'passed',
        duration: passMatch[2] ? parseInt(passMatch[2], 10) : undefined,
      });
      currentSuite.passed++;
      continue;
    }

    // Detect failed test
    const failMatch = line.match(testFailRegex);
    if (failMatch) {
      currentSuite.tests.push({
        name: failMatch[1].trim(),
        status: 'failed',
        duration: failMatch[2] ? parseInt(failMatch[2], 10) : undefined,
        error: currentError || undefined,
      });
      currentSuite.failed++;
      currentError = null;
      continue;
    }

    // Detect skipped test
    const skipMatch = line.match(testSkipRegex);
    if (skipMatch) {
      currentSuite.tests.push({
        name: skipMatch[1].trim(),
        status: 'skipped',
      });
      currentSuite.skipped++;
      continue;
    }

    // Detect error block start (Vitest/Jest format)
    const errorMatch = line.match(errorBlockRegex);
    if (errorMatch) {
      capturingError = true;
      errorLines.length = 0;
      continue;
    }

    // Capture error lines
    if (capturingError) {
      if (line.trim() === '' && errorLines.length > 0) {
        currentError = parseErrorBlock(errorLines.join('\n'));
        capturingError = false;
      } else {
        errorLines.push(line);
      }
    }
  }

  // Push last suite
  if (currentSuite) {
    suites.push(currentSuite);
  }

  // Calculate summary
  const summary = {
    totalTests: suites.reduce((sum, s) => sum + s.tests.length, 0),
    passed: suites.reduce((sum, s) => sum + s.passed, 0),
    failed: suites.reduce((sum, s) => sum + s.failed, 0),
    skipped: suites.reduce((sum, s) => sum + s.skipped, 0),
    duration: suites.reduce((sum, s) => sum + s.duration, 0),
  };

  // Check for zero tests (likely a parse failure or no tests written)
  if (summary.totalTests === 0 && output.length > 0) {
    // Fall back to simple exit code analysis
    return {
      success: exitCode === 0,
      exitCode,
      summary: { totalTests: 0, passed: 0, failed: exitCode === 0 ? 0 : 1, skipped: 0, duration: 0 },
      suites: [],
      builderFeedback: exitCode === 0 
        ? 'Tests passed (could not parse detailed output).'
        : formatRawErrorFeedback(output),
      rawOutput: output,
    };
  }

  return {
    success: summary.failed === 0 && exitCode === 0,
    exitCode,
    summary,
    suites,
    builderFeedback: formatBuilderFeedback(suites, summary),
    rawOutput: output,
  };
}

/**
 * Parse an error block into structured error info.
 */
function parseErrorBlock(block: string): TestResult['error'] {
  const lines = block.split('\n');
  const error: TestResult['error'] = { message: '' };

  // Try to find "expected" and "actual" lines (Jest/Vitest assertion format)
  for (const line of lines) {
    if (line.includes('Expected:')) {
      error.expected = line.split('Expected:')[1]?.trim();
    } else if (line.includes('Received:') || line.includes('Actual:')) {
      error.actual = line.split(/Received:|Actual:/)[1]?.trim();
    }
  }

  error.message = lines[0] || 'Unknown test error';
  error.stack = lines.slice(1).join('\n');

  return error;
}

/**
 * Format feedback for the Builder agent.
 */
function formatBuilderFeedback(suites: TestSuiteResult[], summary: { passed: number; failed: number; totalTests: number }): string {
  if (summary.failed === 0) {
    return `✅ All ${summary.passed} tests passed.`;
  }

  const failedTests = suites
    .flatMap((s) => s.tests.filter((t) => t.status === 'failed').map((t) => ({ file: s.file, ...t })))
    .slice(0, 5); // Limit to 5 to avoid overwhelming the LLM

  const lines = [
    `❌ ${summary.failed}/${summary.totalTests} tests failed.`,
    '',
    '### Failed Tests:',
  ];

  for (const test of failedTests) {
    lines.push(`- **${test.file}**: \`${test.name}\``);
    if (test.error?.message) {
      lines.push(`  Error: ${test.error.message}`);
    }
    if (test.error?.expected && test.error?.actual) {
      lines.push(`  Expected: ${test.error.expected}`);
      lines.push(`  Actual: ${test.error.actual}`);
    }
  }

  lines.push('', 'Fix these tests to proceed.');

  return lines.join('\n');
}

/**
 * Format raw error output when parsing fails.
 */
function formatRawErrorFeedback(output: string): string {
  // Extract the most relevant error portion (last 30 lines often have the error)
  const lines = output.split('\n').filter((l) => l.trim());
  const relevantLines = lines.slice(-30);

  return `❌ Tests failed. Raw output:\n\`\`\`\n${relevantLines.join('\n')}\n\`\`\`\n\nFix the issues to proceed.`;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class VerificationService {
  /**
   * Parse test runner output into structured verification result.
   */
  parseTestOutput(output: string, exitCode: number): VerificationResult {
    return parseTestOutput(output, exitCode);
  }

  /**
   * Generate a test file for a given specification.
   * This prompt is used by the QA_ENGINEER agent.
   */
  generateTestPrompt(spec: {
    componentName: string;
    requirements: string[];
    edgeCases?: string[];
  }): string {
    const edgeCasesList = spec.edgeCases?.length
      ? spec.edgeCases.map((e) => `- ${e}`).join('\n')
      : '- Empty input\n- Error state\n- Boundary conditions';

    return `### Role
You are a **QA Engineer**. Your job is to write comprehensive tests BEFORE the code is written.

### Component
\`${spec.componentName}\`

### Requirements
${spec.requirements.map((r) => `- ${r}`).join('\n')}

### Mandatory Edge Cases (Test These!)
${edgeCasesList}

### Output
Generate a complete Vitest test file (\`${spec.componentName}.test.tsx\`).
- Import from \`vitest\` and \`@testing-library/react\`.
- Write at least one test per requirement.
- Write at least 3 edge case tests.
- Use \`describe\` blocks for organization.
- Output ONLY the test file code, no explanations.`;
  }

  /**
   * Determine if tests should be regenerated vs code should be fixed.
   */
  shouldRegenerateTests(result: VerificationResult): boolean {
    // If more than 80% of tests fail, the tests might be wrong (not the code)
    if (result.summary.totalTests === 0) return false;
    const failureRate = result.summary.failed / result.summary.totalTests;
    return failureRate > 0.8;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let instance: VerificationService | null = null;

export function getVerificationService(): VerificationService {
  if (!instance) {
    instance = new VerificationService();
  }
  return instance;
}
