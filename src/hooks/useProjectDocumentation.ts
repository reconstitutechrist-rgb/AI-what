/**
 * useProjectDocumentation Hook
 *
 * Provides React integration for the ProjectDocumentationService.
 * Handles automatic capture triggers and state synchronization.
 *
 * Features:
 * - Auto-load documentation when appId changes
 * - Capture methods for concept, layout, plan, and phases
 * - Message count tracking for auto-capture every 15-20 messages
 * - Build lifecycle management
 *
 * @example
 * ```typescript
 * const {
 *   documentation,
 *   captureConceptSnapshot,
 *   capturePlanSnapshot,
 * } = useProjectDocumentation({ userId, appId });
 * ```
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { createClient } from '@/utils/supabase/client';
import { ProjectDocumentationService } from '@/services/ProjectDocumentationService';
import type { ProjectDocumentation } from '@/types/projectDocumentation';
import type { AppConcept } from '@/types/appConcept';
import type { LayoutDesign } from '@/types/layoutDesign';
import type { DynamicPhasePlan } from '@/types/dynamicPhases';
import type { ChatMessage } from '@/types/aiBuilderTypes';

// Auto-capture threshold (capture every N messages)
const MESSAGE_CAPTURE_THRESHOLD = 15;

interface UseProjectDocumentationOptions {
  userId: string | null;
  appId: string | null;
  autoLoad?: boolean;
}

interface UseProjectDocumentationReturn {
  // State
  documentation: ProjectDocumentation | null;
  isLoading: boolean;
  isSaving: boolean;

  // Manual capture methods
  captureConceptSnapshot: (
    concept: AppConcept,
    options?: {
      source?: 'wizard' | 'builder-chat';
      conversationContext?: string;
      chatMessages?: ChatMessage[];
      messageCountAtCapture?: number;
    }
  ) => Promise<void>;
  captureBuilderChatSnapshot: (
    chatMessages: ChatMessage[],
    partialConcept?: Partial<AppConcept>
  ) => Promise<void>;
  captureLayoutSnapshot: (layout: LayoutDesign, previewImageUrl?: string) => Promise<void>;
  capturePlanSnapshot: (plan: DynamicPhasePlan) => Promise<void>;
  recordPhaseStart: (
    phaseNumber: number,
    phaseName: string,
    plannedInfo: {
      domain: string;
      features: string[];
      description: string;
      estimatedTokens: number;
    }
  ) => Promise<void>;
  recordPhaseComplete: (
    phaseNumber: number,
    result: {
      success: boolean;
      generatedCode?: string;
      generatedFiles?: string[];
      implementedFeatures?: string[];
      errors?: string[];
      tokensUsed?: { input: number; output: number };
    }
  ) => Promise<void>;

  // Build lifecycle
  startBuild: () => Promise<void>;
  completeBuild: () => Promise<void>;
  failBuild: (error?: string) => Promise<void>;

  // Utilities
  refreshDocumentation: () => Promise<void>;
  createDocumentation: (projectName: string) => Promise<ProjectDocumentation | null>;
  getOrCreateDocumentation: (projectName: string) => Promise<ProjectDocumentation | null>;

  // Auto-capture helpers
  shouldCaptureAtMessageCount: (messageCount: number) => boolean;
  getLastCapturedMessageCount: () => number;
}

export function useProjectDocumentation(
  options: UseProjectDocumentationOptions
): UseProjectDocumentationReturn {
  const { userId, appId, autoLoad = true } = options;

  // Get store state and actions
  const currentDocumentation = useAppStore((state) => state.currentDocumentation);
  const isLoadingDocumentation = useAppStore((state) => state.isLoadingDocumentation);
  const isSavingDocumentation = useAppStore((state) => state.isSavingDocumentation);
  const setCurrentDocumentation = useAppStore((state) => state.setCurrentDocumentation);
  const setIsLoadingDocumentation = useAppStore((state) => state.setIsLoadingDocumentation);
  const setIsSavingDocumentation = useAppStore((state) => state.setIsSavingDocumentation);

  // Track last captured message count
  const lastCapturedMessageCountRef = useRef(0);

  // Service instance (memoized)
  const service = useMemo(() => {
    const supabase = createClient();
    return new ProjectDocumentationService(supabase);
  }, []);

  // Load documentation when appId changes
  useEffect(() => {
    if (!autoLoad || !appId) return;

    const loadDocumentation = async () => {
      setIsLoadingDocumentation(true);
      try {
        const result = await service.getByAppId(appId);
        if (result.success) {
          setCurrentDocumentation(result.data ?? null);
          // Restore last captured message count if available
          if (result.data?.conceptSnapshot?.messageCountAtCapture) {
            lastCapturedMessageCountRef.current = result.data.conceptSnapshot.messageCountAtCapture;
          }
        } else {
          console.error('Failed to load documentation:', result.error);
        }
      } catch (error) {
        console.error('Error loading documentation:', error);
      } finally {
        setIsLoadingDocumentation(false);
      }
    };

    loadDocumentation();
  }, [appId, autoLoad, service, setCurrentDocumentation, setIsLoadingDocumentation]);

  // Refresh documentation
  const refreshDocumentation = useCallback(async () => {
    if (!appId) return;

    setIsLoadingDocumentation(true);
    try {
      const result = await service.getByAppId(appId);
      if (result.success) {
        setCurrentDocumentation(result.data ?? null);
      }
    } catch (error) {
      console.error('Error refreshing documentation:', error);
    } finally {
      setIsLoadingDocumentation(false);
    }
  }, [appId, service, setCurrentDocumentation, setIsLoadingDocumentation]);

  // Create documentation
  const createDocumentation = useCallback(
    async (projectName: string): Promise<ProjectDocumentation | null> => {
      if (!userId || !appId) return null;

      setIsSavingDocumentation(true);
      try {
        const result = await service.createDocumentation(appId, userId, projectName);
        if (result.success && result.data) {
          setCurrentDocumentation(result.data);
          return result.data;
        }
        console.error('Failed to create documentation:', result.error);
        return null;
      } catch (error) {
        console.error('Error creating documentation:', error);
        return null;
      } finally {
        setIsSavingDocumentation(false);
      }
    },
    [userId, appId, service, setCurrentDocumentation, setIsSavingDocumentation]
  );

  // Get or create documentation
  const getOrCreateDocumentation = useCallback(
    async (projectName: string): Promise<ProjectDocumentation | null> => {
      if (!userId || !appId) return null;

      // If we already have documentation loaded, return it
      if (currentDocumentation && currentDocumentation.appId === appId) {
        return currentDocumentation;
      }

      setIsSavingDocumentation(true);
      try {
        const result = await service.getOrCreate(appId, userId, projectName);
        if (result.success && result.data) {
          setCurrentDocumentation(result.data);
          return result.data;
        }
        console.error('Failed to get/create documentation:', result.error);
        return null;
      } catch (error) {
        console.error('Error getting/creating documentation:', error);
        return null;
      } finally {
        setIsSavingDocumentation(false);
      }
    },
    [
      userId,
      appId,
      currentDocumentation,
      service,
      setCurrentDocumentation,
      setIsSavingDocumentation,
    ]
  );

  // Capture concept snapshot
  const captureConceptSnapshot = useCallback(
    async (
      concept: AppConcept,
      captureOptions?: {
        source?: 'wizard' | 'builder-chat';
        conversationContext?: string;
        chatMessages?: ChatMessage[];
        messageCountAtCapture?: number;
      }
    ) => {
      if (!currentDocumentation) return;

      setIsSavingDocumentation(true);
      try {
        const result = await service.captureConceptSnapshot(
          currentDocumentation.id,
          concept,
          captureOptions?.source || 'wizard',
          {
            conversationContext: captureOptions?.conversationContext,
            chatMessages: captureOptions?.chatMessages,
            messageCountAtCapture: captureOptions?.messageCountAtCapture,
          }
        );

        if (result.success) {
          // Update last captured message count
          if (captureOptions?.messageCountAtCapture) {
            lastCapturedMessageCountRef.current = captureOptions.messageCountAtCapture;
          }
          await refreshDocumentation();
        } else {
          console.error('Failed to capture concept:', result.error);
        }
      } catch (error) {
        console.error('Error capturing concept:', error);
      } finally {
        setIsSavingDocumentation(false);
      }
    },
    [currentDocumentation, service, refreshDocumentation, setIsSavingDocumentation]
  );

  // Capture builder chat snapshot
  const captureBuilderChatSnapshot = useCallback(
    async (chatMessages: ChatMessage[], partialConcept?: Partial<AppConcept>) => {
      if (!currentDocumentation) return;

      setIsSavingDocumentation(true);
      try {
        const result = await service.captureBuilderChatSnapshot(
          currentDocumentation.id,
          chatMessages,
          partialConcept,
          chatMessages.length
        );

        if (result.success) {
          lastCapturedMessageCountRef.current = chatMessages.length;
          await refreshDocumentation();
        } else {
          console.error('Failed to capture builder chat:', result.error);
        }
      } catch (error) {
        console.error('Error capturing builder chat:', error);
      } finally {
        setIsSavingDocumentation(false);
      }
    },
    [currentDocumentation, service, refreshDocumentation, setIsSavingDocumentation]
  );

  // Capture layout snapshot
  const captureLayoutSnapshot = useCallback(
    async (layout: LayoutDesign, previewImageUrl?: string) => {
      if (!currentDocumentation) return;

      setIsSavingDocumentation(true);
      try {
        const result = await service.captureLayoutSnapshot(currentDocumentation.id, layout, {
          previewImageUrl,
        });

        if (result.success) {
          await refreshDocumentation();
        } else {
          console.error('Failed to capture layout:', result.error);
        }
      } catch (error) {
        console.error('Error capturing layout:', error);
      } finally {
        setIsSavingDocumentation(false);
      }
    },
    [currentDocumentation, service, refreshDocumentation, setIsSavingDocumentation]
  );

  // Capture plan snapshot
  const capturePlanSnapshot = useCallback(
    async (plan: DynamicPhasePlan) => {
      if (!currentDocumentation) return;

      setIsSavingDocumentation(true);
      try {
        const result = await service.capturePlanSnapshot(currentDocumentation.id, plan);

        if (result.success) {
          await refreshDocumentation();
        } else {
          console.error('Failed to capture plan:', result.error);
        }
      } catch (error) {
        console.error('Error capturing plan:', error);
      } finally {
        setIsSavingDocumentation(false);
      }
    },
    [currentDocumentation, service, refreshDocumentation, setIsSavingDocumentation]
  );

  // Record phase start
  const recordPhaseStart = useCallback(
    async (
      phaseNumber: number,
      phaseName: string,
      plannedInfo: {
        domain: string;
        features: string[];
        description: string;
        estimatedTokens: number;
      }
    ) => {
      if (!currentDocumentation) return;

      try {
        await service.recordPhaseStart(
          currentDocumentation.id,
          phaseNumber,
          phaseName,
          plannedInfo
        );
        await refreshDocumentation();
      } catch (error) {
        console.error('Error recording phase start:', error);
      }
    },
    [currentDocumentation, service, refreshDocumentation]
  );

  // Record phase completion
  const recordPhaseComplete = useCallback(
    async (
      phaseNumber: number,
      result: {
        success: boolean;
        generatedCode?: string;
        generatedFiles?: string[];
        implementedFeatures?: string[];
        errors?: string[];
        tokensUsed?: { input: number; output: number };
      }
    ) => {
      if (!currentDocumentation) return;

      try {
        await service.recordPhaseComplete(currentDocumentation.id, phaseNumber, result);
        await refreshDocumentation();
      } catch (error) {
        console.error('Error recording phase complete:', error);
      }
    },
    [currentDocumentation, service, refreshDocumentation]
  );

  // Build lifecycle methods
  const startBuild = useCallback(async () => {
    if (!currentDocumentation) return;

    try {
      await service.startBuild(currentDocumentation.id);
      await refreshDocumentation();
    } catch (error) {
      console.error('Error starting build:', error);
    }
  }, [currentDocumentation, service, refreshDocumentation]);

  const completeBuild = useCallback(async () => {
    if (!currentDocumentation) return;

    try {
      await service.completeBuild(currentDocumentation.id);
      await refreshDocumentation();
    } catch (error) {
      console.error('Error completing build:', error);
    }
  }, [currentDocumentation, service, refreshDocumentation]);

  const failBuild = useCallback(
    async (error?: string) => {
      if (!currentDocumentation) return;

      try {
        await service.failBuild(currentDocumentation.id, error);
        await refreshDocumentation();
      } catch (err) {
        console.error('Error failing build:', err);
      }
    },
    [currentDocumentation, service, refreshDocumentation]
  );

  // Auto-capture helpers
  const shouldCaptureAtMessageCount = useCallback((messageCount: number): boolean => {
    const lastCaptured = lastCapturedMessageCountRef.current;
    return messageCount - lastCaptured >= MESSAGE_CAPTURE_THRESHOLD;
  }, []);

  const getLastCapturedMessageCount = useCallback((): number => {
    return lastCapturedMessageCountRef.current;
  }, []);

  return {
    documentation: currentDocumentation,
    isLoading: isLoadingDocumentation,
    isSaving: isSavingDocumentation,

    captureConceptSnapshot,
    captureBuilderChatSnapshot,
    captureLayoutSnapshot,
    capturePlanSnapshot,
    recordPhaseStart,
    recordPhaseComplete,

    startBuild,
    completeBuild,
    failBuild,

    refreshDocumentation,
    createDocumentation,
    getOrCreateDocumentation,

    shouldCaptureAtMessageCount,
    getLastCapturedMessageCount,
  };
}

export default useProjectDocumentation;
