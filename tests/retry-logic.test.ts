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
  DEFAULT_RETRY_CONFIG
} from '../src/utils/retryLogic';

// Test utilities
let testCount = 0;
let passCount = 0;
let failCount = 0;

function test(name: string, fn: () => void) {
  testCount++;
  try {
    fn();
    passCount++;
    console.log(`✅ ${name}`);
  } catch (error: any) {
    failCount++;
    console.error(`❌ ${name}`);
    console.error(`   ${error.message}`);
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

function assertContains(str: string, substring: string, message: string) {
  if (!str.includes(substring)) {
    throw new Error(`${message}\n  String: ${str}\n  Expected to contain: ${substring}`);
  }
}

function assertNotNull(value: any, message: string) {
  if (value === null || value === undefined) {
    throw new Error(`${message}\n  Expected non-null value, got: ${value}`);
  }
}

console.log('\n🧪 Testing Retry Logic\n');

// =============================================================================
// Test shouldRetryError
// =============================================================================

console.log('📝 Testing shouldRetryError...\n');

test('Should retry parsing errors on first attempt', () => {
  const result = shouldRetryError(
    new Error('Failed to parse JSON'),
    'parsing_error',
    1,
    DEFAULT_RETRY_CONFIG
  );
  assertEqual(result, true, 'Should allow retry for parsing error on attempt 1');
});

test('Should retry validation errors on first attempt', () => {
  const result = shouldRetryError(
    new Error('Validation failed'),
    'validation_error',
    1,
    DEFAULT_RETRY_CONFIG
  );
  assertEqual(result, true, 'Should allow retry for validation error on attempt 1');
});

test('Should retry AI errors on first attempt', () => {
  const result = shouldRetryError(
    new Error('AI service error'),
    'ai_error',
    1,
    DEFAULT_RETRY_CONFIG
  );
  assertEqual(result, true, 'Should allow retry for AI error on attempt 1');
});

test('Should NOT retry after max attempts reached', () => {
  const result = shouldRetryError(
    new Error('Some error'),
    'parsing_error',
    2, // At max attempts (DEFAULT is 2)
    DEFAULT_RETRY_CONFIG
  );
  assertEqual(result, false, 'Should not retry after max attempts');
});

test('Should NOT retry rate limit errors', () => {
  const result = shouldRetryError(
    new Error('Rate limit exceeded'),
    'rate_limit_error',
    1,
    DEFAULT_RETRY_CONFIG
  );
  assertEqual(result, false, 'Rate limit errors should not be retried automatically');
});

test('Should NOT retry non-retryable errors', () => {
  const result = shouldRetryError(
    new Error('Unknown error'),
    'unknown_error',
    1,
    { ...DEFAULT_RETRY_CONFIG, retryableErrors: ['parsing_error'] }
  );
  assertEqual(result, false, 'Should not retry errors not in retryableErrors list');
});

// =============================================================================
// Test generateRetryStrategy
// =============================================================================

console.log('\n📝 Testing generateRetryStrategy...\n');

test('Should generate retry strategy for parsing error', () => {
  const context = {
    attemptNumber: 1,
    previousError: 'Failed to parse JSON response',
    errorCategory: 'parsing_error' as const,
    originalResponse: '{ invalid json',
  };
  
  const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);
  
  assertEqual(result.shouldRetry, true, 'Should allow retry');
  assertNotNull(result.correctionPrompt, 'Should have correction prompt');
  assertContains(result.correctionPrompt!, 'JSON', 'Correction should mention JSON');
  assertContains(result.correctionPrompt!, 'PARSING ERROR', 'Should identify error type');
});

test('Should generate retry strategy for validation error', () => {
  const context = {
    attemptNumber: 1,
    previousError: 'Validation failed: unclosed strings',
    errorCategory: 'validation_error' as const,
    validationDetails: [
      { file: 'App.tsx', errors: [{ type: 'UNCLOSED_STRING', message: 'Unclosed quote' }] }
    ],
  };
  
  const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);
  
  assertEqual(result.shouldRetry, true, 'Should allow retry');
  assertNotNull(result.correctionPrompt, 'Should have correction prompt');
  assertContains(result.correctionPrompt!, 'VALIDATION ERROR', 'Should identify error type');
  assertContains(result.correctionPrompt!, 'strings', 'Should mention validation issue');
});

