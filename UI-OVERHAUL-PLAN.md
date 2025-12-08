# UI Overhaul Plan - AI App Builder

## Executive Summary
Complete UI refresh focusing on **professional polish**, **visual clarity**, and **improved UX** while preserving all existing functionality. Approximately **25 files** will be modified.

---

## Table of Contents
1. [Problems Identified](#problems-identified)
2. [Design System Changes](#design-system-changes)
3. [Detailed Component Changes](#detailed-component-changes)
4. [File-by-File Implementation](#file-by-file-implementation)
5. [Implementation Order](#implementation-order)

---

## Problems Identified

| Issue | Current State | Solution |
|-------|--------------|----------|
| Emoji overuse | `🚀`, `💬`, `📦`, `👁️` as icons | Replace with Lucide icons |
| Glass-morphism overload | 16px blur on every panel | Reduce to 8px, add solid variants |
| Hover effect excess | `scale-[1.02]`, `hover:shadow-2xl` | Remove transforms, subtle opacity |
| Gradient overuse | `from-blue-600 via-purple-600 to-pink-600` | Solid colors only |
| Inconsistent hierarchy | Everything competes visually | Clear primary/secondary/tertiary |
| Redundant navigation | Header + TabNav overlap | Consolidate into unified nav |
| Cluttered chat | Mode toggle + phases in header | Cleaner separation |
| Dated loading | Bouncing dots animation | Modern spinner/skeleton |

---

## Design System Changes

### File: `tailwind.config.js`

#### Colors - Add surface layers
```js
// Add to theme.extend.colors
surface: {
  DEFAULT: '#09090b',      // zinc-950
  elevated: '#18181b',     // zinc-900
  overlay: '#27272a',      // zinc-800
  border: '#3f3f46',       // zinc-700
},
```

#### Remove/simplify animations
```js
// REMOVE these keyframes:
- pulseGlow
- glow
- bounceSoft

// KEEP these (simplified):
- fadeIn (0.2s, not 0.3s)
- slideInUp (0.2s)
- scaleIn (0.15s)
```

#### Add button utilities
```js
// Add to theme.extend
boxShadow: {
  'btn': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  'btn-hover': '0 1px 3px 0 rgb(0 0 0 / 0.1)',
}
```

### File: `src/app/globals.css`

#### Update glass-panel (reduce blur)
```css
/* BEFORE */
.glass-panel {
  backdrop-filter: blur(16px);
}

/* AFTER */
.glass-panel {
  background: rgba(24, 24, 27, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(63, 63, 70, 0.5);
}
```

#### Add new surface-panel class
```css
.surface-panel {
  background: #18181b;
  border: 1px solid #3f3f46;
  border-radius: 0.75rem;
}
```

#### Add btn classes
```css
.btn {
  @apply inline-flex items-center justify-center gap-2
         font-medium rounded-lg transition-colors
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900;
}

.btn-primary {
  @apply btn px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm;
}

.btn-secondary {
  @apply btn px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm border border-zinc-700;
}

.btn-ghost {
  @apply btn px-3 py-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-sm;
}

.btn-danger {
  @apply btn px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm;
}

.btn-icon {
  @apply btn p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800;
}
```

---

## Detailed Component Changes

### File: `src/components/ui/Icons.tsx`

**Add these Lucide icons** (import from lucide-react or create SVG components):

```tsx
// Chat & Messaging
export const MessageSquareIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

// Code/Preview
export const CodeIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);

export const EyeIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

// Actions
export const SendIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

export const ImageIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
  </svg>
);

export const DownloadIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

export const PackageIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

export const ForkIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"/><line x1="12" y1="12" x2="12" y2="15"/>
  </svg>
);

export const UndoIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
  </svg>
);

export const RedoIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
  </svg>
);

// Navigation/UI
export const XIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export const FolderIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

export const StarIcon = ({ size = 20, className = '', filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

export const TrashIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

export const SearchIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

// Loading
export const LoaderIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className}`}>
    <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
  </svg>
);

// Mode Toggle
export const BrainIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);

export const ZapIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

// Build phases
export const PlayIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

export const CheckCircleIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

export const ClockIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

export const PauseIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
  </svg>
);

export const LayersIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
);
```

---

## File-by-File Implementation

### File: `src/components/ChatPanel.tsx`

#### 1. Update imports
```tsx
// ADD
import { MessageSquareIcon, SendIcon, ImageIcon, XIcon, BrainIcon, ZapIcon, PlayIcon, CheckCircleIcon, ClockIcon, LoaderIcon, LayersIcon } from './ui/Icons';
```

#### 2. Update header (lines 149-189)
**BEFORE:**
```tsx
<div className="px-6 py-4 border-b border-white/10 bg-black/30 backdrop-blur-sm">
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
      <span>💬</span>
      <span>Conversation</span>
    </h2>
    {/* Mode toggle */}
  </div>
  <p className="text-sm text-slate-400">
    {currentMode === 'PLAN' ? '💭 Plan Mode...' : '⚡ Act Mode...'}
  </p>
