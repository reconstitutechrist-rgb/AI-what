import React from 'react';
import { motion } from 'framer-motion';
import type {
  TechArchitectureDocument,
  SystemArchitecture,
  ArchitectureLayer,
  FeatureTechMapping,
  DataFlowDescription,
  IntegrationPattern,
} from '@/types/titanPipeline';

// ============================================================================
// PROPS
// ============================================================================

interface TechArchitecturePreviewProps {
  document: TechArchitectureDocument | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TechArchitecturePreview: React.FC<TechArchitecturePreviewProps> = ({
  document,
  isLoading,
  error,
  onRetry,
}) => {
  // Empty state
  if (!document && !isLoading && !error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-900 text-slate-400">
        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6">
          <span className="text-4xl">🏗️</span>
        </div>
        <h2 className="text-xl font-medium text-white mb-2">Tech Architecture</h2>
        <p className="max-w-md mb-6">
          When your Vision Board is ready, generate a comprehensive architecture document
          that maps your features to technologies, designs system layers, and plans data flows.
        </p>
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
        >
          Generate Architecture
        </button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-900">
        <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-medium text-white mb-2">Analyzing Architecture...</h2>
        <p className="text-slate-400 max-w-md">
          The AI is researching optimal technologies and mapping them to your vision features.
          This may take up to 60 seconds.
        </p>
        <div className="mt-6 flex flex-col gap-2 text-sm text-slate-500">
          <LoadingStep label="Researching technologies" delay={0} />
          <LoadingStep label="Mapping features to tech stack" delay={8} />
          <LoadingStep label="Designing architecture layers" delay={16} />
          <LoadingStep label="Analyzing data flows" delay={24} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-900">
        <div className="w-20 h-20 rounded-full bg-rose-900/30 flex items-center justify-center mb-6">
          <span className="text-4xl">⚠️</span>
        </div>
        <h2 className="text-xl font-medium text-white mb-2">Architecture Analysis Failed</h2>
        <p className="text-rose-400 max-w-md mb-6">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  // Loaded state — should not be null here but guard anyway
  if (!document) return null;

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden relative">
      {/* Document Header */}
      <div className="px-8 py-6 border-b border-white/10 bg-black/30 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-violet-400 mb-1 uppercase tracking-wider">
              Tech Architecture Document
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              System Architecture
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              {new Date(document.generatedAt).toLocaleString()}
            </span>
            <button
              onClick={onRetry}
              className="px-4 py-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-sm font-medium transition-colors border border-violet-500/30"
            >
              Regenerate
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Prose Document */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <article className="max-w-3xl mx-auto px-8 py-10 space-y-10 pb-32">

          {/* System Architecture */}
          {document.systemArchitecture && (
            <SystemArchitectureSection arch={document.systemArchitecture} />
          )}

          {/* Feature-Tech Map */}
          {document.featureTechMap && document.featureTechMap.length > 0 && (
            <FeatureTechMapSection mappings={document.featureTechMap} />
          )}

          {/* Data Flows */}
          {document.dataFlows && document.dataFlows.length > 0 && (
            <DataFlowsSection flows={document.dataFlows} />
          )}

          {/* Integration Patterns */}
          {document.integrationPatterns && document.integrationPatterns.length > 0 && (
            <IntegrationPatternsSection patterns={document.integrationPatterns} />
          )}

          {/* Tech Stack Summary */}
          <TechStackSummary document={document} />

        </article>
      </div>
    </div>
  );
};

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

/** Loading step with delayed appearance */
const LoadingStep = ({ label, delay }: { label: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center gap-2"
  >
    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
    <span>{label}</span>
  </motion.div>
);

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

// ============================================================================
// SYSTEM ARCHITECTURE
// ============================================================================

const SystemArchitectureSection = ({ arch }: { arch: SystemArchitecture }) => (
  <ProseSection title="System Architecture">
    <p className="text-slate-200 text-base leading-[1.85] whitespace-pre-line mb-6">
      {arch.overview}
    </p>
    {arch.layers.length > 0 && (
      <div className="space-y-4">
        {arch.layers.map((layer, idx) => (
          <LayerCard key={idx} layer={layer} />
        ))}
      </div>
    )}
  </ProseSection>
);

const LayerCard = ({ layer }: { layer: ArchitectureLayer }) => (
  <div className="border border-violet-500/30 rounded-lg p-5 bg-violet-950/20 hover:bg-violet-950/30 transition-colors">
    <h4 className="text-lg font-semibold text-white mb-3">{layer.name}</h4>
    <div className="text-sm text-slate-300 space-y-2.5">
      <div>
        <span className="font-medium text-violet-400">Technologies: </span>
        <span className="text-slate-200">
          {layer.technologies.map((tech, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-slate-500">, </span>}
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 text-xs font-medium">
                {tech}
              </span>
            </React.Fragment>
          ))}
        </span>
      </div>
      <div>
        <span className="font-medium text-violet-400">Responsibilities: </span>
        <span className="text-slate-200">{layer.responsibilities.join(', ')}</span>
      </div>
      {layer.connectsTo.length > 0 && (
        <div>
          <span className="font-medium text-violet-400">Connects to: </span>
          <span className="text-slate-200">{layer.connectsTo.join(', ')}</span>
        </div>
      )}
    </div>
  </div>
);

// ============================================================================
// FEATURE-TECH MAP
// ============================================================================

const FeatureTechMapSection = ({ mappings }: { mappings: FeatureTechMapping[] }) => (
  <ProseSection title="Feature-Technology Mapping">
    <div className="space-y-6">
      {mappings.map((mapping, idx) => (
        <div key={idx} className="relative pl-6 border-l-2 border-violet-500/30">
          {/* Feature Number Marker */}
          <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
            <span className="text-xs font-mono text-violet-400">{idx + 1}</span>
          </div>

          <h3 className="text-lg font-bold text-white mb-2">{mapping.featureTitle}</h3>

          <div className="text-sm space-y-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Technologies</h4>
              <div className="flex flex-wrap gap-1.5">
                {mapping.technologies.map((tech, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 text-xs font-medium border border-violet-500/20"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Implementation Approach</h4>
              <p className="text-slate-200 leading-[1.85] whitespace-pre-line">{mapping.implementationApproach}</p>
            </div>

            {mapping.architectureNotes && (
              <div>
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Architecture Notes</h4>
                <p className="text-slate-300 leading-[1.85] whitespace-pre-line">{mapping.architectureNotes}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </ProseSection>
);

// ============================================================================
// DATA FLOWS
// ============================================================================

const DataFlowsSection = ({ flows }: { flows: DataFlowDescription[] }) => (
  <ProseSection title="Key Data Flows">
    <div className="space-y-8">
      {flows.map((flow, idx) => (
        <div key={idx} className="bg-slate-900/50 rounded-lg p-5 border border-violet-500/20">
          <h4 className="text-base font-semibold text-white mb-4">{flow.flowName}</h4>

          {/* Step-by-step flow */}
          <div className="space-y-3 mb-4">
            {flow.steps.map((step) => (
              <div key={step.step} className="flex items-start gap-3 text-sm">
                <span className="shrink-0 w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-400 font-mono text-xs">
                  {step.step}
                </span>
                <div className="flex-1 pt-0.5">
                  <span className="text-slate-200">{step.description}</span>
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 text-xs font-medium">
                    {step.technology}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Technologies involved */}
          <div className="pt-3 border-t border-white/5 text-xs text-slate-400">
            <span className="font-medium text-violet-400">Technologies: </span>
            {flow.technologiesInvolved.join(' → ')}
          </div>
        </div>
      ))}
    </div>
  </ProseSection>
);

// ============================================================================
// INTEGRATION PATTERNS
// ============================================================================

const IntegrationPatternsSection = ({ patterns }: { patterns: IntegrationPattern[] }) => (
  <ProseSection title="Integration Patterns">
    <div className="space-y-5">
      {patterns.map((pattern, idx) => (
        <div key={idx} className="border border-violet-500/30 rounded-lg p-5 bg-slate-900/30">
          <h4 className="text-base font-semibold text-white mb-2">{pattern.pattern}</h4>
          <div className="text-sm text-slate-300 space-y-2.5">
            <div>
              <span className="font-medium text-violet-400">Technologies: </span>
              <span className="text-slate-200">{pattern.technologies.join(' + ')}</span>
            </div>
            <div>
              <span className="font-medium text-violet-400">Rationale: </span>
              <span className="text-slate-200">{pattern.rationale}</span>
            </div>
            {pattern.example && (
              <div className="mt-3 p-3 bg-black/40 rounded border border-violet-500/20 overflow-x-auto">
                <pre className="text-xs text-violet-300 font-mono whitespace-pre-wrap">{pattern.example}</pre>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </ProseSection>
);

// ============================================================================
// TECH STACK SUMMARY
// ============================================================================

const TechStackSummary = ({ document }: { document: TechArchitectureDocument }) => {
  // Collect all unique technologies mentioned across all sections
  const allTechs = new Set<string>();

  document.systemArchitecture?.layers.forEach((layer) => {
    layer.technologies.forEach((tech) => allTechs.add(tech));
  });

  document.featureTechMap?.forEach((mapping) => {
    mapping.technologies.forEach((tech) => allTechs.add(tech));
  });

  document.dataFlows?.forEach((flow) => {
    flow.technologiesInvolved.forEach((tech) => allTechs.add(tech));
  });

  document.integrationPatterns?.forEach((pattern) => {
    pattern.technologies.forEach((tech) => allTechs.add(tech));
  });

  const techArray = Array.from(allTechs).sort();

  if (techArray.length === 0) return null;

  return (
    <ProseSection title="Technology Stack Summary">
      <p className="text-sm text-slate-400 mb-4">
        {techArray.length} technologies identified across all architecture layers, features, and data flows.
      </p>
      <div className="flex flex-wrap gap-2">
        {techArray.map((tech, idx) => (
          <span
            key={idx}
            className="px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 text-sm font-medium"
          >
            {tech}
          </span>
        ))}
      </div>
    </ProseSection>
  );
};

export default TechArchitecturePreview;
