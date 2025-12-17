/**
 * Documentation Capture Utilities
 *
 * Provides utilities for capturing and uploading documentation artifacts
 * like layout preview screenshots.
 */

import { createClient } from '@/utils/supabase/client';
import { captureLayoutPreview } from './screenshotCapture';

/**
 * Result type for capture operations
 */
interface CaptureResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Capture layout preview and upload to Supabase storage
 *
 * @param docId - Documentation ID
 * @param userId - User ID for storage path
 * @param elementId - DOM element ID to capture (default: 'layout-preview-frame')
 * @returns CaptureResult with the public URL if successful
 */
export async function captureAndUploadLayoutPreview(
  docId: string,
  userId: string,
  elementId: string = 'layout-preview-frame'
): Promise<CaptureResult> {
  try {
    // Capture the screenshot
    const captureResult = await captureLayoutPreview(elementId);

    if (!captureResult.success || !captureResult.dataUrl) {
      return {
        success: false,
        error: captureResult.error || 'Failed to capture screenshot',
      };
    }

    // Upload to Supabase storage
    const uploadResult = await uploadBase64Image(
      captureResult.dataUrl,
      `${userId}/documentation/${docId}/layout-preview.jpg`,
      'app-assets'
    );

    return uploadResult;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during capture',
    };
  }
}

/**
 * Upload a base64 encoded image to Supabase storage
 *
 * @param base64Data - Base64 encoded image data (with or without data URL prefix)
 * @param path - Storage path (e.g., 'userId/documentation/docId/image.jpg')
 * @param bucket - Storage bucket name
 * @returns CaptureResult with the public URL if successful
 */
export async function uploadBase64Image(
  base64Data: string,
  path: string,
  bucket: string = 'app-assets'
): Promise<CaptureResult> {
  try {
    const supabase = createClient();

    // Remove data URL prefix if present
    const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

    // Convert base64 to blob
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Determine content type from path or default to JPEG
    const extension = path.split('.').pop()?.toLowerCase() || 'jpg';
    const contentType =
      extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';

    const blob = new Blob([byteArray], { type: contentType });

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, blob, {
      contentType,
      upsert: true, // Overwrite if exists
    });

    if (uploadError) {
      return {
        success: false,
        error: uploadError.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

/**
 * Delete a file from Supabase storage
 *
 * @param path - Storage path
 * @param bucket - Storage bucket name
 */
export async function deleteStorageFile(
  path: string,
  bucket: string = 'app-assets'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown delete error',
    };
  }
}

/**
 * Generate storage path for documentation assets
 *
 * @param userId - User ID
 * @param docId - Documentation ID
 * @param filename - Filename
 * @returns Storage path
 */
export function getDocumentationStoragePath(
  userId: string,
  docId: string,
  filename: string
): string {
  return `${userId}/documentation/${docId}/${filename}`;
}

/**
 * Extract app concept summary from conversation messages
 *
 * @param messages - Chat messages
 * @returns Extracted concept details
 */
export function extractConceptFromMessages(messages: Array<{ role: string; content: string }>): {
  name?: string;
  description?: string;
  features?: string[];
} {
  const result: {
    name?: string;
    description?: string;
    features?: string[];
  } = {};

  // Look for app name patterns
  const namePatterns = [
    /(?:build|create|make)\s+(?:a|an|the)?\s*([A-Za-z0-9\s]+?)(?:\s+app|\s+application|\s+tool)?(?:\.|,|$)/i,
    /(?:app|application|tool)\s+(?:called|named)\s+([A-Za-z0-9\s]+)/i,
    /^([A-Za-z0-9\s]+?)(?:\s+app|\s+application)$/i,
  ];

  // Look for feature patterns
  const featurePatterns = [
    /(?:should|need|want|include|have|with)\s+(?:a|an|the)?\s*([A-Za-z0-9\s]+?)(?:\s+feature|\s+functionality)?/gi,
    /features?:\s*([^.]+)/gi,
  ];

  const userMessages = messages.filter((m) => m.role === 'user').map((m) => m.content);

  for (const content of userMessages) {
    // Try to extract name
    if (!result.name) {
      for (const pattern of namePatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          result.name = match[1].trim();
          break;
        }
      }
    }

    // Extract features
    for (const pattern of featurePatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          result.features = result.features || [];
          result.features.push(match[1].trim());
        }
      }
    }

    // Use first substantial user message as description
    if (!result.description && content.length > 20) {
      result.description = content.length > 200 ? content.slice(0, 200) + '...' : content;
    }
  }

  return result;
}
