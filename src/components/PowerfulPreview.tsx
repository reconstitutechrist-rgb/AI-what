"use client";

import React, { useEffect, useRef } from 'react';
import { SandpackProvider, SandpackPreview, SandpackLayout } from '@codesandbox/sandpack-react';

interface AppFile {
  path: string;
  content: string;
  description: string;
}

interface FullAppData {
  name: string;
  description: string;
  appType?: 'FRONTEND_ONLY' | 'FULL_STACK';
  files: AppFile[];
  dependencies: Record<string, string>;
  setupInstructions: string;
}

// Capture API interface for screenshot functionality
export interface CaptureAPI {
  capture: () => Promise<void>;
}

interface PowerfulPreviewProps {
  appDataJson: string;
  isFullscreen?: boolean;
  onMountCaptureApi?: (captureApi: CaptureAPI) => void;
  onScreenshot?: (dataUrl: string, diagnostics?: string) => void;
}

export default function PowerfulPreview({ 
  appDataJson, 
  isFullscreen = false,
  onMountCaptureApi,
  onScreenshot 
}: PowerfulPreviewProps) {
  const appData: FullAppData = JSON.parse(appDataJson);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Convert files to Sandpack format - React template needs / prefix
  const sandpackFiles: Record<string, { code: string }> = {};
  
  appData.files.forEach(file => {
    // Map file paths to Sandpack structure
    let sandpackPath = file.path;
    
    // Handle different file structures - remove src/ prefix
    if (sandpackPath.startsWith('src/')) {
      sandpackPath = sandpackPath.substring(4); // Remove 'src/' (4 characters)
    }
    
    // Keep as App.tsx for TypeScript support
    if (sandpackPath === 'App.tsx' || sandpackPath === 'app/page.tsx' || sandpackPath === 'page.tsx') {
      sandpackPath = 'App.tsx';
    }
    
    // Add leading / for Sandpack react template
    if (!sandpackPath.startsWith('/') && !sandpackPath.startsWith('public/')) {
      sandpackPath = '/' + sandpackPath;
    }
    
    // Sandpack file format uses objects with 'code' property
    sandpackFiles[sandpackPath] = { code: file.content };
  });

  // Ensure we have /App.tsx
  if (!sandpackFiles['/App.tsx']) {
    console.error('No /App.tsx found in files:', Object.keys(sandpackFiles));
    console.log('Original file paths:', appData.files.map(f => f.path));
  }

  // Add index.tsx for TypeScript support
  if (!sandpackFiles['/index.tsx'] && !sandpackFiles['/index.js']) {
    sandpackFiles['/index.tsx'] = {
      code: `import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);`
    };
  }

  // Add styles.css - Sandpack format
  if (!sandpackFiles['/styles.css']) {
    sandpackFiles['/styles.css'] = {
      code: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
}`
    };
  }

  // Add public/index.html with Tailwind CDN - capture done from parent via DOM serialization
  sandpackFiles['/public/index.html'] = {
    code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appData.name || 'App'}</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script>
      // Simple capture: serialize DOM to SVG and convert to image
      window.capturePreview = async function() {
        try {
          const root = document.getElementById('root');
          if (!root) throw new Error('Root element not found');
          
          // Get computed styles and clone the element
          const width = root.offsetWidth || 800;
          const height = root.offsetHeight || 600;
          
          // Serialize the HTML content
          const htmlContent = root.outerHTML;
          
          // Get all stylesheets
          let styles = '';
          for (const sheet of document.styleSheets) {
            try {
              for (const rule of sheet.cssRules) {
                styles += rule.cssText + '\\n';
              }
            } catch (e) {
              // Cross-origin stylesheets can't be read
            }
          }
          
          // Create SVG with embedded HTML
          const svg = \`<svg xmlns="http://www.w3.org/2000/svg" width="\${width}" height="\${height}">
            <foreignObject width="100%" height="100%">
              <div xmlns="http://www.w3.org/1999/xhtml">
                <style>\${styles}</style>
                \${htmlContent}
              </div>
            </foreignObject>
          </svg>\`;
          
          // Convert SVG to data URL
          const svgBlob = new Blob([svg], {type: 'image/svg+xml;charset=utf-8'});
          const svgUrl = URL.createObjectURL(svgBlob);
          
          // Load SVG into an image
          const img = new Image();
          img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(svgUrl);
            
            const dataUrl = canvas.toDataURL('image/png', 0.9);
            window.parent.postMessage({
              type: 'sandpack-captured',
              dataUrl: dataUrl,
              success: true
            }, '*');
          };
          img.onerror = function() {
            URL.revokeObjectURL(svgUrl);
            // Fallback: just send a placeholder
            window.parent.postMessage({
              type: 'sandpack-captured',
              success: false,
              diagnostics: {
                error: 'SVG to image conversion failed',
                viewport: { width: width, height: height }
              }
            }, '*');
          };
          img.src = svgUrl;
          
        } catch (error) {
          window.parent.postMessage({
            type: 'sandpack-captured',
            success: false,
            diagnostics: {
              error: error.message,
              viewport: { width: window.innerWidth, height: window.innerHeight },
              rootFound: !!document.getElementById('root')
            }
          }, '*');
        }
      };
    </script>
  </body>
</html>`
  };

  // Merge user dependencies with required ones
  const dependencies = {
    react: '^18.0.0',
    'react-dom': '^18.0.0',
    'react-scripts': '^5.0.0',
    ...appData.dependencies,
  };

  // Set up capture functionality
  useEffect(() => {
    // Listen for capture results from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'sandpack-captured') {
        if (event.data.success) {
          onScreenshot?.(event.data.dataUrl);
        } else {
          onScreenshot?.('', JSON.stringify(event.data.diagnostics));
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Retry logic: try to find iframe every 200ms for up to 5 seconds
    let attempts = 0;
    const maxAttempts = 25; // 25 attempts × 200ms = 5 seconds
    let intervalId: NodeJS.Timeout | null = null;
    
    const findIframe = () => {
      attempts++;
      const iframe = document.querySelector('iframe[title*="Sandpack"]') as HTMLIFrameElement;
      
      if (iframe) {
        iframeRef.current = iframe;
        
        // Check if capturePreview function is actually loaded in iframe
        let captureReady = false;
        try {
          const iframeWindow = iframe.contentWindow as any;
          captureReady = typeof iframeWindow?.capturePreview === 'function';
        } catch (e) {
          // Cross-origin or not ready yet
          captureReady = false;
        }
        
        if (captureReady) {
          // Clear interval once capture is ready
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          
          // NOW expose capture API (only after capturePreview function exists)
          if (onMountCaptureApi) {
            onMountCaptureApi({
              capture: async () => {
                if (!iframeRef.current?.contentWindow) {
                  throw new Error('Preview iframe not available');
                }
                
                try {
                  const iframeWindow = iframeRef.current.contentWindow as any;
                  if (typeof iframeWindow.capturePreview === 'function') {
                    iframeWindow.capturePreview();
                  } else {
                    throw new Error('Capture function not loaded yet. Please wait a moment and try again.');
                  }
                } catch (error) {
                  throw new Error('Capture function not available in preview. Please wait for preview to fully load.');
                }
              }
            });
          }
        }
        // If iframe found but capture not ready, keep retrying until maxAttempts
      }
      
      if (attempts >= maxAttempts) {
        // Stop trying after max attempts
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        
        // Still expose API but it will show error when used
        if (onMountCaptureApi && !iframeRef.current) {
          console.warn('Could not find Sandpack iframe after 5 seconds');
        }
      }
    };
    
    // Start trying to find iframe
    intervalId = setInterval(findIframe, 200);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [onMountCaptureApi, onScreenshot]);

  return (
    <div className="w-full h-full flex flex-col" style={{ 
      minHeight: isFullscreen ? '100vh' : '600px', 
      height: isFullscreen ? '100vh' : '100%' 
    }}>
      <SandpackProvider
        template="react-ts"
        theme="dark"
        files={sandpackFiles}
        customSetup={{
          dependencies,
        }}
        options={{
          autorun: true,
          autoReload: true,
          recompileMode: 'immediate',
          externalResources: [
            'https://cdn.tailwindcss.com',
            'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js'
          ],
        }}
      >
        <SandpackLayout style={{ 
          height: '100%', 
          width: '100%', 
          minHeight: isFullscreen ? '100vh' : '600px', 
          flex: 1 
        }}>
          <SandpackPreview 
            showOpenInCodeSandbox={false}
            showRefreshButton={true}
            style={{ 
              height: '100%', 
              width: '100%', 
              minHeight: isFullscreen ? '100vh' : '600px' 
            }}
          />
        </SandpackLayout>
        
        {appData.appType === 'FULL_STACK' && (
          <div className="absolute top-4 left-4 bg-yellow-500/90 text-yellow-900 px-4 py-2 rounded-lg text-sm font-medium shadow-lg z-50">
            ⚠️ Preview mode: Backend features disabled
          </div>
        )}
      </SandpackProvider>
    </div>
  );
}
