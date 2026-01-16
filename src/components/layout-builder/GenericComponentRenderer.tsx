'use client';

import React from 'react';
import type {
  DetectedComponentEnhanced,
  ColorSettings,
  EffectsSettings,
} from '@/types/layoutDesign';

// ============================================================================
// Types
// ============================================================================

interface GenericComponentRendererProps {
  component: DetectedComponentEnhanced;
  colorSettings?: Partial<ColorSettings>;
  effectsSettings?: Partial<EffectsSettings>;
  primaryColor?: string;
  onElementSelect?: (id: string | null) => void;
  selectedElement?: string | null;
  viewMode?: 'mobile' | 'tablet' | 'desktop';
}

// ============================================================================
// Style Mapping Helpers
// ============================================================================

/**
 * Map AI-detected style properties to Tailwind/inline styles
 */
function mapStylesToCSS(
  component: DetectedComponentEnhanced,
  colorSettings?: Partial<ColorSettings>
): React.CSSProperties {
  const style = component.style || {};
  const cssStyle: React.CSSProperties = {};

  // Background color
  if (style.backgroundColor) {
    cssStyle.backgroundColor = style.backgroundColor;
  } else if (style.hasBackground && colorSettings?.surface) {
    cssStyle.backgroundColor = colorSettings.surface;
  }

  // Text color
  if (style.textColor) {
    cssStyle.color = style.textColor;
  } else if (colorSettings?.text) {
    cssStyle.color = colorSettings.text;
  }

  // Border
  if (style.borderColor && style.borderWidth) {
    cssStyle.border = `${style.borderWidth} solid ${style.borderColor}`;
  } else if (style.borderColor) {
    cssStyle.borderColor = style.borderColor;
  }

  // Font properties
  if (style.fontSize) {
    // Map size tokens to actual pixel values
    const sizeMap: Record<string, string> = {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
    };
    cssStyle.fontSize = sizeMap[style.fontSize] || style.fontSize;
  }

  if (style.fontWeight) {
    const weightMap: Record<string, number> = {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    };
    cssStyle.fontWeight = weightMap[style.fontWeight] || 400;
  }

  // Text alignment
  if (style.textAlign) {
    cssStyle.textAlign = style.textAlign as React.CSSProperties['textAlign'];
  }

  return cssStyle;
}

/**
 * Get Tailwind classes from detected styles
 */
function getStyleClasses(
  component: DetectedComponentEnhanced,
  effectsSettings?: Partial<EffectsSettings>
): string {
  const classes: string[] = [];
  const style = component.style || {};

  // Border radius
  if (style.borderRadius) {
    const radiusMap: Record<string, string> = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
    };
    classes.push(radiusMap[style.borderRadius] || 'rounded-md');
  } else if (effectsSettings?.borderRadius) {
    const radiusMap: Record<string, string> = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
    };
    classes.push(radiusMap[effectsSettings.borderRadius] || 'rounded-md');
  }

  // Shadow
  if (style.shadow) {
    const shadowMap: Record<string, string> = {
      none: 'shadow-none',
      subtle: 'shadow-sm',
      medium: 'shadow-md',
      strong: 'shadow-xl',
    };
    classes.push(shadowMap[style.shadow] || 'shadow-md');
  } else if (effectsSettings?.shadows) {
    const shadowMap: Record<string, string> = {
      none: 'shadow-none',
      subtle: 'shadow-sm',
      medium: 'shadow-md',
      strong: 'shadow-xl',
    };
    classes.push(shadowMap[effectsSettings.shadows] || 'shadow-md');
  }

  // Padding
  if (style.padding) {
    const paddingMap: Record<string, string> = {
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-6',
    };
    classes.push(paddingMap[style.padding] || 'p-4');
  } else {
    classes.push('p-4'); // Default padding
  }

  // Display/layout
  if (style.display === 'flex') {
    classes.push('flex');
    if (style.alignment) {
      const alignMap: Record<string, string> = {
        start: 'justify-start items-start',
        center: 'justify-center items-center',
        end: 'justify-end items-end',
        between: 'justify-between items-center',
        around: 'justify-around items-center',
      };
      classes.push(alignMap[style.alignment] || 'justify-start items-start');
    }
    if (style.gap) {
      const gapMap: Record<string, string> = {
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
      };
      classes.push(gapMap[style.gap] || 'gap-4');
    }
  }

  // Position
  if (style.isSticky) {
    classes.push('sticky top-0 z-10');
  }
  if (style.isFloating) {
    classes.push('fixed');
  }

  // Animation (from effects settings)
  if (effectsSettings?.animations && effectsSettings.animations !== 'none') {
    classes.push('transition-all duration-300 ease-in-out');
    if (component.isInteractive) {
      classes.push('hover:scale-[1.02] cursor-pointer');
    }
  }

  return classes.join(' ');
}

