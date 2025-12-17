/**
 * POST /api/figma/anonymous
 * Import from public Figma URL or JSON data without authentication
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  parseFigmaUrl,
  transformFigmaAPIToExtraction,
  transformFigmaToLayoutDesign,
} from '@/services/figmaTransformer';
import type { FigmaImportResponse, FigmaAPIFile } from '@/types/figma';

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

const RequestSchema = z.object({
  type: z.enum(['url', 'json']),
  url: z.string().url().optional(),
  jsonData: z.string().optional(),
});

export async function POST(request: Request): Promise<NextResponse<FigmaImportResponse>> {
  try {
    const body = await request.json();

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

    const { type, url, jsonData } = parseResult.data;

    if (type === 'url') {
      // Parse Figma URL
      if (!url) {
        return NextResponse.json(
          { success: false, error: 'URL is required for URL import' },
          { status: 400, headers: corsHeaders }
        );
      }

      const parsed = parseFigmaUrl(url);
      if (!parsed) {
        return NextResponse.json(
          { success: false, error: 'Invalid Figma URL format' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Check for Figma API token
      const figmaToken = process.env.FIGMA_PERSONAL_ACCESS_TOKEN;

      if (!figmaToken) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Figma API access not configured. Please use the Figma plugin or provide JSON export instead.',
          },
          { status: 400, headers: corsHeaders }
        );
      }

      // Fetch from Figma API
      try {
        const apiUrl = `https://api.figma.com/v1/files/${parsed.fileKey}`;
        const response = await fetch(apiUrl, {
          headers: {
            'X-Figma-Token': figmaToken,
          },
        });

        if (!response.ok) {
          if (response.status === 403) {
            return NextResponse.json(
              {
                success: false,
                error: 'Cannot access this Figma file. It may be private or the token is invalid.',
              },
              { status: 403, headers: corsHeaders }
            );
          }
          if (response.status === 404) {
            return NextResponse.json(
              { success: false, error: 'Figma file not found' },
              { status: 404, headers: corsHeaders }
            );
          }
          throw new Error(`Figma API error: ${response.status}`);
        }

        const figmaFile = (await response.json()) as FigmaAPIFile;

        // Transform API response to extraction format
        const extraction = transformFigmaAPIToExtraction(figmaFile, parsed.nodeId);

        // Transform to LayoutDesign
        const layoutDesign = transformFigmaToLayoutDesign(extraction);

        return NextResponse.json(
          {
            success: true,
            layoutDesign: layoutDesign as FigmaImportResponse['layoutDesign'],
            warnings: [`Imported from: ${figmaFile.name}`],
          },
          { headers: corsHeaders }
        );
      } catch (fetchError) {
        console.error('Figma API fetch error:', fetchError);
        return NextResponse.json(
          {
            success: false,
            error:
              fetchError instanceof Error ? fetchError.message : 'Failed to fetch from Figma API',
          },
          { status: 500, headers: corsHeaders }
        );
      }
    } else if (type === 'json') {
      // Parse JSON data directly
      if (!jsonData) {
        return NextResponse.json(
          { success: false, error: 'JSON data is required for JSON import' },
          { status: 400, headers: corsHeaders }
        );
      }

      try {
        const parsed = JSON.parse(jsonData);

        // Check if it's a Figma extraction or raw design tokens
        if (parsed.documentName && parsed.colors && parsed.typography) {
          // It's a Figma extraction format
          const layoutDesign = transformFigmaToLayoutDesign(parsed);
          return NextResponse.json(
            {
              success: true,
              layoutDesign: layoutDesign as FigmaImportResponse['layoutDesign'],
            },
            { headers: corsHeaders }
          );
        } else if (parsed.globalStyles || parsed.colors) {
          // It's already a LayoutDesign or design tokens format
          return NextResponse.json(
            {
              success: true,
              layoutDesign: parsed,
              warnings: ['Imported as raw design tokens'],
            },
            { headers: corsHeaders }
          );
        } else {
          return NextResponse.json(
            {
              success: false,
              error: 'Unrecognized JSON format. Expected Figma extraction or design tokens.',
            },
            { status: 400, headers: corsHeaders }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid JSON data' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Invalid import type' },
      { status: 400, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Anonymous import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during import',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
