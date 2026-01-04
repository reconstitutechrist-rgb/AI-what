'use client';

import React, { useState, useMemo } from 'react';
import { DesignControlPanel } from '@/components/DesignControlPanel';
import { AnimationPanel } from '@/components/AnimationPanel';
import { SpecSheetPanel } from '@/components/SpecSheetPanel';
import { LintPanel } from '@/components/layout-builder/LintPanel';
import { ShadcnPreview } from '@/components/layout-builder/ShadcnPreview';
import { lintDesign } from '@/utils/designLinter';
import type {
  EffectsSettings,
  ColorSettings,
  TypographySettings,
  SpacingSettings,
  LayoutDesign,
  DetectedAnimation,
  CompleteDesignAnalysis,
} from '@/types/layoutDesign';

type TabId = 'design' | 'animation' | 'specs' | 'lint' | 'shadcn';

interface DesignSidePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  // Design Control Panel props
  effectsSettings?: EffectsSettings;
  colorSettings?: ColorSettings;
  onEffectsChange: (settings: Partial<EffectsSettings>) => void;
  onColorChange: (settings: Partial<ColorSettings>) => void;
  primaryColor?: string;
  onPrimaryColorChange: (color: string) => void;
  typographySettings?: TypographySettings;
  onTypographyChange: (settings: Partial<TypographySettings>) => void;
  spacingSettings?: SpacingSettings;
  onSpacingChange: (settings: Partial<SpacingSettings>) => void;
  showGridOverlay: boolean;
  onGridOverlayToggle: (show: boolean) => void;
  layoutDesign: LayoutDesign;
  onAccessibilityFix: (fixes: Partial<ColorSettings>) => void;
  // Animation Panel props
  detectedAnimations: DetectedAnimation[];
  onEditAnimation: (id: string, updates: Partial<DetectedAnimation>) => void;
  onApplyAnimation: (animation: DetectedAnimation, targetElement?: string) => void;
  onRemoveAnimation: (id: string) => void;
  // Spec Sheet Panel props
  pixelPerfectAnalysis: CompleteDesignAnalysis | null;
  onExportSpecSheet: (format: 'json' | 'css' | 'tailwind' | 'figma') => void;
  // Selected element
  selectedElement: string | null;
  onClearSelection: () => void;
  // Mode indicator
  analysisMode: 'standard' | 'pixel-perfect';
}

/**
 * Collapsible side panel containing Design Controls, Animation, and Spec Sheet tabs
 */
