/**
 * Asset Extraction Service
 *
 * Crops custom visuals (icons, logos, textures, illustrations) from reference
 * images instead of generating approximations. Uses Sharp for server-side
 * image processing and uploads results to Supabase Storage.
 */

import sharp from 'sharp';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { DomTreeNode } from '@/types/titanPipeline';

// Re-export for consumers that imported from here
export type { DomTreeNode };

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractionRequest {
  /** Base64-encoded original image (with or without data URI prefix) */
  originalImageBase64: string;
  /** Normalized bounds as percentage of full image (0-100 scale) */
  bounds: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  /** Identifier for this asset (used in filename and asset mapping) */
  assetId: string;
  /** Output format */
  format?: 'webp' | 'png';
}

export interface ExtractionResult {
  /** Public URL of the uploaded asset, or data URI fallback */
  url: string;
  /** Whether extraction and upload succeeded */
  success: boolean;
  /** Asset identifier matching the request */
  assetId: string;
  /** Error message if failed */
  error?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

class AssetExtractionService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (sbUrl && sbKey) {
      this.supabase = createClient(sbUrl, sbKey);
    }
  }

  /**
   * Extract (crop) a region from the original image.
   * Uploads to Supabase Storage, falls back to data URI if unavailable.
   */
  async extractAsset(request: ExtractionRequest): Promise<ExtractionResult> {
    try {
      // 1. Decode base64 to buffer
      const base64Data = request.originalImageBase64.includes(',')
        ? request.originalImageBase64.split(',')[1]
        : request.originalImageBase64;
      const buffer = Buffer.from(base64Data, 'base64');

      // 2. Get image dimensions
      const metadata = await sharp(buffer).metadata();
      if (!metadata.width || !metadata.height) {
        throw new Error('Could not read image dimensions');
      }

      // 3. Convert normalized bounds (0-100) to pixel coordinates
      const cropLeft = Math.max(0, Math.round((request.bounds.left / 100) * metadata.width));
      const cropTop = Math.max(0, Math.round((request.bounds.top / 100) * metadata.height));
      let cropWidth = Math.round((request.bounds.width / 100) * metadata.width);
      let cropHeight = Math.round((request.bounds.height / 100) * metadata.height);

      // Clamp to image boundaries
      cropWidth = Math.min(cropWidth, metadata.width - cropLeft);
      cropHeight = Math.min(cropHeight, metadata.height - cropTop);

      if (cropWidth <= 0 || cropHeight <= 0) {
        throw new Error(
          `Invalid crop dimensions: ${cropWidth}x${cropHeight} at (${cropLeft},${cropTop})`
        );
      }

      // 4. Crop and encode
      const format = request.format ?? 'webp';
      let pipeline = sharp(buffer).extract({
        left: cropLeft,
        top: cropTop,
        width: cropWidth,
        height: cropHeight,
      });

      if (format === 'webp') {
        pipeline = pipeline.webp({ quality: 90 });
      } else {
        pipeline = pipeline.png();
      }

      const croppedBuffer = await pipeline.toBuffer();

      // 5. Upload or return data URI
      const mimeType = format === 'webp' ? 'image/webp' : 'image/png';
      const ext = format === 'webp' ? 'webp' : 'png';

      if (this.supabase) {
        const filename = `layout-assets/${request.assetId}-${Date.now()}.${ext}`;
        const { data, error } = await this.supabase.storage
          .from('ai-images')
          .upload(filename, croppedBuffer, {
            contentType: mimeType,
            upsert: false,
          });

        if (error) throw error;

        const { data: urlData } = this.supabase.storage
          .from('ai-images')
          .getPublicUrl(data.path);

        return {
          success: true,
          url: urlData.publicUrl,
          assetId: request.assetId,
        };
      }

      // Fallback: data URI
      const base64Result = croppedBuffer.toString('base64');
      return {
        success: true,
        url: `data:${mimeType};base64,${base64Result}`,
        assetId: request.assetId,
      };
    } catch (error) {
      console.error(`[AssetExtraction] Failed to extract ${request.assetId}:`, error);
      return {
        success: false,
        url: '',
        assetId: request.assetId,
        error: error instanceof Error ? error.message : 'Unknown extraction error',
      };
    }
  }

  /**
   * Walk a Surveyor dom_tree and extract all nodes flagged with hasCustomVisual.
   * Returns a map of node ID -> extracted asset URL.
   */
  async extractFromDomTree(
    domTree: DomTreeNode,
    originalImageBase64: string
  ): Promise<Record<string, string>> {
    const extractionTasks: ExtractionRequest[] = [];
    this.collectExtractionTasks(domTree, originalImageBase64, extractionTasks);

    if (extractionTasks.length === 0) {
      return {};
    }

    console.log(`[AssetExtraction] Extracting ${extractionTasks.length} custom visuals...`);

    // Run all extractions in parallel
    const results = await Promise.all(
      extractionTasks.map((task) => this.extractAsset(task))
    );

    const assetMap: Record<string, string> = {};
    for (const result of results) {
      if (result.success && result.url) {
        assetMap[result.assetId] = result.url;
        console.log(`[AssetExtraction] Extracted: ${result.assetId}`);
      } else {
        console.warn(`[AssetExtraction] Failed: ${result.assetId} - ${result.error}`);
      }
    }

    return assetMap;
  }

  /**
   * Recursively collect extraction tasks from dom_tree nodes.
   */
  private collectExtractionTasks(
    node: DomTreeNode,
    originalImageBase64: string,
    tasks: ExtractionRequest[]
  ): void {
    if (
      node.hasCustomVisual &&
      node.extractionBounds &&
      node.id
    ) {
      tasks.push({
        originalImageBase64,
        bounds: node.extractionBounds,
        assetId: node.id,
      });
    }

    if (node.children) {
      for (const child of node.children) {
        this.collectExtractionTasks(child, originalImageBase64, tasks);
      }
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let instance: AssetExtractionService | null = null;

export function getAssetExtractionService(): AssetExtractionService {
  if (!instance) instance = new AssetExtractionService();
  return instance;
}
