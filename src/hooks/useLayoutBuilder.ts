/**
 * useLayoutBuilder Hook
 *
 * State management for the Universal Visual Editor (Titan Stack).
 * Manages generated code (AppFile[]) as the single source of truth.
 * Communicates with the Titan Pipeline API for all generation tasks.
 *
 * Replaces the old component-array model with code-generation:
 *   - AppFile[] instead of DetectedComponentEnhanced[]
 *   - Pipeline API instead of per-image analysis
 *   - Live Editor for FloatingEditBubble quick edits
 *   - Undo/redo snapshots of generated code files
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { AppFile } from '@/types/railway';
import { useAppStore } from '@/store/useAppStore';
import type {
  PipelineProgress,
  AppContext,
  FileInput,
  OmniConversationMessage,
  OmniChatResponse,
} from '@/types/titanPipeline';
import type { AgentCommand, SuspendedExecution, AgentFeedback } from '@/types/autonomy';
import { createInitialProgress } from '@/types/titanPipeline';
import { getWebContainerService } from '@/services/WebContainerService';
import type { ValidationResult, SandboxError, WebContainerStatus } from '@/types/sandbox';

// ============================================================================
// RETURN TYPE
// ============================================================================

export interface UseLayoutBuilderReturn {
  /** Generated code files from the pipeline */
  generatedFiles: AppFile[];
  /** Whether a pipeline or live-edit is in progress */
  isProcessing: boolean;
  /** Step-by-step progress of the current pipeline run */
  pipelineProgress: PipelineProgress | null;
  /** Fatal errors from pipeline runs */
  errors: string[];
  /** Non-fatal warnings from pipeline runs */
  warnings: string[];

  /**
   * Run the full Titan pipeline.
   * Automatically includes currentCode if generated files exist, enabling
   * the Router to detect EDIT mode without caller intervention.
   */
  runPipeline: (files: File[], instructions: string, appContext?: AppContext, cachedSkillId?: string) => Promise<void>;

  /**
   * Apply a quick edit to a specific component via the Live Editor.
   * Used by FloatingEditBubble — no full pipeline, just code-in/code-out.
   */
  refineComponent: (dataId: string, prompt: string, outerHTML: string) => Promise<void>;

  /** Undo last code change */
  undo: () => void;
  /** Redo last undone change */
  redo: () => void;
  /** Copy generated code to clipboard */
  exportCode: () => void;
  /** Clear all errors and warnings */
  clearErrors: () => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;

  /** Whether a chat message is being processed */
  isChatting: boolean;
  /** Send a chat message and get an AI response with intent classification */
  sendChatMessage: (
    message: string,
    conversationHistory: OmniConversationMessage[],
    appContext?: AppContext
  ) => Promise<OmniChatResponse>;

  // --- Sandbox Validation ---
  /** Whether WebContainer validation is running */
  isValidating: boolean;
  /** Current WebContainer status */
  validationStatus: WebContainerStatus;
  /** Errors from the most recent validation */
  validationErrors: SandboxError[];
  /** Number of auto-repair attempts made for current generation */
  repairAttempts: number;

  // --- Visual Critic ---
  /** Quality score from the visual critic (1-10, null if not evaluated) */
  critiqueScore: number | null;
  /** Whether the visual critique is currently running */
  isCritiquing: boolean;
  /** Issues found by the visual critic */
  critiqueIssues: string[];
}

// ============================================================================
// HELPERS
// ============================================================================

/** Convert a browser File to a pipeline FileInput (base64-encoded). */
function fileToFileInput(file: File): Promise<FileInput> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve({
        base64,
        mimeType: file.type || 'image/png',
        filename: file.name,
      });
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Extract the main component code string from the generated files.
 * Returns the content of /src/App.tsx (or /App.tsx), which is the
 * primary code file the Builder outputs.
 */
function extractMainCode(files: AppFile[]): string | null {
  const appFile = files.find((f) => f.path === '/src/App.tsx' || f.path === '/App.tsx');
  return appFile?.content ?? null;
}

