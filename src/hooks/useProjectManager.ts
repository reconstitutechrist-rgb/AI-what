/**
 * useProjectManager Hook
 *
 * Orchestrates project save/load/new/delete operations.
 * Reads from the active state layer (useAppStore + useChatStore)
 * and writes to the project library (IndexedDB via ProjectDatabase).
 *
 * All operations are async since IndexedDB is async.
 */

import { useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useChatStore } from '@/store/useChatStore';
import { useProjectStore } from '@/store/useProjectStore';
import * as ProjectDB from '@/services/ProjectDatabase';
import type { SavedProject } from '@/types/project';

export interface UseProjectManagerReturn {
  /** Save the current project state to IndexedDB */
  saveCurrentProject: (name?: string) => Promise<string>;
  /** Load a project from IndexedDB and restore all state */
  loadProject: (projectId: string) => Promise<void>;
  /** Auto-save current work, then clear all state for a fresh project */
  startNewProject: () => Promise<void>;
  /** Delete a project from IndexedDB */
  deleteProject: (projectId: string) => Promise<void>;
  /** Whether there is an active project that could be saved */
  hasActiveProject: boolean;
}

/**
 * Determine build status from current app state.
 */
function deriveBuildStatus(
  appConcept: unknown,
  layoutManifest: unknown,
  isReviewed: boolean,
  generatedFilesCount: number
): SavedProject['buildStatus'] {
  if (generatedFilesCount > 0) return 'building';
  if (isReviewed) return 'building';
  if (layoutManifest) return 'designing';
  if (appConcept) return 'planning';
  return 'planning';
}

export function useProjectManager(): UseProjectManagerReturn {
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId);
  const refreshProjectList = useProjectStore((s) => s.refreshProjectList);

  const hasActiveProject = activeProjectId !== null ||
    useAppStore.getState().generatedFiles.length > 0 ||
    useAppStore.getState().appConcept !== null;

  /**
   * Save the current project state to IndexedDB.
   * If an activeProjectId exists, updates the existing project.
   * Otherwise creates a new one.
   * Returns the project ID.
   */
  const saveCurrentProject = useCallback(
    async (name?: string): Promise<string> => {
      const appState = useAppStore.getState();
      const chatState = useChatStore.getState();
      const projectStore = useProjectStore.getState();

      const now = new Date().toISOString();
      const projectId = projectStore.activeProjectId ?? crypto.randomUUID();
      const isExisting = projectStore.activeProjectId !== null;

      // Determine project name
      const projectName =
        name ||
        appState.currentComponent?.name ||
        appState.appConcept?.name ||
        'Untitled Project';

      const project: SavedProject = {
        id: projectId,
        name: projectName,
        description: appState.appConcept?.description || appState.appConcept?.purpose || '',
        createdAt: isExisting
          ? ((await ProjectDB.loadProject(projectId))?.createdAt ?? now)
          : now,
        updatedAt: now,
        buildStatus: deriveBuildStatus(
          appState.appConcept,
          appState.currentLayoutManifest,
          appState.isReviewed,
          appState.generatedFiles.length
        ),

        // Core data snapshots
        appConcept: appState.appConcept,
        generatedFiles: appState.generatedFiles,
        currentLayoutManifest: appState.currentLayoutManifest,
        currentDesignSpec: appState.currentDesignSpec,
        currentComponent: appState.currentComponent,
        isReviewed: appState.isReviewed,
        buildSettings: appState.buildSettings,
        layoutThumbnail: appState.layoutThumbnail,
        dynamicPhasePlan: appState.dynamicPhasePlan,
        phasePlanGeneratedAt: appState.phasePlanGeneratedAt,

        // Chat history
        chatMessages: chatState.messages,
      };

      await ProjectDB.saveProject(project);
      setActiveProjectId(projectId);
      await refreshProjectList();

      return projectId;
    },
    [setActiveProjectId, refreshProjectList]
  );

  /**
   * Load a project from IndexedDB and restore all state.
   */
  const loadProject = useCallback(
    async (projectId: string): Promise<void> => {
      const project = await ProjectDB.loadProject(projectId);
      if (!project) {
        console.error('[useProjectManager] Project not found:', projectId);
        return;
      }

      const appStore = useAppStore.getState();
      const chatStore = useChatStore.getState();

      // Restore all app state
      appStore.setAppConcept(project.appConcept);
      appStore.setGeneratedFiles(project.generatedFiles);
      appStore.setCurrentLayoutManifest(project.currentLayoutManifest);
      appStore.setCurrentDesignSpec(project.currentDesignSpec);
      appStore.setCurrentComponent(project.currentComponent);
      appStore.setIsReviewed(project.isReviewed);
      appStore.setBuildSettings(project.buildSettings);
      appStore.setLayoutThumbnail(project.layoutThumbnail);
      appStore.setDynamicPhasePlan(project.dynamicPhasePlan);
      appStore.setPhasePlanGeneratedAt(project.phasePlanGeneratedAt);

      // Restore chat history
      chatStore.setMessages(project.chatMessages);

      // Mark as active
      setActiveProjectId(projectId);
    },
    [setActiveProjectId]
  );

  /**
   * Save current work (if any), then clear all state for a fresh project.
   */
  const startNewProject = useCallback(async (): Promise<void> => {
    // Auto-save current project if there's meaningful state
    const appState = useAppStore.getState();
    const hasContent =
      appState.generatedFiles.length > 0 ||
      appState.appConcept !== null ||
      appState.currentComponent !== null;

    if (hasContent && useProjectStore.getState().activeProjectId !== null) {
      await saveCurrentProject();
    }

    // Clear all project state (new system + legacy fields)
    const store = useAppStore.getState();
    store.setAppConcept(null);
    store.setGeneratedFiles([]);
    store.setCurrentLayoutManifest(null);
    store.setCurrentDesignSpec(null);
    store.setCurrentComponent(null);
    store.setIsReviewed(false);
    store.setBuildSettings({ autoAdvance: true });
    store.setLayoutThumbnail(null);
    store.setDynamicPhasePlan(null);
    store.setPhasePlanGeneratedAt(null);
    store.setNewAppStagePlan(null);
    store.setImplementationPlan(null);
    store.setComponents([]);
    store.setUndoStack([]);
    store.setRedoStack([]);

    // Reset chat
    useChatStore.getState().clearHistory();

    // Clear active project
    setActiveProjectId(null);
  }, [saveCurrentProject, setActiveProjectId]);

  /**
   * Delete a project from IndexedDB.
   * If it's the active project, clears state.
   */
  const deleteProject = useCallback(
    async (projectId: string): Promise<void> => {
      await ProjectDB.deleteProject(projectId);

      // If deleting the active project, clear state
      if (useProjectStore.getState().activeProjectId === projectId) {
        setActiveProjectId(null);
      }

      await refreshProjectList();
    },
    [setActiveProjectId, refreshProjectList]
  );

  return {
    saveCurrentProject,
    loadProject,
    startNewProject,
    deleteProject,
    hasActiveProject,
  };
}
