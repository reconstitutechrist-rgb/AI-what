/**
 * Architecture Template Mapping
 *
 * Maps architecture templates (blueprints) to LayoutDesign configurations.
 * Used by the Architecture Blueprints feature in the Layout Builder.
 */

import type { LayoutDesign } from '@/types/layoutDesign';
import type { FullTemplate } from '@/types/architectureTemplates';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Deep partial type for nested layout configurations
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============================================================================
// LAYOUT TYPE CONFIGURATIONS
// ============================================================================

/**
 * Layout configurations based on architecture template layout types
 */
const layoutTypeConfigs: Record<string, DeepPartial<LayoutDesign>> = {
  sidebar: {
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
    components: {
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
    },
    globalStyles: {
      spacing: {
        density: 'compact',
        containerWidth: 'full',
        sectionPadding: 'md',
        componentGap: 'sm',
      },
    },
  },
  topnav: {
    structure: {
      type: 'multi-page',
      hasHeader: true,
      hasSidebar: false,
      hasFooter: true,
      sidebarPosition: 'left',
      headerType: 'sticky',
      contentLayout: 'centered',
      mainContentWidth: 'wide',
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
        ctaText: 'Get Started',
        ctaStyle: 'filled',
      },
    },
    globalStyles: {
      spacing: {
        density: 'normal',
        containerWidth: 'wide',
        sectionPadding: 'lg',
        componentGap: 'md',
      },
    },
  },
  minimal: {
    structure: {
      type: 'single-page',
      hasHeader: true,
      hasSidebar: false,
      hasFooter: true,
      sidebarPosition: 'left',
      headerType: 'fixed',
      contentLayout: 'centered',
      mainContentWidth: 'standard',
    },
    components: {
      header: {
        visible: true,
        height: 'compact',
        style: 'transparent',
        logoPosition: 'left',
        navPosition: 'right',
        hasSearch: false,
        hasCTA: true,
        ctaStyle: 'outline',
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
    },
    globalStyles: {
      spacing: {
        density: 'relaxed',
        containerWidth: 'standard',
        sectionPadding: 'xl',
        componentGap: 'lg',
      },
    },
  },
  split: {
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
    components: {
      sidebar: {
        visible: true,
        position: 'left',
        width: 'narrow',
        collapsible: false,
        defaultCollapsed: false,
        style: 'minimal',
        iconOnly: true,
        hasLogo: true,
      },
    },
    globalStyles: {
      spacing: {
        density: 'normal',
        containerWidth: 'full',
        sectionPadding: 'md',
        componentGap: 'md',
      },
    },
  },
};

// ============================================================================
// CATEGORY STYLE CONFIGURATIONS
// ============================================================================

/**
 * Category-specific style configurations
 */
const categoryStyles: Record<string, DeepPartial<LayoutDesign['globalStyles']>> = {
  admin: {
    colors: {
      primary: '#3B82F6',
      secondary: '#6366F1',
      accent: '#10B981',
      background: '#0F172A',
      surface: '#1E293B',
      text: '#F1F5F9',
      textMuted: '#94A3B8',
      border: '#334155',
    },
    effects: {
      borderRadius: 'md',
      shadows: 'subtle',
      animations: 'subtle',
      blur: 'none',
      gradients: false,
    },
  },
  content: {
    colors: {
      primary: '#059669',
      secondary: '#0D9488',
      accent: '#F59E0B',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#1E293B',
      textMuted: '#64748B',
      border: '#E2E8F0',
    },
    typography: {
      fontFamily: 'Inter',
      headingWeight: 'bold',
      bodyWeight: 'normal',
      headingSize: 'lg',
      bodySize: 'base',
      lineHeight: 'relaxed',
      letterSpacing: 'normal',
    },
  },
  marketing: {
    colors: {
      primary: '#8B5CF6',
      secondary: '#EC4899',
      accent: '#06B6D4',
      background: '#0F0F23',
      surface: '#1A1A2E',
      text: '#FFFFFF',
      textMuted: '#A1A1AA',
      border: '#27273F',
    },
    effects: {
      borderRadius: 'xl',
      shadows: 'strong',
      animations: 'playful',
      blur: 'medium',
      gradients: true,
    },
  },
  saas: {
    colors: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      accent: '#22D3EE',
      background: '#0F172A',
      surface: '#1E293B',
      text: '#F1F5F9',
      textMuted: '#94A3B8',
      border: '#334155',
    },
    effects: {
      borderRadius: 'lg',
      shadows: 'medium',
      animations: 'smooth',
      blur: 'subtle',
      gradients: true,
    },
  },
  commerce: {
    colors: {
      primary: '#059669',
      secondary: '#0D9488',
      accent: '#F59E0B',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      text: '#111827',
      textMuted: '#6B7280',
      border: '#E5E7EB',
    },
    effects: {
      borderRadius: 'md',
      shadows: 'subtle',
      animations: 'subtle',
      blur: 'none',
      gradients: false,
    },
  },
};

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

