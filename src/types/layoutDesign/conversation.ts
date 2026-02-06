/**
 * Conversation Context Types
 * Context about conversations and design decisions
 */

// ============================================================================
// Conversation Context Types
// ============================================================================

export interface ConversationContext {
  messageCount: number;
  keyDecisions: string[];
  userPreferences: string[];
  lastUpdated: string;
}

// ============================================================================
// Design Context Types (Auto-extracted from conversation)
// ============================================================================

/**
 * Context about what the user is building, extracted automatically from chat.
 * Helps the AI provide more relevant design suggestions.
 */
export interface DesignContext {
  /** What the app/site is for (e.g., "E-commerce store for handmade crafts") */
  purpose?: string;
  /** Who will use it (e.g., "Small business owners, crafters") */
  targetUsers?: string;
  /** Any mentioned constraints (e.g., ["Mobile-first", "Fast checkout", "Accessible"]) */
  requirements?: string[];
  /** When this context was last updated */
  lastUpdated?: string;
}
