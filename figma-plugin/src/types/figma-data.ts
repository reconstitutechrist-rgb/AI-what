/**
 * Types for extracted Figma data
 */

export interface ExtractedColor {
  hex: string;
  rgba: { r: number; g: number; b: number; a: number };
  name?: string;
  usage: 'fill' | 'stroke' | 'text' | 'background';
  frequency: number;
}

export interface ExtractedTypography {
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number | 'auto';
  letterSpacing: number;
  textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';
  usage: 'heading' | 'body' | 'caption' | 'unknown';
  frequency: number;
}

export interface ExtractedSpacing {
  itemSpacing: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
}

export interface ExtractedEffect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  radius: number;
  color?: { r: number; g: number; b: number; a: number };
  offset?: { x: number; y: number };
  spread?: number;
}

export interface ExtractedComponent {
  id: string;
  name: string;
  type: 'header' | 'sidebar' | 'footer' | 'hero' | 'card' | 'navigation' | 'list' | 'unknown';
  bounds: { x: number; y: number; width: number; height: number };
  children: ExtractedComponent[];
  properties: Record<string, unknown>;
}

export interface FigmaExtraction {
  documentName: string;
  pageName: string;
  selectionName: string;
  colors: ExtractedColor[];
  typography: ExtractedTypography[];
  spacing: ExtractedSpacing;
  effects: ExtractedEffect[];
  components: ExtractedComponent[];
  cornerRadius: number;
  frameSize: { width: number; height: number };
}

export interface PluginMessage {
  type: 'extract' | 'selection-change' | 'export' | 'cancel' | 'error' | 'extraction-complete';
  data?: FigmaExtraction;
  error?: string;
  hasSelection?: boolean;
  selectionCount?: number;
}

export interface UIMessage {
  type: 'start-extraction' | 'export-to-app' | 'close' | 'resize';
  serverUrl?: string;
  width?: number;
  height?: number;
}
