/**
 * Hook for Figma import functionality
 * Handles importing designs from Figma via URL, JSON, or plugin
 */

import { useState, useCallback } from 'react';
import type { LayoutDesign } from '@/types/layoutDesign';
import type {
  FigmaExtraction,
  FigmaImportResponse,
  FigmaImportProgress,
  FigmaGenerateCodeResponse,
} from '@/types/figma';
import { parseFigmaUrl } from '@/services/figmaTransformer';

export interface UseFigmaImportReturn {
  // State
  isImporting: boolean;
  progress: FigmaImportProgress | null;
  importedDesign: Partial<LayoutDesign> | null;
  generatedCode: FigmaGenerateCodeResponse['files'] | null;
  error: string | null;
  warnings: string[];

  // Actions
  importFromUrl: (url: string) => Promise<Partial<LayoutDesign> | null>;
  importFromJson: (json: string) => Promise<Partial<LayoutDesign> | null>;
  importFromPlugin: (data: FigmaExtraction) => Promise<Partial<LayoutDesign> | null>;
  generateCode: (design: LayoutDesign) => Promise<FigmaGenerateCodeResponse['files'] | null>;
  reset: () => void;

  // Utilities
  validateUrl: (url: string) => boolean;
}

export function useFigmaImport(): UseFigmaImportReturn {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<FigmaImportProgress | null>(null);
  const [importedDesign, setImportedDesign] = useState<Partial<LayoutDesign> | null>(null);
  const [generatedCode, setGeneratedCode] = useState<FigmaGenerateCodeResponse['files'] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setIsImporting(false);
    setProgress(null);
    setImportedDesign(null);
    setGeneratedCode(null);
    setError(null);
    setWarnings([]);
  }, []);

  /**
   * Validate a Figma URL
   */
  const validateUrl = useCallback((url: string): boolean => {
    return parseFigmaUrl(url) !== null;
  }, []);

  /**
   * Import from Figma URL (anonymous)
   */
  const importFromUrl = useCallback(async (url: string): Promise<Partial<LayoutDesign> | null> => {
    setIsImporting(true);
    setError(null);
    setWarnings([]);
    setProgress({ stage: 'fetching', message: 'Fetching from Figma...', progress: 20 });

    try {
      const response = await fetch('/api/figma/anonymous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', url }),
      });

      setProgress({ stage: 'transforming', message: 'Transforming design...', progress: 60 });

      const result: FigmaImportResponse = await response.json();

      if (!result.success || !result.layoutDesign) {
        throw new Error(result.error || 'Failed to import from URL');
      }

      setProgress({ stage: 'complete', message: 'Import complete!', progress: 100 });
      setImportedDesign(result.layoutDesign);
      setWarnings(result.warnings || []);

      return result.layoutDesign;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setProgress({ stage: 'error', message, progress: 0 });
      return null;
    } finally {
      setIsImporting(false);
    }
  }, []);

  /**
   * Import from JSON string
   */
  const importFromJson = useCallback(
    async (json: string): Promise<Partial<LayoutDesign> | null> => {
      setIsImporting(true);
      setError(null);
      setWarnings([]);
      setProgress({ stage: 'parsing', message: 'Parsing JSON...', progress: 30 });

      try {
        // First try to parse locally to catch JSON errors early
        try {
          JSON.parse(json);
        } catch {
          throw new Error('Invalid JSON format');
        }

        const response = await fetch('/api/figma/anonymous', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'json', jsonData: json }),
        });

        setProgress({ stage: 'transforming', message: 'Transforming design...', progress: 70 });

        const result: FigmaImportResponse = await response.json();

        if (!result.success || !result.layoutDesign) {
          throw new Error(result.error || 'Failed to import JSON');
        }

        setProgress({ stage: 'complete', message: 'Import complete!', progress: 100 });
        setImportedDesign(result.layoutDesign);
        setWarnings(result.warnings || []);

        return result.layoutDesign;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setProgress({ stage: 'error', message, progress: 0 });
        return null;
      } finally {
        setIsImporting(false);
      }
    },
    []
  );

  /**
   * Import from Figma plugin data
   */
  const importFromPlugin = useCallback(
    async (data: FigmaExtraction): Promise<Partial<LayoutDesign> | null> => {
      setIsImporting(true);
      setError(null);
      setWarnings([]);
      setProgress({ stage: 'transforming', message: 'Processing plugin data...', progress: 50 });

      try {
        const response = await fetch('/api/figma/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            figmaData: data,
            options: {
              extractColors: true,
              extractTypography: true,
              extractSpacing: true,
              extractComponents: true,
            },
          }),
        });

        const result: FigmaImportResponse = await response.json();

        if (!result.success || !result.layoutDesign) {
          throw new Error(result.error || 'Failed to import from plugin');
        }

        setProgress({ stage: 'complete', message: 'Import complete!', progress: 100 });
        setImportedDesign(result.layoutDesign);
        setWarnings(result.warnings || []);

        return result.layoutDesign;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setProgress({ stage: 'error', message, progress: 0 });
        return null;
      } finally {
        setIsImporting(false);
      }
    },
    []
  );

  /**
   * Generate React code from LayoutDesign
   */
  const generateCode = useCallback(
    async (design: LayoutDesign): Promise<FigmaGenerateCodeResponse['files'] | null> => {
      setIsImporting(true);
      setError(null);
      setProgress({ stage: 'transforming', message: 'Generating code...', progress: 30 });

      try {
        const response = await fetch('/api/figma/generate-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            layoutDesign: design,
            options: {
              framework: 'react',
              styling: 'tailwind',
              typescript: true,
            },
          }),
        });

        setProgress({ stage: 'transforming', message: 'Processing response...', progress: 80 });

        const result: FigmaGenerateCodeResponse = await response.json();

        if (!result.success || !result.files) {
          throw new Error(result.error || 'Failed to generate code');
        }

        setProgress({ stage: 'complete', message: 'Code generated!', progress: 100 });
        setGeneratedCode(result.files);

        return result.files;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setProgress({ stage: 'error', message, progress: 0 });
        return null;
      } finally {
        setIsImporting(false);
      }
    },
    []
  );

  return {
    // State
    isImporting,
    progress,
    importedDesign,
    generatedCode,
    error,
    warnings,

    // Actions
    importFromUrl,
    importFromJson,
    importFromPlugin,
    generateCode,
    reset,

    // Utilities
    validateUrl,
  };
}

export default useFigmaImport;
