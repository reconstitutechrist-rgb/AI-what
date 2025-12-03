'use client';

import React, { useState, useMemo } from 'react';
import type { UIPreferences, AppConcept, Feature } from '../types/appConcept';
import { generateMockContent } from '../utils/mockContentGenerator';

type ViewMode = 'mobile' | 'tablet' | 'desktop';

/**
 * Props for LayoutPreview component
 */
interface LayoutPreviewProps {
  preferences: UIPreferences;
  concept?: Partial<AppConcept>;
  className?: string;
  onPreferenceChange?: (prefs: Partial<UIPreferences>) => void;
  onElementSelect?: (elementId: string | null) => void;
  selectedElement?: string | null;
}

/**
 * Get device frame dimensions
 */
function getDeviceDimensions(mode: ViewMode): { width: string; height: string } {
  switch (mode) {
    case 'mobile':
      return { width: '375px', height: '667px' };
    case 'tablet':
      return { width: '768px', height: '1024px' };
    case 'desktop':
      return { width: '100%', height: '100%' };
  }
}

/**
 * Style presets based on UI style preference
 */
const stylePresets = {
  modern: {
    borderRadius: '0.75rem',
    cardShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    buttonStyle: 'rounded-xl font-medium',
    fontWeight: 'font-medium',
    spacing: 'gap-4'
  },
  minimalist: {
    borderRadius: '0.25rem',
    cardShadow: 'none',
    buttonStyle: 'rounded font-normal',
    fontWeight: 'font-normal',
    spacing: 'gap-6'
  },
  playful: {
    borderRadius: '1.5rem',
    cardShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    buttonStyle: 'rounded-full font-bold',
    fontWeight: 'font-bold',
    spacing: 'gap-3'
  },
  professional: {
    borderRadius: '0.375rem',
    cardShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    buttonStyle: 'rounded-md font-semibold',
    fontWeight: 'font-semibold',
    spacing: 'gap-5'
  },
  custom: {
    borderRadius: '0.5rem',
    cardShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    buttonStyle: 'rounded-lg font-medium',
    fontWeight: 'font-medium',
    spacing: 'gap-4'
  }
};

/**
 * Color scheme presets
 */
const colorSchemes = {
  light: {
    bg: 'bg-gray-50',
    text: 'text-gray-900',
    textMuted: 'text-gray-600',
    card: 'bg-white',
    border: 'border-gray-200',
    sidebar: 'bg-white',
    header: 'bg-white'
  },
  dark: {
    bg: 'bg-slate-900',
    text: 'text-white',
    textMuted: 'text-slate-400',
    card: 'bg-slate-800',
    border: 'border-slate-700',
    sidebar: 'bg-slate-800',
    header: 'bg-slate-800'
  },
  auto: {
    bg: 'bg-slate-900',
    text: 'text-white',
    textMuted: 'text-slate-400',
    card: 'bg-slate-800',
    border: 'border-slate-700',
    sidebar: 'bg-slate-800',
    header: 'bg-slate-800'
  },
  custom: {
    bg: 'bg-slate-900',
    text: 'text-white',
    textMuted: 'text-slate-400',
    card: 'bg-slate-800',
    border: 'border-slate-700',
    sidebar: 'bg-slate-800',
    header: 'bg-slate-800'
  }
};

/**
 * Selectable wrapper component for element selection
 */
interface SelectableProps {
  id: string;
  children: React.ReactNode;
  isSelected: boolean;
  onClick: (id: string) => void;
  className?: string;
}

