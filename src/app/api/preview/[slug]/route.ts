/**
 * GET /api/preview/[slug]
 * Fetch public app data for preview - no auth required
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PreviewSlugSchema } from '@/types/deployment';

// CORS headers for potential iframe embedding
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    // Validate slug format
    const parseResult = PreviewSlugSchema.safeParse({ slug });
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid preview slug' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Use service role client for public access (bypasses RLS for this query)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: app, error } = await supabase
      .from('generated_apps')
      .select('id, title, description, code, metadata, created_at')
      .eq('preview_slug', slug)
      .eq('is_public', true)
      .eq('preview_enabled', true)
      .single();

    if (error || !app) {
      return NextResponse.json(
        { success: false, error: 'Preview not found or not public' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        app: {
          id: app.id,
          title: app.title,
          description: app.description,
          code: app.code,
          createdAt: app.created_at,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Preview fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch preview' },
      { status: 500, headers: corsHeaders }
    );
  }
}