/**
 * Parse a shell command string into an array of arguments,
 * respecting single and double quotes.
 * e.g. `npm install "pkg@^1.0" --save` → ['npm', 'install', 'pkg@^1.0', '--save']
 */
function parseShellArgs(commandString: string): string[] {
  const args: string[] = [];
  const regex = /(?:"([^"]*)")|(?:'([^']*)')|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(commandString)) !== null) {
    args.push(match[1] ?? match[2] ?? match[3]);
  }
  return args;
}

/**
 * Build a simulated "all steps complete" progress snapshot.
 * Used after the pipeline API returns (non-streaming) to show final status.
 */
function buildFinalProgress(hasImages: boolean, hasVideos: boolean): PipelineProgress {
  return {
    currentStep: 'assembling',
    status: 'completed',
    steps: {
      routing: { status: 'completed' },
      surveying: { status: hasImages ? 'completed' : 'idle' },
      architecting: { status: 'completed' },
      physicist: { status: hasVideos ? 'completed' : 'idle' },
      photographer: { status: 'completed' },
      assembling: { status: 'completed' },
    },
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function useLayoutBuilder(): UseLayoutBuilderReturn {
  // --- Persisted files from store (survives refresh) ---
  const storedFiles = useAppStore((state) => state.generatedFiles);
  const setStoredFiles = useAppStore((state) => state.setGeneratedFiles);

  // --- Core State (initialized from persisted store) ---
  const [generatedFiles, setGeneratedFiles] = useState<AppFile[]>(storedFiles);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // --- Chat State ---
  const [isChatting, setIsChatting] = useState(false);

  // --- Sandbox Validation State ---
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<WebContainerStatus>('idle');
  const [validationErrors, setValidationErrors] = useState<SandboxError[]>([]);
  const [repairAttempts, setRepairAttempts] = useState(0);
  const MAX_REPAIR_ATTEMPTS = 2;
  /** Ref for validation errors — used by Avatar Protocol to avoid stale closures */
  const validationErrorsRef = useRef<SandboxError[]>([]);
  useEffect(() => { validationErrorsRef.current = validationErrors; }, [validationErrors]);

  // --- Visual Critic State ---
  const [critiqueScore, setCritiqueScore] = useState<number | null>(null);
  const [isCritiquing, setIsCritiquing] = useState(false);
  const [critiqueIssues, setCritiqueIssues] = useState<string[]>([]);

  // --- History (undo/redo on AppFile[] snapshots) ---
  const [history, setHistory] = useState<AppFile[][]>([]);
  const [future, setFuture] = useState<AppFile[][]>([]);

  // --- Bidirectional sync with Zustand store ---
  // 1. Write local generatedFiles → store whenever they change
  const syncRef = useRef(false);
  useEffect(() => {
    if (generatedFiles !== storedFiles) {
      syncRef.current = true;
      setStoredFiles(generatedFiles);
    }
  }, [generatedFiles, storedFiles, setStoredFiles]);

  // 2. Hydrate from store when persisted data loads (Zustand hydrates async)
  //    Also handles project switching: store changes → update local state
  useEffect(() => {
    if (syncRef.current) {
      syncRef.current = false;
      return;
    }
    if (storedFiles !== generatedFiles) {
      setGeneratedFiles(storedFiles);
      setHistory([]);
      setFuture([]);
    }
  }, [storedFiles]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Replace generatedFiles with a new set, pushing the current state to history.
   * Clears the redo (future) stack since we're branching off a new timeline.
   */
  const updateFilesWithHistory = useCallback((newFiles: AppFile[]) => {
    setGeneratedFiles((prev) => {
      if (prev.length > 0) {
        setHistory((h) => [...h, prev]);
        setFuture([]);
      }
      return newFiles;
    });
  }, []);

  // --- Actions ---

  const clearErrors = useCallback(() => {
    setErrors([]);
    setWarnings([]);
    setValidationErrors([]);
    setCritiqueScore(null);
    setCritiqueIssues([]);
  }, []);

  /**
   * Validate generated files via WebContainer sandbox and auto-repair if needed.
   * Returns the (possibly repaired) files, or the original files if validation
   * is unavailable or repair fails.
   */
  const validateAndRepair = useCallback(
    async (files: AppFile[], instructions: string): Promise<AppFile[]> => {
      const webContainer = getWebContainerService();

      // Skip validation if WebContainer not supported (no SharedArrayBuffer)
      if (!webContainer.isSupported()) {
        console.log('[useLayoutBuilder] WebContainer not supported, skipping validation');
        return files;
      }

      setIsValidating(true);
      setRepairAttempts(0);
      setValidationErrors([]);
      let currentFiles = files;

      try {
        for (let attempt = 0; attempt <= MAX_REPAIR_ATTEMPTS; attempt++) {
          setValidationStatus(webContainer.status);
          const result: ValidationResult = await webContainer.validate(currentFiles);
          setValidationStatus(webContainer.status);

          if (result.valid) {
            console.log(`[useLayoutBuilder] Validation passed${attempt > 0 ? ` after ${attempt} repair(s)` : ''}`);
            setValidationErrors([]);
            return currentFiles;
          }

          // Validation failed
          console.warn(`[useLayoutBuilder] Validation failed with ${result.errors.length} errors`);
          setValidationErrors(result.errors);

          if (attempt >= MAX_REPAIR_ATTEMPTS) {
            // Max repairs reached — return files anyway, show errors to user
            setWarnings((prev) => [
              ...prev,
              `Code has ${result.errors.length} validation error(s) that could not be auto-repaired.`,
            ]);
            return currentFiles;
          }

          // Attempt auto-repair via the repair API
          setRepairAttempts(attempt + 1);
          try {
            const repairResponse = await fetch('/api/layout/repair', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                files: currentFiles,
                errors: result.errors,
                originalInstructions: instructions,
                attempt: attempt + 1,
              }),
            });

            if (!repairResponse.ok) {
              console.warn('[useLayoutBuilder] Repair API failed, using unrepaired code');
              return currentFiles;
            }

            const repairResult = await repairResponse.json();
            if (repairResult.attempted && repairResult.files?.length > 0) {
              currentFiles = repairResult.files;
              console.log(`[useLayoutBuilder] Repair attempt ${attempt + 1}: ${repairResult.fixes?.join(', ')}`);
            } else {
              // Repair couldn't fix anything
              return currentFiles;
            }
          } catch (repairError) {
            console.error('[useLayoutBuilder] Repair error:', repairError);
            return currentFiles;
          }
        }

        return currentFiles;
      } finally {
        setIsValidating(false);
      }
    },
    [] // No dependencies — uses only service singletons and setState
  );

  /**
   * Run visual critique asynchronously after code is rendered.
   * Non-blocking — the user sees the preview immediately while this runs.
   * Results update UI state when complete.
   */
  const runVisualCritique = useCallback(
    async (files: AppFile[], instructions: string, cachedSkillId?: string, appContext?: AppContext): Promise<void> => {
      setIsCritiquing(true);
      setCritiqueScore(null);
      setCritiqueIssues([]);

      try {
        const response = await fetch('/api/layout/critique', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files,
            originalInstructions: instructions,
            appContext,
          }),
        });

        if (!response.ok) {
          console.warn('[useLayoutBuilder] Critique API returned', response.status);
          return;
        }

        const data = await response.json();
        if (data.success && data.critique) {
          const score = data.critique.overallScore;
          setCritiqueScore(score);
          setCritiqueIssues(
            (data.critique.issues || []).map(
              (issue: { description: string }) => issue.description
            )
          );
          console.log(
            `[useLayoutBuilder] Visual critique: ${score}/10 — ${data.critique.verdict}`
          );

          // Feed quality score back to Skill Library (fire-and-forget)
          if (cachedSkillId && score > 0) {
            fetch('/api/skills/update-quality', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ skillId: cachedSkillId, qualityScore: score }),
            }).catch((err) => {
              console.warn('[useLayoutBuilder] Skill quality update failed (non-critical):', err);
            });
          }
        }
      } catch (error) {
        console.warn('[useLayoutBuilder] Visual critique error:', error);
      } finally {
        setIsCritiquing(false);
      }
    },
    []
  );

  /**
   * AVATAR PROTOCOL CLIENT
   * Handles remote commands from the server (e.g. "npm test") and returns feedback.
   * Recursive: The feedback API might return *another* command.
   * Guarded by MAX_AVATAR_ITERATIONS to prevent infinite loops.
   */
  const MAX_AVATAR_ITERATIONS = 10;

  const handleAvatarCommand = useCallback(
    async (
      command: AgentCommand,
      suspendedState: SuspendedExecution,
      instructions: string,
      currentFiles: AppFile[],
      iteration: number = 0
    ): Promise<void> => {
       if (iteration >= MAX_AVATAR_ITERATIONS) {
           setErrors(prev => [...prev, `Avatar Protocol exceeded maximum iterations (${MAX_AVATAR_ITERATIONS}). Stopping.`]);
           return;
       }

       console.log(`[AvatarClient] Iteration ${iteration + 1}: Executing ${command.type} (${command.command || 'N/A'})`);

       // Update UI progress with current command
       setPipelineProgress(prev => prev ? ({
         ...prev,
         steps: {
           ...prev.steps,
           assembling: {
             status: 'running',
             message: `Avatar: Running ${command.type}${command.command ? ` (${command.command})` : ''}...`
           }
         }
       }) : null);

       let output = '';
       let exitCode = 0;
       let screenshotData: string | undefined;
       const webContainer = getWebContainerService();

       try {
           // 1. Execute Command Client-Side
           if (command.type === 'shell' && command.command) {
               const [cmd, ...args] = parseShellArgs(command.command);

               // Ensure container is ready
               if (webContainer.status !== 'ready') await webContainer.boot();

               const execResult = await webContainer.executeShell(cmd, args, command.timeout || 30000);
               output = execResult.output;
               exitCode = execResult.exitCode;

           } else if (command.type === 'screenshot') {
               // Capture screenshot via server-side Puppeteer
               try {
                   const screenshotResponse = await fetch('/api/layout/screenshot', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({
                           files: currentFiles,
                           viewport: { width: 1280, height: 800 },
                       }),
                   });
                   if (screenshotResponse.ok) {
                       const screenshotResult = await screenshotResponse.json();
                       if (screenshotResult.success) {
                           output = 'Screenshot captured successfully.';
                           screenshotData = screenshotResult.image;
                       } else {
                           output = `Screenshot failed: ${screenshotResult.error}`;
                           exitCode = 1;
                       }
                   } else {
                       output = `Screenshot API error: ${screenshotResponse.status}`;
                       exitCode = 1;
                   }
               } catch (e) {
                   output = `Screenshot failed: ${e instanceof Error ? e.message : String(e)}`;
                   exitCode = 1;
               }

           } else if (command.type === 'browser_log') {
               // Provide validation errors as a proxy for browser console output
               const currentErrors = validationErrorsRef.current;
               if (currentErrors.length > 0) {
                   output = currentErrors.map(e =>
                       `[${e.type}] ${e.message}${e.file ? ` in ${e.file}:${e.line}` : ''}`
                   ).join('\n');
               } else {
                   output = 'No validation errors detected. Console log capture from live preview is not yet available.';
               }
               exitCode = 0;

           } else {
               output = `Unknown command type: ${command.type}`;
               exitCode = 1;
           }

           // Update UI after command execution
           setPipelineProgress(prev => prev ? ({
             ...prev,
             steps: {
               ...prev.steps,
               assembling: {
                 status: 'running',
                 message: `Avatar: Command completed (exit ${exitCode}), analyzing...`
               }
             }
           }) : null);

           // 2. Send Feedback to Server
           const feedback: AgentFeedback = {
               commandId: command.id,
               output,
               exitCode,
               screenshot: screenshotData,
           };

           const response = await fetch('/api/layout/autonomy/feedback', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ feedback, suspendedState })
           });

           if (!response.ok) throw new Error(`Feedback API error: ${response.status}`);

           const result = await response.json();

           // 3. Handle Result (Continue Loop or Finish)
           if (result.command && result.suspendedState) {
               // Server wants another thing done — recurse with incremented counter
               await handleAvatarCommand(result.command, result.suspendedState, instructions, currentFiles, iteration + 1);
           } else if (result.files) {
               // Success! We have files.
               if (result.files.length > 0) {
                   const validatedFiles = await validateAndRepair(result.files, instructions);
                   updateFilesWithHistory(validatedFiles);
               } else {
                   setErrors(prev => [...prev, 'Autonomy completed but returned no files.']);
               }
           } else if (result.error) {
               throw new Error(result.error);
           }

       } catch (error) {
           console.error('[AvatarClient] Error:', error);
           setErrors(prev => [...prev, `Autonomy Error: ${error instanceof Error ? error.message : String(error)}`]);
       }
    },
    [validateAndRepair, updateFilesWithHistory]
  );

  /**
   * Run the full Titan pipeline.
   *
   * This is the single entry point for ALL generation scenarios:
   *   - Single image upload → CREATE
   *   - Multi-image upload → MERGE
   *   - Image + video → MERGE (layout + motion)
   *   - Text-only (no files) → CREATE or EDIT depending on currentCode
   *   - Files + existing code → EDIT with new reference
   *
   * The Router on the backend determines the mode automatically based on
   * the presence/absence of files[] and currentCode.
   */
  const runPipeline = useCallback(
    async (files: File[], instructions: string, appContext?: AppContext, cachedSkillId?: string) => {
      if (isProcessing) return;

      setIsProcessing(true);
      clearErrors();
      setIsCritiquing(false);

      let progress = createInitialProgress();
      setPipelineProgress(progress);

      try {
        // 1. Convert browser Files → pipeline FileInput[]
        progress = {
          ...progress,
          currentStep: 'routing',
          status: 'running',
          steps: {
            ...progress.steps,
            routing: { status: 'running', message: 'Preparing files...' },
          },
        };
        setPipelineProgress(progress);

        const fileInputs = await Promise.all(files.map(fileToFileInput));

        // 2. Include currentCode if we have previously generated files (enables EDIT)
        const currentCode = extractMainCode(generatedFiles);

        // 3. Update progress to "routing"
        progress = {
          ...progress,
          steps: {
            ...progress.steps,
            routing: { status: 'running', message: 'Routing intent...' },
          },
        };
        setPipelineProgress(progress);

        // 4. Call the Titan Pipeline API
        const response = await fetch('/api/layout/pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: fileInputs,
            currentCode,
            instructions,
            appContext,
          }),
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: `HTTP ${response.status}` }));
          throw new Error(errorData.error || `Pipeline failed: ${response.status}`);
        }

        const result = await response.json();

        // 5. Build final progress (all steps done)
        const hasImages = fileInputs.some((f) => f.mimeType.startsWith('image/'));
        const hasVideos = fileInputs.some((f) => f.mimeType.startsWith('video/'));
        setPipelineProgress(buildFinalProgress(hasImages, hasVideos));

        // 6. Handle Autonomy / Avatar Protocol
        if (result.command && result.suspendedState) {
            // Pipeline entered "PAUSED" state -> Hand over to Avatar Client
            setPipelineProgress(prev => prev ? ({...prev, status: 'running', steps: {...prev.steps, assembling: {status: 'running', message: 'Verifying solution...'}}}) : null);

            await handleAvatarCommand(result.command, result.suspendedState, instructions, result.files || generatedFiles);

        } else if (result.files && result.files.length > 0) {
            // Standard Completion
            const validatedFiles = await validateAndRepair(result.files, instructions);
            updateFilesWithHistory(validatedFiles);

            // Run critique on the validated (post-repair) files, not the originals
            runVisualCritique(validatedFiles, instructions, cachedSkillId, appContext).catch((err) => {
                console.warn('[useLayoutBuilder] Visual critique failed (non-critical):', err);
            });
        } else {
            setErrors((prev) => [...prev, 'Pipeline completed but returned no files']);
        }

        // 7. Collect warnings
        if (result.warnings && result.warnings.length > 0) {
          setWarnings(result.warnings);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Pipeline failed';
        setErrors((prev) => [...prev, message]);
        console.error('[useLayoutBuilder] Pipeline error:', error);
      } finally {
        setIsProcessing(false);
        // Keep progress visible briefly before clearing
        setTimeout(() => setPipelineProgress(null), 2000);
      }
    },
    [isProcessing, generatedFiles, clearErrors, updateFilesWithHistory, validateAndRepair, runVisualCritique, handleAvatarCommand]
  );

  /**
   * Refine a specific component via the Live Editor prompt.
   * This is a lightweight code-in → code-out operation, NOT a full pipeline run.
   * Used by FloatingEditBubble for edits like "Make this blue".
   */
  const refineComponent = useCallback(
    async (dataId: string, prompt: string, _outerHTML: string) => {
      const currentCode = extractMainCode(generatedFiles);
      if (!currentCode) {
        setErrors(['No generated code to edit']);
        return;
      }

      setIsProcessing(true);
      clearErrors();

      try {
        const response = await fetch('/api/layout/pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'live-edit',
            currentCode,
            selectedDataId: dataId,
            instruction: prompt,
          }),
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: `HTTP ${response.status}` }));
          throw new Error(errorData.error || `Live edit failed: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.updatedCode) {
          // Replace the App.tsx content in generatedFiles
          const newFiles = generatedFiles.map((f) => {
            if (f.path === '/src/App.tsx' || f.path === '/App.tsx') {
              return { ...f, content: result.updatedCode };
            }
            return f;
          });
          updateFilesWithHistory(newFiles);
        } else {
          throw new Error(result.error || 'Live edit returned no updated code');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Edit failed';
        setErrors((prev) => [...prev, message]);
        console.error('[useLayoutBuilder] Refine error:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [generatedFiles, clearErrors, updateFilesWithHistory]
  );

  /** Undo: pop from history, push current to future. */
  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const newHistory = [...prev];
      const previousState = newHistory.pop()!;

      setGeneratedFiles((current) => {
        setFuture((f) => [current, ...f]);
        return previousState;
      });

      return newHistory;
    });
  }, []);

  /** Redo: shift from future, push current to history. */
  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const newFuture = [...prev];
      const nextState = newFuture.shift()!;

      setGeneratedFiles((current) => {
        setHistory((h) => [...h, current]);
        return nextState;
      });

      return newFuture;
    });
  }, []);

  /** Copy all generated code files to clipboard with path headers. */
  const exportCode = useCallback(() => {
    if (generatedFiles.length === 0) return;

    const output = generatedFiles.map((f) => `// === ${f.path} ===\n${f.content}`).join('\n\n');

    navigator.clipboard.writeText(output).then(
      () => console.log('[useLayoutBuilder] Code exported to clipboard'),
      (err) => {
        console.error('[useLayoutBuilder] Clipboard write failed:', err);
        setErrors(['Failed to copy code to clipboard']);
      }
    );
  }, [generatedFiles]);

  /**
   * Send a chat message to the OmniChat API.
   * Returns the AI's response with intent classification.
   * The caller decides what to do based on response.action.
   */
  const sendChatMessage = useCallback(
    async (
      message: string,
      conversationHistory: OmniConversationMessage[],
      appContext?: AppContext
    ): Promise<OmniChatResponse> => {
      setIsChatting(true);
      try {
        const currentCode = extractMainCode(generatedFiles);

        const response = await fetch('/api/layout/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            conversationHistory,
            currentCode,
            appContext,
          }),
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: `HTTP ${response.status}` }));
          throw new Error(errorData.error || `Chat failed: ${response.status}`);
        }

        return await response.json();
      } finally {
        setIsChatting(false);
      }
    },
    [generatedFiles]
  );

  // --- Return ---

  return {
    generatedFiles,
    isProcessing,
    pipelineProgress,
    errors,
    warnings,

    runPipeline,
    refineComponent,
    undo,
    redo,
    exportCode,
    clearErrors,

    canUndo: history.length > 0,
    canRedo: future.length > 0,

    isChatting,
    sendChatMessage,

    // Sandbox Validation
    isValidating,
    validationStatus,
    validationErrors,
    repairAttempts,

    // Visual Critic
    critiqueScore,
    isCritiquing,
    critiqueIssues,
  };
}
