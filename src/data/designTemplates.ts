/**
 * Design Templates
 *
 * Pre-built layout design configurations for quick starts.
 * Each template provides a complete LayoutDesign configuration
 * optimized for different use cases.
 */

import type { LayoutDesign } from '@/types/layoutDesign';

// ============================================================================
// TYPES
// ============================================================================

export interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'creative' | 'commerce' | 'utility';
  preview?: string; // Base64 preview image
  design: Partial<LayoutDesign>;
}

// ============================================================================
// TEMPLATE CONFIGURATIONS
// ============================================================================

const modernSaaSTemplate: DesignTemplate = {
  id: 'modern-saas',
  name: 'Modern SaaS',
  description: 'Clean, professional design perfect for software products and B2B services.',
  category: 'business',
  design: {
    basePreferences: {
      style: 'modern',
      colorScheme: 'dark',
      layout: 'single-page',
    },
    globalStyles: {
      typography: {
        fontFamily: 'Inter',
        headingWeight: 'semibold',
        bodyWeight: 'normal',
        headingSize: 'lg',
        bodySize: 'sm',
        lineHeight: 'relaxed',
        letterSpacing: 'normal',
      },
      colors: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        accent: '#22D3EE',
        background: '#0F172A',
        surface: '#1E293B',
        text: '#F1F5F9',
        textMuted: '#94A3B8',
        border: '#334155',
        success: '#22C55E',
        warning: '#EAB308',
        error: '#EF4444',
        info: '#3B82F6',
      },
      spacing: {
        density: 'normal',
        containerWidth: 'standard',
        sectionPadding: 'lg',
        componentGap: 'md',
      },
      effects: {
        borderRadius: 'lg',
        shadows: 'medium',
        animations: 'smooth',
        blur: 'subtle',
        gradients: true,
      },
    },
    components: {
      header: {
        visible: true,
        height: 'standard',
        style: 'blur',
        logoPosition: 'left',
        navPosition: 'center',
        hasSearch: false,
        hasCTA: true,
        ctaText: 'Get Started',
        ctaStyle: 'filled',
      },
      hero: {
        visible: true,
        height: 'tall',
        layout: 'centered',
        hasImage: false,
        hasSubtitle: true,
        hasCTA: true,
        ctaCount: 2,
      },
      cards: {
        style: 'bordered',
        imagePosition: 'top',
        showBadge: true,
        showFooter: false,
        hoverEffect: 'lift',
        aspectRatio: 'auto',
      },
      footer: {
        visible: true,
        style: 'minimal',
        columns: 3,
        showSocial: true,
        showNewsletter: false,
        showCopyright: true,
        position: 'static',
      },
    },
    structure: {
      type: 'single-page',
      hasHeader: true,
      hasSidebar: false,
      hasFooter: true,
      sidebarPosition: 'left',
      headerType: 'sticky',
      contentLayout: 'centered',
      mainContentWidth: 'standard',
    },
    responsive: {
      mobileBreakpoint: 640,
      tabletBreakpoint: 1024,
      mobileLayout: 'stack',
      mobileHeader: 'hamburger',
      hideSidebarOnMobile: true,
      stackCardsOnMobile: true,
    },
  },
};

const dashboardTemplate: DesignTemplate = {
  id: 'dashboard',
  name: 'Admin Dashboard',
  description: 'Feature-rich dashboard layout with sidebar navigation and data displays.',
  category: 'utility',
  design: {
    basePreferences: {
      style: 'professional',
      colorScheme: 'dark',
      layout: 'dashboard',
    },
    globalStyles: {
      typography: {
        fontFamily: 'Inter',
        headingWeight: 'medium',
        bodyWeight: 'normal',
        headingSize: 'base',
        bodySize: 'sm',
        lineHeight: 'normal',
        letterSpacing: 'normal',
      },
      colors: {
        primary: '#3B82F6',
        secondary: '#6366F1',
        accent: '#10B981',
        background: '#0F172A',
        surface: '#1E293B',
        text: '#F1F5F9',
        textMuted: '#94A3B8',
        border: '#334155',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#0EA5E9',
      },
      spacing: {
        density: 'compact',
        containerWidth: 'full',
        sectionPadding: 'md',
        componentGap: 'sm',
      },
      effects: {
        borderRadius: 'md',
        shadows: 'subtle',
        animations: 'subtle',
        blur: 'none',
        gradients: false,
      },
    },
    components: {
      header: {
        visible: true,
        height: 'compact',
        style: 'solid',
        logoPosition: 'left',
        navPosition: 'right',
        hasSearch: true,
        hasCTA: false,
      },
      sidebar: {
        visible: true,
        position: 'left',
        width: 'standard',
        collapsible: true,
        defaultCollapsed: false,
        style: 'standard',
        iconOnly: false,
        hasLogo: true,
      },
      stats: {
        visible: true,
        layout: 'row',
        style: 'cards',
        showIcons: true,
        showTrend: true,
        columns: 4,
      },
      cards: {
        style: 'bordered',
        imagePosition: 'none',
        showBadge: true,
        showFooter: true,
        hoverEffect: 'none',
        aspectRatio: 'auto',
      },
      footer: {
        visible: false,
        style: 'minimal',
        columns: 1,
        showSocial: false,
        showNewsletter: false,
        showCopyright: true,
        position: 'static',
      },
    },
    structure: {
      type: 'dashboard',
      hasHeader: true,
      hasSidebar: true,
      hasFooter: false,
      sidebarPosition: 'left',
      headerType: 'fixed',
      contentLayout: 'full-width',
      mainContentWidth: 'full',
    },
    responsive: {
      mobileBreakpoint: 640,
      tabletBreakpoint: 1024,
      mobileLayout: 'drawer',
      mobileHeader: 'hamburger',
      hideSidebarOnMobile: true,
      stackCardsOnMobile: true,
    },
  },
};

