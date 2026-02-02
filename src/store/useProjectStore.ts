/**
 * Project Store
 *
 * Zustand store for reactive project list state.
 * IndexedDB (via ProjectDatabase) is the source of truth for project data.
 * This store holds the in-memory project list for UI rendering and
 * a small piece of persisted state (activeProjectId) in localStorage.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectListItem } from '@/types/project';
import { listProjects } from '@/services/ProjectDatabase';

interface ProjectStoreState {
  /** Lightweight project list for UI rendering (loaded from IndexedDB) */
  projectList: ProjectListItem[];
  /** ID of the currently active/loaded project */
  activeProjectId: string | null;
  /** Whether the project list modal is visible */
  showProjectList: boolean;
  /** Whether a DB operation is in progress */
  isLoading: boolean;

  // Actions
  refreshProjectList: () => Promise<void>;
  setActiveProjectId: (id: string | null) => void;
  setShowProjectList: (show: boolean) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useProjectStore = create<ProjectStoreState>()(
  persist(
    (set) => ({
      projectList: [],
      activeProjectId: null,
      showProjectList: false,
      isLoading: false,

      refreshProjectList: async () => {
        set({ isLoading: true });
        try {
          const projects = await listProjects();
          set({ projectList: projects });
        } catch (error) {
          console.error('[useProjectStore] Failed to load project list:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      setActiveProjectId: (id) => set({ activeProjectId: id }),
      setShowProjectList: (show) => set({ showProjectList: show }),
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'project-store',
      // Only persist the activeProjectId (tiny, just a string)
      // projectList is loaded from IndexedDB on demand
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
      }),
    }
  )
);
