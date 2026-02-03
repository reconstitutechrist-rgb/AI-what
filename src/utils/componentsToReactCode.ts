/**
 * DetectedComponentEnhanced[] → React Code Converter
 *
 * Converts a component array into valid React TSX code (AppFile[]).
 * Uses inline styles mirroring the mapping from GenericComponentRenderer.tsx.
 * Produces code that works in Sandpack with React 19 + Tailwind CDN.
 */

import type { DetectedComponentEnhanced } from '@/types/layoutDesign';
import type { AppFile } from '@/types/railway';
import { buildComponentTree } from '@/utils/layoutValidation';

// ============================================================================
// TYPES
// ============================================================================

export interface CodeGenerationOptions {
  /** Canvas background color */
  canvasBackground?: string;
  /** Include data-id attributes for the inspector */
  includeDataIds?: boolean;
}

// ============================================================================
// STYLE MAPPING
// ============================================================================

/** Map short-form justify values to CSS */
function mapJustify(justify?: string): string | undefined {
  const map: Record<string, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
    evenly: 'space-evenly',
  };
  return justify ? map[justify] || undefined : undefined;
}

/** Map short-form align values to CSS */
function mapAlign(align?: string): string | undefined {
  const map: Record<string, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
  };
  return align ? map[align] || undefined : undefined;
}

/**
 * Build a React CSSProperties object literal string from a component.
 * Mirrors GenericComponentRenderer.tsx lines 189-428.
 */
function buildStyleObject(
  component: DetectedComponentEnhanced,
  isRoot: boolean,
  isContainer: boolean,
): Record<string, string | number | undefined> {
  const { style = {}, bounds, layout } = component;

  const css: Record<string, string | number | undefined> = {};

  // Position strategy: absolute for roots, relative for children
  if (isRoot) {
    css.position = 'absolute';
    css.top = `${bounds?.top ?? 0}%`;
    css.left = `${bounds?.left ?? 0}%`;
    css.width = bounds?.width ? `${bounds.width}%` : 'auto';
    css.height = bounds?.height ? `${bounds.height}%` : 'auto';
  } else {
    css.position = 'relative';
    if (bounds?.width) {
      css.flex = `0 1 ${bounds.width}%`;
      css.maxWidth = `${bounds.width}%`;
    } else {
      css.flex = '1 1 auto';
    }
    if (bounds?.height) {
      css.height = `${bounds.height}%`;
    }
  }

  // Container layout
  if (isContainer) {
    const layoutType = layout?.type || 'flex';
    if (layoutType === 'grid') {
      css.display = 'grid';
      css.gridTemplateColumns = layout?.columns || 'repeat(auto-fit, minmax(100px, 1fr))';
      if (layout?.gap) css.gap = layout.gap;
      if (layout?.justify) css.justifyContent = mapJustify(layout.justify);
      if (layout?.align) css.alignItems = mapAlign(layout.align);
    } else {
      css.display = 'flex';
      css.flexDirection = layout?.direction || 'column';
      if (layout?.gap) css.gap = layout.gap;
      if (layout?.justify) css.justifyContent = mapJustify(layout.justify);
      if (layout?.align) css.alignItems = mapAlign(layout.align);
      if (layout?.wrap) css.flexWrap = 'wrap';
    }
  } else {
    // Leaf layout
    css.display = style.display || 'flex';
    css.flexDirection = 'row';
    css.alignItems = style.alignment === 'center' ? 'center' : 'flex-start';
  }

  // Background color
  const bgColor =
    (style.customCSS?.backgroundColor as string) || style.backgroundColor;
  css.backgroundColor = bgColor || 'transparent';

  // Text color
  if (style.textColor) css.color = style.textColor;

  // Typography
  if (style.fontSize) css.fontSize = style.fontSize;
  if (style.fontWeight) css.fontWeight = style.fontWeight;
  if (style.fontFamily) css.fontFamily = style.fontFamily;
  if (style.fontStyle) css.fontStyle = style.fontStyle;
  if (style.textAlign) css.textAlign = style.textAlign;
  if (style.textTransform) css.textTransform = style.textTransform;
  if (style.textDecoration) css.textDecoration = style.textDecoration;
  if (style.textShadow) css.textShadow = style.textShadow;
  if (style.letterSpacing) css.letterSpacing = style.letterSpacing;
  if (style.lineHeight) css.lineHeight = style.lineHeight;

  // Border
  if (style.borderRadius) css.borderRadius = style.borderRadius;
  if (style.borderWidth || style.borderColor) {
    css.border = `${style.borderWidth || '1px'} ${style.borderStyle || 'solid'} ${style.borderColor || 'currentColor'}`;
  }

  // Spacing
  if (style.padding) css.padding = style.padding;
  if (style.margin) css.margin = style.margin;
  if (style.gap) css.gap = style.gap;

  // Shadow
  if (style.shadow) css.boxShadow = style.shadow;

  // Background
  if (style.backgroundImage) css.backgroundImage = style.backgroundImage;
  if (style.backgroundSize) css.backgroundSize = style.backgroundSize;
  if (style.backgroundPosition) css.backgroundPosition = style.backgroundPosition;
  if (style.backgroundRepeat) css.backgroundRepeat = style.backgroundRepeat;

  // Visual effects
  if (style.opacity) css.opacity = style.opacity;
  if (style.backdropFilter) css.backdropFilter = style.backdropFilter;
  if (style.transform) css.transform = style.transform;
  if (style.filter) css.filter = style.filter;
  if (style.mixBlendMode) css.mixBlendMode = style.mixBlendMode;

  // Overflow
  if (style.overflow) css.overflow = style.overflow;

  // Size constraints
  if (style.maxWidth) css.maxWidth = style.maxWidth;
  if (style.maxHeight) css.maxHeight = style.maxHeight;
  if (style.minHeight) css.minHeight = style.minHeight;
  if (style.aspectRatio) css.aspectRatio = style.aspectRatio;

  // Animation
  if (style.animation) css.animation = style.animation;
  if (style.transition) css.transition = style.transition;

  // Cursor
  if (style.cursor) css.cursor = style.cursor;

  // Text handling
  if (style.whiteSpace) css.whiteSpace = style.whiteSpace;
  if (style.textOverflow) css.textOverflow = style.textOverflow;
  if (style.wordBreak) css.wordBreak = style.wordBreak;

  // Flex control
  if (style.flexGrow !== undefined) css.flexGrow = style.flexGrow;
  if (style.flexShrink !== undefined) css.flexShrink = style.flexShrink;
  if (style.order !== undefined) css.order = style.order;

  // Z-index
  if (component.zIndex !== undefined) css.zIndex = component.zIndex;

  // Custom CSS overrides (spread last)
  if (style.customCSS) {
    for (const [key, value] of Object.entries(style.customCSS)) {
      if (key !== 'backgroundColor' && value !== undefined) {
        css[key] = value as string | number;
      }
    }
  }

  return css;
}

