/**
 * Main Layout Design Type
 * The core LayoutDesign interface that combines all design settings
 */

import type { GlobalStyles } from './globalStyles';
import type {
  HeaderDesign,
  SidebarDesign,
  HeroDesign,
  NavigationDesign,
  CardDesign,
  ListDesign,
  StatsDesign,
  FooterDesign,
} from './components';
import type { LayoutStructure, ResponsiveSettings } from './structure';
import type { MultiPageDesign } from './multiPage';
import type { ReferenceMedia } from './multiPage';
import type { ConversationContext, DesignContext } from './conversation';

// ============================================================================
// Main Layout Design Type
// ============================================================================

export interface LayoutDesign {
  id: string;
  name: string;
  version: number;
  createdAt: string;
  updatedAt: string;

  // Base preferences (maps to UIPreferences for compatibility)
  basePreferences: {
    style: 'modern' | 'minimalist' | 'playful' | 'professional' | 'custom';
    colorScheme: 'light' | 'dark' | 'auto' | 'custom';
    layout: 'single-page' | 'multi-page' | 'dashboard' | 'custom';
  };

  // Global Styling
  globalStyles: GlobalStyles;

  // Component Specifications
  components: {
    header?: HeaderDesign;
    sidebar?: SidebarDesign;
    hero?: HeroDesign;
    navigation?: NavigationDesign;
    cards?: CardDesign;
    lists?: ListDesign;
    stats?: StatsDesign;
    footer?: FooterDesign;
  };

  // Layout Structure
  structure: LayoutStructure;

  // Responsive Settings
  responsive: ResponsiveSettings;

  // Reference Media
  referenceMedia: ReferenceMedia[];

  // Conversation Context
  conversationContext: ConversationContext;

  // Design Context (auto-extracted from conversation)
  designContext?: DesignContext;

  // Multi-Page Design (optional, for multi-page mode)
  multiPage?: MultiPageDesign;

  // Current page being edited (for multi-page mode)
  currentPageId?: string;
}
