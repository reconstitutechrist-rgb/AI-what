'use client';

/**
 * useDesignAnalysis Hook
 *
 * Manages design analysis state and API calls for the Layout Builder.
 * Supports two-pass analysis: quick (2-3s) and deep (10-15s).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { QuickAnalysis, CompleteDesignAnalysis, ColorSwatch } from '@/types/layoutDesign';

// ============================================================================
// TYPES
// ============================================================================

export type AnalysisPhase = 'idle' | 'quick' | 'deep' | 'complete' | 'error';

export interface AnalysisProgress {
  quick: number; // 0-100
  deep: number; // 0-100
  currentSubPhase?: string;
}

export interface UseDesignAnalysisReturn {
  // State
  analysisPhase: AnalysisPhase;
  quickResult: QuickAnalysis | null;
  deepResult: CompleteDesignAnalysis | null;
  progress: AnalysisProgress;
  error: string | null;

  // Actions
  startQuickAnalysis: (imageBase64: string) => Promise<QuickAnalysis | null>;
  startDeepAnalysis: (imageBase64: string) => Promise<CompleteDesignAnalysis | null>;
  startFullAnalysis: (
    imageBase64: string
  ) => Promise<{ quick: QuickAnalysis; deep: CompleteDesignAnalysis } | null>;
  cancelAnalysis: () => void;
  reset: () => void;

  // Computed
  isAnalyzing: boolean;
  hasResults: boolean;
}

// ============================================================================
// ANALYSIS SUB-PHASES
// ============================================================================

const QUICK_SUB_PHASES = [
  'Extracting colors',
  'Detecting layout',
  'Identifying fonts',
  'Analyzing style',
];

const DEEP_SUB_PHASES = [
  'Measuring typography',
  'Calculating spacing',
  'Analyzing effects',
  'Mapping components',
  'Detecting animations',
  'Building spec sheet',
];

// ============================================================================
// HOOK
// ============================================================================

export function useDesignAnalysis(): UseDesignAnalysisReturn {
  // State
  const [analysisPhase, setAnalysisPhase] = useState<AnalysisPhase>('idle');
  const [quickResult, setQuickResult] = useState<QuickAnalysis | null>(null);
  const [deepResult, setDeepResult] = useState<CompleteDesignAnalysis | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress>({ quick: 0, deep: 0 });
  const [error, setError] = useState<string | null>(null);

  // Refs for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Reset function
  const reset = useCallback(() => {
    cancelledRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setAnalysisPhase('idle');
    setQuickResult(null);
    setDeepResult(null);
    setProgress({ quick: 0, deep: 0 });
    setError(null);
    cancelledRef.current = false;
  }, []);

  // Cancel function
  const cancelAnalysis = useCallback(() => {
    cancelledRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setAnalysisPhase('idle');
    setProgress({ quick: 0, deep: 0 });
  }, []);

  // Simulate progress during analysis
  const simulateProgress = useCallback(
    (phase: 'quick' | 'deep', subPhases: string[], durationMs: number) => {
      const intervalMs = durationMs / subPhases.length;
      let currentPhaseIndex = 0;

      // Clear any existing interval before starting a new one
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        if (cancelledRef.current) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        currentPhaseIndex++;
        const progressPercent = Math.min(
          95,
          Math.round((currentPhaseIndex / subPhases.length) * 100)
        );

        setProgress((prev) => ({
          ...prev,
          [phase]: progressPercent,
          currentSubPhase: subPhases[Math.min(currentPhaseIndex, subPhases.length - 1)],
        }));

        if (currentPhaseIndex >= subPhases.length) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, intervalMs);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    },
    []
  );

  // Quick analysis
  const startQuickAnalysis = useCallback(
    async (imageBase64: string): Promise<QuickAnalysis | null> => {
      try {
        cancelledRef.current = false;
        abortControllerRef.current = new AbortController();

        setAnalysisPhase('quick');
        setError(null);
        setProgress({ quick: 0, deep: 0, currentSubPhase: QUICK_SUB_PHASES[0] });

        // Simulate progress during API call
        const clearProgress = simulateProgress('quick', QUICK_SUB_PHASES, 2500);

        const response = await fetch('/api/layout/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortControllerRef.current.signal,
          body: JSON.stringify({
            message: 'Analyze this design reference image',
            conversationHistory: [],
            currentDesign: {},
            referenceImages: [imageBase64],
            analysisMode: 'pixel-perfect',
            requestedAnalysis: 'quick',
          }),
        });

        clearProgress();

        if (cancelledRef.current) return null;

        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.quickAnalysis) {
          setQuickResult(data.quickAnalysis);
          setProgress((prev) => ({ ...prev, quick: 100 }));
          setAnalysisPhase('complete');
          return data.quickAnalysis;
        } else {
          throw new Error('No quick analysis result returned');
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return null;
        }
        const errorMessage = err instanceof Error ? err.message : 'Quick analysis failed';
        setError(errorMessage);
        setAnalysisPhase('error');
        return null;
      }
    },
    [simulateProgress]
  );

  // Deep analysis
  const startDeepAnalysis = useCallback(
    async (imageBase64: string): Promise<CompleteDesignAnalysis | null> => {
      try {
        cancelledRef.current = false;
        abortControllerRef.current = new AbortController();

        setAnalysisPhase('deep');
        setError(null);
        setProgress((prev) => ({ ...prev, deep: 0, currentSubPhase: DEEP_SUB_PHASES[0] }));

        // Simulate progress during API call
        const clearProgress = simulateProgress('deep', DEEP_SUB_PHASES, 12000);

        const response = await fetch('/api/layout/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortControllerRef.current.signal,
          body: JSON.stringify({
            message: 'Perform deep analysis of this design reference',
            conversationHistory: [],
            currentDesign: {},
            referenceImages: [imageBase64],
            analysisMode: 'pixel-perfect',
            requestedAnalysis: 'deep',
          }),
        });

        clearProgress();

        if (cancelledRef.current) return null;

        if (!response.ok) {
          throw new Error(`Deep analysis failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.pixelPerfectAnalysis) {
          setDeepResult(data.pixelPerfectAnalysis);
          setProgress((prev) => ({ ...prev, deep: 100 }));
          setAnalysisPhase('complete');
          return data.pixelPerfectAnalysis;
        } else {
          throw new Error('No deep analysis result returned');
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return null;
        }
        const errorMessage = err instanceof Error ? err.message : 'Deep analysis failed';
        setError(errorMessage);
        setAnalysisPhase('error');
        return null;
      }
    },
    [simulateProgress]
  );

  // Full analysis (quick + deep)
  const startFullAnalysis = useCallback(
    async (
      imageBase64: string
    ): Promise<{ quick: QuickAnalysis; deep: CompleteDesignAnalysis } | null> => {
      try {
        cancelledRef.current = false;
        abortControllerRef.current = new AbortController();

        // Start with quick analysis
        setAnalysisPhase('quick');
        setError(null);
        setProgress({ quick: 0, deep: 0, currentSubPhase: QUICK_SUB_PHASES[0] });

        // Simulate quick progress
        const clearQuickProgress = simulateProgress('quick', QUICK_SUB_PHASES, 2500);

        const response = await fetch('/api/layout/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortControllerRef.current.signal,
          body: JSON.stringify({
            message: 'Perform complete pixel-perfect analysis of this design',
            conversationHistory: [],
            currentDesign: {},
            referenceImages: [imageBase64],
            analysisMode: 'pixel-perfect',
            requestedAnalysis: 'full',
          }),
        });

        clearQuickProgress();

        if (cancelledRef.current) return null;

        if (!response.ok) {
          throw new Error(`Full analysis failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Update quick results
        if (data.quickAnalysis) {
          setQuickResult(data.quickAnalysis);
          setProgress((prev) => ({ ...prev, quick: 100 }));
        }

        // Transition to deep phase visualization
        if (!cancelledRef.current && data.pixelPerfectAnalysis) {
          setAnalysisPhase('deep');

          // Simulate deep progress (already done server-side, just animate)
          const clearDeepProgress = simulateProgress('deep', DEEP_SUB_PHASES, 1000);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          clearDeepProgress();

          setDeepResult(data.pixelPerfectAnalysis);
          setProgress((prev) => ({ ...prev, deep: 100 }));
          setAnalysisPhase('complete');

          return {
            quick: data.quickAnalysis,
            deep: data.pixelPerfectAnalysis,
          };
        }

        throw new Error('Incomplete analysis results');
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return null;
        }
        const errorMessage = err instanceof Error ? err.message : 'Full analysis failed';
        setError(errorMessage);
        setAnalysisPhase('error');
        return null;
      }
    },
    [simulateProgress]
  );

  // Computed values
  const isAnalyzing = analysisPhase === 'quick' || analysisPhase === 'deep';
  const hasResults = quickResult !== null || deepResult !== null;

  return {
    // State
    analysisPhase,
    quickResult,
    deepResult,
    progress,
    error,

    // Actions
    startQuickAnalysis,
    startDeepAnalysis,
    startFullAnalysis,
    cancelAnalysis,
    reset,

    // Computed
    isAnalyzing,
    hasResults,
  };
}

export default useDesignAnalysis;
