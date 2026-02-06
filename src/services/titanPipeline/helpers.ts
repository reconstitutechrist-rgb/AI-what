/**
 * Titan Pipeline Helpers
 *
 * File upload utilities and output parsing.
 */

import { GoogleAIFileManager } from '@google/generative-ai/server';
import type { AppFile } from '@/types/railway';
import type { FileInput } from '@/types/titanPipeline';
import { extractCode } from '@/utils/extractCode';

// ============================================================================
// FILE UPLOAD
// ============================================================================

/**
 * Upload a file (image/video) to Gemini API
 */
export async function uploadFileToGemini(apiKey: string, file: FileInput) {
  const fileManager = new GoogleAIFileManager(apiKey);
  const base64Data = file.base64.includes(',') ? file.base64.split(',')[1] : file.base64;
  const buffer = Buffer.from(base64Data, 'base64');

  const uploadResult = await fileManager.uploadFile(buffer, {
    mimeType: file.mimeType,
    displayName: file.filename,
  });

  let fileState = uploadResult.file;
  while (fileState.state === 'PROCESSING') {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    fileState = await fileManager.getFile(fileState.name);
  }

  if (fileState.state === 'FAILED') throw new Error(`Upload failed: ${file.filename}`);
  return fileState;
}

// ============================================================================
// AUTONOMY OUTPUT PARSER
// ============================================================================

/**
 * Parse autonomy output into multiple AppFiles.
 * If the output contains file markers like `// === /src/filename.tsx ===`,
 * split into separate files. Otherwise, treat entire output as App.tsx.
 */
export function parseAutonomyOutput(output: string): AppFile[] {
  const fileMarkerRegex = /\/\/\s*===\s*(\/[^\s]+)\s*===/g;
  const matches = [...output.matchAll(fileMarkerRegex)];

  if (matches.length === 0) {
    // No markers — treat as single App.tsx
    const code = extractCode(output);
    return [{ path: '/src/App.tsx', content: code }];
  }

  // Split output by file markers
  const files: AppFile[] = [];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const path = match[1];
    const matchIndex = match.index;

    if (matchIndex === undefined) {
      console.warn('[TitanPipeline] Regex match missing index, skipping file');
      continue;
    }

    const startIndex = matchIndex + match[0].length;
    const nextMatchIndex = i < matches.length - 1 ? matches[i + 1].index : undefined;
    const endIndex = nextMatchIndex !== undefined ? nextMatchIndex : output.length;
    const content = extractCode(output.slice(startIndex, endIndex));

    if (content.length > 0) {
      files.push({ path, content });
    }
  }

  // Ensure we always have at least an App.tsx
  if (files.length === 0) {
    return [{ path: '/src/App.tsx', content: output.trim() }];
  }

  return files;
}
