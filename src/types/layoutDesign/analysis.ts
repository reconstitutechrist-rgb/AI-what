/**
 * Complete Design Analysis Types
 * Pixel-perfect design extraction with full component specifications
 */

// ============================================================================
// COMPLETE DESIGN ANALYSIS TYPES (Pixel-Perfect Replication)
// ============================================================================

/**
 * Color swatch with usage context
 */
export interface ColorSwatch {
  hex: string;
  rgba?: string;
  usage: string; // e.g., "button-primary", "card-background", "heading-text"
  frequency: number; // How often this color appears (0-100)
}

/**
 * Gradient definition with full CSS output
 */
export interface GradientDefinition {
  id: string;
  type: 'linear' | 'radial' | 'conic';
  direction: string; // e.g., "135deg", "to right", "circle at center"
  stops: Array<{ color: string; position: string }>;
  css: string; // Full CSS value
  usage: string; // Where this gradient is used
}

/**
 * Semi-transparent overlay specification
 */
export interface OverlaySpec {
  color: string; // rgba value
  opacity: number;
  usage: string;
}

/**
 * Font specification with Google Fonts integration
 */
export interface FontSpec {
  family: string;
  googleFontUrl: string;
  fallbacks: string[];
  weights: number[];
  confidence: number; // 0-1 confidence of match
  detected: string; // Description of what was detected
}

/**
 * Typography scale for a specific text level
 */