function Selectable({ id, children, isSelected, onClick, className = '' }: SelectableProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick(id);
      }}
      className={`cursor-pointer transition-all ${
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent'
          : 'hover:ring-1 hover:ring-blue-400/50'
      } ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Header component for preview
 */
interface HeaderProps {
  appName: string;
  navItems: string[];
  colors: typeof colorSchemes.dark;
  style: typeof stylePresets.modern;
  primaryColor?: string;
  onElementSelect?: (id: string | null) => void;
  selectedElement?: string | null;
}

function Header({
  appName,
  navItems,
  colors,
  style,
  primaryColor,
  onElementSelect,
  selectedElement
}: HeaderProps) {
  const handleSelect = (id: string) => {
    onElementSelect?.(selectedElement === id ? null : id);
  };

  return (
    <Selectable
      id="header"
      isSelected={selectedElement === 'header'}
      onClick={handleSelect}
      className={`${colors.header} border-b ${colors.border} px-4 py-3`}
    >
      <div className="flex items-center justify-between">
        <div className={`${style.fontWeight} ${colors.text}`}>
          {appName || 'App Name'}
        </div>
        <nav className="hidden sm:flex items-center gap-4">
          {navItems.slice(0, 4).map((item, i) => (
            <span
              key={i}
              className={`text-sm ${colors.textMuted} hover:opacity-80 transition-opacity cursor-pointer`}
            >
              {item}
            </span>
          ))}
        </nav>
        <button
          className={`px-3 py-1.5 text-sm text-white ${style.buttonStyle}`}
          style={{ backgroundColor: primaryColor || '#3B82F6' }}
        >
          Sign In
        </button>
      </div>
    </Selectable>
  );
}

/**
 * Sidebar component for dashboard layout
 */
interface SidebarProps {
  navItems: string[];
  colors: typeof colorSchemes.dark;
  style: typeof stylePresets.modern;
  primaryColor?: string;
  onElementSelect?: (id: string | null) => void;
  selectedElement?: string | null;
}

function Sidebar({
  navItems,
  colors,
  style,
  primaryColor,
  onElementSelect,
  selectedElement
}: SidebarProps) {
  const handleSelect = (id: string) => {
    onElementSelect?.(selectedElement === id ? null : id);
  };

  return (
    <Selectable
      id="sidebar"
      isSelected={selectedElement === 'sidebar'}
      onClick={handleSelect}
      className={`${colors.sidebar} border-r ${colors.border} w-48 p-4 flex-shrink-0`}
    >
      <div className={`${style.spacing} flex flex-col`}>
        <div className={`${style.fontWeight} ${colors.text} mb-4`}>Menu</div>
        {navItems.map((item, i) => (
          <div
            key={i}
            className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-all ${
              i === 0
                ? 'text-white'
                : `${colors.textMuted} hover:opacity-80`
            }`}
            style={i === 0 ? { backgroundColor: primaryColor || '#3B82F6' } : {}}
          >
            {item}
          </div>
        ))}
      </div>
    </Selectable>
  );
}

/**
 * Hero section component
 */
interface HeroProps {
  title: string;
  subtitle: string;
  cta: string;
  colors: typeof colorSchemes.dark;
  style: typeof stylePresets.modern;
  primaryColor?: string;
  onElementSelect?: (id: string | null) => void;
  selectedElement?: string | null;
}

function Hero({
  title,
  subtitle,
  cta,
  colors,
  style,
  primaryColor,
  onElementSelect,
  selectedElement
}: HeroProps) {
  const handleSelect = (id: string) => {
    onElementSelect?.(selectedElement === id ? null : id);
  };

  return (
    <Selectable
      id="hero"
      isSelected={selectedElement === 'hero'}
      onClick={handleSelect}
      className="py-12 px-6 text-center"
    >
      <h1 className={`text-2xl ${style.fontWeight} ${colors.text} mb-3`}>
        {title}
      </h1>
      <p className={`${colors.textMuted} mb-6 max-w-md mx-auto text-sm`}>
        {subtitle}
      </p>
      <button
        className={`px-6 py-2.5 text-white ${style.buttonStyle}`}
        style={{ backgroundColor: primaryColor || '#3B82F6' }}
      >
        {cta}
      </button>
    </Selectable>
  );
}

/**
 * Stats row component
 */
interface StatsRowProps {
  stats: Array<{ label: string; value: string }>;
  colors: typeof colorSchemes.dark;
  style: typeof stylePresets.modern;
  onElementSelect?: (id: string | null) => void;
  selectedElement?: string | null;
}

