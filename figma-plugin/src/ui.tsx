/**
 * Figma Plugin UI
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import type { FigmaExtraction, PluginMessage, UIMessage } from './types/figma-data';
import { sendToAppBuilder, checkServerHealth } from './api/client';

// Styles
const styles = {
  container: {
    padding: '16px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: '12px',
    color: '#333',
  } as React.CSSProperties,
  header: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  logo: {
    width: '24px',
    height: '24px',
    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    borderRadius: '6px',
  } as React.CSSProperties,
  section: {
    marginBottom: '16px',
  } as React.CSSProperties,
  label: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#666',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '12px',
    outline: 'none',
  } as React.CSSProperties,
  button: {
    width: '100%',
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s',
  } as React.CSSProperties,
  primaryButton: {
    background: '#6366F1',
    color: 'white',
  } as React.CSSProperties,
  secondaryButton: {
    background: '#f3f4f6',
    color: '#333',
    marginTop: '8px',
  } as React.CSSProperties,
  disabledButton: {
    background: '#e5e7eb',
    color: '#9ca3af',
    cursor: 'not-allowed',
  } as React.CSSProperties,
  status: {
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '12px',
  } as React.CSSProperties,
  success: {
    background: '#dcfce7',
    color: '#166534',
  } as React.CSSProperties,
  error: {
    background: '#fee2e2',
    color: '#991b1b',
  } as React.CSSProperties,
  info: {
    background: '#dbeafe',
    color: '#1e40af',
  } as React.CSSProperties,
  warning: {
    background: '#fef3c7',
    color: '#92400e',
  } as React.CSSProperties,
  preview: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '12px',
    marginTop: '12px',
  } as React.CSSProperties,
  previewItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    borderBottom: '1px solid #e5e7eb',
  } as React.CSSProperties,
  colorSwatch: {
    width: '16px',
    height: '16px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    display: 'inline-block',
    marginRight: '8px',
    verticalAlign: 'middle',
  } as React.CSSProperties,
};

type Status = 'idle' | 'extracting' | 'sending' | 'success' | 'error';

function App() {
  const [serverUrl, setServerUrl] = useState('http://localhost:3000');
  const [hasSelection, setHasSelection] = useState(false);
  const [selectionCount, setSelectionCount] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [extractedData, setExtractedData] = useState<FigmaExtraction | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  // Check server health on load and URL change
  useEffect(() => {
    const check = async () => {
      const online = await checkServerHealth(serverUrl);
      setServerOnline(online);
    };
    check();
  }, [serverUrl]);

  // Listen for messages from plugin code
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage as PluginMessage;
      if (!msg) return;

      switch (msg.type) {
        case 'selection-change':
          setHasSelection(msg.hasSelection || false);
          setSelectionCount(msg.selectionCount || 0);
          // Clear previous extraction when selection changes
          setExtractedData(null);
          setStatus('idle');
          setMessage('');
          break;

        case 'extraction-complete':
          setExtractedData(msg.data || null);
          setStatus('idle');
          setMessage('Design extracted successfully!');
          break;

        case 'error':
          setStatus('error');
          setMessage(msg.error || 'Unknown error');
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const postMessage = useCallback((msg: UIMessage) => {
    parent.postMessage({ pluginMessage: msg }, '*');
  }, []);

  const handleExtract = () => {
    setStatus('extracting');
    setMessage('Extracting design data...');
    postMessage({ type: 'start-extraction' });
  };

  const handleExport = async () => {
    if (!extractedData) return;

    setStatus('sending');
    setMessage('Sending to AI App Builder...');

    const result = await sendToAppBuilder(extractedData, serverUrl);

    if (result.success) {
      setStatus('success');
      setMessage('Design imported successfully! Check AI App Builder.');
    } else {
      setStatus('error');
      setMessage(result.error || 'Failed to import design');
    }
  };

  const handleCopyJSON = () => {
    if (!extractedData) return;
    navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2));
    setMessage('JSON copied to clipboard!');
  };

  const canExtract = hasSelection && status !== 'extracting' && status !== 'sending';
  const canExport = extractedData && serverOnline && status !== 'sending';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo} />
        <span>AI App Builder Sync</span>
      </div>

      {/* Server URL */}
      <div style={styles.section}>
        <div style={styles.label}>Server URL</div>
        <input
          style={styles.input}
          type="text"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          placeholder="http://localhost:3000"
        />
        <div style={{ marginTop: '4px', fontSize: '11px', color: '#666' }}>
          Status:{' '}
          {serverOnline === null ? 'Checking...' : serverOnline ? '🟢 Online' : '🔴 Offline'}
        </div>
      </div>

      {/* Selection Status */}
      <div style={styles.section}>
        <div style={styles.label}>Selection</div>
        <div
          style={{
            ...styles.status,
            ...(hasSelection ? styles.info : styles.warning),
          }}
        >
          {hasSelection
            ? `${selectionCount} frame${selectionCount > 1 ? 's' : ''} selected`
            : 'Select a frame to extract'}
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div
          style={{
            ...styles.status,
            ...(status === 'error'
              ? styles.error
              : status === 'success'
                ? styles.success
                : styles.info),
          }}
        >
          {message}
        </div>
      )}

      {/* Extract Button */}
      <button
        style={{
          ...styles.button,
          ...(canExtract ? styles.primaryButton : styles.disabledButton),
        }}
        onClick={handleExtract}
        disabled={!canExtract}
      >
        {status === 'extracting' ? 'Extracting...' : 'Extract Design'}
      </button>

      {/* Extracted Data Preview */}
      {extractedData && (
        <div style={styles.preview}>
          <div style={styles.label}>Extracted Data</div>
          <div style={styles.previewItem}>
            <span>Colors</span>
            <span>
              {extractedData.colors.slice(0, 5).map((c, i) => (
                <span key={i} style={{ ...styles.colorSwatch, background: c.hex }} title={c.hex} />
              ))}
              {extractedData.colors.length > 5 && ` +${extractedData.colors.length - 5}`}
            </span>
          </div>
          <div style={styles.previewItem}>
            <span>Fonts</span>
            <span>
              {[...new Set(extractedData.typography.map((t) => t.fontFamily))]
                .slice(0, 2)
                .join(', ')}
            </span>
          </div>
          <div style={styles.previewItem}>
            <span>Components</span>
            <span>{extractedData.components.length}</span>
          </div>
          <div style={styles.previewItem}>
            <span>Border Radius</span>
            <span>{extractedData.cornerRadius}px</span>
          </div>
        </div>
      )}

      {/* Export Button */}
      {extractedData && (
        <>
          <button
            style={{
              ...styles.button,
              ...styles.primaryButton,
              marginTop: '12px',
            }}
            onClick={handleExport}
            disabled={!canExport}
          >
            {status === 'sending' ? 'Sending...' : 'Send to AI App Builder'}
          </button>

          <button
            style={{
              ...styles.button,
              ...styles.secondaryButton,
            }}
            onClick={handleCopyJSON}
          >
            Copy JSON to Clipboard
          </button>
        </>
      )}

      {/* Help Text */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          background: '#f9fafb',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#666',
        }}
      >
        <strong>How to use:</strong>
        <ol style={{ margin: '8px 0 0 16px', padding: 0 }}>
          <li>Select a frame in Figma</li>
          <li>Click &quot;Extract Design&quot;</li>
          <li>Review extracted colors, fonts, and layout</li>
          <li>Click &quot;Send to AI App Builder&quot;</li>
        </ol>
      </div>
    </div>
  );
}

// Mount the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