/**
 * Generate placeholder content based on component type
 */
function getPlaceholderContent(component: DetectedComponentEnhanced): string {
  const content = component.content;

  // Use detected text if available
  if (content?.text) {
    return content.text;
  }

  // Generate appropriate placeholder based on type
  const placeholders: Record<string, string> = {
    button: 'Button',
    input: 'Enter text...',
    'search-bar': 'Search...',
    logo: 'Logo',
    breadcrumb: 'Home / Products / Item',
    pagination: '← 1 2 3 →',
    tabs: 'Tab 1 | Tab 2 | Tab 3',
    badge: 'New',
    avatar: 'A',
    divider: '',
    progress: '75%',
    menu: '☰ Menu',
    dropdown: 'Select ▼',
    'user-menu': '👤',
    'content-section': 'Content section with text and information.',
    'image-gallery': '🖼️ Gallery',
    chart: '📊 Chart',
    list: '• List item 1\n• List item 2\n• List item 3',
    modal: '□ Modal',
    unknown: component.type,
  };

  return placeholders[component.type] || component.type;
}

/**
 * Get icon representation for component type
 */
function getIconForType(type: string): string {
  const icons: Record<string, string> = {
    button: '▢',
    input: '▭',
    'search-bar': '🔍',
    logo: '◆',
    breadcrumb: '→',
    pagination: '◄ ►',
    tabs: '▭▭▭',
    badge: '◉',
    avatar: '👤',
    progress: '▰▰▰▱▱',
    menu: '☰',
    dropdown: '▼',
    'user-menu': '👤',
    'image-gallery': '🖼️',
    chart: '📊',
    modal: '□',
    list: '≡',
  };
  return icons[type] || '▢';
}

// ============================================================================
// Main Component
// ============================================================================

