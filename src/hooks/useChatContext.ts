import { useChatStore } from '@/store/useChatStore';
import { useAppStore } from '@/store/useAppStore';
import { getTitanPipelineService } from '@/services/TitanPipelineService';

export function useChatContext() {
  const { messages, addMessage, setThinking, isThinking, isOpen, toggleChat } = useChatStore();
  const { dynamicPhasePlan } = useAppStore();

  const handleUserMessage = async (content: string) => {
    // 1. Add User Message
    addMessage({ role: 'user', content });
    setThinking(true);

    try {
      // 2. Prepare Context (e.g., current phase, selected component)
      const phaseCount = dynamicPhasePlan?.phases?.length || 0;
      const contextSummary = `Total Phases: ${phaseCount}`;
      
      // 3. Send to Pipeline (Using the Research Loop if needed)
      // For now, we simulate a direct call to the orchestration layer via TitanPipelineService logic
      // Ideally, TitanPipelineService exposes a "chat" method, but we can reuse 'routeIntent' logic or add a dedicated chat handler.
      // Since TitanPipelineService is heavy, we'll implement a lightweight chat turn here that delegates to the specialized services.
      
      const titan = getTitanPipelineService();
      
      // Determine if this is a command or query.
      // For this MVP, we treat everything as a "instruction" to the pipeline for now, 
      // but wrap it in a pseudo-file input if none exists, or just pass context.
      
      // HACK: We construct a pipeline input with NO files, just instructions.
      // The router will likely classify this as 'EDIT' (if code exists) or 'RESEARCH_AND_BUILD' (if unknown).
      
      const currentState = useAppStore.getState();
      const currentCode = currentState.currentComponent?.code || null;
      
      const result = await titan.runPipeline({
        files: [],
        instructions: content,
        currentCode: currentCode,
        appContext: { name: currentState.appConcept?.name }
      });

      // 4. Handle Response
      // If Autonomy Core ran, we might have a result output or error.
      
      let responseText = "I've processed that.";
      
      if (result.strategy.mode === 'RESEARCH_AND_BUILD') {
         // The output of autonomy is currently put into 'files'.
         responseText = "I had to do some research for that. " + (result.files[0]?.content ? "Here is the result." : "I couldn't generate code.");
      } else if (result.files.length > 0) {
        responseText = "I've updated the code based on your request.";
        // Dispatch code update to global store
        // useAppStore.getState().updateFile('/src/App.tsx', result.files[0].content); // This needs to be exposed
      } else {
         responseText = "I analyzed the request but didn't make changes. " + (result.warnings.join(', ') || "");
      }

      addMessage({ role: 'assistant', content: responseText });

    } catch (error) {
      console.error('Chat Error:', error);
      addMessage({ role: 'assistant', content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setThinking(false);
    }
  };

  return {
    messages,
    isThinking,
    isOpen,
    toggleChat,
    sendMessage: handleUserMessage
  };
}
