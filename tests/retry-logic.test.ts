/**
 * Unit Tests for Retry Logic
 * Phase 6.1: Testing & Validation
 *
 * Tests retry decision engine, correction prompts, and error categorization
 */

import {
  shouldRetryError,
  generateRetryStrategy,
  isPatternMatchingError,
  generatePatternMatchingPrompt,
  DEFAULT_RETRY_CONFIG,
} from '../src/utils/retryLogic';

// =============================================================================
// Test shouldRetryError
// =============================================================================

describe('shouldRetryError', () => {
  it('should retry parsing errors on first attempt', () => {
    const result = shouldRetryError(
      new Error('Failed to parse JSON'),
      'parsing_error',
      1,
      DEFAULT_RETRY_CONFIG
    );
    expect(result).toBe(true);
  });

  it('should retry validation errors on first attempt', () => {
    const result = shouldRetryError(
      new Error('Validation failed'),
      'validation_error',
      1,
      DEFAULT_RETRY_CONFIG
    );
    expect(result).toBe(true);
  });

  it('should retry AI errors on first attempt', () => {
    const result = shouldRetryError(
      new Error('AI service error'),
      'ai_error',
      1,
      DEFAULT_RETRY_CONFIG
    );
    expect(result).toBe(true);
  });

  it('should NOT retry after max attempts reached', () => {
    const result = shouldRetryError(
      new Error('Some error'),
      'parsing_error',
      2, // At max attempts (DEFAULT is 2)
      DEFAULT_RETRY_CONFIG
    );
    expect(result).toBe(false);
  });

  it('should NOT retry rate limit errors', () => {
    const result = shouldRetryError(
      new Error('Rate limit exceeded'),
      'rate_limit_error',
      1,
      DEFAULT_RETRY_CONFIG
    );
    expect(result).toBe(false);
  });

  it('should NOT retry non-retryable errors', () => {
    const result = shouldRetryError(
      new Error('Unknown error'),
      'unknown_error',
      1,
      { ...DEFAULT_RETRY_CONFIG, retryableErrors: ['parsing_error'] }
    );
    expect(result).toBe(false);
  });
});

// =============================================================================
// Test generateRetryStrategy
// =============================================================================

describe('generateRetryStrategy', () => {
  it('should generate retry strategy for parsing error', () => {
    const context = {
      attemptNumber: 1,
      previousError: 'Failed to parse JSON response',
      errorCategory: 'parsing_error' as const,
      originalResponse: '{ invalid json',
    };

    const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);

    expect(result.shouldRetry).toBe(true);
    expect(result.correctionPrompt).not.toBeNull();
    expect(result.correctionPrompt).toContain('JSON');
    expect(result.correctionPrompt).toContain('PARSING ERROR');
  });

  it('should generate retry strategy for validation error', () => {
    const context = {
      attemptNumber: 1,
      previousError: 'Validation failed: unclosed strings',
      errorCategory: 'validation_error' as const,
      validationDetails: [
        { file: 'App.tsx', errors: [{ type: 'UNCLOSED_STRING', message: 'Unclosed quote' }] },
      ],
    };

    const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);

    expect(result.shouldRetry).toBe(true);
    expect(result.correctionPrompt).not.toBeNull();
    expect(result.correctionPrompt).toContain('VALIDATION ERROR');
    expect(result.correctionPrompt).toContain('strings');
  });

  it('should generate retry strategy for AI error', () => {
    const context = {
      attemptNumber: 1,
      previousError: 'AI service unavailable',
      errorCategory: 'ai_error' as const,
    };

    const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);

    expect(result.shouldRetry).toBe(true);
    expect(result.correctionPrompt).not.toBeNull();
    expect(result.correctionPrompt).toContain('AI');
    expect(result.correctionPrompt).toContain('SIMPLIFICATION');
  });

  it('should generate retry strategy for timeout error', () => {
    const context = {
      attemptNumber: 1,
      previousError: 'Request timeout',
      errorCategory: 'timeout_error' as const,
    };

    const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);

    expect(result.shouldRetry).toBe(true);
    expect(result.correctionPrompt).not.toBeNull();
    expect(result.correctionPrompt).toContain('TIMEOUT');
    expect(result.correctionPrompt).toContain('simpler');
  });

  it('should NOT retry after max attempts', () => {
    const context = {
      attemptNumber: 2, // At max
      previousError: 'Some error',
      errorCategory: 'parsing_error' as const,
    };

    const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);

    expect(result.shouldRetry).toBe(false);
  });

  it('should calculate retry delay for first retry', () => {
    const context = {
      attemptNumber: 1,
      previousError: 'Error',
      errorCategory: 'ai_error' as const,
    };

    const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);

    expect(result.retryDelay).toBe(0);
  });
});

// =============================================================================
// Test isPatternMatchingError
// =============================================================================

