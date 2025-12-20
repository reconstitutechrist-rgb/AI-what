/**
 * Rate limiting utility using sliding window algorithm.
 * Prevents operations from exceeding a maximum rate.
 */

export interface RateLimiter {
  /** Check if an operation can be executed without exceeding the rate limit */
  canExecute: () => boolean;
  /** Execute a function if under rate limit, returns null if rate limited */
  execute: <T>(fn: () => T) => T | null;
  /** Reset the rate limiter, clearing all timestamps */
  reset: () => void;
  /** Get current count of operations in the window */
  getCount: () => number;
}

/**
 * Creates a rate limiter that allows a maximum number of operations
 * within a sliding time window.
 *
 * @param maxOperations - Maximum operations allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns RateLimiter instance
 *
 * @example
 * const limiter = createRateLimiter(2, 1000); // 2 ops per second
 * limiter.execute(() => console.log('allowed')); // runs
 * limiter.execute(() => console.log('allowed')); // runs
 * limiter.execute(() => console.log('blocked')); // returns null
 */
export function createRateLimiter(maxOperations: number, windowMs: number): RateLimiter {
  const timestamps: number[] = [];

  const cleanOldTimestamps = () => {
    const now = Date.now();
    while (timestamps.length > 0 && now - timestamps[0] > windowMs) {
      timestamps.shift();
    }
  };

  return {
    canExecute: () => {
      cleanOldTimestamps();
      return timestamps.length < maxOperations;
    },

    execute: <T>(fn: () => T): T | null => {
      cleanOldTimestamps();
      if (timestamps.length >= maxOperations) {
        return null;
      }
      timestamps.push(Date.now());
      return fn();
    },

    reset: () => {
      timestamps.length = 0;
    },

    getCount: () => {
      cleanOldTimestamps();
      return timestamps.length;
    },
  };
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last call.
 *
 * @param fn - Function to debounce
 * @param waitMs - Delay in milliseconds
 * @returns Debounced function with cancel method
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  waitMs: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, waitMs);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}