const portfolioTemplate: DesignTemplate = {
  id: 'portfolio',
  name: 'Creative Portfolio',
  description: 'Showcase-focused design for artists, designers, and creative professionals.',
  category: 'creative',
  design: {
    basePreferences: {
      style: 'minimalist',
      colorScheme: 'dark',
      layout: 'single-page',
    },
    globalStyles: {
      typography: {
        fontFamily: 'Inter',
        headingWeight: 'bold',
        bodyWeight: 'light',
        headingSize: 'xl',
        bodySize: 'base',
        lineHeight: 'relaxed',
        letterSpacing: 'wide',
      },
      colors: {
        primary: '#FFFFFF',
        secondary: '#A3A3A3',
        accent: '#FBBF24',
        background: '#0A0A0A',
        surface: '#171717',
        text: '#FAFAFA',
        textMuted: '#737373',
        border: '#262626',
        success: '#4ADE80',
        warning: '#FBBF24',
        error: '#F87171',
        info: '#60A5FA',
      },
      spacing: {
        density: 'relaxed',
        containerWidth: 'wide',
        sectionPadding: 'xl',
        componentGap: 'lg',
      },
      effects: {
        borderRadius: 'none',
        shadows: 'none',
        animations: 'smooth',
        blur: 'none',
        gradients: false,
      },
    },
    components: {
      header: {
        visible: true,
        height: 'compact',
        style: 'transparent',
        logoPosition: 'left',
        navPosition: 'right',
        hasSearch: false,
        hasCTA: false,
      },
      hero: {
        visible: true,
        height: 'fullscreen',
        layout: 'centered',
        hasImage: false,
        hasSubtitle: true,
        hasCTA: true,
        ctaCount: 1,
      },
      cards: {
        style: 'minimal',
        imagePosition: 'top',
        showBadge: false,
        showFooter: false,
        hoverEffect: 'scale',
        aspectRatio: 'square',
      },
      footer: {
        visible: true,
        style: 'minimal',
        columns: 1,
        showSocial: true,
        showNewsletter: false,
        showCopyright: true,
        position: 'static',
      },
    },
    structure: {
      type: 'single-page',
      hasHeader: true,
      hasSidebar: false,
      hasFooter: true,
      sidebarPosition: 'left',
      headerType: 'fixed',
      contentLayout: 'full-width',
      mainContentWidth: 'wide',
    },
    responsive: {
      mobileBreakpoint: 640,
      tabletBreakpoint: 1024,
      mobileLayout: 'stack',
      mobileHeader: 'minimal',
      hideSidebarOnMobile: true,
      stackCardsOnMobile: true,
    },
  },
};