test('Should generate retry strategy for AI error', () => {
  const context = {
    attemptNumber: 1,
    previousError: 'AI service unavailable',
    errorCategory: 'ai_error' as const,
  };
  
  const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);
  
  assertEqual(result.shouldRetry, true, 'Should allow retry');
  assertNotNull(result.correctionPrompt, 'Should have correction prompt');
  assertContains(result.correctionPrompt!, 'AI', 'Should mention AI error');
  assertContains(result.correctionPrompt!, 'SIMPLIFICATION', 'Should suggest simplification');
});

test('Should generate retry strategy for timeout error', () => {
  const context = {
    attemptNumber: 1,
    previousError: 'Request timeout',
    errorCategory: 'timeout_error' as const,
  };
  
  const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);
  
  assertEqual(result.shouldRetry, true, 'Should allow retry');
  assertNotNull(result.correctionPrompt, 'Should have correction prompt');
  assertContains(result.correctionPrompt!, 'TIMEOUT', 'Should identify timeout');
  assertContains(result.correctionPrompt!, 'simpler', 'Should suggest simpler approach');
});

test('Should NOT retry after max attempts', () => {
  const context = {
    attemptNumber: 2, // At max
    previousError: 'Some error',
    errorCategory: 'parsing_error' as const,
  };
  
  const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);
  
  assertEqual(result.shouldRetry, false, 'Should not retry after max attempts');
});

test('Should calculate retry delay for first retry', () => {
  const context = {
    attemptNumber: 1,
    previousError: 'Error',
    errorCategory: 'ai_error' as const,
  };
  
  const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);
  
  assertEqual(result.retryDelay, 0, 'First retry should have no delay');
});

// =============================================================================
// Test isPatternMatchingError
// =============================================================================

console.log('\n📝 Testing isPatternMatchingError...\n');

test('Should detect "could not find" as pattern matching error', () => {
  const result = isPatternMatchingError(
    'Could not find the specified element',
    'ai_error'
  );
  assertEqual(result, true, 'Should detect "could not find" pattern');
});

test('Should detect "not found" as pattern matching error', () => {
  const result = isPatternMatchingError(
    'Pattern not found in file',
    'ai_error'
  );
  assertEqual(result, true, 'Should detect "not found" pattern');
});

test('Should detect "no match" as pattern matching error', () => {
  const result = isPatternMatchingError(
    'No match for search pattern',
    'unknown_error'
  );
  assertEqual(result, true, 'Should detect "no match" pattern');
});

test('Should detect "searchFor" as pattern matching error', () => {
  const result = isPatternMatchingError(
    'searchFor pattern did not match',
    'ai_error'
  );
  assertEqual(result, true, 'Should detect "searchFor" keyword');
});

test('Should NOT detect non-pattern errors', () => {
  const result = isPatternMatchingError(
    'JSON parse error',
    'parsing_error'
  );
  assertEqual(result, false, 'Should not detect parsing errors as pattern matching');
});

test('Should only detect in ai_error or unknown_error categories', () => {
  const result = isPatternMatchingError(
    'Could not find',
    'validation_error'
  );
  assertEqual(result, false, 'Should not flag validation errors as pattern matching');
});

// =============================================================================
// Test generatePatternMatchingPrompt
// =============================================================================

console.log('\n📝 Testing generatePatternMatchingPrompt...\n');

test('Should generate pattern matching prompt with file contents', () => {
  const fileContents = 'const [count, setCount] = useState(0);';
  const searchPattern = 'const count = useState(0);';
  
  const result = generatePatternMatchingPrompt(fileContents, searchPattern);
  
  assertContains(result, 'PATTERN MATCHING ERROR', 'Should identify error type');
  assertContains(result, searchPattern, 'Should include search pattern');
  assertContains(result, fileContents, 'Should include actual file contents');
  assertContains(result, 'EXACT', 'Should emphasize exact matching');
  assertContains(result, 'character-for-character', 'Should emphasize precision');
});

test('Should truncate long file contents', () => {
  const longContent = 'a'.repeat(3000);
  const searchPattern = 'pattern';
  
  const result = generatePatternMatchingPrompt(longContent, searchPattern);
  
  assertContains(result, '(truncated)', 'Should indicate truncation');
  assertEqual(result.length < longContent.length + 500, true, 'Should be significantly shorter');
});

