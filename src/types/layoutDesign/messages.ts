/**
 * Layout Message Types
 * Error types and message structures for layout chat
 */

import type { VisualAnalysis } from './common';

// ============================================================================
// Layout Message Types
// ============================================================================

export type MessageErrorType = 'network' | 'timeout' | 'rate_limit' | 'server' | 'unknown';

export interface MessageError {
  type: MessageErrorType;
  message: string;
  canRetry: boolean;
  retryAfter?: number; // Milliseconds until retry is allowed
  originalMessage?: string; // Original user message for retry
}

export interface LayoutMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: string[]; // Base64 images
  /** Selected element info when message was sent (Click + Talk mode) */
  selectedElement?: import('./structure').SelectedElementInfo;
  previewSnapshot?: string; // Screenshot of preview when message was sent
  error?: MessageError; // Error information for retry functionality
  isRetrying?: boolean; // Indicates message is being retried
  /** Gemini's visual analysis for embedding Creative Director panel in chat */
  geminiAnalysis?: VisualAnalysis;
}
