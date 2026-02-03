/**
 * React-to-HTML Service
 *
 * Converts AppFile[] (React TSX code) into a standalone HTML document
 * that can be rendered by Puppeteer for screenshot capture.
 *
 * Uses React CDN + Babel Standalone for in-browser transpilation,
 * plus Tailwind CSS CDN for styling. This avoids needing a Node.js
 * build step — the HTML document is self-contained and renders
 * the React components client-side.
 *
 * Server-side only — used by VisualCriticService and the critique API.
 */

import type { AppFile } from '@/types/railway';

// ============================================================================
// CDN URLS
// ============================================================================

const REACT_CDN = 'https://unpkg.com/react@19/umd/react.production.min.js';
const REACT_DOM_CDN = 'https://unpkg.com/react-dom@19/umd/react-dom.production.min.js';
const BABEL_STANDALONE_CDN = 'https://unpkg.com/@babel/standalone@7/babel.min.js';
const TAILWIND_CDN = 'https://cdn.tailwindcss.com';

// ============================================================================
// SERVICE
// ============================================================================

class ReactToHtmlServiceInstance {
  /**
   * Convert AppFile[] into a standalone HTML document.
   *
   * Strategy:
   * 1. Extract the App.tsx (main component) content
   * 2. Strip TypeScript types and import statements
   * 3. Wrap in a Babel-transpiled script tag
   * 4. Include React/ReactDOM from CDN
   * 5. Include Tailwind CSS from CDN
   * 6. Render App into a root div
   */
  buildStandaloneHtml(
    files: AppFile[],
    viewport: { width: number; height: number } = { width: 1280, height: 800 }
  ): string {
    // Find the main App file
    const appFile = files.find(
      (f) => f.path.endsWith('App.tsx') || f.path.endsWith('App.jsx')
    );

    if (!appFile) {
      return this.buildErrorHtml('No App.tsx found in generated files');
    }

    // Process the code: strip imports that won't resolve in browser,
    // keep the component code intact for Babel to transpile
    const processedCode = this.processCodeForBrowser(appFile.content);

    // Collect any additional component files
    const additionalComponents = files
      .filter((f) => f !== appFile && (f.path.endsWith('.tsx') || f.path.endsWith('.jsx')))
      .filter((f) => !f.path.endsWith('index.tsx') && !f.path.endsWith('main.tsx'));

    const additionalScripts = additionalComponents
      .map((f) => {
        const processed = this.processCodeForBrowser(f.content);
        const componentName = this.extractComponentName(f.path);
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
  <title>Visual Critic Preview</title>

  <!-- Tailwind CSS -->
  <script src="${TAILWIND_CDN}"></script>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: ${viewport.width}px;
      height: ${viewport.height}px;
      overflow: hidden;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    body { background: #ffffff; }
    #root { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="root"></div>

  <!-- React -->
  <script crossorigin src="${REACT_CDN}"></script>
  <script crossorigin src="${REACT_DOM_CDN}"></script>

  <!-- Babel Standalone (for JSX/TSX transpilation) -->
  <script src="${BABEL_STANDALONE_CDN}"></script>

  <!-- Shims for common imports that generated code uses -->
  <script>
    // Provide stubs for common libraries that may be imported
    window.exports = window.exports || {};
    window.module = window.module || { exports: {} };

    // Stub lucide-react icons as simple SVG placeholders
    window.LucideIcons = new Proxy({}, {
      get: function(target, name) {
        if (typeof name !== 'string') return undefined;
        return function LucideIcon(props) {
          const size = props?.size || 24;
          return React.createElement('svg', {
            width: size, height: size, viewBox: '0 0 24 24',
            fill: 'none', stroke: 'currentColor', strokeWidth: 2,
            strokeLinecap: 'round', strokeLinejoin: 'round',
            className: props?.className || '',
          }, React.createElement('circle', { cx: 12, cy: 12, r: 10 }));
        };
      }
    });

    // Stub framer-motion as passthrough
    window.framerMotion = {
      motion: new Proxy({}, {
        get: function(target, name) {
          if (typeof name !== 'string') return undefined;
          return React.forwardRef(function(props, ref) {
            var newProps = Object.assign({}, props, { ref: ref });
            delete newProps.initial;
            delete newProps.animate;
            delete newProps.exit;
            delete newProps.transition;
            delete newProps.whileHover;
            delete newProps.whileTap;
            delete newProps.variants;
            delete newProps.layout;
            return React.createElement(name, newProps);
          });
        }
      }),
      AnimatePresence: function(props) { return props.children; },
      useAnimation: function() { return { start: function() {} }; },
      useInView: function() { return [null, true]; },
    };

    // Stub clsx and tailwind-merge
    window.clsx = function() {
      return Array.from(arguments).flat().filter(Boolean).join(' ');
    };
    window.twMerge = window.clsx;
    window.cn = function() { return window.clsx.apply(null, arguments); };
  </script>

  ${additionalScripts}

  <!-- Main App Component -->
  <script type="text/babel" data-type="module" data-presets="react,typescript">
    ${processedCode}

    // Render
    const container = document.getElementById('root');
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(App));
  </script>
</body>
</html>`;
  }

  /**
   * Process React TSX code for browser execution:
   * - Replace ES module imports with window globals
   * - Strip TypeScript-only constructs that Babel standalone can't handle
   */
  private processCodeForBrowser(code: string): string {
    let processed = code;

    // Replace React imports with global references
    processed = processed.replace(
      /import\s+(?:React,?\s*)?(?:\{[^}]*\}\s*from\s*)?['"]react['"]\s*;?/g,
      '// React available as global'
    );
    processed = processed.replace(
      /import\s+(?:\{[^}]*\}\s*from\s*)?['"]react-dom(?:\/client)?['"]\s*;?/g,
      '// ReactDOM available as global'
    );

    // Replace lucide-react imports with window proxy
    processed = processed.replace(
      /import\s+\{([^}]+)\}\s*from\s*['"]lucide-react['"]\s*;?/g,
      (_, imports) => {
        const names = imports.split(',').map((s: string) => s.trim()).filter(Boolean);
        return names.map((name: string) => `const ${name} = LucideIcons['${name}'];`).join('\n');
      }
    );

    // Replace framer-motion imports with window stubs
    processed = processed.replace(
      /import\s+\{([^}]+)\}\s*from\s*['"]framer-motion['"]\s*;?/g,
      (_, imports) => {
        const names = imports.split(',').map((s: string) => s.trim()).filter(Boolean);
        return names.map((name: string) => `const ${name} = framerMotion['${name}'] || framerMotion.motion;`).join('\n');
      }
    );

    // Replace clsx/tailwind-merge imports
    processed = processed.replace(
      /import\s+\{?\s*(?:clsx|cn|twMerge)\s*\}?\s*from\s*['"](?:clsx|tailwind-merge|@\/utils\/cn)['"]\s*;?/g,
      'const cn = window.cn; const clsx = window.clsx; const twMerge = window.twMerge;'
    );

    // Remove remaining relative imports (./components, etc.) — they'll be window globals
    processed = processed.replace(
      /import\s+(?:(?:\{[^}]*\})|(?:\w+))?\s*(?:,\s*\{[^}]*\})?\s*from\s*['"]\.\/[^'"]*['"]\s*;?/g,
      '// Local import removed (component available as global)'
    );

    // Remove any remaining npm package imports that we can't resolve
    processed = processed.replace(
      /import\s+(?:(?:type\s+)?\{[^}]*\}|\w+)\s*from\s*['"][^'"./][^'"]*['"]\s*;?/g,
      '// External import removed'
    );

    // Remove TypeScript 'export' keywords (we render directly, no modules)
    processed = processed.replace(/^export\s+default\s+/gm, '');
    processed = processed.replace(/^export\s+/gm, '');

    // Remove TypeScript interface/type declarations that Babel standalone can't handle.
    // Match "interface Name {" or "type Name = {" blocks by finding the closing brace,
    // plus single-line type aliases like "type Props = { ... }" or "type X = string;"
    processed = processed.replace(/^(?:interface|type)\s+\w+[^{;]*\{[^}]*\}\s*;?/gm, '');
    processed = processed.replace(/^type\s+\w+\s*=\s*[^;{]+;/gm, '');

    return processed;
  }

  /**
   * Extract component name from file path.
   */
  private extractComponentName(filePath: string): string | null {
    const match = filePath.match(/\/(\w+)\.(?:tsx|jsx)$/);
    return match ? match[1] : null;
  }

  /**
   * Build a simple error HTML page.
   */
  private buildErrorHtml(message: string): string {
    return `<!DOCTYPE html>
<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#ef4444;">
<p>${message}</p>
</body></html>`;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: ReactToHtmlServiceInstance | null = null;

export function getReactToHtmlService(): ReactToHtmlServiceInstance {
  if (!_instance) {
    _instance = new ReactToHtmlServiceInstance();
  }
  return _instance;
}

export type { ReactToHtmlServiceInstance };
