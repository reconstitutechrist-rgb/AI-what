'use client';

import React, { useRef, useEffect } from 'react';
import type { ChatMessage, StagePlan, Phase } from '../types/aiBuilderTypes';
import type { StreamingProgress as StreamingProgressType } from '../types/streaming';
import { InlineStreamingProgress } from './StreamingProgress';
import {
  MessageSquareIcon,
  SendIcon,
  ImageIcon,
  XIcon,
  BrainIcon,
  ZapIcon,
  CheckCircleIcon,
  ClockIcon,
  LoaderIcon,
  LayersIcon,
  EyeIcon,
  CameraIcon,
  UndoIcon,
  RedoIcon,
} from './ui/Icons';

// ============================================================================
// INTERNAL COMPONENTS
// ============================================================================

interface PhaseProgressCardProps {
  phases: Phase[];
  currentPhase: number;
  onBuildPhase?: (phase: Phase) => void;
}

const PhaseProgressCard: React.FC<PhaseProgressCardProps> = ({
  phases,
  currentPhase,
  onBuildPhase,
}) => (
  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 mb-4">
    <h3 className="text-slate-100 font-medium text-sm mb-3 flex items-center gap-2">
      <LayersIcon size={16} className="text-gold-400" />
      Build Plan ({phases.length} Phases)
    </h3>
    <div className="space-y-2">
      {phases.map((phase, idx) => (
        <div
          key={idx}
          className={`p-3 rounded-lg border transition-colors ${
            phase.status === 'complete'
              ? 'bg-garden-500/10 border-garden-500/30'
              : phase.status === 'building'
                ? 'bg-garden-500/10 border-garden-500/30'
                : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-100 font-medium text-sm">
              Phase {phase.number}: {phase.name}
            </span>
            <div className="flex items-center gap-2">
              {phase.status === 'pending' && idx === currentPhase && onBuildPhase && (
                <button
                  onClick={() => onBuildPhase(phase)}
                  className="px-3 py-1 rounded-md bg-garden-600 hover:bg-garden-700 text-white text-xs font-medium transition-colors"
                >
                  Build
                </button>
              )}
              {phase.status === 'complete' && (
                <CheckCircleIcon size={16} className="text-garden-400" />
              )}
              {phase.status === 'building' && <LoaderIcon size={16} className="text-garden-400" />}
              {phase.status === 'pending' && idx !== currentPhase && (
                <ClockIcon size={16} className="text-slate-500" />
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">{phase.description}</p>
          {phase.features && phase.features.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {phase.features.slice(0, 3).map((feature, fIdx) => (
                <span
                  key={fIdx}
                  className="text-xs bg-slate-700/50 px-2 py-0.5 rounded text-slate-300"
                >
                  {feature.length > 25 ? feature.substring(0, 25) + '...' : feature}
                </span>
              ))}
              {phase.features.length > 3 && (
                <span className="text-xs text-slate-500">+{phase.features.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface ChatPanelProps {
  // Messages
  messages: ChatMessage[];

  // Generation state
  isGenerating: boolean;
  generationProgress: string;

  // Input state
  userInput: string;
  onUserInputChange: (value: string) => void;
  onSendMessage: () => void;

  // Image upload
  uploadedImage: string | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;

  // Mode toggle
  currentMode: 'PLAN' | 'ACT';
  onModeChange: (mode: 'PLAN' | 'ACT') => void;

  // Phase progress (optional)
  stagePlan?: StagePlan | null;
  onBuildPhase?: (phase: Phase) => void;

  // View component action
  onViewComponent?: () => void;

  // Streaming progress (optional)
  streamingProgress?: StreamingProgressType;
  isStreamingActive?: boolean;

  // Design mode capture (optional)
  hasLayoutDesign?: boolean;
  onCapturePreview?: () => Promise<void>;

  // Undo/Redo (optional)
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = React.memo(function ChatPanel({
  messages,
  isGenerating,
  generationProgress,
  userInput,
  onUserInputChange,
  onSendMessage,
  uploadedImage,
  onImageUpload,
  onRemoveImage,
  currentMode,
  onModeChange,
  stagePlan,
  onBuildPhase,
  onViewComponent,
  streamingProgress,
  isStreamingActive,
  hasLayoutDesign,
  onCapturePreview,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change or streaming progress updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isGenerating, isStreamingActive, streamingProgress]);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-full">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-100 flex items-center gap-2">
            <MessageSquareIcon size={16} className="text-slate-400" />
            Chat
          </h2>

          {/* Plan/Act Mode Toggle - Gradient Styled */}
          <div className="flex bg-slate-800/50 backdrop-blur-sm rounded-lg p-0.5 border border-slate-700/50">
            <button
              onClick={() => onModeChange('PLAN')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentMode === 'PLAN'
                  ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-white shadow-lg shadow-gold-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
              title="Plan Mode: AI discusses and explains (no code changes)"
            >
              <BrainIcon size={16} />
              Plan
            </button>
            <button
              onClick={() => onModeChange('ACT')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentMode === 'ACT'
                  ? 'bg-gradient-to-r from-garden-600 to-garden-500 text-white shadow-lg shadow-garden-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
              title="Act Mode: AI can modify code"
            >
              <ZapIcon size={16} />
              Act
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={chatContainerRef} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
        {/* Phase Progress Display */}
        {stagePlan && stagePlan.phases && stagePlan.phases.length > 0 && (
          <PhaseProgressCard
            phases={stagePlan.phases}
            currentPhase={Math.max(0, stagePlan.currentPhase - 1)}
            onBuildPhase={onBuildPhase}
          />
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-garden-600 text-white'
                  : message.role === 'system'
                    ? 'bg-slate-900 border-l-2 border-gold-500 text-slate-300'
                    : 'bg-slate-800 text-slate-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.componentPreview && onViewComponent && (
                <button
                  onClick={onViewComponent}
                  className="mt-3 text-xs px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1.5"
                >
                  <EyeIcon size={12} />
                  View Component
                </button>
              )}
              <p className="text-xs opacity-50 mt-2" suppressHydrationWarning>
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {/* Inline Streaming Progress */}
        {isStreamingActive && streamingProgress && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-4 py-3">
              <InlineStreamingProgress progress={streamingProgress} />
            </div>
          </div>
        )}

        {/* Non-streaming generation indicator */}
        {isGenerating && !isStreamingActive && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-lg px-4 py-3 border border-slate-700">
              <div className="flex items-center gap-3">
                <LoaderIcon size={18} className="text-garden-500" />
                <div>
                  <div className="text-sm font-medium text-slate-200">Generating...</div>
                  {generationProgress && (
                    <div className="text-xs text-slate-400 mt-0.5">{generationProgress}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Undo/Redo Bar - appears after modifications */}
      {(canUndo || canRedo) && (
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-800/50 flex items-center justify-center gap-2">
          <span className="text-xs text-slate-500 mr-2">Recent change:</span>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <UndoIcon size={14} />
            Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Shift+Z)"
          >
            <RedoIcon size={14} />
            Redo
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        {/* Image Preview */}
        {uploadedImage && (
          <div className="mb-3 relative inline-block">
            <img
              src={uploadedImage}
              alt="Uploaded inspiration"
              className="h-20 w-20 object-cover rounded-lg border border-slate-700"
            />
            <button
              onClick={onRemoveImage}
              className="absolute -top-1.5 -right-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-100 rounded-full p-1 transition-colors"
            >
              <XIcon size={12} />
            </button>
            <div className="text-xs text-slate-500 mt-1">Design reference attached</div>
          </div>
        )}

        <div className="flex gap-2">
          {/* Image Upload Button */}
          <label className="btn-icon cursor-pointer" title="Upload image">
            <ImageIcon size={18} />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
              id="chat-panel-image-upload"
              name="chat-panel-image-upload"
            />
          </label>

          {/* Capture Preview Button - shown when layout design exists */}
          {hasLayoutDesign && onCapturePreview && (
            <button
              onClick={onCapturePreview}
              className="btn-icon"
              title="Capture current preview for design feedback"
              disabled={isGenerating}
            >
              <CameraIcon size={18} />
            </button>
          )}

          <input
            type="text"
            value={userInput}
            onChange={(e) => onUserInputChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
            placeholder="Describe what you want to build..."
            disabled={isGenerating}
            className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-garden-500 focus:border-transparent disabled:opacity-50 transition-colors"
            id="chat-panel-user-message"
            name="chat-panel-user-message"
            autoComplete="off"
          />
          <button
            onClick={onSendMessage}
            disabled={isGenerating || (!userInput.trim() && !uploadedImage)}
            data-send-button="true"
            className="btn-primary px-4"
          >
            {isGenerating ? <LoaderIcon size={18} /> : <SendIcon size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ChatPanel;
