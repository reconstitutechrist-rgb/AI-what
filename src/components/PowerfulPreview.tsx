"use client";

import React from 'react';
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

interface PowerfulPreviewProps {
  appDataJson: string;
}

export default function PowerfulPreview({ appDataJson }: PowerfulPreviewProps) {
  const appData: FullAppData = JSON.parse(appDataJson);

  // Convert files to Sandpack format
  const sandpackFiles: Record<string, string> = {};
  
  appData.files.forEach(file => {
    // Map file paths to Sandpack structure
    let sandpackPath = file.path;
    
    // Handle different file structures
    if (sandpackPath === 'src/App.tsx' || sandpackPath === 'App.tsx') {
      sandpackPath = '/App.tsx';
    } else if (sandpackPath === 'app/page.tsx' || sandpackPath === 'page.tsx') {
      sandpackPath = '/App.tsx'; // Rename Next.js pages to App.tsx for React preview
    } else if (sandpackPath.startsWith('src/')) {
      sandpackPath = sandpackPath.substring(3); // Remove src/ prefix
    }
    
    // Start all paths with /
    if (!sandpackPath.startsWith('/')) {
      sandpackPath = '/' + sandpackPath;
    }
    
    sandpackFiles[sandpackPath] = file.content;
  });

  // Ensure we have App.tsx
  if (!sandpackFiles['/App.tsx']) {
    console.error('No App.tsx found in files:', Object.keys(sandpackFiles));
  }

  // Add index.js if not present
  if (!sandpackFiles['/index.js'] && !sandpackFiles['/index.tsx']) {
    sandpackFiles['/index.js'] = `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const root = createRoot(document.getElementById('root'));
root.render(<App />);`;
  }

  // Add styles.css if not present (for Tailwind or custom styles)
  if (!sandpackFiles['/styles.css']) {
    sandpackFiles['/styles.css'] = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
}`;
  }

  // Merge user dependencies with required ones
  const dependencies = {
    react: '^18.2.0',
    'react-dom': '^18.2.0',
    ...appData.dependencies,
  };

  console.log('Sandpack files:', Object.keys(sandpackFiles));
  console.log('Dependencies:', dependencies);

  return (
    <div className="h-full w-full">
      <SandpackProvider
        template="react"
        theme="dark"
        files={sandpackFiles}
        customSetup={{
          dependencies: dependencies,
        }}
      >
        <SandpackLayout className="h-full">
          <SandpackPreview 
            showOpenInCodeSandbox={false}
            showRefreshButton={true}
            style={{ height: '100%', width: '100%' }}
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
