import React from 'react';
import { motion } from 'framer-motion';
import type { VisionDocument, VisionFeature } from '@/types/titanPipeline';

/**
 * Safely convert any value to a renderable string.
 * The AI sometimes returns objects/arrays where we expect strings.
 */
function safeText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map((item, i) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          // Render object fields as readable prose
          const name = (item as Record<string, unknown>).name || (item as Record<string, unknown>).title || `Item ${i + 1}`;
          const desc = (item as Record<string, unknown>).purpose || (item as Record<string, unknown>).description || '';
          const sections = (item as Record<string, unknown>).sections;
          let text = `${name}${desc ? ': ' + desc : ''}`;
          if (Array.isArray(sections)) {
            text += '\n  ' + sections.map((s: unknown) => typeof s === 'string' ? s : JSON.stringify(s)).join('\n  ');
          }
          return text;
        }
        return String(item);
      })
      .join('\n\n');
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join('\n');
  }
  return String(value);
}

interface VisionPreviewProps {
  vision: VisionDocument | null;
  onStartBuilding: () => void;
}

export const VisionPreview: React.FC<VisionPreviewProps> = ({ vision, onStartBuilding }) => {
  if (!vision) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-900 text-slate-400">
        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 animate-pulse">
          <span className="text-4xl">✨</span>
        </div>
        <h2 className="text-xl font-medium text-white mb-2">Vision Board</h2>
        <p className="max-w-md">
          Chat with the AI to brainstorm your idea. I&apos;ll build a Vision Document here as we talk.
          <br /><br />
          Describe your dream app to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden relative">
      {/* Document Header */}
      <div className="px-8 py-6 border-b border-white/10 bg-black/30 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-emerald-400 mb-1 uppercase tracking-wider">
              Vision Document
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {vision.name || 'Untitled Vision'}
            </h1>
          </div>
          <button
            onClick={onStartBuilding}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] flex items-center gap-2 group"
          >
            Start Building
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </div>

      {/* Scrollable Prose Document */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <article className="max-w-3xl mx-auto px-8 py-10 space-y-10 pb-32">

          {/* Overview */}
          {vision.overview && (
            <ProseSection title="Overview">
              <p className="text-slate-200 text-base leading-[1.85] whitespace-pre-line">
                {safeText(vision.overview)}
              </p>
            </ProseSection>
          )}

          {/* Core Purpose */}
          {vision.corePurpose && (
            <ProseSection title="Core Purpose">
              <p className="text-slate-200 text-base leading-[1.85] whitespace-pre-line">
                {safeText(vision.corePurpose)}
              </p>
            </ProseSection>
          )}

          {/* Target Audience */}
          {vision.targetAudience && (
            <ProseSection title="Target Audience">
              <p className="text-slate-200 text-base leading-[1.85] whitespace-pre-line">
                {safeText(vision.targetAudience)}
              </p>
            </ProseSection>
          )}

          {/* Competitive Edge */}
          {vision.competitiveEdge && (
            <ProseSection title="Competitive Edge">
              <p className="text-slate-200 text-base leading-[1.85] whitespace-pre-line">
                {safeText(vision.competitiveEdge)}
              </p>
            </ProseSection>
          )}

          {/* Features — Flowing Prose */}
          {vision.features && vision.features.length > 0 && (
            <ProseSection title="Feature Specifications">
              <div className="space-y-10">
                {vision.features.map((feature, idx) => (
                  <FeatureProseBlock key={feature.id} feature={feature} index={idx} />
                ))}
              </div>
            </ProseSection>
          )}

          {/* User Journey */}
          {vision.userFlow && (
            <ProseSection title="User Journey">
              <p className="text-slate-200 text-base leading-[1.85] whitespace-pre-line">
                {safeText(vision.userFlow)}
              </p>
            </ProseSection>
          )}

          {/* Page Breakdown */}
          {vision.pageBreakdown && (
            <ProseSection title="Page-by-Page Breakdown">
              <p className="text-slate-200 text-base leading-[1.85] whitespace-pre-line">
                {safeText(vision.pageBreakdown)}
              </p>
            </ProseSection>
          )}

          {/* Design System */}
          {vision.designSystem && (
            <ProseSection title="Design System">
              <p className="text-slate-200 text-base leading-[1.85] whitespace-pre-line">
                {safeText(vision.designSystem)}
              </p>
            </ProseSection>
          )}

          {/* Legacy market analysis if no new fields are populated */}
          {vision.marketAnalysis && !vision.corePurpose && !vision.targetAudience && (
            <ProseSection title="Market & Audience">
              <p className="text-slate-200 text-base leading-[1.85] whitespace-pre-line">
                {vision.marketAnalysis}
              </p>
            </ProseSection>
          )}

        </article>
      </div>
    </div>
  );
};

// ============================================================================
// SUBCOMPONENTS — Prose-first, flowing layout
// ============================================================================

/** A titled section with a clean divider and fade-in animation */
const ProseSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <motion.section
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
  >
    <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-white/10 tracking-tight">
      {title}
    </h2>
    {children}
  </motion.section>
);

/** A full-prose feature block — NO cards, NO boxes. Reads like a spec document. */
const FeatureProseBlock = ({ feature, index }: { feature: VisionFeature; index: number }) => (
  <div className="relative pl-6 border-l-2 border-emerald-500/30">
    {/* Feature Number Marker */}
    <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
      <span className="text-xs font-mono text-emerald-400">{index + 1}</span>
    </div>

    {/* Feature Title + Complexity */}
    <div className="flex items-baseline gap-3 mb-3">
      <h3 className="text-lg font-bold text-white">{feature.title}</h3>
      <ComplexityIndicator level={feature.complexityLevel} />
    </div>

    {/* User Story */}
    {feature.userStory && (
      <p className="text-emerald-300/80 text-sm italic mb-4 leading-relaxed">
        &ldquo;{feature.userStory}&rdquo;
      </p>
    )}

    {/* Description */}
    {feature.description && (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</h4>
        <p className="text-slate-200 text-sm leading-[1.85] whitespace-pre-line">{safeText(feature.description)}</p>
      </div>
    )}

    {/* Behavior */}
    {feature.behavior && (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Behavior</h4>
        <p className="text-slate-300 text-sm leading-[1.85] whitespace-pre-line">{safeText(feature.behavior)}</p>
      </div>
    )}

    {/* Acceptance Criteria */}
    {feature.acceptanceCriteria && feature.acceptanceCriteria.length > 0 && (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Acceptance Criteria</h4>
        <ul className="space-y-1.5">
          {feature.acceptanceCriteria.map((criterion, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
              <span className="leading-relaxed">{criterion}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Edge Cases */}
    {feature.edgeCases && (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Edge Cases</h4>
        <p className="text-slate-300 text-sm leading-[1.85] whitespace-pre-line">{safeText(feature.edgeCases)}</p>
      </div>
    )}

    {/* UX Notes */}
    {feature.uxNotes && (
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">UX & Feel</h4>
        <p className="text-slate-300 text-sm leading-[1.85] whitespace-pre-line">{safeText(feature.uxNotes)}</p>
      </div>
    )}
  </div>
);

/** Minimal inline complexity indicator — no boxes */
const ComplexityIndicator = ({ level }: { level: 'low' | 'medium' | 'high' }) => {
  const colors: Record<string, string> = {
    low: 'text-emerald-400',
    medium: 'text-amber-400',
    high: 'text-rose-400',
  };

  return (
    <span className={`text-xs font-mono uppercase tracking-wide ${colors[level] || colors.medium}`}>
      {level}
    </span>
  );
};

export default VisionPreview;