describe('isPatternMatchingError', () => {
  it('should detect "could not find" as pattern matching error', () => {
    const result = isPatternMatchingError('Could not find the specified element', 'ai_error');
    expect(result).toBe(true);
  });

  it('should detect "not found" as pattern matching error', () => {
    const result = isPatternMatchingError('Pattern not found in file', 'ai_error');
    expect(result).toBe(true);
  });

  it('should detect "no match" as pattern matching error', () => {
    const result = isPatternMatchingError('No match for search pattern', 'unknown_error');
    expect(result).toBe(true);
  });

  it('should detect "searchFor" as pattern matching error', () => {
    const result = isPatternMatchingError('searchFor pattern did not match', 'ai_error');
    expect(result).toBe(true);
  });

  it('should NOT detect non-pattern errors', () => {
    const result = isPatternMatchingError('JSON parse error', 'parsing_error');
    expect(result).toBe(false);
  });

  it('should only detect in ai_error or unknown_error categories', () => {
    const result = isPatternMatchingError('Could not find', 'validation_error');
    expect(result).toBe(false);
  });
});

// =============================================================================
// Test generatePatternMatchingPrompt
// =============================================================================

describe('generatePatternMatchingPrompt', () => {
  it('should generate pattern matching prompt with file contents', () => {
    const fileContents = 'const [count, setCount] = useState(0);';
    const searchPattern = 'const count = useState(0);';

    const result = generatePatternMatchingPrompt(fileContents, searchPattern);

    expect(result).toContain('PATTERN MATCHING ERROR');
    expect(result).toContain(searchPattern);
    expect(result).toContain(fileContents);
    expect(result).toContain('EXACT');
    expect(result).toContain('character-for-character');
  });

  it('should truncate long file contents', () => {
    const longContent = 'a'.repeat(3000);
    const searchPattern = 'pattern';

    const result = generatePatternMatchingPrompt(longContent, searchPattern);

    expect(result).toContain('(truncated)');
    expect(result.length).toBeLessThan(longContent.length + 500);
  });

  it('should include examples of exact matching', () => {
    const result = generatePatternMatchingPrompt('code', 'pattern');

    expect(result).toContain('EXAMPLE');
    expect(result).toContain('indentation');
    expect(result).toContain('spacing');
  });
});

// =============================================================================
// Test Correction Prompt Content
// =============================================================================

describe('Correction Prompt Content', () => {
  it('parsing error prompt should have actionable fixes', () => {
    const context = {
      attemptNumber: 1,
      previousError: 'Invalid JSON',
      errorCategory: 'parsing_error' as const,
      originalResponse: '{ broken',
    };

    const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);

    expect(result.correctionPrompt).toContain('✅');
    expect(result.correctionPrompt).toContain('double quotes');
    expect(result.correctionPrompt).toContain('NO markdown');
  });

  it('validation error prompt should list validation checklist', () => {
    const context = {
      attemptNumber: 1,
      previousError: 'Validation failed',
      errorCategory: 'validation_error' as const,
    };

    const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);

    expect(result.correctionPrompt).toContain('VALIDATION CHECKLIST');
    expect(result.correctionPrompt).toContain('- [ ]');
    expect(result.correctionPrompt).toContain('strings');
    expect(result.correctionPrompt).toContain('JSX tags');
  });

  it('AI error prompt should suggest simplification', () => {
    const context = {
      attemptNumber: 1,
      previousError: 'AI error',
      errorCategory: 'ai_error' as const,
    };

    const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);

    expect(result.correctionPrompt).toContain('SIMPLIFICATION');
    expect(result.correctionPrompt).toContain('smaller');
    expect(result.correctionPrompt).toContain('ONE');
  });

  it('timeout error prompt should emphasize scope reduction', () => {
    const context = {
      attemptNumber: 1,
      previousError: 'Timeout',
      errorCategory: 'timeout_error' as const,
    };

    const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);

    expect(result.correctionPrompt).toContain('TIMEOUT');
    expect(result.correctionPrompt).toContain('FEWER changes');
    expect(result.correctionPrompt).toContain('MUCH simpler');
    expect(result.correctionPrompt).toContain('1-2 files');
  });
});

// =============================================================================
// Test Custom Retry Config
// =============================================================================

describe('Custom Retry Config', () => {
  it('should respect custom maxAttempts', () => {
    const customConfig = { ...DEFAULT_RETRY_CONFIG, maxAttempts: 3 };

    const result1 = shouldRetryError('Error', 'parsing_error', 1, customConfig);
    expect(result1).toBe(true);

    const result2 = shouldRetryError('Error', 'parsing_error', 2, customConfig);
    expect(result2).toBe(true);

    const result3 = shouldRetryError('Error', 'parsing_error', 3, customConfig);
    expect(result3).toBe(false);
  });

  it('should respect custom retryableErrors list', () => {
    const customConfig = {
      ...DEFAULT_RETRY_CONFIG,
      retryableErrors: ['parsing_error'] as any,
    };

    const result1 = shouldRetryError('Error', 'parsing_error', 1, customConfig);
    expect(result1).toBe(true);

    const result2 = shouldRetryError('Error', 'validation_error', 1, customConfig);
    expect(result2).toBe(false);
  });
});
