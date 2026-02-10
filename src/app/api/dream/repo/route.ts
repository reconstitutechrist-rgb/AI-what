/**
 * Dream Mode Repo Proxy
 *
 * Server-side proxy for GitHub API repo downloads.
 * The client can't fetch GitHub API directly because the app's
 * Cross-Origin-Embedder-Policy headers block cross-origin responses.
 * This route fetches the ZIP server-side and streams it back.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { repoUrl, token, branch = 'main' } = await req.json();

    if (!repoUrl || typeof repoUrl !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid repoUrl' },
        { status: 400 }
      );
    }

    // Normalize: accept full GitHub URLs or owner/repo format
    const slug = repoUrl
      .replace(/^https?:\/\/(www\.)?github\.com\//, '')
      .replace(/\.git$/, '')
      .replace(/\/+$/, '');

    // Validate slug format (owner/repo)
    if (!/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(slug)) {
      return NextResponse.json(
        { error: `Invalid repository format: "${slug}". Expected "owner/repo".` },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'AI-App-Builder-DreamMode',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const ghResponse = await fetch(
      `https://api.github.com/repos/${slug}/zipball/${branch}`,
      { headers }
    );

    if (!ghResponse.ok) {
      const errorText = await ghResponse.text().catch(() => 'Unknown error');
      return NextResponse.json(
        {
          error: `GitHub API returned ${ghResponse.status}: ${ghResponse.statusText}`,
          details: errorText.slice(0, 500),
        },
        { status: ghResponse.status }
      );
    }

    // Stream the ZIP binary back to the client
    const zipBuffer = await ghResponse.arrayBuffer();

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': String(zipBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error('[Dream Repo Proxy] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
