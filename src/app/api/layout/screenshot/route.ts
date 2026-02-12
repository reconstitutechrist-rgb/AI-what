/**
 * Screenshot API Route
 *
 * Server-side screenshot capture using Puppeteer.
 * Used by the self-healing vision loop to capture the current
 * rendered layout for comparison with the original design.
 *
 * Features:
 * - Captures HTML/CSS to base64 PNG
 * - Handles blur effects, gradients, and custom fonts correctly
 * - Configurable viewport dimensions
 * - Falls back gracefully if Puppeteer unavailable
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ScreenshotResponse } from '@/types/layoutAnalysis';
import type { AppFile } from '@/types/railway';
import { getReactToHtmlService } from '@/services/ReactToHtmlService';
import { ScreenshotRequestSchema } from '@/types/api-schemas';
import { CURATED_VERSIONS } from '@/config/curated-versions';

// Lazy-load puppeteer to avoid issues in environments where it's not available
let puppeteerModule: typeof import('puppeteer') | null = null;

async function getPuppeteer() {
  if (!puppeteerModule) {
    try {
      puppeteerModule = await import('puppeteer');
    } catch (error) {
      console.warn('[Screenshot API] Puppeteer not available:', error);
      return null;
    }
  }
  return puppeteerModule;
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = ScreenshotRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message } as ScreenshotResponse,
        { status: 400 }
      );
    }

    const body = parsed.data;
    const { css, viewport } = body;
    const is3D = body.use3DRenderer === true;

    // 3D path: build self-contained HTML using esm.sh CDN for Three.js ecosystem
    // 2D path: use ReactToHtmlService for CDN-based React rendering
    let html = body.html;
    if (!html && body.files && body.files.length > 0) {
      if (is3D) {
        html = build3DHtmlDocument(body.files, viewport);
      } else {
        const htmlService = getReactToHtmlService();
        html = htmlService.buildStandaloneHtml(body.files, viewport);
      }
    }

    if (!html) {
      return NextResponse.json(
        { success: false, error: 'Either html or files is required' } as ScreenshotResponse,
        { status: 400 }
      );
    }

    const puppeteer = await getPuppeteer();

    if (!puppeteer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Puppeteer not available. Use client-side html2canvas as fallback.',
        } as ScreenshotResponse,
        { status: 503 }
      );
    }

    // Launch browser — enable WebGL for 3D rendering
    const launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process',
    ];
    if (is3D) {
      // Enable GPU/WebGL for Three.js rendering
      launchArgs.push('--enable-webgl', '--use-gl=swiftshader');
    } else {
      launchArgs.push('--disable-gpu');
    }

    const browser = await puppeteer.default.launch({
      headless: true,
      args: launchArgs,
    });

    try {
      const page = await browser.newPage();

      // Set viewport
      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 2,
      });

      // Build the full HTML document with styles
      const fullHtml = is3D ? html : buildFullHtmlDocument(html, css, viewport);

      // Set the page content — 3D scenes need more time for esm.sh module loading
      await page.setContent(fullHtml, {
        waitUntil: 'networkidle0',
        timeout: is3D ? 60000 : 30000,
      });

      // Wait for rendering to settle — 3D needs extra time for scene initialization
      const settleMs = is3D ? 3000 : 500;
      await page.evaluate((ms) => new Promise((resolve) => setTimeout(resolve, ms)), settleMs);

      // Take the screenshot
      const screenshotBuffer = await page.screenshot({
        type: 'png',
        fullPage: false,
        encoding: 'base64',
      });

      const response: ScreenshotResponse = {
        success: true,
        image: `data:image/png;base64,${screenshotBuffer}`,
      };

      return NextResponse.json(response);
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('[Screenshot API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Screenshot capture failed';
    return NextResponse.json({ success: false, error: errorMessage } as ScreenshotResponse, {
      status: 500,
    });
  }
}

// ============================================================================
// 3D RENDERING (esm.sh CDN)
// ============================================================================

/**
 * esm.sh import map for Three.js ecosystem.
 * Maps bare npm specifiers to esm.sh CDN URLs so Puppeteer can run
 * React Three Fiber code without a bundler.
 *
 * Uses pinned versions from CURATED_VERSIONS for reproducibility.
 */