</div>
```

**AFTER:**
```tsx
<div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
  <div className="flex items-center justify-between">
    <h2 className="text-sm font-medium text-zinc-100 flex items-center gap-2">
      <MessageSquareIcon size={16} className="text-zinc-400" />
      Chat
    </h2>

    {/* Mode Toggle - Cleaner */}
    <div className="flex bg-zinc-800 rounded-lg p-0.5">
      <button
        onClick={() => onModeChange('PLAN')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          currentMode === 'PLAN'
            ? 'bg-purple-600 text-white'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <BrainIcon size={14} />
        Plan
      </button>
      <button
        onClick={() => onModeChange('ACT')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          currentMode === 'ACT'
            ? 'bg-blue-600 text-white'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <ZapIcon size={14} />
        Act
      </button>
    </div>
  </div>
</div>
```

#### 3. Update PhaseProgressCard (lines 18-78)
**BEFORE:**
```tsx
<div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-4 border border-purple-500/30 mb-4">
  <h3 className="text-white font-bold mb-3 flex items-center gap-2">
    <span>🏗️</span> Build Plan ({phases.length} Phases)
  </h3>
```

**AFTER:**
```tsx
<div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700 mb-4">
  <h3 className="text-zinc-100 font-medium text-sm mb-3 flex items-center gap-2">
    <LayersIcon size={16} className="text-purple-400" />
    Build Plan ({phases.length} Phases)
  </h3>
```

#### 4. Update phase status icons
**BEFORE:**
```tsx
{phase.status === 'complete' && <span className="text-green-400">✅</span>}
{phase.status === 'building' && <span className="text-blue-400 animate-spin">⏳</span>}
{phase.status === 'pending' && idx !== currentPhase && <span className="text-slate-500">⏸️</span>}
```

**AFTER:**
```tsx
{phase.status === 'complete' && <CheckCircleIcon size={16} className="text-green-400" />}
{phase.status === 'building' && <LoaderIcon size={16} className="text-blue-400" />}
{phase.status === 'pending' && idx !== currentPhase && <ClockIcon size={16} className="text-zinc-500" />}
```

#### 5. Update message bubbles (lines 202-229)
**BEFORE:**
```tsx
<div
  className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
    message.role === 'user'
      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-500/30 hover:shadow-blue-500/50'
      : message.role === 'system'
        ? 'glass-panel text-purple-200 border border-purple-500/40 shadow-purple-500/20 hover:shadow-purple-500/40 hover:border-purple-500/60'
        : 'glass-panel text-slate-200 border border-white/20 hover:border-white/30'
  }`}
>
```

**AFTER:**
```tsx
<div
  className={`max-w-[85%] rounded-lg px-4 py-3 ${
    message.role === 'user'
      ? 'bg-blue-600 text-white'
      : message.role === 'system'
        ? 'bg-zinc-900 border-l-2 border-purple-500 text-zinc-300'
        : 'bg-zinc-800 text-zinc-200'
  }`}
>
```

#### 6. Update "View Component" button
**BEFORE:**
```tsx
<button className="mt-3 text-xs px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all">
  👁️ View Component
</button>
```

**AFTER:**
```tsx
<button className="mt-3 text-xs px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1.5">
  <EyeIcon size={12} />
  View Component
</button>
```

#### 7. Update loading indicator (lines 242-269)
**BEFORE:**
```tsx
<div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl px-4 py-3 border border-blue-500/30">
  <div className="flex items-center gap-3">
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
```

**AFTER:**
```tsx
<div className="bg-zinc-800 rounded-lg px-4 py-3 border border-zinc-700">
  <div className="flex items-center gap-3">
    <LoaderIcon size={18} className="text-blue-500" />
    <div>
      <div className="text-sm font-medium text-zinc-200">Generating...</div>
      {generationProgress && (
        <div className="text-xs text-zinc-400 mt-0.5">{generationProgress}</div>
      )}
    </div>
  </div>
</div>
```

#### 8. Update input area (lines 273-333)
**BEFORE:**
```tsx
<div className="p-4 border-t border-white/10 bg-black/20">
  {/* Image upload button with emoji 🖼️ */}
  <label className="px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center justify-center">
    <span className="text-xl">🖼️</span>

  {/* Send button with gradient */}
  <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 active:scale-95">
    <span>{isGenerating ? '⏳' : '🚀'}</span>
  </button>
```

**AFTER:**
```tsx
<div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
  {/* Image upload button */}
  <label className="btn-icon cursor-pointer" title="Upload image">
    <ImageIcon size={18} />
    <input type="file" ... className="hidden" />
  </label>

  {/* Input field */}
  <input
    className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500
               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
               disabled:opacity-50 transition-colors"
    ...
  />

  {/* Send button */}
  <button
    className="btn-primary px-4"
    disabled={isGenerating || (!userInput.trim() && !uploadedImage)}
  >
    {isGenerating ? <LoaderIcon size={18} /> : <SendIcon size={18} />}
  </button>
```

#### 9. Update image preview
**BEFORE:**
```tsx
<button className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
  ✕
</button>
<div className="text-xs text-slate-400 mt-1">
  🎨 AI will use this for design inspiration
</div>
```

**AFTER:**
```tsx
<button className="absolute -top-1.5 -right-1.5 btn-icon bg-zinc-800 border border-zinc-700 rounded-full p-1">
  <XIcon size={12} />
</button>
<div className="text-xs text-zinc-500 mt-1">
  Design reference attached
</div>
```

---

### File: `src/components/PreviewPanel.tsx`

#### 1. Update imports
```tsx
import { EyeIcon, CodeIcon, UndoIcon, RedoIcon, ForkIcon, PackageIcon, DownloadIcon, MessageSquareIcon, LoaderIcon } from './ui/Icons';
```

#### 2. Update tabs header (lines 63-144)
**BEFORE:**
```tsx
<div className="flex items-center gap-2 px-6 py-4 border-b border-white/10 bg-black/30 backdrop-blur-sm">
  <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
    activeTab === 'preview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : '...'
  }`}>
    👁️ Preview
  </button>
  <button ...>💻 Code</button>
