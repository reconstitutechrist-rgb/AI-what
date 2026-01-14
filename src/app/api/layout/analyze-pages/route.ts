/**
 * Multi-Page Analysis API Route
 *
 * Analyzes multiple page screenshots for exact replication purposes.
 * Returns shared design tokens, navigation structure, and per-page analysis.
 *
 * Used for:
 * - Multi-page app replication
 * - Detecting shared design tokens across pages
 * - Inferring navigation structure and routes
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getGeminiLayoutService } from '@/services/GeminiLayoutService';
import type { MultiPageAnalysisResult, PageReference, MultiPageDesign } from '@/types/layoutDesign';

// Vercel serverless function config
export const maxDuration = 120; // 2 minutes for multi-page analysis
export const dynamic = 'force-dynamic';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const PageInputSchema = z.object({
  id: z.string(),
  imageBase64: z.string(),
  name: z.string().optional(),
});

const AnalyzePagesRequestSchema = z.object({
  /** Array of pages to analyze (max 5 initially, more can be added via conversation) */
  pages: z.array(PageInputSchema).min(1).max(10),
  /** Existing multi-page design for incremental updates */
  existingDesign: z.any().optional(),
  /** Analysis mode */
  analysisMode: z.enum(['standard', 'pixel-perfect']).optional().default('standard'),
});

// ============================================================================
// TYPES
// ============================================================================

// Request type (documented for reference; validation uses Zod schema)
interface _AnalyzePagesRequest {
  pages: Array<{ id: string; imageBase64: string; name?: string }>;
  existingDesign?: MultiPageDesign;
  analysisMode?: 'standard' | 'pixel-perfect';
}

interface AnalyzePagesResponse extends MultiPageAnalysisResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const validatedRequest = AnalyzePagesRequestSchema.parse(body);

    const { pages, existingDesign, analysisMode: _analysisMode } = validatedRequest;

    // Check for Gemini API key
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gemini API key not configured (GOOGLE_API_KEY required)',
        },
        { status: 500 }
      );
    }

    const geminiService = getGeminiLayoutService();

    if (!geminiService.checkAvailability()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gemini service not available',
        },
        { status: 500 }
      );
    }

    console.log(`[analyze-pages] Starting analysis of ${pages.length} pages`);

    // Analyze all pages
    const analysisResult = await geminiService.analyzeMultiplePages(pages);

    // If there's an existing design, merge the new pages
    let finalResult = analysisResult;
    if (existingDesign && existingDesign.pages) {
      const typedExistingDesign = existingDesign as MultiPageDesign;
      // Merge existing pages with new pages
      const existingPageIds = new Set(typedExistingDesign.pages.map((p: PageReference) => p.id));
      const newPages = analysisResult.pages.filter((p) => !existingPageIds.has(p.id));

      finalResult = {
        ...analysisResult,
        pages: [...typedExistingDesign.pages, ...newPages],
        // Re-detect navigation with all pages
        navigation: await geminiService.detectNavigationFromPages([
          ...typedExistingDesign.pages,
          ...newPages,
        ]),
        // Re-infer routes with all pages
        inferredRoutes: geminiService.inferRoutesFromPages([
          ...typedExistingDesign.pages,
          ...newPages,
        ]),
      };
    }

    const processingTime = Date.now() - startTime;
    console.log(
      `[analyze-pages] Completed analysis in ${processingTime}ms. ` +
        `${finalResult.metadata.analyzedPages}/${finalResult.metadata.totalPages} pages analyzed successfully.`
    );

    const response: AnalyzePagesResponse = {
      ...finalResult,
      success: true,
      metadata: {
        ...finalResult.metadata,
        processingTimeMs: processingTime,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[analyze-pages] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during page analysis',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET HANDLER (for health check)
// ============================================================================

export async function GET() {
  const geminiAvailable = process.env.GOOGLE_API_KEY
    ? getGeminiLayoutService().checkAvailability()
    : false;

  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/layout/analyze-pages',
    geminiAvailable,
    maxPages: 10,
    maxDuration: '120s',
  });
}
