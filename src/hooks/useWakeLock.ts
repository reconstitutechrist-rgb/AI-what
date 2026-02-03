/**
 * useWakeLock — Screen Wake Lock API hook
 *
 * Prevents browser tab throttling and machine sleep during Dream Mode.
 * Uses the Screen Wake Lock API (navigator.wakeLock.request('screen')).
 *
 * - Re-acquires the lock on visibility change (user tabs away and back)
 * - Gracefully degrades if the Wake Lock API is unsupported
 * - Releases the lock when the component unmounts or enabled becomes false
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWakeLockReturn {
  /** Whether the wake lock is currently active */
  isActive: boolean;
  /** Whether the Wake Lock API is supported in this browser */
  isSupported: boolean;
  /** Any error that occurred while acquiring the lock */
  error: string | null;
}

export function useWakeLock(enabled: boolean): UseWakeLockReturn {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const isSupported =
    typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  const acquireLock = useCallback(async () => {
    if (!isSupported || !enabled) return;

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setIsActive(true);
      setError(null);

      wakeLockRef.current.addEventListener('release', () => {
        setIsActive(false);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wake Lock request failed';
      setError(message);
      setIsActive(false);
    }
  }, [enabled, isSupported]);

  const releaseLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // Ignore release errors — lock may already be released
      }
      wakeLockRef.current = null;
      setIsActive(false);
    }
  }, []);

  // Acquire/release based on enabled prop
  useEffect(() => {
    if (enabled) {
      acquireLock();
    } else {
      releaseLock();
    }

    return () => {
      releaseLock();
    };
  }, [enabled, acquireLock, releaseLock]);

  // Re-acquire on visibility change (user tabs back)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        acquireLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, acquireLock]);

  return { isActive, isSupported, error };
}