function StatsRow({
  stats,
  colors,
  style,
  onElementSelect,
  selectedElement
}: StatsRowProps) {
  const handleSelect = (id: string) => {
    onElementSelect?.(selectedElement === id ? null : id);
  };

  return (
    <Selectable
      id="stats"
      isSelected={selectedElement === 'stats'}
      onClick={handleSelect}
      className="px-4 py-6"
    >
      <div className={`grid grid-cols-2 sm:grid-cols-4 ${style.spacing}`}>
        {stats.slice(0, 4).map((stat, i) => (
          <div
            key={i}
            className={`${colors.card} border ${colors.border} p-4 text-center`}
            style={{ borderRadius: style.borderRadius, boxShadow: style.cardShadow }}
          >
            <div className={`text-xl ${style.fontWeight} ${colors.text}`}>
              {stat.value}
            </div>
            <div className={`text-xs ${colors.textMuted} mt-1`}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </Selectable>
  );
}

/**
 * Card grid component
 */
interface CardGridProps {
  cards: Array<{ title: string; subtitle: string; tag: string }>;
  colors: typeof colorSchemes.dark;
  style: typeof stylePresets.modern;
  primaryColor?: string;
  onElementSelect?: (id: string | null) => void;
  selectedElement?: string | null;
}

function CardGrid({
  cards,
  colors,
  style,
  primaryColor,
  onElementSelect,
  selectedElement
}: CardGridProps) {
  const handleSelect = (id: string) => {
    onElementSelect?.(selectedElement === id ? null : id);
  };

  return (
    <Selectable
      id="cards"
      isSelected={selectedElement === 'cards'}
      onClick={handleSelect}
      className="px-4 py-6"
    >
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${style.spacing}`}>
        {cards.slice(0, 4).map((card, i) => (
          <div
            key={i}
            className={`${colors.card} border ${colors.border} p-4`}
            style={{ borderRadius: style.borderRadius, boxShadow: style.cardShadow }}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className={`${style.fontWeight} ${colors.text} text-sm`}>
                {card.title}
              </h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: primaryColor || '#3B82F6' }}
              >
                {card.tag}
              </span>
            </div>
            <p className={`text-xs ${colors.textMuted}`}>{card.subtitle}</p>
          </div>
        ))}
      </div>
    </Selectable>
  );
}

/**
 * List items component
 */
interface ListItemsProps {
  items: Array<{ title: string; status: string; meta: string }>;
  colors: typeof colorSchemes.dark;
  style: typeof stylePresets.modern;
  onElementSelect?: (id: string | null) => void;
  selectedElement?: string | null;
}

function ListItems({
  items,
  colors,
  style,
  onElementSelect,
  selectedElement
}: ListItemsProps) {
  const handleSelect = (id: string) => {
    onElementSelect?.(selectedElement === id ? null : id);
  };

  return (
    <Selectable
      id="list"
      isSelected={selectedElement === 'list'}
      onClick={handleSelect}
      className="px-4 py-6"
    >
      <div
        className={`${colors.card} border ${colors.border} overflow-hidden`}
        style={{ borderRadius: style.borderRadius }}
      >
        {items.slice(0, 5).map((item, i, slicedArr) => (
          <div
            key={i}
            className={`px-4 py-3 flex items-center justify-between ${
              i !== slicedArr.length - 1 ? `border-b ${colors.border}` : ''
            }`}
          >
            <div>
              <div className={`text-sm ${colors.text}`}>{item.title}</div>
              <div className={`text-xs ${colors.textMuted}`}>{item.meta}</div>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${colors.card} ${colors.textMuted}`}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </Selectable>
  );
}

/**
 * Footer component for preview
 */
interface FooterProps {
  appName: string;
  colors: typeof colorSchemes.dark;
  style: typeof stylePresets.modern;
  onElementSelect?: (id: string | null) => void;
  selectedElement?: string | null;
}

function Footer({
  appName,
  colors,
  style,
  onElementSelect,
  selectedElement
}: FooterProps) {
  const handleSelect = (id: string) => {
    onElementSelect?.(selectedElement === id ? null : id);
  };

  return (
    <Selectable
      id="footer"
      isSelected={selectedElement === 'footer'}
      onClick={handleSelect}
      className={`${colors.card} border-t ${colors.border} px-4 py-4`}
    >
      <div className="flex items-center justify-between">
        <div className={`text-xs ${colors.textMuted}`}>
          {new Date().getFullYear()} {appName || 'My App'}. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-xs ${colors.textMuted} hover:opacity-80 cursor-pointer`}>Privacy</span>
          <span className={`text-xs ${colors.textMuted} hover:opacity-80 cursor-pointer`}>Terms</span>
        </div>
      </div>
    </Selectable>
  );
}

/**
 * Dashboard layout renderer
 */
function DashboardLayout({
  content,
  colors,
  style,
  primaryColor,
  appName,
  onElementSelect,
  selectedElement
}: {
  content: ReturnType<typeof generateMockContent>;
  colors: typeof colorSchemes.dark;
  style: typeof stylePresets.modern;
  primaryColor?: string;
  appName: string;
  onElementSelect?: (id: string | null) => void;
  selectedElement?: string | null;
}) {
  return (
    <div className={`flex flex-col h-full ${colors.bg}`}>
      <Header
        appName={appName}
        navItems={content.navItems}
        colors={colors}
        style={style}
        primaryColor={primaryColor}
        onElementSelect={onElementSelect}
        selectedElement={selectedElement}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          navItems={content.navItems}
          colors={colors}
          style={style}
          primaryColor={primaryColor}
          onElementSelect={onElementSelect}
          selectedElement={selectedElement}
        />
        <main className="flex-1 overflow-y-auto p-4">
          <StatsRow
            stats={content.stats}
            colors={colors}
            style={style}
            onElementSelect={onElementSelect}
            selectedElement={selectedElement}
          />
          <CardGrid
            cards={content.cards}
            colors={colors}
            style={style}
            primaryColor={primaryColor}
            onElementSelect={onElementSelect}
            selectedElement={selectedElement}
          />
          <ListItems
            items={content.listItems}
            colors={colors}
            style={style}
            onElementSelect={onElementSelect}
            selectedElement={selectedElement}
          />
        </main>
      </div>
    </div>
  );
}

/**
 * Multi-page layout renderer
 */
function MultiPageLayout({
  content,
  colors,
  style,
  primaryColor,
  appName,
  onElementSelect,
  selectedElement
}: {
  content: ReturnType<typeof generateMockContent>;
  colors: typeof colorSchemes.dark;
  style: typeof stylePresets.modern;
  primaryColor?: string;
  appName: string;
  onElementSelect?: (id: string | null) => void;
  selectedElement?: string | null;
}) {
  return (
    <div className={`flex flex-col h-full ${colors.bg}`}>
      <Header
        appName={appName}
        navItems={content.navItems}
        colors={colors}
        style={style}
        primaryColor={primaryColor}
        onElementSelect={onElementSelect}
        selectedElement={selectedElement}
      />
      <main className="flex-1 overflow-y-auto">
        <Hero
          title={content.hero.title}
          subtitle={content.hero.subtitle}
          cta={content.hero.cta}
          colors={colors}
          style={style}
          primaryColor={primaryColor}
          onElementSelect={onElementSelect}
          selectedElement={selectedElement}
        />
        <StatsRow
          stats={content.stats}
          colors={colors}
          style={style}
          onElementSelect={onElementSelect}
          selectedElement={selectedElement}
        />
        <CardGrid
          cards={content.cards}
          colors={colors}
          style={style}
          primaryColor={primaryColor}
          onElementSelect={onElementSelect}
          selectedElement={selectedElement}
        />
      </main>
      <Footer
        appName={appName}
        colors={colors}
        style={style}
        onElementSelect={onElementSelect}
        selectedElement={selectedElement}
      />
    </div>
  );
}

/**
 * Single-page layout renderer
 */
function SinglePageLayout({
  content,
  colors,
  style,
  primaryColor,
  appName,
  onElementSelect,
  selectedElement
}: {
  content: ReturnType<typeof generateMockContent>;
  colors: typeof colorSchemes.dark;
  style: typeof stylePresets.modern;
  primaryColor?: string;
  appName: string;
  onElementSelect?: (id: string | null) => void;
  selectedElement?: string | null;
}) {
  return (
    <div className={`flex flex-col h-full ${colors.bg}`}>
      <Header
        appName={appName}
        navItems={content.navItems}
        colors={colors}
        style={style}
        primaryColor={primaryColor}
        onElementSelect={onElementSelect}
        selectedElement={selectedElement}
      />
      <main className="flex-1 overflow-y-auto">
        <Hero
          title={content.hero.title}
          subtitle={content.hero.subtitle}
          cta={content.hero.cta}
          colors={colors}
          style={style}
          primaryColor={primaryColor}
          onElementSelect={onElementSelect}
          selectedElement={selectedElement}
        />
        <CardGrid
          cards={content.cards}
          colors={colors}
          style={style}
          primaryColor={primaryColor}
          onElementSelect={onElementSelect}
          selectedElement={selectedElement}
        />
        <ListItems
          items={content.listItems}
          colors={colors}
          style={style}
          onElementSelect={onElementSelect}
          selectedElement={selectedElement}
        />
      </main>
      <Footer
        appName={appName}
        colors={colors}
        style={style}
        onElementSelect={onElementSelect}
        selectedElement={selectedElement}
      />
    </div>
  );
}

/**
 * LayoutPreview component - Real-time visual preview
 */
export function LayoutPreview({
  preferences,
  concept,
  className = '',
  onPreferenceChange,
  onElementSelect,
  selectedElement
}: LayoutPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');

  // Generate mock content based on concept
  const mockContent = useMemo(() => {
    return generateMockContent(
      concept?.name || 'My App',
      concept?.description || '',
      (concept?.coreFeatures as Feature[]) || [],
      concept?.purpose || ''
    );
  }, [concept?.name, concept?.description, concept?.coreFeatures, concept?.purpose]);

  // Get style and color presets
  const style = stylePresets[preferences.style] || stylePresets.modern;
  const colors = colorSchemes[preferences.colorScheme] || colorSchemes.dark;
  const primaryColor = preferences.primaryColor || '#3B82F6';

  // Get device dimensions
  const dimensions = getDeviceDimensions(viewMode);

  // Render the appropriate layout
  const renderLayout = () => {
    const layoutProps = {
      content: mockContent,
      colors,
      style,
      primaryColor,
      appName: concept?.name || 'My App',
      onElementSelect,
      selectedElement
    };

    switch (preferences.layout) {
      case 'dashboard':
        return <DashboardLayout {...layoutProps} />;
      case 'multi-page':
        return <MultiPageLayout {...layoutProps} />;
      case 'single-page':
      case 'custom':
      default:
        return <SinglePageLayout {...layoutProps} />;
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 px-2">
        {/* View Mode Toggle */}
        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('mobile')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'mobile'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Mobile view (375x667)"
          >
            📱 Mobile
          </button>
          <button
            onClick={() => setViewMode('tablet')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'tablet'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Tablet view (768x1024)"
          >
            📲 Tablet
          </button>
          <button
            onClick={() => setViewMode('desktop')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'desktop'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Desktop view (full width)"
          >
            🖥️ Desktop
          </button>
        </div>

        {/* Quick Preference Controls */}
        {onPreferenceChange && (
          <div className="flex items-center gap-2">
            {/* Color Scheme Toggle */}
            <button
              onClick={() =>
                onPreferenceChange({
                  colorScheme: preferences.colorScheme === 'dark' ? 'light' : 'dark'
                })
              }
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-medium transition-all"
              title="Toggle color scheme"
            >
              {preferences.colorScheme === 'dark' ? '🌙' : '☀️'}
            </button>

            {/* Primary Color Picker */}
            <label className="relative cursor-pointer">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => onPreferenceChange({ primaryColor: e.target.value })}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="w-8 h-8 rounded-lg border-2 border-white/20"
                style={{ backgroundColor: primaryColor }}
                title="Change primary color"
              />
            </label>
          </div>
        )}
      </div>

      {/* Preview Frame */}
      <div className="flex-1 flex items-center justify-center bg-slate-950 rounded-xl p-4 overflow-hidden">
        <div
          className="bg-white rounded-lg overflow-hidden shadow-2xl transition-all duration-300"
          style={{
            width: dimensions.width,
            height: dimensions.height,
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          {renderLayout()}
        </div>
      </div>

      {/* Selected Element Info */}
      {selectedElement && (
        <div className="mt-4 px-4 py-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-blue-400">🎯</span>
            <span className="text-sm text-blue-200">
              Selected: <strong className="font-medium">{selectedElement}</strong>
            </span>
            <button
              onClick={() => onElementSelect?.(null)}
              className="ml-auto text-xs text-blue-400 hover:text-blue-300"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LayoutPreview;
