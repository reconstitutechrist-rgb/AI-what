/**
 * API Client for communicating with AI App Builder
 */

import type { FigmaExtraction } from '../types/figma-data';

export interface ImportResponse {
  success: boolean;
  layoutDesign?: Record<string, unknown>;
  warnings?: string[];
  error?: string;
}

const DEFAULT_SERVER_URL = 'http://localhost:3000';

/**
 * Send extracted Figma data to AI App Builder
 */
export async function sendToAppBuilder(
  data: FigmaExtraction,
  serverUrl: string = DEFAULT_SERVER_URL
): Promise<ImportResponse> {
  const url = `${serverUrl}/api/figma/import`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Server error (${response.status}): ${errorText}`,
      };
    }

    const result = await response.json();
    return result as ImportResponse;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to connect to AI App Builder',
    };
  }
}

/**
 * Check if AI App Builder server is reachable
 */
export async function checkServerHealth(serverUrl: string = DEFAULT_SERVER_URL): Promise<boolean> {
  try {
    const response = await fetch(`${serverUrl}/api/health`, {
      method: 'GET',
      // Short timeout for health check
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Open the AI App Builder in browser with the design data
 */
export function openInBrowser(data: FigmaExtraction, serverUrl: string = DEFAULT_SERVER_URL): void {
  // Encode data as base64 URL parameter (for small designs)
  // For larger designs, we'll use the API route instead
  const jsonStr = JSON.stringify(data);

  if (jsonStr.length < 10000) {
    // Small enough to pass as URL param
    const encoded = btoa(encodeURIComponent(jsonStr));
    // In actual plugin, would use figma.openExternal(url)
    void `${serverUrl}?figma-import=${encoded}`;
  }
  // For larger designs, use the API route instead
}