```

**AFTER:**
```tsx
<div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
  <button
    onClick={() => onTabChange('preview')}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      activeTab === 'preview' || (activeTab === 'chat' && currentComponent)
        ? 'bg-zinc-800 text-zinc-100'
        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
    }`}
  >
    <EyeIcon size={16} />
    Preview
  </button>
  <button
    onClick={() => onTabChange('code')}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      activeTab === 'code'
        ? 'bg-zinc-800 text-zinc-100'
        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
    }`}
  >
    <CodeIcon size={16} />
    Code
  </button>
```

#### 3. Update undo/redo buttons
**BEFORE:**
```tsx
<div className="flex items-center gap-1 ml-2 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
  <button className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 ...">↶</button>
  <button ...>↷</button>
</div>
```

**AFTER:**
```tsx
<div className="flex items-center gap-1 ml-2">
  <button
    onClick={onUndo}
    disabled={!canUndo}
    className="btn-icon disabled:opacity-30"
    title={`Undo${undoCount > 0 ? ` (${undoCount})` : ''}`}
  >
    <UndoIcon size={16} />
  </button>
  <button
    onClick={onRedo}
    disabled={!canRedo}
    className="btn-icon disabled:opacity-30"
    title={`Redo${redoCount > 0 ? ` (${redoCount})` : ''}`}
  >
    <RedoIcon size={16} />
  </button>
</div>
```

#### 4. Update Fork button
**BEFORE:**
```tsx
<button className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white text-sm font-medium transition-all flex items-center gap-2">
  <span>🍴</span>
  <span className="hidden lg:inline">Fork</span>