export function GenericComponentRenderer({
  component,
  colorSettings,
  effectsSettings,
  primaryColor,
  onElementSelect,
  selectedElement,
  viewMode = 'desktop',
}: GenericComponentRendererProps) {
  const handleSelect = (id: string) => {
    onElementSelect?.(selectedElement === id ? null : id);
  };

  const isSelected = selectedElement === component.id;
  const isMobile = viewMode === 'mobile';

  // Get computed styles
  const inlineStyle = mapStylesToCSS(component, colorSettings);
  const styleClasses = getStyleClasses(component, effectsSettings);

  // Get content
  const placeholderText = getPlaceholderContent(component);
  const hasIcon = component.content?.hasIcon;
  const icon = hasIcon ? getIconForType(component.type) : null;

  // Handle different component types with appropriate rendering
  const renderContent = () => {
    // Button components
    if (component.type === 'button') {
      return (
        <button
          type="button"
          className={`px-4 py-2 ${styleClasses} font-medium`}
          style={{
            ...inlineStyle,
            backgroundColor:
              inlineStyle.backgroundColor || colorSettings?.primary || primaryColor || '#22c55e',
            color: inlineStyle.color || '#ffffff',
          }}
        >
          {icon && <span className="mr-2">{icon}</span>}
          {placeholderText}
        </button>
      );
    }

    // Input components
    if (component.type === 'input' || component.type === 'search-bar') {
      return (
        <div className={`${styleClasses} flex-1`} style={inlineStyle}>
          {icon && <span className="mr-2 text-gray-500">{icon}</span>}
          <input
            type="text"
            placeholder={component.content?.placeholder || placeholderText}
            className="bg-transparent border-none outline-none flex-1"
            style={{ color: inlineStyle.color }}
            readOnly
          />
        </div>
      );
    }

    // List components
    if (component.type === 'list') {
      const itemCount = component.content?.itemCount || 3;
      return (
        <div className={styleClasses} style={inlineStyle}>
          {Array.from({ length: Math.min(itemCount, 5) }).map((_, i) => (
            <div key={i} className="py-2 border-b border-gray-700 last:border-0">
              {`• Item ${i + 1}`}
            </div>
          ))}
        </div>
      );
    }

    // Navigation/Menu components
    if (component.type === 'menu' || component.type === 'navigation') {
      return (
        <nav className={`${styleClasses} flex gap-4`} style={inlineStyle}>
          {['Home', 'About', 'Services', 'Contact'].map((item) => (
            <span key={item} className="cursor-pointer hover:opacity-80">
              {item}
            </span>
          ))}
        </nav>
      );
    }

    // Badge components
    if (component.type === 'badge') {
      return (
        <span
          className={`inline-flex items-center ${styleClasses} text-xs font-medium`}
          style={{
            ...inlineStyle,
            backgroundColor:
              inlineStyle.backgroundColor || colorSettings?.primary || primaryColor || '#22c55e',
            color: inlineStyle.color || '#ffffff',
          }}
        >
          {placeholderText}
        </span>
      );
    }

    // Avatar components
    if (component.type === 'avatar') {
      return (
        <div
          className={`${styleClasses} flex items-center justify-center w-10 h-10 rounded-full font-medium`}
          style={{
            ...inlineStyle,
            backgroundColor:
              inlineStyle.backgroundColor || colorSettings?.primary || primaryColor || '#22c55e',
            color: inlineStyle.color || '#ffffff',
          }}
        >
          {icon || placeholderText.charAt(0)}
        </div>
      );
    }

    // Progress components
    if (component.type === 'progress') {
      return (
        <div className={styleClasses} style={inlineStyle}>
          <div
            className="h-2 rounded-full"
            style={{
              width: '75%',
              backgroundColor: colorSettings?.primary || primaryColor || '#22c55e',
            }}
          />
        </div>
      );
    }

    // Tabs components
    if (component.type === 'tabs') {
      return (
        <div className={styleClasses} style={inlineStyle}>
          <div className="flex gap-4 border-b border-gray-700">
            {['Tab 1', 'Tab 2', 'Tab 3'].map((tab, i) => (
              <button
                key={tab}
                type="button"
                className={`pb-2 px-4 ${i === 0 ? 'border-b-2' : ''}`}
                style={{
                  borderColor:
                    i === 0 ? colorSettings?.primary || primaryColor || '#22c55e' : 'transparent',
                  color:
                    i === 0
                      ? colorSettings?.primary || primaryColor || '#22c55e'
                      : inlineStyle.color,
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Breadcrumb components
    if (component.type === 'breadcrumb') {
      return (
        <nav className={styleClasses} style={inlineStyle}>
          <span>Home</span>
          <span className="mx-2">/</span>
          <span>Category</span>
          <span className="mx-2">/</span>
          <span style={{ color: colorSettings?.primary || primaryColor || '#22c55e' }}>
            Current
          </span>
        </nav>
      );
    }

    // Pagination components
    if (component.type === 'pagination') {
      return (
        <div className={`${styleClasses} flex items-center gap-2`} style={inlineStyle}>
          <button type="button" className="px-3 py-1 rounded hover:bg-gray-700">
            ←
          </button>
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              type="button"
              className={`px-3 py-1 rounded ${page === 1 ? 'bg-green-600 text-white' : 'hover:bg-gray-700'}`}
              style={
                page === 1
                  ? { backgroundColor: colorSettings?.primary || primaryColor || '#22c55e' }
                  : {}
              }
            >
              {page}
            </button>
          ))}
          <button type="button" className="px-3 py-1 rounded hover:bg-gray-700">
            →
          </button>
        </div>
      );
    }

    // Dropdown components
    if (component.type === 'dropdown') {
      return (
        <div
          className={`${styleClasses} flex justify-between items-center cursor-pointer`}
          style={inlineStyle}
        >
          <span>{placeholderText}</span>
          <span>▼</span>
        </div>
      );
    }

    // Divider components
    if (component.type === 'divider') {
      return (
        <hr
          className="border-t"
          style={{
            borderColor: inlineStyle.borderColor || colorSettings?.border || '#475569',
          }}
        />
      );
    }

    // Content section (generic text block)
    if (component.type === 'content-section') {
      return (
        <div className={styleClasses} style={inlineStyle}>
          <h3 className="text-lg font-semibold mb-2">
            {component.content?.text || 'Section Title'}
          </h3>
          <p className="text-sm opacity-80">
            This is a content section with text and information. The layout detected this as a
            distinct content area.
          </p>
        </div>
      );
    }

    // Default: Generic box with type label
    return (
      <div
        className={`${styleClasses} flex flex-col items-center justify-center min-h-[80px]`}
        style={inlineStyle}
      >
        {icon && <div className="text-2xl mb-2">{icon}</div>}
        <div className="text-sm font-medium" style={{ color: inlineStyle.color }}>
          {placeholderText}
        </div>
        <div className="text-xs opacity-60 mt-1">{component.type}</div>
      </div>
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        handleSelect(component.id);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelect(component.id);
        }
      }}
      className={`cursor-pointer transition-all ${
        isSelected
          ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-transparent'
          : 'hover:ring-1 hover:ring-green-400/50'
      } ${isMobile ? 'text-sm' : ''}`}
      aria-pressed={isSelected}
      data-element-id={component.id}
      data-element-type={component.type}
    >
      {renderContent()}
    </div>
  );
}

export default GenericComponentRenderer;