function build3DImportMap(): Record<string, string> {
  const threeVer = CURATED_VERSIONS.three.replace('^', '');
  const r3fVer = CURATED_VERSIONS['@react-three/fiber'].replace('^', '');
  const dreiVer = CURATED_VERSIONS['@react-three/drei'].replace('^', '');
  const postVer = CURATED_VERSIONS['@react-three/postprocessing'].replace('^', '');
  const rapierVer = CURATED_VERSIONS['@react-three/rapier'].replace('^', '');
  const rapier3dVer = CURATED_VERSIONS['@dimforge/rapier3d-compat'].replace('^', '');
  const framerVer = CURATED_VERSIONS['framer-motion'].replace('^', '');

  return {
    'react': 'https://esm.sh/react@19?bundle',
    'react/': 'https://esm.sh/react@19/',
    'react-dom': 'https://esm.sh/react-dom@19?bundle',
    'react-dom/': 'https://esm.sh/react-dom@19/',
    'react/jsx-runtime': 'https://esm.sh/react@19/jsx-runtime?bundle',
    'three': `https://esm.sh/three@${threeVer}?bundle`,
    'three/': `https://esm.sh/three@${threeVer}/`,
    '@react-three/fiber': `https://esm.sh/@react-three/fiber@${r3fVer}?bundle&external=react,react-dom,three`,
    '@react-three/drei': `https://esm.sh/@react-three/drei@${dreiVer}?bundle&external=react,react-dom,three,@react-three/fiber`,
    '@react-three/postprocessing': `https://esm.sh/@react-three/postprocessing@${postVer}?bundle&external=react,react-dom,three,@react-three/fiber`,
    '@react-three/rapier': `https://esm.sh/@react-three/rapier@${rapierVer}?bundle&external=react,react-dom,three,@react-three/fiber`,
    '@dimforge/rapier3d-compat': `https://esm.sh/@dimforge/rapier3d-compat@${rapier3dVer}?bundle`,
    'framer-motion': `https://esm.sh/framer-motion@${framerVer}?bundle&external=react,react-dom`,
    'lucide-react': 'https://esm.sh/lucide-react@latest?bundle&external=react',
    'clsx': 'https://esm.sh/clsx@2?bundle',
    'tailwind-merge': 'https://esm.sh/tailwind-merge@2?bundle',
  };
}

/**
 * Build a self-contained HTML document for 3D scene rendering.
 *
 * Strategy: use an ES module import map to resolve bare specifiers
 * (e.g. `import { Canvas } from '@react-three/fiber'`) to esm.sh CDN
 * URLs. Babel Standalone transpiles the TSX at runtime.
 *
 * This bypasses ReactToHtmlService entirely — Three.js has no UMD bundle,
 * so the CDN-only approach used for 2D cannot work for 3D.
 */
