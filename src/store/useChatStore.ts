import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    context?: string; // e.g., "Selected Component: #header"
    relatedFile?: string;
  };
}

interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  isThinking: boolean;
  activeContext: string | null; // Currently selected component ID or Phase ID
  
  toggleChat: () => void;
  setThinking: (thinking: boolean) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearHistory: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      isOpen: false,
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Hello! I am your Autopoietic Assistant. I can help you build, edit, or even learn new skills. How can I help?',
          timestamp: Date.now(),
        }
      ],
      isThinking: false,
      activeContext: null,

      toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
      
      setThinking: (thinking) => set({ isThinking: thinking }),
      
      addMessage: (msg) => set((state) => ({
        messages: [
          ...state.messages,
          {
            ...msg,
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
          }
        ]
      })),
      
      setMessages: (messages) => set({ messages }),

      clearHistory: () => set({
        messages: [
           {
            id: 'welcome_reset',
            role: 'assistant',
            content: 'Chat history cleared. What shall we do next?',
            timestamp: Date.now(),
          }
        ] 
      }),
    }),
    {
      name: 'omni-chat-storage',
      partialize: (state) => ({ messages: state.messages }), // Persist only messages
    }
  )
);