test('Should include examples of exact matching', () => {
  const result = generatePatternMatchingPrompt('code', 'pattern');
  
  assertContains(result, 'EXAMPLE', 'Should include example');
  assertContains(result, 'indentation', 'Should mention indentation importance');
  assertContains(result, 'spacing', 'Should mention spacing importance');
});

// =============================================================================
// Test Correction Prompt Content
// =============================================================================

console.log('\n📝 Testing Correction Prompt Content...\n');

test('Parsing error prompt should have actionable fixes', () => {
  const context = {
    attemptNumber: 1,
    previousError: 'Invalid JSON',
    errorCategory: 'parsing_error' as const,
    originalResponse: '{ broken',
  };
  
  const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);
  
  assertContains(result.correctionPrompt!, '✅', 'Should use checkmarks for fixes');
  assertContains(result.correctionPrompt!, 'double quotes', 'Should mention JSON syntax rules');
  assertContains(result.correctionPrompt!, 'NO markdown', 'Should warn against markdown');
});

test('Validation error prompt should list validation checklist', () => {
  const context = {
    attemptNumber: 1,
    previousError: 'Validation failed',
    errorCategory: 'validation_error' as const,
  };
  
  const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);
  
  assertContains(result.correctionPrompt!, 'VALIDATION CHECKLIST', 'Should have checklist');
  assertContains(result.correctionPrompt!, '- [ ]', 'Should use checkbox format');
  assertContains(result.correctionPrompt!, 'strings', 'Should mention string validation');
  assertContains(result.correctionPrompt!, 'JSX tags', 'Should mention JSX validation');
});

test('AI error prompt should suggest simplification', () => {
  const context = {
    attemptNumber: 1,
    previousError: 'AI error',
    errorCategory: 'ai_error' as const,
  };
  
  const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);
  
  assertContains(result.correctionPrompt!, 'SIMPLIFICATION', 'Should suggest simplification');
  assertContains(result.correctionPrompt!, 'smaller', 'Should recommend smaller changes');
  assertContains(result.correctionPrompt!, 'ONE', 'Should emphasize single focus');
});

test('Timeout error prompt should emphasize scope reduction', () => {
  const context = {
    attemptNumber: 1,
    previousError: 'Timeout',
    errorCategory: 'timeout_error' as const,
  };
  
  const result = generateRetryStrategy(context, DEFAULT_RETRY_CONFIG);
  
  assertContains(result.correctionPrompt!, 'TIMEOUT', 'Should identify timeout');
  assertContains(result.correctionPrompt!, 'FEWER changes', 'Should suggest fewer changes');
  assertContains(result.correctionPrompt!, 'MUCH simpler', 'Should emphasize simplicity');
  assertContains(result.correctionPrompt!, '1-2 files', 'Should suggest file limit');
});

// =============================================================================
// Test Custom Retry Config
// =============================================================================

console.log('\n📝 Testing Custom Retry Config...\n');

test('Should respect custom maxAttempts', () => {
  const customConfig = { ...DEFAULT_RETRY_CONFIG, maxAttempts: 3 };
  
  const result1 = shouldRetryError('Error', 'parsing_error', 1, customConfig);
  assertEqual(result1, true, 'Should retry on attempt 1');
  
  const result2 = shouldRetryError('Error', 'parsing_error', 2, customConfig);
  assertEqual(result2, true, 'Should retry on attempt 2');
  
  const result3 = shouldRetryError('Error', 'parsing_error', 3, customConfig);
  assertEqual(result3, false, 'Should not retry after attempt 3');
});

test('Should respect custom retryableErrors list', () => {
  const customConfig = { 
    ...DEFAULT_RETRY_CONFIG, 
    retryableErrors: ['parsing_error'] as any
  };
  
  const result1 = shouldRetryError('Error', 'parsing_error', 1, customConfig);
  assertEqual(result1, true, 'Should retry parsing errors');
  
  const result2 = shouldRetryError('Error', 'validation_error', 1, customConfig);
  assertEqual(result2, false, 'Should not retry validation errors with custom config');
});

// =============================================================================
// Summary
// =============================================================================

console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary');
console.log('='.repeat(60));
console.log(`Total Tests: ${testCount}`);
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`Success Rate: ${((passCount / testCount) * 100).toFixed(1)}%`);
console.log('='.repeat(60) + '\n');

if (failCount > 0) {
  process.exit(1);
}
