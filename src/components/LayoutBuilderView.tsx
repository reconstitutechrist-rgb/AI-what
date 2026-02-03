/**
 * Layout Builder View
 *
 * Main orchestrator for the virtual reality engine.
 * Combines OmniChat (left) with the Sandpack preview canvas (right).
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

import React, { useState, useCallback, useMemo } from 'react';
import { OmniChat, type UploadedMedia } from './interface/OmniChat';
import { LayoutCanvas } from './layout-builder/LayoutCanvas';
import { useLayoutBuilder } from '@/hooks/useLayoutBuilder';
import { useAppStore } from '@/store/useAppStore';
import { useChatStore } from '@/store/useChatStore';
import type { AppContext, OmniChatAction } from '@/types/titanPipeline';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LayoutBuilderView: React.FC = () => {
  // --- App context for personalized generation ---
  const appConcept = useAppStore((state) => state.appConcept);

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
  } = useLayoutBuilder();

  // --- Handle media uploads (always pipeline) ---
  const handleMediaPipeline = useCallback(
    async (media: UploadedMedia[], instructions?: string) => {
      if (media.length === 0) return;

      setActiveAction('pipeline');

      try {
        const files = media.map((m) => m.file);
        await runPipeline(files, instructions || '', appContext);

        const hint =
          media.length > 1
            ? `Analyzed ${media.length} files and created a merged layout.`
            : `Analyzed the ${media[0].type} and created a layout.`;

        addMessage({
          role: 'assistant',
          content: `${hint} Click on any component in the preview to edit it, or describe further changes.`,
        });
      } catch (error) {
        addMessage({
          role: 'system',
          content: `Failed to analyze media: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      } finally {
        setActiveAction(null);
      }
    },
    [runPipeline, appContext, addMessage]
  );

  // --- Execute an action returned by the chat AI ---
  const executeAction = useCallback(
    async (action: OmniChatAction, instructions: string, selectedDataId?: string, cachedSkillId?: string) => {
      setActiveAction(action);

      try {
        switch (action) {
          case 'pipeline':
            await runPipeline([], instructions, appContext, cachedSkillId);
            addMessage({
              role: 'system',
              content: 'Layout updated. Check the preview.',
              metadata: { context: 'Pipeline Complete' },
            });
            break;

          case 'autonomy':
            // The pipeline Router will detect this as RESEARCH_AND_BUILD
            // and delegate to AutonomyCore automatically
            addMessage({
              role: 'system',
              content: 'Activating autonomy system — researching, fabricating agents, and building...',
              metadata: { context: 'Autonomy Core' },
            });
            await runPipeline([], instructions, appContext, cachedSkillId);
            addMessage({
              role: 'system',
              content: 'Autonomy complete. Check the preview.',
              metadata: { context: 'Autonomy Complete' },
            });
            break;

          case 'live-edit':
            if (generatedFiles.length === 0) {
              addMessage({
                role: 'system',
                content: 'No code to edit yet. Describe what you want to build first.',
              });
              break;
            }
            await refineComponent(
              selectedDataId || 'root',
              instructions,
              ''
            );
            addMessage({
              role: 'system',
              content: 'Edit applied. Check the preview.',
              metadata: { context: 'Live Edit' },
            });
            break;
        }
      } catch (error) {
        addMessage({
          role: 'system',
          content: `Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      } finally {
        setActiveAction(null);
      }
    },
    [runPipeline, refineComponent, appContext, generatedFiles.length, addMessage]
  );

  // --- Handle all messages from OmniChat ---
  const handleSendMessage = useCallback(
    async (message: string, media: UploadedMedia[]) => {
      if (!message.trim() && media.length === 0) return;

      // Add user message to persistent store
      addMessage({
        role: 'user',
        content: media.length > 0
          ? `${message || 'Analyze and build from uploaded media'} [${media.length} file(s)]`
          : message,
      });

      // Media path — always pipeline
      if (media.length > 0) {
        await handleMediaPipeline(media, message);
        return;
      }

      // Text-only path — chat first, then dispatch action
      try {
        // Build conversation history for the AI (last 20, exclude system)
        const conversationHistory = messages
          .filter((m) => m.role !== 'system')
          .slice(-20)
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));

        // Get AI response with intent classification
        const chatResponse = await sendChatMessage(
          message,
          conversationHistory,
          appContext
        );

        // Display AI's conversational reply
        addMessage({
          role: 'assistant',
          content: chatResponse.reply,
        });

        // Execute the classified action (if any)
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
      }
    },
    [addMessage, handleMediaPipeline, messages, sendChatMessage, appContext, executeAction]
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

      setActiveAction('pipeline');
      runPipeline(mediaFiles, '', appContext)
        .then(() => {
          addMessage({
            role: 'assistant',
            content: 'Layout generated from dropped files. Click on any component to edit it.',
          });
        })
        .catch((error) => {
          addMessage({
            role: 'system',
            content: `Failed to process dropped files: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        })
        .finally(() => {
          setActiveAction(null);
        });
    },
    [runPipeline, appContext, addMessage]
  );

  return (
    <div className="flex h-full w-full">
      {/* Left Panel: OmniChat */}
      <div className="w-[400px] min-w-[320px] max-w-[500px] flex-shrink-0 h-full">
        <OmniChat
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
          isChatting={isChatting}
          pipelineProgress={pipelineProgress}
          activeAction={activeAction}
        />
      </div>

      {/* Right Panel: Preview Canvas */}
      <div className="flex-1 h-full overflow-hidden">
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
        />
      </div>
    </div>
  );
};

export default LayoutBuilderView;
