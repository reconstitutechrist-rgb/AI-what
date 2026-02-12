import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import * as ProjectDB from '@/services/ProjectDatabase';
import { SavedProject, ProjectListItem } from '@/types/project';
import { v4 as uuidv4 } from 'uuid';

export function useProjectManager() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selector for all state needed to save a project
  const fullState = useAppStore((state) => ({
    appConcept: state.appConcept,
    generatedFiles: state.generatedFiles,
    currentLayoutManifest: state.currentLayoutManifest,
    currentDesignSpec: state.currentDesignSpec,
    currentComponent: state.currentComponent,
    isReviewed: state.isReviewed,
    buildSettings: state.buildSettings,
    layoutThumbnail: state.layoutThumbnail,
    dynamicPhasePlan: state.dynamicPhasePlan,
    phasePlanGeneratedAt: state.phasePlanGeneratedAt,
    chatMessages: state.chatMessages,
    currentAppId: state.currentAppId,
  }));

  const { setCurrentAppId, setAppConcept, setGeneratedFiles, setCurrentLayoutManifest, setCurrentDesignSpec, setCurrentComponent, setIsReviewed, setBuildSettings, setLayoutThumbnail, setDynamicPhasePlan, setPhasePlanGeneratedAt, setChatMessages, clearChatMessages } = useAppStore();

  // Load project list on mount
  const refreshProjects = useCallback(async () => {
    try {
      setLoading(true);
      const list = await ProjectDB.listProjects();
      setProjects(list);
    } catch (err) {
      console.error('Failed to list projects:', err);
      setError('Failed to load project list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const saveProject = async (nameOverride?: string) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Determine ID
      const projectId = fullState.currentAppId || uuidv4();

      // 2. Determine Name & Description
      const name = nameOverride || fullState.appConcept?.name || 'Untitled Project';
      const description = fullState.appConcept?.description || 'No description';

      // 3. Construct SavedProject
      const project: SavedProject = {
        id: projectId,
        name,
        description,
        createdAt: new Date().toISOString(), // In a real app, we might want to preserve original createdAt
        updatedAt: new Date().toISOString(),
        buildStatus: 'designing', // Default for now, could be derived
        
        // State Snapshots
        appConcept: fullState.appConcept,
        generatedFiles: fullState.generatedFiles,
        currentLayoutManifest: fullState.currentLayoutManifest,
        currentDesignSpec: fullState.currentDesignSpec,
        currentComponent: fullState.currentComponent,
        isReviewed: fullState.isReviewed,
        buildSettings: fullState.buildSettings,
        layoutThumbnail: fullState.layoutThumbnail,
        dynamicPhasePlan: fullState.dynamicPhasePlan,
        phasePlanGeneratedAt: fullState.phasePlanGeneratedAt,
        chatMessages: fullState.chatMessages,
      };

      // 4. Save to DB
      await ProjectDB.saveProject(project);

      // 5. Update Store with ID if it was new
      if (!fullState.currentAppId) {
        setCurrentAppId(projectId);
      }

      await refreshProjects();
      return projectId;
    } catch (err) {
      console.error('Failed to save project:', err);
      setError('Failed to save project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadProject = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const project = await ProjectDB.loadProject(id);
      if (!project) {
        throw new Error(`Project ${id} not found`);
      }

      // Hydrate Store
      setCurrentAppId(project.id);
      setAppConcept(project.appConcept);
      setGeneratedFiles(project.generatedFiles);
      setCurrentLayoutManifest(project.currentLayoutManifest);
      setCurrentDesignSpec(project.currentDesignSpec);
      setCurrentComponent(project.currentComponent);
      setIsReviewed(project.isReviewed);
      setBuildSettings(project.buildSettings);
      setLayoutThumbnail(project.layoutThumbnail);
      setDynamicPhasePlan(project.dynamicPhasePlan);
      setPhasePlanGeneratedAt(project.phasePlanGeneratedAt);
      setChatMessages(project.chatMessages);

    } catch (err) {
      console.error('Failed to load project:', err);
      setError('Failed to load project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createNewProject = useCallback(() => {
    // Reset Store to Defaults
    setCurrentAppId(null);
    setAppConcept(null);
    setGeneratedFiles([]);
    setCurrentLayoutManifest(null);
    setCurrentDesignSpec(null);
    setCurrentComponent(null);
    setIsReviewed(false);
    setBuildSettings({ autoAdvance: true });
    setLayoutThumbnail(null);
    setDynamicPhasePlan(null);
    setPhasePlanGeneratedAt(null);
    clearChatMessages();
    
    // Specifically trigger a "Welcome" message for the new chat
    // This part essentially mimics the initial state of the store
    useAppStore.getState().addChatMessage({
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: 'Hello! I am your Autopoietic Assistant. I can help you build, edit, or even learn new skills. How can I help?',
        timestamp: new Date().toISOString(),
    });

  }, [setCurrentAppId, setAppConcept, setGeneratedFiles, setCurrentLayoutManifest, setCurrentDesignSpec, setCurrentComponent, setIsReviewed, setBuildSettings, setLayoutThumbnail, setDynamicPhasePlan, setPhasePlanGeneratedAt, clearChatMessages]);

  const deleteProject = async (id: string) => {
    try {
      setLoading(true);
      await ProjectDB.deleteProject(id);
      
      // If deleting current project, reset
      if (fullState.currentAppId === id) {
        createNewProject();
      }
      
      await refreshProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
      setError('Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  return {
    projects,
    loading,
    error,
    saveProject,
    loadProject,
    createNewProject,
    deleteProject,
    refreshProjects
  };
}
