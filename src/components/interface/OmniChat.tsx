/**
 * OmniChat — The Mouth
 *
 * Context-aware conversational interface for the virtual reality engine.
 * Replaces the old LayoutBuilderChatPanel with full AI conversation
 * support and action dispatching (pipeline, autonomy, live-edit).
 *
 * Uses useChatStore for persistent message history.
 * Receives pipeline/processing state from parent via props.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useChatStore, type ChatMessage } from '@/store/useChatStore';
import type { PipelineProgress, PipelineStepName, PipelineStepStatus, OmniChatAction } from '@/types/titanPipeline';
import { PIPELINE_STEP_LABELS } from '@/types/titanPipeline';

// ============================================================================
// TYPES
// ============================================================================

export interface UploadedMedia {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
}

export interface OmniChatProps {
  onSendMessage: (message: string, media: UploadedMedia[]) => void;
  isProcessing: boolean;
  isChatting: boolean;
  pipelineProgress?: PipelineProgress | null;
  /** The action currently being executed (shown in status) */
  activeAction?: OmniChatAction | null;
}

// ============================================================================
// ICONS
// ============================================================================

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const VideoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const BrainIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

// ============================================================================
// STATUS HELPERS
// ============================================================================

function getStatusInfo(
  isProcessing: boolean,
  isChatting: boolean,
  activeAction?: OmniChatAction | null
): { label: string; dotColor: string } {
  if (isChatting) return { label: 'Thinking...', dotColor: 'bg-blue-500 animate-pulse' };
  if (!isProcessing) return { label: 'Ready', dotColor: 'bg-green-500' };

  switch (activeAction) {
    case 'autonomy':
      return { label: 'Self-Teaching...', dotColor: 'bg-purple-500 animate-pulse' };
    case 'pipeline':
      return { label: 'Generating...', dotColor: 'bg-amber-500 animate-pulse' };
    case 'live-edit':
      return { label: 'Editing...', dotColor: 'bg-cyan-500 animate-pulse' };
    default:
      return { label: 'Processing...', dotColor: 'bg-amber-500 animate-pulse' };
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const OmniChat: React.FC<OmniChatProps> = ({
  onSendMessage,
  isProcessing,
  isChatting,
  pipelineProgress,
  activeAction,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistent message store
  const messages = useChatStore((s) => s.messages);

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isProcessing, isChatting]);

  // Cleanup Object URLs on unmount
  const uploadedMediaRef = useRef<UploadedMedia[]>([]);
  uploadedMediaRef.current = uploadedMedia;
  useEffect(() => {
    return () => {
      uploadedMediaRef.current.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    };
  }, []);

  // --- Handlers ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newMedia: UploadedMedia[] = [];
    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (isImage || isVideo) {
        newMedia.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          previewUrl: URL.createObjectURL(file),
          type: isVideo ? 'video' : 'image',
        });
      }
    });

    setUploadedMedia((prev) => [...prev, ...newMedia]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveMedia = (id: string) => {
    setUploadedMedia((prev) => {
      const item = prev.find((m) => m.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((m) => m.id !== id);
    });
  };

  const handleSend = () => {
    if (!inputValue.trim() && uploadedMedia.length === 0) return;
    onSendMessage(inputValue, uploadedMedia);
    // Revoke blob URLs before clearing to prevent memory leaks
    uploadedMedia.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    setInputValue('');
    setUploadedMedia([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const status = getStatusInfo(isProcessing, isChatting, activeAction);
  const isBusy = isProcessing || isChatting;

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <BrainIcon />
          <h2 className="font-semibold text-sm text-gray-800">OmniChat</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full', status.dotColor)} />
          <span className="text-xs text-gray-500">{status.label}</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-4">
              <BrainIcon />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Omnipotent Creation Engine</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Describe anything you want to build. Upload images for visual replication.
              I can create anything — if I don&apos;t know how, I&apos;ll figure it out.
            </p>
          </div>
        )}

        {messages.map((message: ChatMessage) => (
          <div
            key={message.id}
            className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-lg px-4 py-3',
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.role === 'system'
                    ? 'bg-purple-50 border border-purple-200 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
              )}
            >
              {/* System messages with action context */}
              {message.role === 'system' && message.metadata?.context && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <SparklesIcon />
                  <span className="text-xs font-medium text-purple-600">
                    {message.metadata.context}
                  </span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-60 mt-2" suppressHydrationWarning>
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator (chat) */}
        {isChatting && !isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Pipeline progress indicator */}
        {isProcessing && pipelineProgress && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3 w-full max-w-[85%]">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-5 h-5 animate-spin text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm text-gray-600">
                  {pipelineProgress.steps[pipelineProgress.currentStep]?.message || 'Processing...'}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {(
                  Object.entries(pipelineProgress.steps) as [
                    PipelineStepName,
                    { status: PipelineStepStatus; message?: string },
                  ][]
                ).map(([step, stepData]) => (
                  <div key={step} className="flex items-center gap-1">
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        stepData.status === 'running' && 'bg-blue-600 animate-pulse',
                        stepData.status === 'completed' && 'bg-green-600',
                        stepData.status === 'error' && 'bg-red-600',
                        stepData.status === 'idle' && 'bg-gray-200'
                      )}
                    />
                    <span
                      className={cn(
                        'text-xs',
                        stepData.status === 'running' && 'text-blue-700 font-medium',
                        stepData.status === 'completed' && 'text-green-700',
                        stepData.status === 'error' && 'text-red-700',
                        stepData.status === 'idle' && 'text-gray-400'
                      )}
                    >
                      {PIPELINE_STEP_LABELS[step]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Autonomy active indicator */}
        {isProcessing && activeAction === 'autonomy' && !pipelineProgress && (
          <div className="flex justify-start">
            <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 w-full max-w-[85%]">
              <div className="flex items-center gap-2 mb-1">
                <BrainIcon />
                <span className="text-sm font-medium text-purple-700">Autonomy Core Active</span>
              </div>
              <p className="text-xs text-purple-600">
                Researching, fabricating specialist agents, and building solution...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Media Preview Area */}
      {uploadedMedia.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {uploadedMedia.map((media) => (
              <div key={media.id} className="relative group">
                {media.type === 'image' ? (
                  <img
                    src={media.previewUrl}
                    alt="Upload preview"
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-lg border border-gray-200 flex items-center justify-center">
                    <VideoIcon />
                  </div>
                )}
                <button
                  onClick={() => handleRemoveMedia(media.id)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          {/* File Upload */}
          <label
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 cursor-pointer transition-colors',
              'hover:bg-gray-50 hover:border-gray-400',
              isBusy && 'opacity-50 cursor-not-allowed'
            )}
            title="Upload images or videos"
          >
            <ImageIcon />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={isBusy}
            />
          </label>

          {/* Text Input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              uploadedMedia.length > 0
                ? 'Add instructions (optional)...'
                : 'Describe anything to build...'
            }
            disabled={isBusy}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 text-sm"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isBusy || (!inputValue.trim() && uploadedMedia.length === 0)}
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
              uploadedMedia.length > 0
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-blue-600 text-white hover:bg-blue-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isBusy ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : uploadedMedia.length > 0 ? (
              <SparklesIcon />
            ) : (
              <SendIcon />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OmniChat;
