/**
 * POST /api/figma/import
 * Receives Figma extraction data from plugin and converts to LayoutDesign
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { transformFigmaToLayoutDesign } from '@/services/figmaTransformer';
import type { FigmaImportRequest, FigmaImportResponse } from '@/types/figma';

// CORS headers for Figma plugin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Validation schema for the request
const FigmaExtractionSchema = z.object({
  documentName: z.string(),
  pageName: z.string(),
  selectionName: z.string(),
  colors: z.array(
    z.object({
      hex: z.string(),
      rgba: z.object({
        r: z.number(),
        g: z.number(),
        b: z.number(),
        a: z.number(),
      }),
      name: z.string().optional(),
      usage: z.enum(['fill', 'stroke', 'text', 'background']),
      frequency: z.number(),
    })
  ),
  typography: z.array(
    z.object({
      fontFamily: z.string(),
      fontWeight: z.number(),
      fontSize: z.number(),
      lineHeight: z.union([z.number(), z.literal('auto')]),
      letterSpacing: z.number(),
      textCase: z.enum(['ORIGINAL', 'UPPER', 'LOWER', 'TITLE']).optional(),
      usage: z.enum(['heading', 'body', 'caption', 'unknown']),
      frequency: z.number(),
    })
  ),
  spacing: z.object({
    itemSpacing: z.number(),
    paddingTop: z.number(),
    paddingRight: z.number(),
    paddingBottom: z.number(),
    paddingLeft: z.number(),
    layoutMode: z.enum(['NONE', 'HORIZONTAL', 'VERTICAL']),
  }),
  effects: z.array(
    z.object({
      type: z.enum(['DROP_SHADOW', 'INNER_SHADOW', 'LAYER_BLUR', 'BACKGROUND_BLUR']),
      radius: z.number(),
      color: z
        .object({
          r: z.number(),
          g: z.number(),
          b: z.number(),
          a: z.number(),
        })
        .optional(),
      offset: z
        .object({
          x: z.number(),
          y: z.number(),
        })
        .optional(),
      spread: z.number().optional(),
    })
  ),
  components: z.array(z.lazy((): z.ZodType => ComponentSchema)),
  cornerRadius: z.number(),
  frameSize: z.object({
    width: z.number(),
    height: z.number(),
  }),
});

const ComponentSchema: z.ZodType = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['header', 'sidebar', 'footer', 'hero', 'card', 'navigation', 'list', 'unknown']),
  bounds: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  children: z.array(z.lazy(() => ComponentSchema)),
  properties: z.record(z.string(), z.unknown()),
});

const RequestSchema = z.object({
  figmaData: FigmaExtractionSchema,
  options: z
    .object({
      extractColors: z.boolean().optional(),
      extractTypography: z.boolean().optional(),
      extractSpacing: z.boolean().optional(),
      extractComponents: z.boolean().optional(),
    })
    .optional(),
});

export async function POST(request: Request): Promise<NextResponse<FigmaImportResponse>> {
  try {
    const body: unknown = await request.json();

    // Validate request
    const parseResult = RequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid request: ${parseResult.error.message}`,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const { figmaData } = parseResult.data as FigmaImportRequest;

    // Transform Figma data to LayoutDesign
    const layoutDesign = transformFigmaToLayoutDesign(figmaData);

    // Collect warnings
    const warnings: string[] = [];

    if (figmaData.colors.length === 0) {
      warnings.push('No colors found in selection');
    }
    if (figmaData.typography.length === 0) {
      warnings.push('No typography found in selection');
    }
    if (figmaData.components.length === 0) {
      warnings.push('No components identified in selection');
    }

    return NextResponse.json(
      {
        success: true,
        layoutDesign: layoutDesign as FigmaImportResponse['layoutDesign'],
        warnings: warnings.length > 0 ? warnings : undefined,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Figma import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during import',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
