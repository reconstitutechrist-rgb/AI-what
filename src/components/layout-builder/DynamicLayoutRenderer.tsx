'use client';

import React, { useMemo } from 'react';
import type {
  DetectedComponentEnhanced,
  ColorSettings,
  EffectsSettings,
} from '@/types/layoutDesign';
import { generateMockContent } from '@/utils/mockContentGenerator';
import { BackgroundEffects } from './BackgroundEffects';
import { GenericComponentRenderer } from './GenericComponentRenderer';

// ============================================================================
// Types
// ============================================================================

type ViewMode = 'mobile' | 'tablet' | 'desktop';

interface DynamicLayoutRendererProps {
  components: DetectedComponentEnhanced[];
  colorSettings?: Partial<ColorSettings>;
  effectsSettings?: Partial<EffectsSettings>;
  content: ReturnType<typeof generateMockContent>;
  primaryColor?: string;
  appName: string;
  onElementSelect?: (id: string | null) => void;
  selectedElement?: string | null;
  viewMode?: ViewMode;
}

interface ComponentRendererProps {
  component: DetectedComponentEnhanced;
  colorSettings?: Partial<ColorSettings>;
  effectsSettings?: Partial<EffectsSettings>;
  content: ReturnType<typeof generateMockContent>;
  primaryColor?: string;
  appName: string;
  onElementSelect?: (id: string | null) => void;
  selectedElement?: string | null;
  viewMode?: ViewMode;
  nestedComponents?: DetectedComponentEnhanced[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Organize components by hierarchy - separate root from nested
 */
function organizeComponents(components: DetectedComponentEnhanced[]) {
  const rootComponents = components.filter((c) => !c.parentId);
  const nestedMap = new Map<string, DetectedComponentEnhanced[]>();

  components
    .filter((c) => c.parentId)
    .forEach((c) => {
      const children = nestedMap.get(c.parentId!) || [];
      children.push(c);
      nestedMap.set(c.parentId!, children);
    });

  return { rootComponents, nestedMap };
}

/**
 * Sort components by vertical position (top to bottom)
 */
function sortByVerticalPosition(components: DetectedComponentEnhanced[]) {
  return [...components].sort((a, b) => {
    // Primary: sort by top position
    if (a.bounds.top !== b.bounds.top) {
      return a.bounds.top - b.bounds.top;
    }
    // Secondary: sort by left position
    return a.bounds.left - b.bounds.left;
  });
}

/**
 * Detect layout structure from components
 */
function detectLayoutStructure(components: DetectedComponentEnhanced[]) {
  const sidebar = components.find((c) => c.type === 'sidebar');
  const header = components.find((c) => c.type === 'header');
  const footer = components.find((c) => c.type === 'footer');

  return {
    hasSidebar: !!sidebar,
    sidebarPosition: sidebar ? (sidebar.bounds.left < 50 ? 'left' : 'right') : null,
    hasHeader: !!header,
    hasFooter: !!footer,
    headerIsSticky: header?.style?.isSticky || false,
  };
}

/**
 * Get border radius class based on effects settings
 */
function getBorderRadiusClass(radius?: EffectsSettings['borderRadius']): string {
  const map: Record<string, string> = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };
  return map[radius || 'md'] || 'rounded-md';
}

/**
 * Get shadow class based on effects settings
 */
function getShadowClass(shadow?: EffectsSettings['shadows']): string {
  const map: Record<string, string> = {
    none: 'shadow-none',
    subtle: 'shadow-sm',
    medium: 'shadow-md',
    strong: 'shadow-xl',
  };
  return map[shadow || 'medium'] || 'shadow-md';
}

/**
 * Animation classes based on EffectsSettings.animations
 */
const animationClasses = {
  none: {
    base: '',
    hover: '',
    transition: '',
  },
  subtle: {
    base: 'transition-all duration-150 ease-out',
    hover: 'hover:scale-[1.01]',
    transition: 'transition-opacity duration-150',
  },
  smooth: {
    base: 'transition-all duration-300 ease-in-out',
    hover: 'hover:scale-[1.02]',
    transition: 'transition-all duration-300',
  },
  playful: {
    base: 'transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]',
    hover: 'hover:scale-[1.05] hover:-rotate-1',
    transition: 'transition-all duration-500',
  },
} as const;

/**
 * Get animation class based on animation level and type
 */
function getAnimationClass(
  animation?: EffectsSettings['animations'],
  type: 'base' | 'hover' | 'transition' = 'base'
): string {
  const level = animation || 'none';
  return animationClasses[level]?.[type] || '';
}

/**
 * Blur intensity classes based on EffectsSettings.blur
 */
const blurClasses = {
  none: '',
  subtle: 'backdrop-blur-sm',
  medium: 'backdrop-blur-md',
  strong: 'backdrop-blur-xl',
} as const;

/**
 * Get blur class based on blur level
 */
function getBlurClass(blur?: EffectsSettings['blur']): string {
  return blurClasses[blur || 'none'] || '';
}

/**
 * Get gradient style if gradients are enabled
 */
function getGradientStyle(
  enabled?: boolean,
  primaryColor?: string
): React.CSSProperties | undefined {
  if (!enabled || !primaryColor) return undefined;
  return {
    background: `linear-gradient(135deg, ${primaryColor}15 0%, transparent 50%)`,
  };
}

// ============================================================================
// Selectable Wrapper
// ============================================================================

interface SelectableProps {
  id: string;
  children: React.ReactNode;
  isSelected: boolean;
  onClick: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

function Selectable({ id, children, isSelected, onClick, className = '', style }: SelectableProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onClick(id);
      }}
      onKeyDown={handleKeyDown}
      aria-pressed={isSelected}
      data-element-id={id}
      className={`cursor-pointer transition-all ${
        isSelected
          ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-transparent'
          : 'hover:ring-1 hover:ring-green-400/50'
      } ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Individual Component Renderers
// ============================================================================

function DynamicHeader({
  component,
  colorSettings,
  effectsSettings,
  content,
  primaryColor,
  appName,
  onElementSelect,
  selectedElement,
  viewMode,
}: ComponentRendererProps) {
  const isMobile = viewMode === 'mobile';

  const handleSelect = (id: string) => {
    onElementSelect?.(selectedElement === id ? null : id);
  };

  // Get effect classes
  const animBase = getAnimationClass(effectsSettings?.animations, 'base');
  const blurClass = getBlurClass(effectsSettings?.blur);
  const gradientStyle = getGradientStyle(effectsSettings?.gradients, primaryColor);

  const headerStyle: React.CSSProperties = {
    backgroundColor: colorSettings?.background || colorSettings?.surface || '#1e293b',
    ...gradientStyle,
  };

  const textStyle: React.CSSProperties = {
    color: colorSettings?.text || '#f8fafc',
  };

  const mutedTextStyle: React.CSSProperties = {
    color: colorSettings?.textMuted || '#94a3b8',
  };

  return (
    <Selectable
      id={component.id}
      isSelected={selectedElement === component.id}
      onClick={handleSelect}
      className={`border-b border-slate-700 px-4 py-3 ${animBase} ${blurClass}`}
      style={headerStyle}
    >
      <div className="flex items-center justify-between">
        <div className="font-medium" style={textStyle}>
          {appName || 'App Name'}
        </div>
        {!isMobile && (
          <nav className="flex items-center gap-4">
            {content.navItems.slice(0, 4).map((item, index) => (
              <span
                key={`nav-${item}`}
                className="text-sm cursor-pointer"
                style={index === 0 ? textStyle : mutedTextStyle}
              >
                {item}
              </span>
            ))}
          </nav>
        )}
        <button
          type="button"
          className="px-3 py-1.5 text-sm text-white rounded-lg"
          style={{ backgroundColor: colorSettings?.primary || primaryColor || '#22c55e' }}
        >
          Sign In
        </button>
      </div>
    </Selectable>
  );
}

function DynamicHero({
  component,
  colorSettings,
  effectsSettings,
  content,
  primaryColor,
  onElementSelect,
  selectedElement,
}: ComponentRendererProps) {
  const handleSelect = (id: string) => {
    onElementSelect?.(selectedElement === id ? null : id);
  };

  const textStyle: React.CSSProperties = {
    color: colorSettings?.text || '#f8fafc',
  };

  const mutedTextStyle: React.CSSProperties = {
    color: colorSettings?.textMuted || '#94a3b8',
  };

  // Get effect classes
  const radiusClass = getBorderRadiusClass(effectsSettings?.borderRadius);
  const animBase = getAnimationClass(effectsSettings?.animations, 'base');
  const animHover = getAnimationClass(effectsSettings?.animations, 'hover');
  const gradientStyle = getGradientStyle(effectsSettings?.gradients, primaryColor);

  return (
    <Selectable
      id={component.id}
      isSelected={selectedElement === component.id}
      onClick={handleSelect}
      className={`py-12 px-6 text-center ${animBase}`}
      style={gradientStyle}
    >
      <h1 className="text-2xl font-medium mb-3" style={textStyle}>
        {content.hero.title}
      </h1>
      <p className="mb-6 max-w-md mx-auto text-sm" style={mutedTextStyle}>
        {content.hero.subtitle}
      </p>
      <button
        type="button"
        className={`px-6 py-2.5 text-white ${radiusClass} ${animHover}`}
        style={{ backgroundColor: colorSettings?.primary || primaryColor || '#22c55e' }}
      >
        {content.hero.cta}
      </button>
    </Selectable>
  );
}

function DynamicSidebar({
  component,
  colorSettings,
  content,
  primaryColor,
  onElementSelect,
  selectedElement,
}: ComponentRendererProps) {
  const handleSelect = (id: string) => {
    onElementSelect?.(selectedElement === id ? null : id);
  };

  const sidebarStyle: React.CSSProperties = {
    backgroundColor: colorSettings?.surface || colorSettings?.secondary || '#1e293b',
  };

  const textStyle: React.CSSProperties = {
    color: colorSettings?.text || '#f8fafc',
  };

  const mutedTextStyle: React.CSSProperties = {
    color: colorSettings?.textMuted || '#94a3b8',
  };

  return (
    <Selectable
      id={component.id}
      isSelected={selectedElement === component.id}
      onClick={handleSelect}
      className="w-48 border-r border-slate-700 p-4 flex-shrink-0"
      style={sidebarStyle}
    >
      <div className="space-y-2">
        <div className="font-medium mb-4" style={textStyle}>
          Menu
        </div>
        {content.navItems.map((item, index) => (
          <div
            key={`sidebar-${item}`}
            className="px-3 py-2 rounded-lg text-sm cursor-pointer"
            style={
              index === 0
                ? {
                    backgroundColor: colorSettings?.primary || primaryColor || '#22c55e',
                    color: '#fff',
                  }
                : mutedTextStyle
            }
          >
            {item}
          </div>
        ))}
      </div>
    </Selectable>
  );
}

function DynamicCardGrid({
  component,
  colorSettings,
  effectsSettings,
  content,
  primaryColor,
  onElementSelect,
  selectedElement,
}: ComponentRendererProps) {
  const handleSelect = (id: string) => {
    onElementSelect?.(selectedElement === id ? null : id);
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: colorSettings?.surface || '#1e293b',
  };

  const textStyle: React.CSSProperties = {
    color: colorSettings?.text || '#f8fafc',
  };

  const mutedTextStyle: React.CSSProperties = {
    color: colorSettings?.textMuted || '#94a3b8',
  };

  // Get effect classes
  const radiusClass = getBorderRadiusClass(effectsSettings?.borderRadius);
  const shadowClass = getShadowClass(effectsSettings?.shadows);
  const animBase = getAnimationClass(effectsSettings?.animations, 'base');
  const animHover = getAnimationClass(effectsSettings?.animations, 'hover');

  return (
    <Selectable
      id={component.id}
      isSelected={selectedElement === component.id}
      onClick={handleSelect}
      className="px-4 py-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {content.cards.slice(0, 4).map((card) => (
          <div
            key={`card-${card.title}`}
            className={`border border-slate-700 overflow-hidden ${radiusClass} ${shadowClass} ${animBase} ${animHover}`}
            style={cardStyle}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-sm" style={textStyle}>
                  {card.title}
                </h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: colorSettings?.primary || primaryColor || '#22c55e' }}
                >
                  {card.tag}
                </span>
              </div>
              <p className="text-xs" style={mutedTextStyle}>
                {card.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Selectable>
  );
}

function DynamicStats({
  component,
  colorSettings,
  effectsSettings,
  content,
  onElementSelect,
  selectedElement,
}: ComponentRendererProps) {
  const handleSelect = (id: string) => {
    onElementSelect?.(selectedElement === id ? null : id);
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: colorSettings?.surface || '#1e293b',
  };

  const textStyle: React.CSSProperties = {
    color: colorSettings?.text || '#f8fafc',
  };

  const mutedTextStyle: React.CSSProperties = {
    color: colorSettings?.textMuted || '#94a3b8',
  };

  const radiusClass = getBorderRadiusClass(effectsSettings?.borderRadius);
  const shadowClass = getShadowClass(effectsSettings?.shadows);

  return (
    <Selectable
      id={component.id}
      isSelected={selectedElement === component.id}
      onClick={handleSelect}
      className="px-4 py-6"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {content.stats.slice(0, 4).map((stat) => (
          <div
            key={`stat-${stat.label}`}
            className={`border border-slate-700 p-4 text-center ${radiusClass} ${shadowClass}`}
            style={cardStyle}
          >
            <div className="text-xl font-medium" style={textStyle}>
              {stat.value}
            </div>
            <div className="text-xs mt-1" style={mutedTextStyle}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </Selectable>
  );
}

function DynamicFooter({
  component,
  colorSettings,
  appName,
  onElementSelect,
  selectedElement,
}: ComponentRendererProps) {
  const handleSelect = (id: string) => {
    onElementSelect?.(selectedElement === id ? null : id);
  };

  const footerStyle: React.CSSProperties = {
    backgroundColor: colorSettings?.surface || colorSettings?.background || '#1e293b',
  };

  const mutedTextStyle: React.CSSProperties = {
    color: colorSettings?.textMuted || '#94a3b8',
  };

  const currentYear = new Date().getFullYear();

  return (
    <Selectable
      id={component.id}
      isSelected={selectedElement === component.id}
      onClick={handleSelect}
      className="border-t border-slate-700 px-4 py-4"
      style={footerStyle}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs" style={mutedTextStyle}>
          © {currentYear} {appName || 'My App'}. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <button type="button" className="text-xs hover:opacity-80" style={mutedTextStyle}>
            Privacy
          </button>
          <button type="button" className="text-xs hover:opacity-80" style={mutedTextStyle}>
            Terms
          </button>
        </div>
      </div>
    </Selectable>
  );
}

function DynamicCTA({
  component,
  colorSettings,
  effectsSettings,
  primaryColor,
  onElementSelect,
  selectedElement,
}: ComponentRendererProps) {
  const handleSelect = (id: string) => {
    onElementSelect?.(selectedElement === id ? null : id);
  };

  const textStyle: React.CSSProperties = {
    color: colorSettings?.text || '#f8fafc',
  };

  const mutedTextStyle: React.CSSProperties = {
    color: colorSettings?.textMuted || '#94a3b8',
  };

  const radiusClass = getBorderRadiusClass(effectsSettings?.borderRadius);

  return (
    <Selectable
      id={component.id}
      isSelected={selectedElement === component.id}
      onClick={handleSelect}
      className="px-4 py-8 text-center"
    >
      <h2 className="text-xl font-medium mb-2" style={textStyle}>
        Ready to Get Started?
      </h2>
      <p className="text-sm mb-4 max-w-md mx-auto" style={mutedTextStyle}>
        Join thousands of users already using our platform.
      </p>
      <button
        type="button"
        className={`px-6 py-2.5 text-white ${radiusClass}`}
        style={{ backgroundColor: colorSettings?.primary || primaryColor || '#22c55e' }}
      >
        Get Started Free
      </button>
    </Selectable>
  );
}

function DynamicFeatures({
  component,
  colorSettings,
  effectsSettings,
  onElementSelect,
  selectedElement,
}: ComponentRendererProps) {
  const handleSelect = (id: string) => {
    onElementSelect?.(selectedElement === id ? null : id);
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: colorSettings?.surface || '#1e293b',
  };

  const textStyle: React.CSSProperties = {
    color: colorSettings?.text || '#f8fafc',
  };

  const mutedTextStyle: React.CSSProperties = {
    color: colorSettings?.textMuted || '#94a3b8',
  };

  const radiusClass = getBorderRadiusClass(effectsSettings?.borderRadius);

  const features = [
    {
      title: 'Fast Performance',
      description: 'Lightning-fast load times and smooth interactions.',
    },
    {
      title: 'Secure by Default',
      description: 'Enterprise-grade security built into every feature.',
    },
    { title: 'Easy Integration', description: 'Seamlessly connects with your existing tools.' },
  ];

  return (
    <Selectable
      id={component.id}
      isSelected={selectedElement === component.id}
      onClick={handleSelect}
      className="px-4 py-8"
    >
      <h2 className="text-xl font-medium mb-6 text-center" style={textStyle}>
        Features
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className={`border border-slate-700 p-4 ${radiusClass}`}
            style={cardStyle}
          >
            <h3 className="font-medium text-sm mb-2" style={textStyle}>
              {feature.title}
            </h3>
            <p className="text-xs" style={mutedTextStyle}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </Selectable>
  );
}

function DynamicPricing({
  component,
  colorSettings,
  effectsSettings,
  primaryColor,
  onElementSelect,
  selectedElement,
}: ComponentRendererProps) {
  const handleSelect = (id: string) => {
    onElementSelect?.(selectedElement === id ? null : id);
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: colorSettings?.surface || '#1e293b',
  };

  const textStyle: React.CSSProperties = {
    color: colorSettings?.text || '#f8fafc',
  };

  const mutedTextStyle: React.CSSProperties = {
    color: colorSettings?.textMuted || '#94a3b8',
  };

  const radiusClass = getBorderRadiusClass(effectsSettings?.borderRadius);

  const plans = [
    { name: 'Starter', price: '$9', features: ['5 projects', 'Basic support'] },
    {
      name: 'Pro',
      price: '$29',
      features: ['Unlimited projects', 'Priority support'],
      popular: true,
    },
    { name: 'Enterprise', price: '$99', features: ['Custom solutions', 'Dedicated support'] },
  ];

  return (
    <Selectable
      id={component.id}
      isSelected={selectedElement === component.id}
      onClick={handleSelect}
      className="px-4 py-8"
    >
      <h2 className="text-xl font-medium mb-6 text-center" style={textStyle}>
        Pricing
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`border p-4 ${radiusClass} ${plan.popular ? 'border-green-500' : 'border-slate-700'}`}
            style={cardStyle}
          >
            <h3 className="font-medium text-sm mb-1" style={textStyle}>
              {plan.name}
            </h3>
            <div className="text-2xl font-bold mb-3" style={textStyle}>
              {plan.price}
              <span className="text-sm font-normal">/mo</span>
            </div>
            <ul className="text-xs space-y-1 mb-4">
              {plan.features.map((f) => (
                <li key={f} style={mutedTextStyle}>
                  ✓ {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={`w-full py-2 text-sm ${radiusClass}`}
              style={{
                backgroundColor: plan.popular
                  ? colorSettings?.primary || primaryColor || '#22c55e'
                  : 'transparent',
                color: plan.popular ? '#fff' : colorSettings?.text || '#f8fafc',
                border: plan.popular ? 'none' : '1px solid #475569',
              }}
            >
              Choose Plan
            </button>
          </div>
        ))}
      </div>
    </Selectable>
  );
}

function DynamicTestimonials({
  component,
  colorSettings,
  effectsSettings,
  onElementSelect,
  selectedElement,
}: ComponentRendererProps) {
  const handleSelect = (id: string) => {
    onElementSelect?.(selectedElement === id ? null : id);
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: colorSettings?.surface || '#1e293b',
  };

  const textStyle: React.CSSProperties = {
    color: colorSettings?.text || '#f8fafc',
  };

  const mutedTextStyle: React.CSSProperties = {
    color: colorSettings?.textMuted || '#94a3b8',
  };

  const radiusClass = getBorderRadiusClass(effectsSettings?.borderRadius);

  const testimonials = [
    { quote: 'Amazing product! It has transformed our workflow.', author: 'Jane D.' },
    { quote: 'The best tool we have used. Highly recommend!', author: 'John S.' },
  ];

  return (
    <Selectable
      id={component.id}
      isSelected={selectedElement === component.id}
      onClick={handleSelect}
      className="px-4 py-8"
    >
      <h2 className="text-xl font-medium mb-6 text-center" style={textStyle}>
        What People Say
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {testimonials.map((t) => (
          <div
            key={t.author}
            className={`border border-slate-700 p-4 ${radiusClass}`}
            style={cardStyle}
          >
            <p className="text-sm mb-3 italic" style={mutedTextStyle}>
              &ldquo;{t.quote}&rdquo;
            </p>
            <p className="text-xs font-medium" style={textStyle}>
              — {t.author}
            </p>
          </div>
        ))}
      </div>
    </Selectable>
  );
}

/**
 * Generic renderer for unknown or unsupported component types
 * Uses AI-detected styles to render appropriately
 */
function UnknownComponentPlaceholder({
  component,
  colorSettings,
  effectsSettings,
  primaryColor,
  onElementSelect,
  selectedElement,
  viewMode,
}: ComponentRendererProps) {
  // Use GenericComponentRenderer for all unknown types
  // This applies AI-detected styles instead of showing a placeholder
  return (
    <GenericComponentRenderer
      component={component}
      colorSettings={colorSettings}
      effectsSettings={effectsSettings}
      primaryColor={primaryColor}
      onElementSelect={onElementSelect}
      selectedElement={selectedElement}
      viewMode={viewMode}
    />
  );
}

// ============================================================================
// Component Type to Renderer Mapping
// ============================================================================

function renderComponent(
  component: DetectedComponentEnhanced,
  props: Omit<ComponentRendererProps, 'component'>
): React.ReactNode {
  const commonProps = { component, ...props };

  switch (component.type) {
    case 'header':
      return <DynamicHeader key={component.id} {...commonProps} />;
    case 'hero':
      return <DynamicHero key={component.id} {...commonProps} />;
    case 'sidebar':
      return <DynamicSidebar key={component.id} {...commonProps} />;
    case 'cards':
      return <DynamicCardGrid key={component.id} {...commonProps} />;
    case 'stats':
      return <DynamicStats key={component.id} {...commonProps} />;
    case 'footer':
      return <DynamicFooter key={component.id} {...commonProps} />;
    case 'cta':
      return <DynamicCTA key={component.id} {...commonProps} />;
    case 'features':
      return <DynamicFeatures key={component.id} {...commonProps} />;
    case 'pricing':
      return <DynamicPricing key={component.id} {...commonProps} />;
    case 'testimonials':
      return <DynamicTestimonials key={component.id} {...commonProps} />;

    // NEW: Handle additional component types with GenericComponentRenderer
    case 'breadcrumb':
    case 'pagination':
    case 'tabs':
    case 'search-bar':
    case 'user-menu':
    case 'logo':
    case 'content-section':
    case 'image-gallery':
    case 'chart':
    case 'button':
    case 'input':
    case 'list':
    case 'menu':
    case 'modal':
    case 'dropdown':
    case 'badge':
    case 'avatar':
    case 'divider':
    case 'progress':
      return <GenericComponentRenderer key={component.id} component={component} {...props} />;

    // Unknown components also use GenericComponentRenderer (with AI-detected styles)
    default:
      return <UnknownComponentPlaceholder key={component.id} {...commonProps} />;
  }
}

// ============================================================================
// Main Component
// ============================================================================

export function DynamicLayoutRenderer({
  components,
  colorSettings,
  effectsSettings,
  content,
  primaryColor,
  appName,
  onElementSelect,
  selectedElement,
  viewMode = 'desktop',
}: DynamicLayoutRendererProps) {
  const isMobile = viewMode === 'mobile';

  // Organize components: separate root from nested, sort by position
  const { rootComponents, nestedMap: _nestedMap } = useMemo(
    () => organizeComponents(components),
    [components]
  );

  const sortedComponents = useMemo(() => sortByVerticalPosition(rootComponents), [rootComponents]);

  // Detect layout structure (sidebar presence/position)
  const layoutStructure = useMemo(
    () => detectLayoutStructure(sortedComponents),
    [sortedComponents]
  );

  // Separate fixed elements from main content
  const { fixedElements, mainContent } = useMemo(() => {
    const header = sortedComponents.find((c) => c.type === 'header');
    const sidebar = sortedComponents.find((c) => c.type === 'sidebar');
    const footer = sortedComponents.find((c) => c.type === 'footer');

    const main = sortedComponents.filter(
      (c) => c.type !== 'header' && c.type !== 'sidebar' && c.type !== 'footer'
    );

    return {
      fixedElements: { header, sidebar, footer },
      mainContent: main,
    };
  }, [sortedComponents]);

  // Common props for all renderers
  const commonProps = {
    colorSettings,
    effectsSettings,
    content,
    primaryColor,
    appName,
    onElementSelect,
    selectedElement,
    viewMode,
  };

  // Container background style
  const containerStyle: React.CSSProperties = colorSettings?.background
    ? { backgroundColor: colorSettings.background }
    : { backgroundColor: '#0f172a' }; // slate-900 fallback

  // Render with sidebar layout
  if (layoutStructure.hasSidebar && !isMobile) {
    const sidebarOnLeft = layoutStructure.sidebarPosition === 'left';

    return (
      <div className="flex flex-col h-full relative" style={containerStyle}>
        {/* Background Effects Layer */}
        {effectsSettings?.backgroundEffect?.enabled && (
          <BackgroundEffects config={effectsSettings.backgroundEffect} />
        )}
        <div className="relative z-10 flex flex-col h-full">
          {fixedElements.header && renderComponent(fixedElements.header, commonProps)}
          <div className="flex flex-1 overflow-hidden">
            {sidebarOnLeft &&
              fixedElements.sidebar &&
              renderComponent(fixedElements.sidebar, commonProps)}
            <main className="flex-1 overflow-y-auto">
              {mainContent.map((comp) => renderComponent(comp, commonProps))}
            </main>
            {!sidebarOnLeft &&
              fixedElements.sidebar &&
              renderComponent(fixedElements.sidebar, commonProps)}
          </div>
          {fixedElements.footer && renderComponent(fixedElements.footer, commonProps)}
        </div>
      </div>
    );
  }

  // Render stacked layout (no sidebar or mobile)
  return (
    <div className="flex flex-col h-full relative" style={containerStyle}>
      {/* Background Effects Layer */}
      {effectsSettings?.backgroundEffect?.enabled && (
        <BackgroundEffects config={effectsSettings.backgroundEffect} />
      )}
      <div className="relative z-10 flex flex-col h-full">
        {fixedElements.header && renderComponent(fixedElements.header, commonProps)}
        <main className="flex-1 overflow-y-auto">
          {mainContent.map((comp) => renderComponent(comp, commonProps))}
        </main>
        {fixedElements.footer && renderComponent(fixedElements.footer, commonProps)}
      </div>
    </div>
  );
}

export default DynamicLayoutRenderer;