function build3DHtmlDocument(
  files: AppFile[],
  viewport: { width: number; height: number }
): string {
  const appFile = files.find(
    (f) => f.path.endsWith('App.tsx') || f.path.endsWith('App.jsx')
  );

  if (!appFile) {
    return `<!DOCTYPE html><html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#ef4444;"><p>No App.tsx found</p></body></html>`;
  }

  const importMap = build3DImportMap();
  const importMapJson = JSON.stringify({ imports: importMap }, null, 2);

  // Strip TypeScript types that Babel standalone handles poorly
  function stripTypes(code: string): string {
    let result = code;
    // Remove interface/type declarations
    result = result.replace(/^(?:export\s+)?(?:interface|type)\s+\w+[^{;]*\{[^}]*\}\s*;?/gm, '');
    result = result.replace(/^(?:export\s+)?type\s+\w+\s*=\s*[^;{]+;/gm, '');
    // Remove type-only imports
    result = result.replace(/import\s+type\s+\{[^}]*\}\s*from\s*['"][^'"]*['"]\s*;?/g, '');
    // Remove generic type annotations from arrow functions: <T,>(...) or <T extends ...>(...)
    result = result.replace(/<\w+(?:\s+extends\s+\w+)?(?:,\s*\w+(?:\s+extends\s+\w+)?)*>\s*(?=\()/g, '');
    // Remove 'as Type' assertions
    result = result.replace(/\s+as\s+\w+(?:<[^>]+>)?/g, '');
    return result;
  }

  // Process App code
  const appCode = stripTypes(appFile.content);

  // Process additional component files
  const additionalFiles = files
    .filter((f) => f !== appFile && (f.path.endsWith('.tsx') || f.path.endsWith('.jsx')))
    .filter((f) => !f.path.endsWith('index.tsx') && !f.path.endsWith('main.tsx'));

  const additionalScripts = additionalFiles
    .map((f) => {
      const processed = stripTypes(f.content);
      const nameMatch = f.path.match(/\/(\w+)\.(?:tsx|jsx)$/);
      const componentName = nameMatch ? nameMatch[1] : null;
      return `
    <script type="text/babel" data-type="module" data-presets="react,typescript">
      // Component: ${f.path}
      ${processed}
      ${componentName ? `window.${componentName} = ${componentName};` : ''}
    </script>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>3D Scene Screenshot</title>

  <!-- Import Map for Three.js ecosystem via esm.sh -->
  <script type="importmap">${importMapJson}</script>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: ${viewport.width}px;
      height: ${viewport.height}px;
      overflow: hidden;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    body { background: #000000; }
    #root { width: 100%; height: 100%; }
    canvas { display: block; }
  </style>
</head>
<body>
  <div id="root"></div>

  <!-- React (ESM via import map) -->
  <script type="module">
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    window.React = React;
    window.ReactDOM = ReactDOM;

    // Signal that React is loaded
    window.__REACT_LOADED = true;
    window.dispatchEvent(new Event('react-loaded'));
  </script>

  <!-- Babel Standalone for TSX transpilation -->
  <script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>

  <!-- Wait for React, then run components -->
  <script>
    function runBabelScripts() {
      // Transform and execute all text/babel scripts in order
      var scripts = document.querySelectorAll('script[type="text/babel"]');
      scripts.forEach(function(script) {
        try {
          var code = script.textContent;
          var output = Babel.transform(code, {
            presets: ['react', 'typescript'],
            filename: 'component.tsx',
          });
          var fn = new Function(output.code);
          fn();
        } catch(e) {
          console.error('[3D Screenshot] Babel transform error:', e);
        }
      });
    }

    if (window.__REACT_LOADED) {
      runBabelScripts();
    } else {
      window.addEventListener('react-loaded', runBabelScripts);
    }
  </script>

  ${additionalScripts}

  <!-- Main App Component -->
  <script type="text/babel" data-type="module" data-presets="react,typescript">
    ${appCode}

    // Render
    const container = document.getElementById('root');
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(App));

    // Signal render complete for Puppeteer
    window.__APP_RENDERED = true;
  </script>
</body>
</html>`;
}

// ============================================================================
// 2D RENDERING (standard HTML/CSS)
// ============================================================================

/**
 * Build a complete HTML document with proper styling
 */
function buildFullHtmlDocument(
  html: string,
  css?: string,
  viewport?: { width: number; height: number }
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Layout Screenshot</title>

  <!-- Google Fonts for common font families -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    /* Reset and base styles */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      width: ${viewport?.width || 1280}px;
      height: ${viewport?.height || 800}px;
      overflow: hidden;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    body {
      background: #ffffff;
      position: relative;
    }

    /* Support for blur effects (glassmorphism) */
    .backdrop-blur {
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    /* Support for gradients */
    .gradient-support {
      background-image: var(--gradient);
    }

    /* Custom CSS from request */
    ${css || ''}
  </style>
</head>
<body>
  ${html}
</body>
</html>
  `.trim();
}

/**
 * GET handler for health check
 */
export async function GET() {
  const puppeteer = await getPuppeteer();
  return NextResponse.json({
    available: !!puppeteer,
    message: puppeteer
      ? 'Screenshot API ready with Puppeteer'
      : 'Puppeteer not available - use html2canvas fallback',
  });
}