export interface TypeScale {
  size: string; // e.g., "48px" or "3rem"
  weight: number; // 100-900
  lineHeight: number | string; // e.g., 1.2 or "1.5"
  letterSpacing: string; // e.g., "-0.02em"
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

/**
 * Responsive value that changes per breakpoint
 */
export interface ResponsiveValue<T = string> {
  mobile: T;
  tablet: T;
  desktop: T;
}

/**
 * Shadow specification with full CSS output
 */
export interface ShadowSpec {
  name: string;
  value: string; // Full CSS box-shadow value
  layers: Array<{
    offsetX: string;
    offsetY: string;
    blur: string;
    spread: string;
    color: string;
    inset?: boolean;
  }>;
}

/**
 * Border radius specification (can be per-corner)
 */
export interface RadiusSpec {
  all?: string;
  topLeft?: string;
  topRight?: string;
  bottomLeft?: string;
  bottomRight?: string;
  css: string;
}

/**
 * Hover animation specification
 */
export interface HoverAnimation {
  element: string; // CSS selector or description
  properties: Record<string, { from: string; to: string }>;
  duration: string; // e.g., "0.2s"
  easing: string; // e.g., "ease-out", "cubic-bezier(0.4, 0, 0.2, 1)"
  delay?: string;
  css: string; // Full CSS output
  tailwind: string; // Tailwind classes
  framerMotion: Record<string, unknown>; // Framer Motion config
}

/**
 * Scroll-triggered animation
 */
export interface ScrollAnimation {
  element: string;
  trigger: 'enter' | 'exit' | 'center';
  animation: string; // Animation name/description
  duration: string;
  easing: string;
  css: string;
  framerMotion: Record<string, unknown>;
}

/**
 * Entrance/page load animation
 */
export interface EntranceAnimation {
  element: string;
  animation:
    | 'fadeIn'
    | 'fadeInUp'
    | 'fadeInDown'
    | 'slideInLeft'
    | 'slideInRight'
    | 'scaleIn'
    | 'custom';
  duration: string;
  delay: string;
  stagger?: string; // For staggered children
  css: string;
  framerMotion: Record<string, unknown>;
}

/**
 * Transition specification
 */
export interface TransitionSpec {
  property: string; // CSS property or "all"
  duration: string;
  easing: string;
  delay?: string;
  css: string;
}

/**
 * Micro-interaction specification
 */
export interface MicroInteraction {
  trigger: 'click' | 'hover' | 'focus' | 'active' | 'drag';
  element: string;
  animation: string;
  feedback: string; // Description of user feedback
  css: string;
  framerMotion: Record<string, unknown>;
}

/**
 * Page transition animation
 */
export interface PageTransition {
  type: 'fade' | 'slide' | 'scale' | 'morph' | 'custom';
  duration: string;
  easing: string;
  direction?: 'left' | 'right' | 'up' | 'down';
  css: string;
  framerMotion: Record<string, unknown>;
}

/**
 * Button component specification
 */
export interface ButtonSpec {
  variant: string; // e.g., "primary", "secondary", "ghost"
  size: string;
  states: {
    default: Record<string, string>;
    hover: Record<string, string>;
    focus: Record<string, string>;
    active: Record<string, string>;
    disabled: Record<string, string>;
  };
  borderRadius: string;
  padding: string;
  fontSize: string;
  fontWeight: number;
  transition: string;
}

/**
 * Input component specification
 */
export interface InputSpec {
  variant: string;
  size: string;
  states: {
    default: Record<string, string>;
    hover: Record<string, string>;
    focus: Record<string, string>;
    error: Record<string, string>;
    disabled: Record<string, string>;
  };
  borderRadius: string;
  padding: string;
  fontSize: string;
  labelStyle: Record<string, string>;
  placeholderStyle: Record<string, string>;
}

/**
 * Card component specification
 */
export interface CardSpec {
  variant: string;
  states: {
    default: Record<string, string>;
    hover: Record<string, string>;
  };
  borderRadius: string;
  padding: string;
  shadow: string;
  border: string;
  background: string;
}

/**
 * Header component specification
 */
export interface HeaderSpec {
  height: string;
  background: string;
  borderBottom?: string;
  shadow?: string;
  blur?: string;
  position: 'fixed' | 'sticky' | 'static';
  padding: string;
  logoSize: string;
  navItemSpacing: string;
  navItemStyle: Record<string, string>;
}

/**
 * Navigation component specification
 */
export interface NavSpec {
  itemStyle: Record<string, string>;
  itemHoverStyle: Record<string, string>;
  itemActiveStyle: Record<string, string>;
  spacing: string;
  fontSize: string;
  fontWeight: number;
}

/**
 * Hero section specification
 */
export interface HeroSpec {
  height: string;
  padding: string;
  background: string;
  headingStyle: TypeScale;
  subtitleStyle: TypeScale;
  ctaStyle: ButtonSpec;
  alignment: 'left' | 'center' | 'right';
  imagePosition?: string;
}

/**
 * Footer component specification
 */
export interface FooterSpec {
  height?: string;
  background: string;
  borderTop?: string;
  padding: string;
  textStyle: Record<string, string>;
  linkStyle: Record<string, string>;
}

/**
 * Modal/Dialog specification
 */
export interface ModalSpec {
  maxWidth: string;
  borderRadius: string;
  padding: string;
  background: string;
  shadow: string;
  overlayColor: string;
  overlayBlur?: string;
  animation: EntranceAnimation;
}

/**
 * Dropdown specification
 */
export interface DropdownSpec {
  borderRadius: string;
  padding: string;
  background: string;
  shadow: string;
  border?: string;
  itemPadding: string;
  itemHoverStyle: Record<string, string>;
  animation: EntranceAnimation;
}

/**
 * Table specification
 */
export interface TableSpec {
  headerStyle: Record<string, string>;
  cellPadding: string;
  rowBorder?: string;
  stripedColor?: string;
  hoverColor?: string;
  fontSize: string;
}

/**
 * List specification
 */
export interface ListSpec {
  itemPadding: string;
  dividerStyle?: string;
  hoverStyle?: Record<string, string>;
  spacing: string;
}

/**
 * Layout region specification
 */
export interface LayoutRegion {
  id: string;
  name: string;
  gridArea?: string;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  height?: string;
  padding?: string;
  background?: string;
}

/**
 * Breakpoint configuration
 */
export interface BreakpointConfig {
  sm: number; // 640px
  md: number; // 768px
  lg: number; // 1024px
  xl: number; // 1280px
  '2xl': number; // 1536px
}

/**
 * Complete Design Analysis - Full pixel-perfect extraction
 */
export interface CompleteDesignAnalysis {
  // Meta
  id: string;
  analyzedAt: string;
  sourceType: 'image' | 'video' | 'url';
  sourceUrl?: string;
  confidence: number; // Overall confidence of analysis (0-1)

