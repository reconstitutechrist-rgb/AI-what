/**
 * Retry wrapper for Gemini API calls that handles 429 rate limits.
 * Parses the retry delay from Google's error response and waits accordingly.
 */
export async function withGeminiRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      if (attempt === maxRetries) throw error;

      const delay = parseRetryDelay(error);
      if (delay <= 0) throw error; // Not a rate limit — don't retry

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError; // unreachable, satisfies TS
}

/** Parse retry delay (ms) from Gemini 429 error. Returns 0 if not a rate limit error. */
function parseRetryDelay(error: unknown): number {
  const msg = error instanceof Error ? error.message : String(error);
  if (!msg.includes('429') && !msg.includes('Too Many Requests')) return 0;

  // Gemini format: "retryDelay":"21s" or "Please retry in 21.124101106s"
  const match = msg.match(/retry\s*(?:in|Delay['"]:?\s*['"])?\s*([\d.]+)s/i);
  const seconds = match ? parseFloat(match[1]) : 30; // default 30s if unparseable
  return Math.ceil(seconds * 1000); // convert to ms
}