// ============================================================================
// STRING BUILDERS
// ============================================================================

/** Escape a string for use inside JSX text content */
function escapeJsxText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;');
}

/** Escape a string for use inside a JS string literal */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n');
}

/** Convert a style object to a JS object literal string */
function styleToString(css: Record<string, string | number | undefined>): string {
  const entries: string[] = [];
  for (const [key, value] of Object.entries(css)) {
    if (value === undefined) continue;
    if (typeof value === 'number') {
      entries.push(`${key}: ${value}`);
    } else {
      entries.push(`${key}: '${escapeString(value)}'`);
    }
  }
  return `{ ${entries.join(', ')} }`;
}

// ============================================================================
// ICON COLLECTION
// ============================================================================

/** Collect all lucide-react icon names used in the component tree */
function collectLucideIcons(
  components: DetectedComponentEnhanced[]
): Set<string> {
  const icons = new Set<string>();
  for (const c of components) {
    if (c.content?.hasIcon && c.content.iconName && !c.content.iconSvgPath) {
      // Capitalize first letter for lucide-react import
      const name = c.content.iconName;
      const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
      icons.add(pascalName);
    }
  }
  return icons;
}

// ============================================================================
// COMPONENT RENDERER (String-based)
// ============================================================================

function renderComponent(
  component: DetectedComponentEnhanced,
  componentMap: Map<string, DetectedComponentEnhanced>,
  indent: number,
  options: CodeGenerationOptions,
  depth: number = 0
): string {
  if (depth > 10) return '';

  const pad = ' '.repeat(indent);
  const isRoot = !component.parentId;
  const isContainer =
    component.role === 'container' ||
    (component.children && component.children.length > 0);

  const css = buildStyleObject(component, isRoot, !!isContainer);
  const styleStr = styleToString(css);

  const dataId = options.includeDataIds ? ` data-id="${component.id}"` : '';

  // Build children content
  const childrenJsx: string[] = [];

  // Text content
  if (component.content?.text) {
    childrenJsx.push(`${pad}    <span>${escapeJsxText(component.content.text)}</span>`);
  }

  // Icon (inline SVG or lucide-react)
  if (component.content?.hasIcon) {
    if (component.content.iconSvgPath) {
      const viewBox = component.content.iconViewBox || '0 0 24 24';
      const color = component.content.iconColor || 'currentColor';
      childrenJsx.push(
        `${pad}    <svg viewBox="${viewBox}" width="24" height="24" fill="none" stroke="${color}" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">`,
        `${pad}      <path d="${escapeString(component.content.iconSvgPath)}" />`,
        `${pad}    </svg>`
      );
    } else if (component.content.iconName) {
      const name = component.content.iconName;
      const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
      childrenJsx.push(
        `${pad}    <${pascalName} size={${component.content.iconSize === 'lg' ? 32 : component.content.iconSize === 'sm' ? 16 : 24}} />`
      );
    }
  }

  // Image placeholder
  if (component.content?.hasImage && !component.content?.hasIcon) {
    const alt = component.content.imageAlt || component.content.imageDescription || 'Image';
    childrenJsx.push(
      `${pad}    <div style={{ width: '100%', height: '100%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>`,
      `${pad}      <span style={{ color: '#9ca3af', fontSize: '12px' }}>${escapeJsxText(alt)}</span>`,
      `${pad}    </div>`
    );
  }

  // Recursive children
  if (component.children && component.children.length > 0) {
    for (const childId of component.children) {
      const child = componentMap.get(childId);
      if (child) {
        childrenJsx.push(
          renderComponent(child, componentMap, indent + 4, options, depth + 1)
        );
      }
    }
  }

  // Build JSX element
  if (childrenJsx.length === 0) {
    return `${pad}<div${dataId} style={${styleStr}} />`;
  }

  return [
    `${pad}<div${dataId} style={${styleStr}}>`,
    ...childrenJsx,
    `${pad}</div>`,
  ].join('\n');
}