</button>
```

**AFTER:**
```tsx
<button
  onClick={() => onFork(currentComponent)}
  className="btn-secondary"
  title="Fork this app"
>
  <ForkIcon size={16} />
  <span className="hidden lg:inline">Fork</span>
</button>
```

#### 5. Update Export & Download buttons
**BEFORE:**
```tsx
<button className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-purple-500/20 flex items-center gap-2">
  <span>{isExporting ? '⏳' : '📦'}</span>
  <span className="hidden sm:inline">Export & Deploy</span>
</button>
<button className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-green-500/20 flex items-center gap-2">
  <span>📥</span>
  <span className="hidden sm:inline">Download</span>
</button>
```

**AFTER:**
```tsx
<button
  onClick={() => onExport(currentComponent)}
  disabled={isExporting}
  className="btn-primary disabled:opacity-50"
>
  {isExporting ? <LoaderIcon size={16} /> : <PackageIcon size={16} />}
  <span className="hidden sm:inline">Export</span>
</button>
<button onClick={onDownload} className="btn-secondary">
  <DownloadIcon size={16} />
  <span className="hidden sm:inline">Download</span>
</button>
```

#### 6. Update empty state (lines 149-157)
**BEFORE:**
```tsx
<div className="h-full flex flex-col items-center justify-center text-center">
  <div className="text-6xl mb-4">💬</div>
  <h3 className="text-xl font-semibold text-white mb-2">Start Building Your App</h3>
  <p className="text-slate-400 max-w-md">
    Describe what you want to build in the chat, and I'll create a complete app with live preview for you.
  </p>
</div>
```

**AFTER:**
```tsx
<div className="h-full flex flex-col items-center justify-center text-center px-4">
  <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
    <MessageSquareIcon size={32} className="text-zinc-600" />
  </div>
  <h3 className="text-lg font-medium text-zinc-100 mb-2">Start Building</h3>
  <p className="text-sm text-zinc-400 max-w-sm">
    Describe what you want to build in the chat panel, and your app will appear here.
  </p>
</div>
```

---

### File: `src/components/modals/LibraryModal.tsx`

#### 1. Update imports
```tsx
import { FolderIcon, XIcon, StarIcon, RocketIcon, FileIcon } from '../ui/Icons';
```

#### 2. Update modal container
**BEFORE:**
```tsx
<div className="bg-slate-900 rounded-2xl border border-white/10 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
```

**AFTER:**
```tsx
<div className="bg-zinc-900 rounded-xl border border-zinc-800 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
```

#### 3. Update header
**BEFORE:**
```tsx
<h2 className="text-xl font-bold text-white flex items-center gap-2">
  <span>📂</span>
  <span>My Content</span>
</h2>
<button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-all">
  <span className="text-slate-400 text-xl">✕</span>
</button>
```

**AFTER:**
```tsx
<h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
  <FolderIcon size={20} className="text-zinc-400" />
  My Content
  <span className="text-sm font-normal text-zinc-500">
    ({contentTab === 'apps' ? components.length : storageFiles.length})
  </span>
</h2>
<button onClick={onClose} className="btn-icon">
  <XIcon size={18} />
</button>
```

#### 4. Update tabs
**BEFORE:**
```tsx
<button className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
  contentTab === 'apps' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
}`}>
  🚀 Apps ({components.length})
</button>
```

**AFTER:**
```tsx
<button
  onClick={() => onContentTabChange('apps')}
  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
    contentTab === 'apps'
      ? 'bg-zinc-800 text-zinc-100'
      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
  }`}
>
  <RocketIcon size={16} />
  Apps ({components.length})
</button>
```

#### 5. Update empty state
**BEFORE:**
```tsx
<div className="text-center py-12">
  <div className="text-6xl mb-4">📭</div>
  <p className="text-slate-400">
    {searchQuery ? 'No components found' : 'No components yet. Start building!'}
  </p>
</div>
```

**AFTER:**
```tsx
<div className="text-center py-12">
  <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
    <FolderIcon size={32} className="text-zinc-600" />
  </div>
  <p className="text-sm text-zinc-400">
    {searchQuery ? 'No apps match your search' : 'No apps yet. Start building!'}
  </p>