const ecommerceTemplate: DesignTemplate = {
  id: 'ecommerce',
  name: 'E-Commerce Store',
  description: 'Product-focused layout with catalog display and shopping-oriented navigation.',
  category: 'commerce',
  design: {
    basePreferences: {
      style: 'modern',
      colorScheme: 'light',
      layout: 'multi-page',
    },
    globalStyles: {
      typography: {
        fontFamily: 'Inter',
        headingWeight: 'semibold',
        bodyWeight: 'normal',
        headingSize: 'lg',
        bodySize: 'sm',
        lineHeight: 'normal',
        letterSpacing: 'normal',
      },
      colors: {
        primary: '#000000',
        secondary: '#6B7280',
        accent: '#DC2626',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: '#111827',
        textMuted: '#6B7280',
        border: '#E5E7EB',
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
        info: '#2563EB',
      },
      spacing: {
        density: 'normal',
        containerWidth: 'wide',
        sectionPadding: 'md',
        componentGap: 'md',
      },
      effects: {
        borderRadius: 'md',
        shadows: 'subtle',
        animations: 'subtle',
        blur: 'none',
        gradients: false,
      },
    },
    components: {
      header: {
        visible: true,
        height: 'standard',
        style: 'solid',
        logoPosition: 'left',
        navPosition: 'center',
        hasSearch: true,
        hasCTA: true,
        ctaText: 'Cart',
        ctaStyle: 'outline',
      },
      hero: {
        visible: true,
        height: 'standard',
        layout: 'split',
        hasImage: true,
        imagePosition: 'right',
        hasSubtitle: true,
        hasCTA: true,
        ctaCount: 2,
      },
      cards: {
        style: 'minimal',
        imagePosition: 'top',
        showBadge: true,
        showFooter: true,
        hoverEffect: 'lift',
        aspectRatio: 'portrait',
      },
      footer: {
        visible: true,
        style: 'rich',
        columns: 4,
        showSocial: true,
        showNewsletter: true,
        showCopyright: true,
        position: 'static',
      },
    },
    structure: {
      type: 'multi-page',
      hasHeader: true,
      hasSidebar: false,
      hasFooter: true,
      sidebarPosition: 'left',
      headerType: 'sticky',
      contentLayout: 'full-width',
      mainContentWidth: 'wide',
    },
    responsive: {
      mobileBreakpoint: 640,
      tabletBreakpoint: 1024,
      mobileLayout: 'bottom-nav',
      mobileHeader: 'hamburger',
      hideSidebarOnMobile: true,
      stackCardsOnMobile: false,
    },
  },
};

const landingPageTemplate: DesignTemplate = {
  id: 'landing-page',
  name: 'Landing Page',
  description: 'Conversion-focused single page design for marketing and product launches.',
  category: 'business',
  design: {
    basePreferences: {
      style: 'playful',
      colorScheme: 'dark',
      layout: 'single-page',
    },
    globalStyles: {
      typography: {
        fontFamily: 'Inter',
        headingWeight: 'bold',
        bodyWeight: 'normal',
        headingSize: 'xl',
        bodySize: 'base',
        lineHeight: 'relaxed',
        letterSpacing: 'tight',
      },
      colors: {
        primary: '#8B5CF6',
        secondary: '#EC4899',
        accent: '#06B6D4',
        background: '#0F0F23',
        surface: '#1A1A2E',
        text: '#FFFFFF',
        textMuted: '#A1A1AA',
        border: '#27273F',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      spacing: {
        density: 'relaxed',
        containerWidth: 'standard',
        sectionPadding: 'xl',
        componentGap: 'lg',
      },
      effects: {
        borderRadius: 'xl',
        shadows: 'strong',
        animations: 'playful',
        blur: 'medium',
        gradients: true,
      },
    },
    components: {
      header: {
        visible: true,
        height: 'compact',
        style: 'blur',
        logoPosition: 'left',
        navPosition: 'right',
        hasSearch: false,
        hasCTA: true,
        ctaText: 'Sign Up',
        ctaStyle: 'filled',
      },
      hero: {
        visible: true,
        height: 'fullscreen',
        layout: 'centered',
        hasImage: false,
        hasSubtitle: true,
        hasCTA: true,
        ctaCount: 2,
      },
      stats: {
        visible: true,
        layout: 'row',
        style: 'minimal',
        showIcons: false,
        showTrend: false,
        columns: 3,
      },
      cards: {
        style: 'elevated',
        imagePosition: 'top',
        showBadge: false,
        showFooter: false,
        hoverEffect: 'glow',
        aspectRatio: 'auto',
      },
      footer: {
        visible: true,
        style: 'standard',
        columns: 3,
        showSocial: true,
        showNewsletter: true,
        showCopyright: true,
        position: 'static',
      },
    },
    structure: {
      type: 'landing',
      hasHeader: true,
      hasSidebar: false,
      hasFooter: true,
      sidebarPosition: 'left',
      headerType: 'fixed',
      contentLayout: 'centered',
      mainContentWidth: 'standard',
    },
    responsive: {
      mobileBreakpoint: 640,
      tabletBreakpoint: 1024,
      mobileLayout: 'stack',
      mobileHeader: 'hamburger',
      hideSidebarOnMobile: true,
      stackCardsOnMobile: true,
    },
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * All available design templates
 */
export const DESIGN_TEMPLATES: DesignTemplate[] = [
  modernSaaSTemplate,
  dashboardTemplate,
  portfolioTemplate,
  ecommerceTemplate,
  landingPageTemplate,
];

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): DesignTemplate | undefined {
  return DESIGN_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: DesignTemplate['category']): DesignTemplate[] {
  return DESIGN_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Template categories with display info
 */
export const TEMPLATE_CATEGORIES = [
  { id: 'business', name: 'Business', icon: 'briefcase' },
  { id: 'creative', name: 'Creative', icon: 'palette' },
  { id: 'commerce', name: 'Commerce', icon: 'shopping-cart' },
  { id: 'utility', name: 'Utility', icon: 'cog' },
] as const;

export default DESIGN_TEMPLATES;
