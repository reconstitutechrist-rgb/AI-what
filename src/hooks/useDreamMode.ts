/**
 * useDreamMode — Dream Mode orchestration hook
 *
 * Connects the UI to the MaintenanceCampaign workflow.
 * Manages campaign lifecycle, goal queue, and dream logs.
 *
 * Usage:
 *   const dream = useDreamMode();
 *   dream.start(); // Begin dream cycle
 *   dream.addGoal('Add dark mode toggle');
 *   dream.stop(); // Abort
 */

'use client';

import { useState, useCallback, useRef, type RefObject } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useSettings } from '@/hooks/useSettings';
import { MaintenanceCampaign } from '@/workflows/MaintenanceCampaign';
import { getQAChaosAgent } from '@/agents/QA_ChaosAgent';
import type {
  CampaignPhase,
  CrashReport,
  DreamGoal,
  DreamStats,
  DiscoveryReport,
} from '@/types/dream';

export interface UseDreamModeOptions {
  /** Ref to the preview iframe for Strategy B chaos testing */
  iframeRef?: RefObject<HTMLIFrameElement | null>;
}

export interface UseDreamMode {
  /** Whether a dream cycle is currently running */
  isDreaming: boolean;
  /** Current campaign phase */
  currentPhase: CampaignPhase;
  /** Real-time stats from the running campaign */
  stats: DreamStats | null;
  /** Terminal log messages */
  logs: string[];
  /** The goal queue (user + discovery goals) */
  goalQueue: DreamGoal[];
  /** Latest discovery report */
  discoveryReport: DiscoveryReport | null;

  /** Start a dream cycle */
  start: () => Promise<void>;
  /** Stop the current cycle */
  stop: () => void;
  /** Add a goal to the queue */
  addGoal: (prompt: string) => void;
  /** Remove a goal from the queue */
  removeGoal: (goalId: string) => void;
  /** Reorder goals in the queue */
  reorderGoals: (goalIds: string[]) => void;
  /** Clear terminal logs */
  clearLogs: () => void;
}

export function useDreamMode(options: UseDreamModeOptions = {}): UseDreamMode {
  const { iframeRef } = options;
  const { settings } = useSettings();
  const campaignRef = useRef<MaintenanceCampaign | null>(null);

  // Local UI state (not persisted)
  const [currentPhase, setCurrentPhase] = useState<CampaignPhase>('IDLE');
  const [logs, setLogs] = useState<string[]>([]);

  // Zustand store state (persisted)
  const isDreaming = useAppStore((s) => s.isDreaming);
  const goalQueue = useAppStore((s) => s.dreamGoalQueue);
  const discoveryReport = useAppStore((s) => s.discoveryReport);
  const stats = useAppStore((s) => s.dreamStats);

  // Zustand store actions
  const setIsDreaming = useAppStore((s) => s.setIsDreaming);
  const addDreamLog = useAppStore((s) => s.addDreamLog);
  const setDreamGoalQueue = useAppStore((s) => s.setDreamGoalQueue);
  const addDreamGoal = useAppStore((s) => s.addDreamGoal);
  const removeDreamGoal = useAppStore((s) => s.removeDreamGoal);
  const reorderDreamGoals = useAppStore((s) => s.reorderDreamGoals);
  const setDiscoveryReport = useAppStore((s) => s.setDiscoveryReport);
  const setDreamStats = useAppStore((s) => s.setDreamStats);

  const appendLog = useCallback((message: string) => {
    setLogs((prev) => [...prev, message]);
  }, []);

  /** Strategy B: run chaos tests inside the preview iframe */
  const handleIframeTestRequest = useCallback(async (script: string): Promise<CrashReport | null> => {
    const iframe = iframeRef?.current;
    if (!iframe) return null;
    const chaosAgent = getQAChaosAgent();
    return chaosAgent.runIframeTests(iframe, script);
  }, [iframeRef]);

  const start = useCallback(async () => {
    // Guard against parallel campaigns (e.g., double-click)
    if (campaignRef.current) {
      appendLog('[WARN] A dream cycle is already running.');
      return;
    }

    const { dream } = settings;
    if (!dream.repoUrl) {
      appendLog('[ERROR] No repository URL configured. Set it in Settings > Dream Mode.');
      return;
    }

    setIsDreaming(true);
    setLogs([]);
    setCurrentPhase('LOADING');
    setDreamStats(null);

    // Merge goals from settings (configured in DreamToggle) into store queue
    // to ensure both sources are captured
    const settingsGoals = dream.goalQueue || [];
    const storeGoalIds = new Set(goalQueue.map((g) => g.id));
    for (const sg of settingsGoals) {
      if (!storeGoalIds.has(sg.id)) {
        addDreamGoal(sg);
      }
    }
    // Use the merged store queue (updated by addDreamGoal above)
    const mergedQueue = [...goalQueue, ...settingsGoals.filter((sg) => !storeGoalIds.has(sg.id))];

    const campaign = new MaintenanceCampaign({
      profileName: dream.chaosProfile,
      goalQueue: mergedQueue,
      onLog: appendLog,
      onPhaseChange: setCurrentPhase,
      onStatsUpdate: setDreamStats,
      onGoalQueueUpdate: setDreamGoalQueue,
      onDiscoveryReport: setDiscoveryReport,
      onIframeTestRequest: iframeRef?.current ? handleIframeTestRequest : undefined,
    });

    campaignRef.current = campaign;

    try {
      const log = await campaign.run(
        dream.repoUrl,
        dream.githubToken || undefined,
      );

      addDreamLog(log);
      appendLog(`Dream cycle complete. ${log.goalsCompleted} goals, ${log.bugsFound} bugs found, ${log.bugsFixed} fixed.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendLog(`[ERROR] Dream cycle failed: ${message}`);
    } finally {
      setIsDreaming(false);
      setCurrentPhase('DONE');
      campaignRef.current = null;
    }
  }, [
    settings,
    goalQueue,
    appendLog,
    setIsDreaming,
    setDreamStats,
    setDreamGoalQueue,
    setDiscoveryReport,
    addDreamLog,
    addDreamGoal,
    setCurrentPhase,
    iframeRef,
    handleIframeTestRequest,
  ]);

  const stop = useCallback(() => {
    if (campaignRef.current) {
      campaignRef.current.stop();
      appendLog('Stop requested — finishing current operation...');
    }
  }, [appendLog]);

  const addGoal = useCallback((prompt: string) => {
    const goal: DreamGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      prompt,
      status: 'PENDING',
      source: 'user',
      createdAt: Date.now(),
    };
    addDreamGoal(goal);

    // If campaign is running, also add to the live campaign
    if (campaignRef.current) {
      campaignRef.current.addGoal(goal);
    }
  }, [addDreamGoal]);

  const removeGoal = useCallback((goalId: string) => {
    removeDreamGoal(goalId);
  }, [removeDreamGoal]);

  const reorderGoals = useCallback((goalIds: string[]) => {
    reorderDreamGoals(goalIds);
  }, [reorderDreamGoals]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    isDreaming,
    currentPhase,
    stats,
    logs,
    goalQueue,
    discoveryReport,
    start,
    stop,
    addGoal,
    removeGoal,
    reorderGoals,
    clearLogs,
  };
}

export default useDreamMode;