// ============================================================================
// MAIN CONVERTER
// ============================================================================

/**
 * Convert DetectedComponentEnhanced[] into AppFile[] (React TSX code).
 */
export function componentsToReactCode(
  components: DetectedComponentEnhanced[],
  options: CodeGenerationOptions = {}
): AppFile[] {
  const { canvasBackground = '#ffffff', includeDataIds = true } = options;

  if (components.length === 0) {
    return [
      {
        path: '/src/App.tsx',
        content: `import React from 'react';\n\nexport default function App() {\n  return <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '${escapeString(canvasBackground)}' }} />;\n}\n`,
      },
      {
        path: '/src/index.tsx',
        content: `import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\nimport './inspector';\n\nconst root = createRoot(document.getElementById('root')!);\nroot.render(<React.StrictMode><App /></React.StrictMode>);\n`,
      },
    ];
  }

  // Build component tree
  const { roots, componentMap } = buildComponentTree(components);

  // Collect lucide-react imports
  const lucideIcons = collectLucideIcons(components);

  // Build imports
  const imports: string[] = [`import React from 'react';`];
  if (lucideIcons.size > 0) {
    imports.push(
      `import { ${Array.from(lucideIcons).join(', ')} } from 'lucide-react';`
    );
  }

  // Render root components
  const rootJsx = roots
    .map((root) =>
      renderComponent(root, componentMap, 8, { canvasBackground, includeDataIds })
    )
    .join('\n');

  // Assemble App.tsx
  const appCode = `${imports.join('\n')}

export default function App() {
  return (
    <div style={{ width: '100%', minHeight: '100vh', position: 'relative', backgroundColor: '${escapeString(canvasBackground)}' }}>
${rootJsx}
    </div>
  );
}
`;

  // Standard index.tsx bootstrap (same as assembleCode in TitanPipelineService)
  const indexCode = `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './inspector';

const root = createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
`;

  return [
    { path: '/src/App.tsx', content: appCode },
    { path: '/src/index.tsx', content: indexCode },
  ];
}
