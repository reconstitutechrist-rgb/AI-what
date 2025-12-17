/**
 * Types for Figma integration
 * Used by API routes, hooks, and transformer service
 */

// ============================================================================
// EXTRACTED DATA TYPES (from Figma Plugin)
// ============================================================================

export interface FigmaExtractedColor {
  hex: string;
  rgba: { r: number; g: number; b: number; a: number };
  name?: string;
  usage: 'fill' | 'stroke' | 'text' | 'background';
  frequency: number;
}

export interface FigmaExtractedTypography {
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number | 'auto';
  letterSpacing: number;
  textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';
  usage: 'heading' | 'body' | 'caption' | 'unknown';
  frequency: number;
}

export interface FigmaExtractedSpacing {
  itemSpacing: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
}

export interface FigmaExtractedEffect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  radius: number;
  color?: { r: number; g: number; b: number; a: number };
  offset?: { x: number; y: number };
  spread?: number;
}

export interface FigmaExtractedComponent {
  id: string;
  name: string;
  type: 'header' | 'sidebar' | 'footer' | 'hero' | 'card' | 'navigation' | 'list' | 'unknown';
  bounds: { x: number; y: number; width: number; height: number };
  children: FigmaExtractedComponent[];
  properties: Record<string, unknown>;
}

export interface FigmaExtraction {
  documentName: string;
  pageName: string;
  selectionName: string;
  colors: FigmaExtractedColor[];
  typography: FigmaExtractedTypography[];
  spacing: FigmaExtractedSpacing;
  effects: FigmaExtractedEffect[];
  components: FigmaExtractedComponent[];
  cornerRadius: number;
  frameSize: { width: number; height: number };
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface FigmaImportRequest {
  figmaData: FigmaExtraction;
  options?: {
    extractColors?: boolean;
    extractTypography?: boolean;
    extractSpacing?: boolean;
    extractComponents?: boolean;
  };
}

export interface FigmaImportResponse {
  success: boolean;
  layoutDesign?: import('./layoutDesign').LayoutDesign;
  warnings?: string[];
  error?: string;
}

export interface FigmaAnonymousImportRequest {
  type: 'url' | 'json';
  url?: string;
  jsonData?: string;
}

export interface FigmaGenerateCodeRequest {
  layoutDesign: import('./layoutDesign').LayoutDesign;
  options?: {
    framework?: 'react' | 'next';
    styling?: 'tailwind' | 'css-modules';
    typescript?: boolean;
  };
}

export interface FigmaGenerateCodeResponse {
  success: boolean;
  files?: Array<{
    path: string;
    content: string;
    language: 'typescript' | 'css' | 'json';
  }>;
  error?: string;
}

// ============================================================================
// FIGMA REST API TYPES (for anonymous URL import)
// ============================================================================

export interface FigmaAPIFile {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaAPIDocument;
  styles: Record<string, FigmaAPIStyle>;
}

export interface FigmaAPIDocument {
  id: string;
  name: string;
  type: string;
  children: FigmaAPINode[];
}

export interface FigmaAPINode {
  id: string;
  name: string;
  type: string;
  children?: FigmaAPINode[];
  fills?: FigmaAPIPaint[];
  strokes?: FigmaAPIPaint[];
  effects?: FigmaAPIEffect[];
  style?: FigmaAPITypeStyle;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  cornerRadius?: number;
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  itemSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
}

export interface FigmaAPIPaint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE';
  visible?: boolean;
  opacity?: number;
  color?: { r: number; g: number; b: number; a: number };
}

export interface FigmaAPIEffect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  visible?: boolean;
  radius: number;
  color?: { r: number; g: number; b: number; a: number };
  offset?: { x: number; y: number };
  spread?: number;
}

export interface FigmaAPITypeStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  fontWeight: number;
  fontSize: number;
  lineHeightPx?: number;
  letterSpacing?: number;
}

export interface FigmaAPIStyle {
  key: string;
  name: string;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
  description?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface FigmaUrlParseResult {
  fileKey: string;
  nodeId?: string;
  fileName?: string;
}

export interface FigmaImportProgress {
  stage: 'fetching' | 'parsing' | 'transforming' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
}
