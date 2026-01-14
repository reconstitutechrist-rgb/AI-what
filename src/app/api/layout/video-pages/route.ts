/**
 * Video Page Detection API Route
 *
 * Analyzes video frames to detect page transitions (navigation events).
 * Unlike video-analyze (which detects animations), this route detects
 * when the user navigates between different pages/screens.
 *
 * Used for:
 * - Auto-splitting videos into separate pages
 * - Detecting navigation patterns in screen recordings
 * - Creating PageReferences from video frames
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { ExtractedFrame, VideoPageTransition, PageReference } from '@/types/layoutDesign';
import { getGeminiLayoutService } from '@/services/GeminiLayoutService';

// Vercel serverless function config
export const maxDuration = 120; // 2 minutes for video processing
export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const ExtractedFrameSchema = z.object({
  index: z.number(),
  timestamp: z.number(),
  imageDataUrl: z.string(),
  isKeyFrame: z.boolean(),
});

const VideoPagesRequestSchema = z.object({
  /** Extracted frames from the video */
  frames: z.array(ExtractedFrameSchema).min(2),
  /** Key frames for more detailed analysis */
  keyFrames: z.array(ExtractedFrameSchema).optional(),
  /** Video metadata */
  metadata: z.object({
    duration: z.number(),
    width: z.number(),
    height: z.number(),
    fps: z.number(),
  }),
  /** Threshold for layout change detection (0-1, default 0.6 = 60% change) */
  transitionThreshold: z.number().min(0).max(1).optional().default(0.6),
});

// ============================================================================
// TYPES
// ============================================================================

interface VideoPagesResponse {
  success: boolean;
  /** Detected page transitions with timestamps */
  transitions: VideoPageTransition[];
  /** Page references created from representative frames */
  pageFrames: Partial<PageReference>[];
  /** Suggested page names based on content analysis */
  suggestedNames: string[];
  /** Processing metadata */
  metadata: {
    framesAnalyzed: number;
    transitionsDetected: number;
    processingTimeMs: number;
  };
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract MIME type from a base64 data URL
 */
function getMediaType(
  imageDataUrl: string
): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  const match = imageDataUrl.match(/^data:(image\/[^;]+);base64,/);
  if (match) {
    const mimeType = match[1];
    if (
      mimeType === 'image/jpeg' ||
      mimeType === 'image/png' ||
      mimeType === 'image/gif' ||
      mimeType === 'image/webp'
    ) {
      return mimeType;
    }
  }
  return 'image/jpeg';
}

/**
 * Generate a unique ID for page references
 */