export function DesignSidePanel({
  isOpen,
  onToggle,
  effectsSettings,
  colorSettings,
  onEffectsChange,
  onColorChange,
  primaryColor,
  onPrimaryColorChange,
  typographySettings,
  onTypographyChange,
  spacingSettings,
  onSpacingChange,
  showGridOverlay,
  onGridOverlayToggle,
  layoutDesign,
  onAccessibilityFix,
  detectedAnimations,
  onEditAnimation,
  onApplyAnimation,
  onRemoveAnimation,
  pixelPerfectAnalysis,
  onExportSpecSheet,
  selectedElement,
  onClearSelection,
  analysisMode,
}: DesignSidePanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('design');

  const hasAnimations = detectedAnimations.length > 0;
  const hasSpecs = pixelPerfectAnalysis !== null;

  // Run lint check on design
  const lintResult = useMemo(() => lintDesign(layoutDesign), [layoutDesign]);
  const lintIssueCount = lintResult.issues.length;

  // Available tabs based on current state
  const tabs: {
    id: TabId;
    label: string;
    available: boolean;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { id: 'design', label: 'Design', available: true },
    {
      id: 'animation',
      label: 'Animation',
      available: hasAnimations,
      badge: detectedAnimations.length,
    },
    { id: 'specs', label: 'Specs', available: hasSpecs },
    {
      id: 'lint',
      label: 'Lint',
      available: true,
      badge: lintIssueCount > 0 ? lintIssueCount : undefined,
      badgeColor:
        lintResult.summary.errors > 0
          ? 'bg-red-600'
          : lintResult.summary.warnings > 0
            ? 'bg-yellow-600'
            : 'bg-garden-600',
    },
    {
      id: 'shadcn',
      label: 'Preview',
      available: true,
    },
  ];

  const availableTabs = tabs.filter((t) => t.available);

  // Reset to design tab if current tab becomes unavailable
  React.useEffect(() => {
    // Check availability directly based on tab id and state values
    const isCurrentTabAvailable =
      activeTab === 'design' ||
      activeTab === 'lint' ||
      activeTab === 'shadcn' ||
      (activeTab === 'animation' && hasAnimations) ||
      (activeTab === 'specs' && hasSpecs);

    if (!isCurrentTabAvailable) {
      setActiveTab('design');
    }
  }, [activeTab, hasAnimations, hasSpecs]);

  return (
    <>
      {/* Toggle button (always visible on the edge) */}
      <button
        onClick={onToggle}
        className={`absolute top-1/2 -translate-y-1/2 z-20 p-2 rounded-l-lg transition-all ${
          isOpen
            ? 'right-80 bg-slate-800 hover:bg-slate-700'
            : 'right-0 bg-slate-700 hover:bg-slate-600'
        }`}
        title={isOpen ? 'Hide panel' : 'Show design panel'}
      >
        <svg
          className={`w-4 h-4 text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Side Panel */}
      <div
        className={`absolute top-0 right-0 h-full w-80 bg-slate-900 border-l border-slate-700 flex flex-col transition-transform duration-300 z-10 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header with mode indicator */}
        <div className="flex-shrink-0 border-b border-slate-700">
          {/* Mode Badge */}
          {analysisMode === 'pixel-perfect' && (
            <div className="px-3 py-1.5 bg-gold-500/20 border-b border-gold-500/30">
              <div className="flex items-center gap-2 text-xs text-gold-300">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Pixel-Perfect Mode Active
              </div>
            </div>
          )}

          {/* Selected Element Indicator */}
          {selectedElement && (
            <div className="px-3 py-2 bg-garden-500/20 border-b border-garden-500/30 flex items-center justify-between">
              <span className="text-xs text-garden-300">
                Selected: <strong>{selectedElement}</strong>
              </span>
              <button
                onClick={onClearSelection}
                className="text-xs text-garden-400 hover:text-garden-300"
              >
                Clear
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-white bg-slate-800'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 text-[10px] ${tab.badgeColor || 'bg-gold-600'} text-white rounded-full`}
                  >
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-garden-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'design' && (
            <div className="p-4">
              <DesignControlPanel
                effectsSettings={effectsSettings}
                colorSettings={colorSettings}
                onEffectsChange={onEffectsChange}
                onColorChange={onColorChange}
                primaryColor={primaryColor}
                onPrimaryColorChange={onPrimaryColorChange}
                typographySettings={typographySettings}
                onTypographyChange={onTypographyChange}
                spacingSettings={spacingSettings}
                onSpacingChange={onSpacingChange}
                showGridOverlay={showGridOverlay}
                onGridOverlayToggle={onGridOverlayToggle}
                layoutDesign={layoutDesign}
                onAccessibilityFix={onAccessibilityFix}
              />
            </div>
          )}

          {activeTab === 'animation' && hasAnimations && (
            <AnimationPanel
              animations={detectedAnimations}
              onEditAnimation={onEditAnimation}
              onApplyAnimation={onApplyAnimation}
              onRemoveAnimation={onRemoveAnimation}
              className="h-full"
            />
          )}

          {activeTab === 'specs' && hasSpecs && pixelPerfectAnalysis && (
            <SpecSheetPanel
              analysis={pixelPerfectAnalysis}
              onExport={(format) => {
                if (
                  format === 'json' ||
                  format === 'css' ||
                  format === 'tailwind' ||
                  format === 'figma'
                ) {
                  onExportSpecSheet(format);
                }
              }}
              onClose={() => setActiveTab('design')}
              className="h-full"
            />
          )}

          {activeTab === 'lint' && (
            <div className="p-4">
              <LintPanel design={layoutDesign} />
            </div>
          )}

          {activeTab === 'shadcn' && <ShadcnPreview design={layoutDesign} />}
        </div>
      </div>
    </>
  );
}

export default DesignSidePanel;
