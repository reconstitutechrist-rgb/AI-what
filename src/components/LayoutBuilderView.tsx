/**
 * Layout Builder View
 *
 * Main orchestrator for the virtual reality engine.
 * Combines OmniChat (left) with the LayoutCanvas preview or Vision Board (right).
 *
 * Message flow:
 *   Text-only → OmniChat API → AI response + action classification
 *     action: 'none'      → just show reply
 *     action: 'pipeline'  → run Titan pipeline
 *     action: 'autonomy'  → run pipeline (Router detects RESEARCH_AND_BUILD)
 *     action: 'live-edit' → run refineComponent
 *   Media → pipeline directly (image/video analysis)
 */

'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { OmniChat, type UploadedMedia } from './interface/OmniChat';
import { VisionPreview } from './interface/VisionPreview';
import { LayoutCanvas } from './layout-builder/LayoutCanvas';
import { useLayoutBuilder } from '@/hooks/useLayoutBuilder';
import { useAppStore } from '@/store/useAppStore';
import { useChatStore } from '@/store/useChatStore';
import { useProjectManager } from '@/hooks/useProjectManager';
import { ProjectList } from './projects/ProjectList';
import { ProjectSaveModal } from './projects/ProjectSaveModal';
import type { AppContext, OmniChatAction, VisionBoardResponse } from '@/types/titanPipeline';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LayoutBuilderView: React.FC = () => {
  // --- App context for personalized generation ---
  const appConcept = useAppStore((state) => state.appConcept);

  // --- Vision Board / Planning Mode State ---
  const chatMode = useAppStore((state) => state.chatMode);
  const visionDocument = useAppStore((state) => state.visionDocument);
  const setChatMode = useAppStore((state) => state.setChatMode);
  const setVisionDocument = useAppStore((state) => state.setVisionDocument);

  // --- Project Management ---
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const isAutoSavingRef = useRef(false);

  const {
    projects,
    loading: projectsLoading,
    saveProject,
    loadProject,
    createNewProject,
    deleteProject,
  } = useProjectManager();

  const handleOpenProject = async (id: string) => {
    await loadProject(id);
    setShowProjectsModal(false);
  };

  const handleNewProject = () => {
    createNewProject();
    // Also reset OmniChat (separate store from appStore)
    useChatStore.getState().clearHistory();
    // Reset Vision Board state
    setVisionDocument(null);
    setChatMode('planning');
    setShowProjectsModal(false);
  };

  const handleSaveProject = async (name: string) => {
    await saveProject(name);
    setShowSaveModal(false);
  };

  // Smart save: if project already exists, save silently; otherwise open the name modal
  const [isSaving, setIsSaving] = useState(false);
  const handleSmartSave = async () => {
    const currentId = useAppStore.getState().currentAppId;
    if (currentId) {
      // Project exists → save directly, no modal needed
      setIsSaving(true);
      try {
        await saveProject();
      } catch (err) {
        console.error('[SmartSave] Failed:', err);
      } finally {
        setIsSaving(false);
      }
    } else {
      // First save → show name modal
      setShowSaveModal(true);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteProject(id);
    }
  };

  const currentProjectName = appConcept?.name || 'Untitled Project';
  const hasExistingProject = useAppStore((state) => !!state.currentAppId);

  const appContext: AppContext | undefined = useMemo(() => {
    if (!appConcept) return undefined;
    return {
      name: appConcept.name,
      colorScheme: appConcept.uiPreferences?.colorScheme,
      primaryColor: appConcept.uiPreferences?.primaryColor,
      style: appConcept.uiPreferences?.style,
    };
  }, [appConcept]);

  // --- Chat store (persistent messages) ---
  const addMessage = useChatStore((s) => s.addMessage);
  const messages = useChatStore((s) => s.messages);

  // --- Active action tracking ---
  const [activeAction, setActiveAction] = useState<OmniChatAction | null>(null);

  // --- Layout builder hook (single source of truth) ---
  const {
    generatedFiles,
    isProcessing,
    isChatting,
    pipelineProgress,
    errors,
    warnings,
    runPipeline,
    refineComponent,
    sendChatMessage,
    undo,
    redo,
    exportCode,
    clearErrors,
    canUndo,
    canRedo,
    isValidating,
    validationStatus,
    validationErrors,
    repairAttempts,
    critiqueScore,
    isCritiquing,
    critiqueIssues,
    executeAction,
  } = useLayoutBuilder();

  // --- Serialize the FULL VisionDocument for the pipeline ---
  const serializeVisionForPipeline = useCallback((vision: typeof visionDocument) => {
    if (!vision) return '';

    const featureBlocks = (vision.features || [])
      .map((f, i) => `### Feature ${i + 1}: ${f.title}
- **User Story:** ${f.userStory}
- **Description:** ${f.description}
- **Behavior:** ${f.behavior}
- **Acceptance Criteria:** ${(f.acceptanceCriteria || []).join('; ')}
- **Edge Cases:** ${f.edgeCases}
- **UX Notes:** ${f.uxNotes}
- **Complexity:** ${f.complexityLevel}`)
      .join('\n\n');

    return `# ${vision.name}

## Overview
${vision.overview}

## Core Purpose
${vision.corePurpose}

## Target Audience
${vision.targetAudience}

## Competitive Edge
${vision.competitiveEdge}

## Features
${featureBlocks}

## User Flow
${vision.userFlow}

## Page Breakdown
${vision.pageBreakdown}

## Design System
${vision.designSystem}`;
  }, []);

  // --- Handle "Start Building" from VisionPreview ---
  const handleStartBuilding = useCallback(() => {
    setChatMode('building');
    addMessage({
      role: 'system',
      content: 'Vision confirmed. Switching to Builder Mode. Running Tech Scout → Blueprint Planner → Builder...',
    });

    if (visionDocument) {
      const fullConcept = serializeVisionForPipeline(visionDocument);
      setActiveAction('pipeline');
      runPipeline([], fullConcept, appContext).finally(() => setActiveAction(null));
    }
  }, [setChatMode, addMessage, visionDocument, runPipeline, appContext, serializeVisionForPipeline]);

  // --- Handle media uploads (always pipeline) ---
  const handleMediaPipeline = useCallback(
    async (media: UploadedMedia[], instructions?: string) => {
      if (media.length === 0) return;

      // If we upload media, we implicitly switch to building mode
      if (chatMode === 'planning') {
        setChatMode('building');
        addMessage({
          role: 'system',
          content: 'Media uploaded. Switching to Builder Mode.',
        });
      }

      const prompt =
        instructions ||
        (media.length > 0 ? 'Analyze these files and build the layout' : 'Generate layout');

      setActiveAction('pipeline');

      try {
        await runPipeline(
          media.map((m) => m.file),
          prompt,
          appContext
        );
      } catch (error) {
        console.error('Pipeline failed:', error);
        addMessage({
          role: 'system',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      } finally {
        setActiveAction(null);
      }
    },
    [runPipeline, appContext, addMessage, chatMode, setChatMode]
  );

  // --- Handle all messages from OmniChat ---
  const handleSendMessage = useCallback(
    async (message: string, media: UploadedMedia[]) => {
      if (!message.trim() && media.length === 0) return;

      // Add user message to persistent store
      addMessage({
        role: 'user',
        content:
          media.length > 0
            ? `${message || 'Analyze and build from uploaded media'} [${media.length} file(s)]`
            : message,
      });

      // Media path — always pipeline (triggers building mode)
      if (media.length > 0) {
        await handleMediaPipeline(media, message);
        return;
      }

      // Text-only path
      try {
        // Build conversation history (last 20, exclude system)
        const conversationHistory = [
          ...messages
            .filter((m) => m.role !== 'system')
            .slice(-19)
            .map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
          { role: 'user' as const, content: message },
        ];

        // PLANNING MODE — hit vision board API
        if (chatMode === 'planning') {
          setActiveAction('autonomy'); // Visual indicator for "thinking"

          const response = await fetch('/api/layout/vision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message,
              conversationHistory,
              currentVision: visionDocument,
            }),
          });

          if (!response.ok) throw new Error('Failed to contact Vision Board');

          const data: VisionBoardResponse = await response.json();

          addMessage({
            role: 'assistant',
            content: data.reply,
          });

          if (data.visionUpdate) {
            setVisionDocument({
              ...(visionDocument || {
                name: '',
                overview: '',
                corePurpose: '',
                targetAudience: '',
                competitiveEdge: '',
                features: [],
                userFlow: '',
                pageBreakdown: '',
                designSystem: '',
              }),
              ...data.visionUpdate,
            });

            // Auto-save on first input — create project slot immediately
            // Guard prevents duplicate project creation from rapid typing
            const currentId = useAppStore.getState().currentAppId;
            if (!currentId && !isAutoSavingRef.current) {
              isAutoSavingRef.current = true;
              const projectName = data.visionUpdate.name || message.slice(0, 50) || 'New Project';
              saveProject(projectName)
                .catch((err: unknown) =>
                  console.error('[AutoSave] Failed to create project slot:', err)
                )
                .finally(() => {
                  isAutoSavingRef.current = false;
                });
            }
          }

          setActiveAction(null);
          return;
        }

        // BUILDING MODE — standard OmniChat
        const chatResponse = await sendChatMessage(message, conversationHistory, appContext);

        addMessage({
          role: 'assistant',
          content: chatResponse.reply,
        });

        if (chatResponse.action !== 'none' && chatResponse.actionPayload) {
          await executeAction(
            chatResponse.action,
            chatResponse.actionPayload.instructions,
            chatResponse.actionPayload.selectedDataId,
            chatResponse.actionPayload.cachedSkillId
          );
        }
      } catch (error) {
        addMessage({
          role: 'system',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
        setActiveAction(null);
      }
    },
    [
      addMessage,
      handleMediaPipeline,
      messages,
      sendChatMessage,
      appContext,
      chatMode,
      visionDocument,
      setVisionDocument,
      executeAction,
    ]
  );

  // --- Handle file drops on the canvas ---
  const handleDropFiles = useCallback(
    (files: File[]) => {
      const mediaFiles = files.filter(
        (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
      );
      if (mediaFiles.length === 0) return;

      addMessage({
        role: 'user',
        content: `Dropped ${mediaFiles.length} file${mediaFiles.length > 1 ? 's' : ''} for analysis`,
      });

      handleMediaPipeline(
        mediaFiles.map((f) => ({
          id: Math.random().toString(36).substr(2, 9),
          file: f,
          previewUrl: URL.createObjectURL(f),
          type: f.type.startsWith('video/') ? ('video' as const) : ('image' as const),
        })),
        ''
      );
    },
    [addMessage, handleMediaPipeline]
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full bg-black text-white overflow-hidden">
        {/* Global Header */}
        <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-slate-900/50 backdrop-blur-md shrink-0 z-10 w-full relative">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/30">
                AI
              </div>
              <span className="font-bold text-lg tracking-tight">Virtual World Engine</span>
            </div>
            <div className="h-6 w-px bg-white/10 mx-2" />
            <span className="text-slate-400 text-sm font-medium">
              {currentProjectName}
              {chatMode === 'planning' && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs uppercase tracking-wide">
                  Planning
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProjectsModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-sm font-medium flex items-center gap-2 border border-white/5"
            >
              <span>📂</span> Projects
            </button>
            <button
              onClick={handleSmartSave}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-sm font-medium flex items-center gap-2 border border-white/5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <span>💾</span> {hasExistingProject ? 'Save' : 'Save As...'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Builder Workspace — two-panel layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: OmniChat */}
          <div className="w-[400px] min-w-[320px] border-r border-white/10 flex flex-col bg-[#0d1117]">
            <OmniChat
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing || activeAction !== null}
              isChatting={isChatting}
              pipelineProgress={pipelineProgress}
              activeAction={activeAction}
            />
          </div>

          {/* Right Panel: Vision Board (planning) or LayoutCanvas (building) */}
          <div className="flex-1 bg-[#0d1117] relative flex flex-col">
            {chatMode === 'planning' ? (
              <VisionPreview
                vision={visionDocument}
                onStartBuilding={handleStartBuilding}
              />
            ) : (
              <LayoutCanvas
                generatedFiles={generatedFiles}
                isProcessing={isProcessing}
                pipelineProgress={pipelineProgress}
                errors={errors}
                warnings={warnings}
                onDropFiles={handleDropFiles}
                onRefineComponent={refineComponent}
                onUndo={undo}
                onRedo={redo}
                onExportCode={exportCode}
                onClearErrors={clearErrors}
                canUndo={canUndo}
                canRedo={canRedo}
                isValidating={isValidating}
                validationStatus={validationStatus}
                validationErrors={validationErrors}
                repairAttempts={repairAttempts}
                critiqueScore={critiqueScore}
                isCritiquing={isCritiquing}
                critiqueIssues={critiqueIssues}
                onRetryBuild={visionDocument ? handleStartBuilding : undefined}
              />
            )}
          </div>
        </div>

        {/* Projects Modal */}
        {showProjectsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-4xl max-h-[80vh] overflow-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Your Projects
                </h2>
                <button
                  onClick={() => setShowProjectsModal(false)}
                  className="rounded-full p-2 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>
              <ProjectList
                projects={projects}
                currentProjectId={null}
                onOpen={handleOpenProject}
                onDelete={handleDeleteProject}
                onNew={handleNewProject}
                loading={projectsLoading}
              />
            </div>
          </div>
        )}

        {/* Save Modal */}
        <ProjectSaveModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveProject}
          initialName={currentProjectName}
        />
      </div>
    </ErrorBoundary>
  );
};

export default LayoutBuilderView;