  // COLORS - Every color in the design
  colors: {
    palette: ColorSwatch[];
    primary: string;
    primaryHover?: string;
    secondary: string;
    secondaryHover?: string;
    accent: string;
    accentHover?: string;
    background: string;
    surface: string;
    surfaceAlt?: string;
    text: string;
    textMuted: string;
    textInverted?: string;
    border: string;
    borderLight?: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    gradients: GradientDefinition[];
    overlays: OverlaySpec[];
  };

  // TYPOGRAPHY - Complete font specifications
  typography: {
    headingFont: FontSpec;
    bodyFont: FontSpec;
    monoFont?: FontSpec;
    displaySizes: {
      h1: TypeScale;
      h2: TypeScale;
      h3: TypeScale;
      h4: TypeScale;
      h5: TypeScale;
      h6: TypeScale;
    };
    bodySizes: {
      xs: TypeScale;
      sm: TypeScale;
      base: TypeScale;
      lg: TypeScale;
      xl: TypeScale;
    };
    lineHeights: Record<string, number>;
    letterSpacing: Record<string, string>;
    fontWeights: number[];
  };

  // SPACING - Complete spacing system
  spacing: {
    baseUnit: number; // 4 or 8
    scale: number[]; // [4, 8, 12, 16, 24, 32, 48, 64, ...]
    containerMaxWidth: string;
    containerPadding: ResponsiveValue;
    sectionPadding: ResponsiveValue;
    componentGap: ResponsiveValue;
    cardPadding: string;
    buttonPadding: string;
    inputPadding: string;
  };

  // EFFECTS - All visual effects
  effects: {
    borderRadius: {
      none: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      full: string;
      button: string;
      card: string;
      input: string;
    };
    shadows: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      card: string;
      dropdown: string;
      modal: string;
      button: string;
      buttonHover: string;
      inner?: string;
    };
    blur: {
      sm: string;
      md: string;
      lg: string;
      backdrop: string;
    };
    transitions: {
      fast: string;
      normal: string;
      slow: string;
      bounce: string;
      spring: string;
    };
  };

  // COMPONENTS - Detailed component specs
  components: {
    header?: HeaderSpec;
    navigation?: NavSpec;
    hero?: HeroSpec;
    cards: CardSpec[];
    buttons: ButtonSpec[];
    inputs: InputSpec[];
    footer?: FooterSpec;
    modals?: ModalSpec;
    dropdowns?: DropdownSpec;
    tables?: TableSpec;
    lists?: ListSpec;
  };

  // LAYOUT - Grid and structure
  layout: {
    type: 'flex' | 'grid' | 'mixed';
    gridColumns: number;
    gridGutter: string;
    regions: LayoutRegion[];
    breakpoints: BreakpointConfig;
    zIndexScale: number[];
    containerWidth: string;
    contentWidth: string;
  };

  // ANIMATIONS - All motion
  animations: {
    hover: HoverAnimation[];
    scroll: ScrollAnimation[];
    entrance: EntranceAnimation[];
    transitions: TransitionSpec[];
    microInteractions: MicroInteraction[];
    pageTransitions: PageTransition[];
  };

  // RESPONSIVE - Breakpoint-specific overrides
  responsive: {
    mobile: Partial<CompleteDesignAnalysis>;
    tablet: Partial<CompleteDesignAnalysis>;
    desktop: Partial<CompleteDesignAnalysis>;
  };
}
