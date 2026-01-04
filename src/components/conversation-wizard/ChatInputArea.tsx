'use client';

import { forwardRef, useRef, useImperativeHandle } from 'react';
import { ImageIcon, SendIcon, LoaderIcon } from '@/components/ui/Icons';

interface ChatInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileSelect: (files: FileList) => void;
  isLoading: boolean;
  canSend: boolean;
}

export interface ChatInputAreaRef {
  focus: () => void;
}

/**
 * Chat input area with file upload and send button
 */
export const ChatInputArea = forwardRef<ChatInputAreaRef, ChatInputAreaProps>(
  function ChatInputArea({ value, onChange, onSend, onFileSelect, isLoading, canSend }, ref) {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isLoading && canSend) {
          onSend();
        }
      }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        onFileSelect(files);
      }
      // Reset input
      event.target.value = '';
    };

    return (
      <div className="px-6 py-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="flex items-end gap-3">
          {/* File upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-icon"
            title="Upload design reference"
          >
            <ImageIcon size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your app idea..."
              rows={1}
              className="w-full rounded-lg px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-garden-500 focus:border-transparent transition-colors"
              style={{
                minHeight: '48px',
                maxHeight: '120px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={onSend}
            disabled={isLoading || !canSend}
            className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <LoaderIcon size={18} /> : <SendIcon size={18} />}
          </button>
        </div>

        <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    );
  }
);

export default ChatInputArea;
