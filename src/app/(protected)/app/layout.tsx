'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { AppNavigation } from '@/components/AppNavigation';
import { SideDrawer } from '@/components/SideDrawer';
import { ProjectListModal } from '@/components/modals/ProjectListModal';
import { ToastProvider } from '@/components/Toast';
import { useAppStore } from '@/store/useAppStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useProjectManager } from '@/hooks/useProjectManager';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get project info from store
  const currentComponent = useAppStore((state) => state.currentComponent);
  const components = useAppStore((state) => state.components);
  const appConcept = useAppStore((state) => state.appConcept);
  const setShowVersionHistory = useAppStore((state) => state.setShowVersionHistory);
  const showVersionHistory = useAppStore((state) => state.showVersionHistory);
  const setShowLibrary = useAppStore((state) => state.setShowLibrary);
  const showLibrary = useAppStore((state) => state.showLibrary);
  const setShowSettings = useAppStore((state) => state.setShowSettings);

  // Project management
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const refreshProjectList = useProjectStore((state) => state.refreshProjectList);
  const { saveCurrentProject } = useProjectManager();

  // Load project list on mount
  useEffect(() => {
    refreshProjectList();
  }, [refreshProjectList]);

  // Auto-save every 30 seconds when there's an active project
  const lastSaveRef = useRef<string>('');
  useEffect(() => {
    if (!activeProjectId) return;

    const interval = setInterval(() => {
      // Dirty check: compare a fingerprint of key state to avoid unnecessary writes
      const appState = useAppStore.getState();
      const fingerprint = JSON.stringify({
        fileCount: appState.generatedFiles.length,
        filePaths: appState.generatedFiles.map((f) => f.path),
        fileContentLengths: appState.generatedFiles.map((f) => f.content.length),
        concept: appState.appConcept?.name,
        conceptUpdated: appState.appConcept?.updatedAt,
        reviewed: appState.isReviewed,
        designSpec: appState.currentDesignSpec !== null,
        component: appState.currentComponent?.name,
      });

      if (fingerprint !== lastSaveRef.current) {
        lastSaveRef.current = fingerprint;
        saveCurrentProject().catch(console.error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeProjectId, saveCurrentProject]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await saveCurrentProject();
    } catch (error) {
      console.error('[AppLayout] Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [saveCurrentProject]);

  const handleShowHistory = () => {
    setShowVersionHistory(!showVersionHistory);
  };

  const handleShowLibrary = () => {
    setShowLibrary(!showLibrary);
  };

  const handleShowSettings = () => {
    setShowSettings(true);
    setDrawerOpen(false);
  };

  const projectName =
    currentComponent?.name || appConcept?.name || 'Untitled Project';

  return (
    <ToastProvider>
      <div
        className="min-h-screen relative overflow-hidden"
        style={{ background: 'var(--bg-primary)' }}
      >
        {/* Animated Background Gradients */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-0 -left-1/4 w-[600px] h-[600px] bg-garden-600/10 rounded-full blur-[120px]"
            animate={{
              x: [0, 30, 0],
              y: [0, 20, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute top-1/3 -right-1/4 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-[120px]"
            animate={{
              x: [0, -20, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute -bottom-1/4 left-1/3 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-[100px]"
            animate={{
              x: [0, 25, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Navigation */}
        <AppNavigation
          projectName={projectName}
          onSave={handleSave}
          isSaving={isSaving}
          onMenuClick={() => setDrawerOpen(true)}
        />

        {/* Main Content */}
        <main className="relative pt-14 md:pt-14">{children}</main>

        {/* Side Drawer */}
        <SideDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onShowSettings={handleShowSettings}
          onShowHistory={handleShowHistory}
          onShowLibrary={handleShowLibrary}
          versionCount={currentComponent?.versions?.length || 0}
          appCount={components.length}
        />

        {/* Project List Modal */}
        <ProjectListModal />
      </div>
    </ToastProvider>
  );
}