function generatePageId(): string {
  return `page_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a slug from a suggested name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const validatedRequest = VideoPagesRequestSchema.parse(body);

    const { frames, keyFrames, metadata: _metadata, transitionThreshold } = validatedRequest;

    // Check for required API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Anthropic API key not configured',
        },
        { status: 500 }
      );
    }

    console.log(`[video-pages] Analyzing ${frames.length} frames for page transitions`);

    // Analyze consecutive frame pairs to detect transitions
    const transitions: VideoPageTransition[] = [];
    const framesToAnalyze = keyFrames && keyFrames.length > 0 ? keyFrames : frames;

    // Limit to analyzing pairs with reasonable spacing
    const maxPairs = Math.min(15, framesToAnalyze.length - 1);
    const step = Math.max(1, Math.floor((framesToAnalyze.length - 1) / maxPairs));

    for (let i = 0; i < framesToAnalyze.length - 1; i += step) {
      const frame1 = framesToAnalyze[i];
      const frame2 = framesToAnalyze[Math.min(i + step, framesToAnalyze.length - 1)];

      try {
        const transition = await detectVideoPageTransition(frame1, frame2, transitionThreshold);

        if (transition) {
          transitions.push(transition);
        }
      } catch (error) {
        console.error(`[video-pages] Failed to analyze frame pair ${i}:`, error);
      }

      // Small delay to avoid rate limits
      if (i + step < framesToAnalyze.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    // Create page references from transition boundaries
    const pageFrames: Partial<PageReference>[] = [];
    const suggestedNames: string[] = [];

    // First page is always the first frame
    pageFrames.push({
      id: generatePageId(),
      name: 'Page 1',
      slug: 'page-1',
      referenceImage: framesToAnalyze[0].imageDataUrl,
      order: 0,
      isMain: true,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    suggestedNames.push('Home');

    // Add pages at each transition point
    let pageIndex = 2;
    for (const transition of transitions) {
      const frameAtTransition = framesToAnalyze.find((f) => f.index >= transition.endFrameIndex);

      if (frameAtTransition) {
        const suggestedName = await suggestPageName(frameAtTransition);
        pageFrames.push({
          id: generatePageId(),
          name: suggestedName || `Page ${pageIndex}`,
          slug: generateSlug(suggestedName || `Page ${pageIndex}`),
          referenceImage: frameAtTransition.imageDataUrl,
          order: pageIndex - 1,
          isMain: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
        suggestedNames.push(suggestedName || `Page ${pageIndex}`);
        pageIndex++;
      }
    }

    const processingTime = Date.now() - startTime;

    const response: VideoPagesResponse = {
      success: true,
      transitions,
      pageFrames,
      suggestedNames,
      metadata: {
        framesAnalyzed: framesToAnalyze.length,
        transitionsDetected: transitions.length,
        processingTimeMs: processingTime,
      },
    };

    console.log(
      `[video-pages] Completed. Found ${transitions.length} page transitions in ${processingTime}ms`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('[video-pages] Error:', error);

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
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PAGE TRANSITION DETECTION
// ============================================================================

/**
 * Detect if there's a page transition between two frames
 */
async function detectVideoPageTransition(
  frame1: ExtractedFrame,
  frame2: ExtractedFrame,
  threshold: number
): Promise<VideoPageTransition | null> {
  const prompt = `Compare these two consecutive frames from a screen recording and determine if there's a PAGE TRANSITION (navigation to a different page/screen).

A page transition is characterized by:
- Significant layout change (>60% of the viewport changed)
- URL bar change visible (if browser)
- Complete content replacement
- Navigation animation (slide, fade between pages)
- Modal/drawer opening that covers most of the screen

This is NOT a page transition:
- Scrolling
- Hover effects
- Small UI animations
- Dropdown menus
- Tooltips
- Minor content updates

Return a JSON object:
{
  "isVideoPageTransition": true/false,
  "confidence": 0.0-1.0,
  "transitionType": "navigation" | "scroll" | "modal" | "drawer" | "tab-switch" | "unknown",
  "layoutChangePercent": 0-100,
  "description": "Brief description of what changed"
}

Return ONLY the JSON, no markdown or explanation.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: getMediaType(frame1.imageDataUrl),
                data: frame1.imageDataUrl.replace(/^data:image\/[a-z]+;base64,/, ''),
              },
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: getMediaType(frame2.imageDataUrl),
                data: frame2.imageDataUrl.replace(/^data:image\/[a-z]+;base64,/, ''),
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return null;
    }

    // Parse JSON from response
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Check if this qualifies as a page transition
    if (
      parsed.isVideoPageTransition &&
      parsed.confidence >= threshold &&
      (parsed.layoutChangePercent >= 60 || parsed.transitionType === 'navigation')
    ) {
      return {
        startTime: frame1.timestamp,
        endTime: frame2.timestamp,
        transitionType: parsed.transitionType || 'unknown',
        confidence: parsed.confidence,
        startFrameIndex: frame1.index,
        endFrameIndex: frame2.index,
      };
    }

    return null;
  } catch (error) {
    console.error('[video-pages] detectVideoPageTransition error:', error);
    return null;
  }
}

/**
 * Suggest a page name based on the frame content
 */
async function suggestPageName(frame: ExtractedFrame): Promise<string> {
  // Use Gemini for quick page name suggestion if available
  if (process.env.GOOGLE_API_KEY) {
    try {
      const geminiService = getGeminiLayoutService();
      if (geminiService.checkAvailability()) {
        const analysis = await geminiService.detectLayoutStructure(frame.imageDataUrl);

        // Generate name based on detected structure
        if (analysis.structure === 'dashboard') return 'Dashboard';
        if (analysis.hasSidebar && !analysis.hasHeader) return 'Settings';
        if (analysis.mainContentAreas.includes('form')) return 'Form';
        if (analysis.mainContentAreas.includes('table')) return 'Data Table';
        if (analysis.mainContentAreas.includes('cards')) return 'Gallery';
      }
    } catch {
      // Fall through to default
    }
  }

  return 'New Page';
}

// ============================================================================
// GET HANDLER (health check)
// ============================================================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/layout/video-pages',
    description: 'Detects page transitions in video frames',
    maxDuration: '120s',
    anthropicAvailable: !!process.env.ANTHROPIC_API_KEY,
    geminiAvailable: !!process.env.GOOGLE_API_KEY,
  });
}