</div>
```

#### 6. Update favorite toggle
**BEFORE:**
```tsx
<button className="text-xl hover:scale-125 transition-transform">
  {comp.isFavorite ? '⭐' : '☆'}
</button>
```

**AFTER:**
```tsx
<button
  onClick={(e) => { e.stopPropagation(); onToggleFavorite(comp.id); }}
  className="btn-icon"
>
  <StarIcon size={16} filled={comp.isFavorite} className={comp.isFavorite ? 'text-yellow-400' : 'text-zinc-500'} />
</button>
```

---

### File: `src/components/BuilderHeader.tsx`

#### Key changes:
1. Reduce height from `h-16` to `h-14` (56px)
2. Remove duplicate view controls (TabNavigation handles this)
3. Cleaner logo section
4. Better mobile menu

**Header container:**
```tsx
// BEFORE
<header className="linear-header">

// AFTER
<header className="h-14 px-4 flex items-center gap-4 bg-zinc-950 border-b border-zinc-800">
```

**Logo section:**
```tsx
// BEFORE
<div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
  <RocketIcon size={18} className="text-white" />
</div>

// AFTER
<div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
  <RocketIcon size={16} className="text-white" />
</div>
```

---

### File: `src/components/TabNavigation.tsx`

#### Update styling
**BEFORE:**
```tsx
<nav className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 border-b border-slate-700">
  ...
  <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
    isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
  }`}>
```

**AFTER:**
```tsx
<nav className="flex items-center gap-1 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
  ...
  <button
    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-zinc-800 text-zinc-100'
        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
    }`}
  >
```

---

### File: `src/components/AIBuilder.tsx`

#### Update main container
**BEFORE:**
```tsx
<div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
```

**AFTER:**
```tsx
<div className="h-full bg-zinc-950">
```

#### Update loading state
**BEFORE:**
```tsx
<div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
  <div className="text-slate-400">Loading...</div>
</div>
```

**AFTER:**
```tsx
<div className="h-full bg-zinc-950 flex items-center justify-center">
  <LoaderIcon size={24} className="text-zinc-500" />
</div>
```

#### Update "No Build Plan" empty state
**BEFORE:**
```tsx
<div className="text-6xl mb-4">🏗️</div>
<h2 className="text-2xl font-bold text-white mb-2">No Build Plan Yet</h2>
```

**AFTER:**
```tsx
<div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center mb-6">
  <LayersIcon size={40} className="text-zinc-600" />
</div>
<h2 className="text-xl font-semibold text-zinc-100 mb-2">No Build Plan</h2>
```

---

### File: `src/components/NaturalConversationWizard.tsx`

Apply same patterns as ChatPanel:
1. Replace bouncing dots with LoaderIcon
2. Solid message bubbles (no gradients)
3. Remove hover scale transforms
4. Use proper icons instead of emojis in greeting message

---

## Implementation Order

Execute in this sequence to minimize breaking changes:

1. **`tailwind.config.js`** - Add surface colors, simplify animations
2. **`src/app/globals.css`** - Add btn classes, update glass-panel
3. **`src/components/ui/Icons.tsx`** - Add all new icons
4. **`src/components/ChatPanel.tsx`** - Major UI cleanup
5. **`src/components/PreviewPanel.tsx`** - Tab and action cleanup
6. **`src/components/TabNavigation.tsx`** - Cleaner tabs
7. **`src/components/BuilderHeader.tsx`** - Compact header
8. **`src/components/AIBuilder.tsx`** - Container updates
9. **`src/components/modals/LibraryModal.tsx`** - Modal cleanup
10. **`src/components/modals/*.tsx`** - Other modals
11. **`src/components/NaturalConversationWizard.tsx`** - Wizard refinement
12. **`src/components/header/*.tsx`** - Header subcomponents

---

## Summary

| Metric | Before | After |
|--------|--------|-------|
| Emoji icons | ~50+ | 0 |
| Gradient buttons | ~15 | 0 |
| hover:scale transforms | ~20 | 0 |
| Glass blur | 16px | 8px |
| Button variants | Inconsistent | 5 standard classes |
| Color palette | Complex | Simplified zinc + blue |

**Total files modified:** ~25
**Estimated effort:** ~4-6 hours implementation