/**
 * Map an architecture template to a LayoutDesign configuration.
 * This allows users to start with a structural blueprint and get layout styling.
 */
export function mapArchitectureToLayout(template: FullTemplate): DeepPartial<LayoutDesign> {
  const layoutType = template.layoutStructure.type;
  const category = template.category;

  // Get base layout configuration
  const baseLayout = layoutTypeConfigs[layoutType] || layoutTypeConfigs.topnav;

  // Get category-specific styles
  const categoryStyle = categoryStyles[category] || categoryStyles.saas;

  // Merge configurations
  const result: DeepPartial<LayoutDesign> = {
    ...baseLayout,
    basePreferences: {
      style:
        category === 'marketing' ? 'playful' : category === 'admin' ? 'professional' : 'modern',
      colorScheme: ['commerce', 'content'].includes(category) ? 'light' : 'dark',
      layout: baseLayout.structure?.type === 'dashboard' ? 'dashboard' : 'single-page',
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
        ...categoryStyle.typography,
      },
      colors: {
        primary: '#3B82F6',
        background: '#0F172A',
        surface: '#1E293B',
        text: '#F1F5F9',
        textMuted: '#94A3B8',
        border: '#334155',
        ...categoryStyle.colors,
      },
      spacing: {
        density: 'normal',
        containerWidth: 'standard',
        sectionPadding: 'lg',
        componentGap: 'md',
        ...baseLayout.globalStyles?.spacing,
      },
      effects: {
        borderRadius: 'lg',
        shadows: 'medium',
        animations: 'smooth',
        blur: 'none',
        gradients: false,
        ...categoryStyle.effects,
      },
    },
    components: {
      ...baseLayout.components,
      header: {
        visible: true,
        height: 'standard',
        style: 'solid',
        logoPosition: 'left',
        navPosition: 'right',
        hasSearch: template.technicalRequirements.needsDatabase,
        hasCTA: true,
        ctaText: 'Get Started',
        ctaStyle: 'filled',
        ...baseLayout.components?.header,
      },
      footer: {
        visible: layoutType !== 'sidebar',
        style: 'minimal',
        columns: 3,
        showSocial: true,
        showNewsletter: category === 'marketing',
        showCopyright: true,
        position: 'static',
      },
    },
    structure: baseLayout.structure,
    responsive: {
      mobileBreakpoint: 640,
      tabletBreakpoint: 1024,
      mobileLayout: layoutType === 'sidebar' ? 'drawer' : 'stack',
      mobileHeader: 'hamburger',
      hideSidebarOnMobile: true,
      stackCardsOnMobile: true,
    },
    // Store context for the AI to use
    designContext: {
      purpose: template.description,
      requirements: template.requiredFeatures.slice(0, 5),
      lastUpdated: new Date().toISOString(),
    },
  };

  return result;
}

/**
 * Generate an initial chat message for the selected architecture template.
 */
export function generateArchitecturePrompt(template: FullTemplate): string {
  const features = template.requiredFeatures.slice(0, 3).join(', ');
  return `I'm building a ${template.name.toLowerCase()}. The main features are: ${features}. Please help me design a ${template.layoutStructure.type} layout that works well for this type of application.`;
}
