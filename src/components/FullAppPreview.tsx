"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PowerfulPreview, { CaptureAPI } from './PowerfulPreview';

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

interface FullAppPreviewProps {
  appDataJson: string;
  onScreenshot?: (dataUrl: string) => void;
}

export default function FullAppPreview({ appDataJson, onScreenshot }: FullAppPreviewProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [captureApi, setCaptureApi] = useState<CaptureAPI | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureSuccess, setCaptureSuccess] = useState(false);
  const [captureError, setCaptureError] = useState<string>('');

  // Detect client-side rendering for portal
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle body overflow when entering/exiting fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Memoize parsed app data
  const appData = useMemo(() => {
    try {
      return JSON.parse(appDataJson) as FullAppData;
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }
  }, [appDataJson]);

  // Handle parse error
  if (!appData) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
        <p className="text-red-400">Error parsing app data</p>
      </div>
    );
  }

  // Set initial selected file
  if (!selectedFile && appData.files && appData.files.length > 0) {
    setSelectedFile(appData.files[0].path);
  }

  const currentFile = appData.files?.find(f => f.path === selectedFile);

  // Fullscreen content that will be rendered via portal
  const fullscreenContent = (
    <div className="fixed inset-0 w-screen h-screen z-[9999] bg-black flex flex-col overflow-hidden">
      {/* Header with tabs - conditionally hide in fullscreen preview mode */}
      {activeTab === 'code' && (
        <div className="flex items-center justify-between px-4 py-3 bg-black/30 border-b border-white/10">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('preview')}
              className="px-4 py-2 rounded-lg font-medium transition-all bg-slate-800 text-slate-400 hover:text-white"
            >
              👁️ Live Preview
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className="px-4 py-2 rounded-lg font-medium transition-all bg-blue-600 text-white"
            >
              💻 Code
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span>Fully Interactive</span>
            </div>
            
            <button
              onClick={() => setIsFullscreen(false)}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all flex items-center gap-2"
              title="Exit Fullscreen"
            >
              <span className="text-lg">⤓</span>
              <span className="text-sm font-medium">Exit</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating exit button and capture button when in fullscreen preview mode */}
      {activeTab === 'preview' && (
        <>
          {captureError && (
            <div className="fixed top-20 right-4 z-[110] max-w-md px-4 py-3 rounded-lg bg-red-600/90 text-white backdrop-blur-sm shadow-xl border border-red-500/30">
              <div className="flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Capture Failed</p>
                  <p className="text-xs opacity-90">{captureError}</p>
                </div>
                <button
                  onClick={() => setCaptureError('')}
                  className="text-white/70 hover:text-white text-xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          <button
            onClick={async () => {
              setIsCapturing(true);
              setCaptureError('');
              
              // Set a timeout to prevent getting stuck
              const timeoutId = setTimeout(() => {
                setIsCapturing(false);
                setCaptureError('Capture timed out. The preview may still be loading.');
                setTimeout(() => setCaptureError(''), 5000);
              }, 10000); // 10 second timeout
              
              try {
                await captureApi?.capture();
                // Note: isCapturing will be set to false in onScreenshot callback
              } catch (error: any) {
                clearTimeout(timeoutId);
                setIsCapturing(false);
                const errorMsg = error?.message || 'Unknown error occurred';
                setCaptureError(errorMsg);
                setTimeout(() => setCaptureError(''), 5000);
              }
            }}
            disabled={isCapturing || !captureApi}
            className="fixed top-4 right-44 z-[110] px-4 py-2 rounded-lg bg-purple-600/90 hover:bg-purple-700 disabled:bg-purple-800/50 disabled:opacity-50 text-white backdrop-blur-sm transition-all flex items-center gap-2 shadow-xl border border-purple-500/30"
            title={!captureApi ? 'Preview loading...' : 'Capture preview for AI debugging'}
          >
            <span className="text-lg">{isCapturing ? '⏳' : captureSuccess ? '✅' : '📸'}</span>
            <span className="text-sm font-medium">Capture</span>
          </button>
          <button
            onClick={() => setIsFullscreen(false)}
            className="fixed top-4 right-4 z-[110] px-4 py-2 rounded-lg bg-black/80 hover:bg-black text-white backdrop-blur-sm transition-all flex items-center gap-2 shadow-xl border border-white/20"
            title="Exit Fullscreen"
          >
            <span className="text-lg">⤓</span>
            <span className="text-sm font-medium">Exit Fullscreen</span>
          </button>
        </>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'preview' ? (
          <div className="h-full w-full">
            <PowerfulPreview 
              appDataJson={appDataJson} 
              isFullscreen={true}
              onMountCaptureApi={setCaptureApi}
              onScreenshot={(dataUrl, diagnostics) => {
                setIsCapturing(false);
                if (dataUrl) {
                  setCaptureSuccess(true);
                  setCaptureError('');
                  setTimeout(() => setCaptureSuccess(false), 2000);
                  onScreenshot?.(dataUrl);
                } else {
                  const errorMsg = diagnostics ? `Capture failed: ${diagnostics}` : 'Capture failed';
                  setCaptureError(errorMsg);
                  setTimeout(() => setCaptureError(''), 5000);
                }
              }}
            />
          </div>
        ) : (
          <div className="h-full flex">
            {/* File list */}
            <div className="w-64 bg-black/20 border-r border-white/10 overflow-y-auto">
              <div className="p-3 border-b border-white/10">
                <h3 className="text-xs font-semibold text-slate-400 uppercase">Files</h3>
              </div>
              {appData.files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file.path)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    selectedFile === file.path
                      ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-500'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">
                      {file.path.endsWith('.tsx') || file.path.endsWith('.ts')
                        ? '📘'
                        : file.path.endsWith('.css')
                        ? '🎨'
                        : file.path.endsWith('.json')
                        ? '⚙️'
                        : '📄'}
                    </span>
                    <span className="truncate">{file.path}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Code viewer */}
            <div className="flex-1 overflow-auto">
              {currentFile ? (
                <div className="h-full">
                  <div className="sticky top-0 bg-black/40 backdrop-blur-sm px-4 py-2 border-b border-white/10 flex items-center justify-between">
                    <span className="text-sm text-slate-300 font-mono">{currentFile.path}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentFile.content);
                      }}
                      className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                    >
                      📋 Copy
                    </button>
                  </div>
                  <pre className="p-4 text-sm text-slate-300 font-mono overflow-x-auto">
                    <code>{currentFile.content}</code>
                  </pre>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  Select a file to view its contents
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Normal (non-fullscreen) content - shows the preview with a fullscreen button and capture button
  const normalContent = (
    <div className="h-full w-full relative">
      {captureError && (
        <div className="absolute top-20 right-4 z-[100] max-w-md px-4 py-3 rounded-lg bg-red-600/90 text-white backdrop-blur-sm shadow-xl border border-red-500/30">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Capture Failed</p>
              <p className="text-xs opacity-90">{captureError}</p>
            </div>
            <button
              onClick={() => setCaptureError('')}
              className="text-white/70 hover:text-white text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <button
        onClick={async () => {
          setIsCapturing(true);
          setCaptureError('');
          
          // Set a timeout to prevent getting stuck
          const timeoutId = setTimeout(() => {
            setIsCapturing(false);
            setCaptureError('Capture timed out. The preview may still be loading.');
            setTimeout(() => setCaptureError(''), 5000);
          }, 10000); // 10 second timeout
          
          try {
            await captureApi?.capture();
            // Note: isCapturing will be set to false in onScreenshot callback
          } catch (error: any) {
            clearTimeout(timeoutId);
            setIsCapturing(false);
            const errorMsg = error?.message || 'Unknown error occurred';
            setCaptureError(errorMsg);
            setTimeout(() => setCaptureError(''), 5000);
          }
        }}
        disabled={isCapturing || !captureApi}
        className="absolute top-4 right-32 z-[100] px-4 py-2 rounded-lg bg-purple-600/90 hover:bg-purple-700 disabled:bg-purple-800/50 disabled:opacity-50 text-white backdrop-blur-sm transition-all flex items-center gap-2 shadow-xl border border-purple-500/30"
        title={!captureApi ? 'Preview loading...' : 'Capture preview for AI debugging'}
      >
        <span className="text-lg">{isCapturing ? '⏳' : captureSuccess ? '✅' : '📸'}</span>
        <span className="text-sm font-medium">Capture</span>
      </button>
      <button
        onClick={() => setIsFullscreen(true)}
        className="absolute top-4 right-4 z-[100] px-4 py-2 rounded-lg bg-black/80 hover:bg-black text-white backdrop-blur-sm transition-all flex items-center gap-2 shadow-xl border border-white/20"
        title="Enter Fullscreen"
      >
        <span className="text-lg">⤢</span>
        <span className="text-sm font-medium">Fullscreen</span>
      </button>
      <PowerfulPreview 
        appDataJson={appDataJson} 
        isFullscreen={false}
        onMountCaptureApi={setCaptureApi}
        onScreenshot={(dataUrl, diagnostics) => {
          setIsCapturing(false);
          if (dataUrl) {
            setCaptureSuccess(true);
            setTimeout(() => setCaptureSuccess(false), 2000);
            onScreenshot?.(dataUrl);
          } else {
            console.error('Capture failed:', diagnostics);
          }
        }}
      />
    </div>
  );

  // Render via portal when fullscreen, otherwise render normally
  return (
    <>
      {isFullscreen && isClient ? createPortal(fullscreenContent, document.body) : normalContent}
    </>
  );
}
