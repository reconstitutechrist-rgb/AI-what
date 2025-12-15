/**
 * Design Workflows
 *
 * Pre-defined step-by-step design workflows for common project types.
 * Each workflow guides the user through creating a complete design.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  focusElements: string[];
  suggestedActions: string[];
  completionCriteria: string[];
  tips: string[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  estimatedSteps: number;
  steps: WorkflowStep[];
}

export interface WorkflowState {
  workflowId: string;
  workflowType: string;
  currentStepIndex: number;
  completedSteps: string[];
  skippedSteps: string[];
  stepNotes: Record<string, string>;
  startedAt: string;
}

// ============================================================================
// WORKFLOW TEMPLATES
// ============================================================================

export const DESIGN_WORKFLOWS: Record<string, WorkflowTemplate> = {
  'landing-page': {
    id: 'landing-page',
    name: 'Landing Page Design',
    description: 'Design a high-converting landing page step by step',
    estimatedSteps: 5,
    steps: [
      {
        id: 'hero',
        name: 'Hero Section',
        description: 'Create an impactful first impression that captures attention',
        focusElements: ['hero'],
        suggestedActions: [
          'Set a compelling headline (keep it under 10 words)',
          'Choose hero layout (centered, split, or image-background)',
          'Add a primary CTA button with action-oriented text',
          'Select background treatment (solid, gradient, or image)',
        ],
        completionCriteria: ['hero.visible', 'hero.hasCTA'],
        tips: [
          'Headlines should communicate value in 10 words or less',
          'Use contrasting colors for the CTA button',
          'Ensure text is readable on the background',
        ],
      },
      {
        id: 'value-props',
        name: 'Value Proposition',
        description: 'Highlight key benefits with cards, icons, or stats',
        focusElements: ['cards', 'stats'],
        suggestedActions: [
          'Add 3-4 benefit cards or feature highlights',
          'Include icons or illustrations for visual appeal',
          'Write concise, benefit-focused copy',
          'Consider adding stats or social proof numbers',
        ],
        completionCriteria: ['cards.visible OR stats.visible'],
        tips: [
          'Keep card content scannable',
          'Use consistent icon style throughout',
          'Lead with benefits, not features',
        ],
      },
      {
        id: 'social-proof',
        name: 'Social Proof',
        description: 'Build trust with testimonials, logos, or reviews',
        focusElements: ['testimonials', 'logos'],
        suggestedActions: [
          'Add customer testimonials or reviews',
          'Include company logos if B2B',
          'Display ratings or review scores',
          'Consider before/after or case study snippets',
        ],
        completionCriteria: [],
        tips: [
          'Real photos build more trust than stock images',
          'Include names and titles for credibility',
          'Keep testimonials specific and results-focused',
        ],
      },
      {
        id: 'cta-section',
        name: 'Call to Action',
        description: 'Final conversion push with clear next steps',
        focusElements: ['cta'],
        suggestedActions: [
          'Create a dedicated CTA section',
          'Repeat the main value proposition',
          'Make the action crystal clear',
          'Consider adding urgency or incentive',
        ],
        completionCriteria: [],
        tips: [
          'Use the same CTA text as the hero for consistency',
          'Add a secondary option for hesitant visitors',
          'Contrasting background helps section stand out',
        ],
      },
      {
        id: 'footer',
        name: 'Footer',
        description: 'Complete the page with navigation and trust elements',
        focusElements: ['footer'],
        suggestedActions: [
          'Add essential links (Privacy, Terms, Contact)',
          'Include social media links',
          'Add company info or about snippet',
          'Consider newsletter signup',
        ],
        completionCriteria: ['footer.visible'],
        tips: [
          'Keep footer navigation organized',
          'Include trust badges if applicable',
          'Make contact info easy to find',
        ],
      },
    ],
  },

  dashboard: {
    id: 'dashboard',
    name: 'Dashboard Design',
    description: 'Design a functional and clear dashboard interface',
    estimatedSteps: 5,
    steps: [
      {
        id: 'layout',
        name: 'Dashboard Layout',
        description: 'Establish the overall structure and navigation',
        focusElements: ['header', 'sidebar', 'navigation'],
        suggestedActions: [
          'Choose between sidebar or top navigation',
          'Define header with user menu and actions',
          'Set up navigation hierarchy',
          'Consider collapsed/expanded sidebar states',
        ],
        completionCriteria: ['header.visible', 'sidebar.visible OR navigation.visible'],
        tips: [
          'Sidebar works well for many navigation items',
          'Top nav is cleaner for fewer items',
          'Include breadcrumbs for nested pages',
        ],
      },
      {
        id: 'metrics',
        name: 'Key Metrics',
        description: 'Display important numbers and KPIs prominently',
        focusElements: ['stats', 'cards'],
        suggestedActions: [
          'Add stat cards for key metrics',
          'Include trend indicators (up/down arrows)',
          'Choose appropriate visualizations',
          'Group related metrics together',
        ],
        completionCriteria: ['stats.visible'],
        tips: [
          '4-6 key metrics is usually optimal',
          'Use color coding for positive/negative trends',
          'Include time period context',
        ],
      },
      {
        id: 'data-display',
        name: 'Data Display',
        description: 'Present detailed data in tables or lists',
        focusElements: ['lists', 'tables'],
        suggestedActions: [
          'Add primary data table or list',
          'Include sorting and filtering options',
          'Add action buttons for each row',
          'Consider pagination for large datasets',
        ],
        completionCriteria: ['lists.visible'],
        tips: [
          'Highlight important columns',
          'Use status badges for quick scanning',
          'Include row actions on hover or in column',
        ],
      },
      {
        id: 'actions',
        name: 'Actions & Controls',
        description: 'Add buttons and controls for user actions',
        focusElements: ['buttons', 'forms'],
        suggestedActions: [
          'Add primary action button (Create, Add, etc.)',
          'Include filter controls',
          'Add search functionality',
          'Consider bulk action options',
        ],
        completionCriteria: [],
        tips: [
          'Primary actions should be prominent',
          'Group related controls together',
          'Use icons with labels for clarity',
        ],
      },
      {
        id: 'polish',
        name: 'Polish & Refinement',
        description: 'Final touches for a professional finish',
        focusElements: ['global'],
        suggestedActions: [
          'Ensure consistent spacing throughout',
          'Check color contrast for accessibility',
          'Add loading states and empty states',
          'Review responsive behavior',
        ],
        completionCriteria: [],
        tips: [
          'Dashboards need to be scannable',
          'Use whitespace to group related items',
          'Test at different screen sizes',
        ],
      },
    ],
  },

  'e-commerce': {
    id: 'e-commerce',
    name: 'E-commerce Design',
    description: 'Design a product-focused e-commerce experience',
    estimatedSteps: 5,
    steps: [
      {
        id: 'header-nav',
        name: 'Header & Navigation',
        description: 'Create intuitive navigation with search and cart',
        focusElements: ['header', 'navigation'],
        suggestedActions: [
          'Add prominent search bar',
          'Include category navigation',
          'Add cart icon with item count',
          'Include user account menu',
        ],
        completionCriteria: ['header.visible', 'header.hasSearch'],
        tips: [
          'Search should be easily accessible',
          'Show cart item count at a glance',
          'Consider mega-menu for categories',
        ],
      },
      {
        id: 'hero-promo',
        name: 'Hero & Promotions',
        description: 'Feature current promotions and key products',
        focusElements: ['hero', 'cards'],
        suggestedActions: [
          'Create hero banner for main promotion',
          'Add secondary promotion cards',
          'Include clear CTAs (Shop Now, View Sale)',
          'Consider image carousel for multiple promos',
        ],
        completionCriteria: ['hero.visible'],
        tips: [
          'Promotions should have urgency',
          'Use high-quality product imagery',
          'CTAs should be action-oriented',
        ],
      },
      {
        id: 'product-grid',
        name: 'Product Display',
        description: 'Show products in an appealing, browseable grid',
        focusElements: ['cards', 'lists'],
        suggestedActions: [
          'Create product card design',
          'Include price and ratings',
          'Add quick-view or add-to-cart options',
          'Consider wishlist functionality',
        ],
        completionCriteria: ['cards.visible'],
        tips: [
          'Product images should be consistent size',
          'Show original and sale prices',
          'Include ratings for social proof',
        ],
      },
      {
        id: 'categories',
        name: 'Category Sections',
        description: 'Organize products by category',
        focusElements: ['cards', 'navigation'],
        suggestedActions: [
          'Create category highlight sections',
          'Add "View All" links',
          'Consider featured products per category',
          'Use category-specific imagery',
        ],
        completionCriteria: [],
        tips: [
          'Show 4-8 products per category section',
          'Use carousel for more products',
          'Category images should be representative',
        ],
      },
      {
        id: 'trust-footer',
        name: 'Trust & Footer',
        description: 'Build confidence with trust signals and complete the page',
        focusElements: ['footer'],
        suggestedActions: [
          'Add trust badges (secure payment, returns)',
          'Include customer service info',
          'Add newsletter signup',
          'Include social media and payment icons',
        ],
        completionCriteria: ['footer.visible'],
        tips: [
          'Trust badges increase conversion',
          'Make return policy visible',
          'Include multiple contact options',
        ],
      },
    ],
  },

  portfolio: {
    id: 'portfolio',
    name: 'Portfolio Design',
    description: 'Showcase your work with a professional portfolio',
    estimatedSteps: 4,
    steps: [
      {
        id: 'intro',
        name: 'Introduction',
        description: 'Create a memorable first impression',
        focusElements: ['hero', 'header'],
        suggestedActions: [
          'Add your name/brand prominently',
          'Write a brief, compelling tagline',
          'Include professional photo or avatar',
          'Add social/contact links in header',
        ],
        completionCriteria: ['hero.visible', 'header.visible'],
        tips: [
          'Keep tagline focused on your specialty',
          'Professional photo builds trust',
          'Make contact info easily accessible',
        ],
      },
      {
        id: 'work',
        name: 'Work Showcase',
        description: 'Display your best projects',
        focusElements: ['cards'],
        suggestedActions: [
          'Create project cards with thumbnails',
          'Add project titles and brief descriptions',
          'Include tags for skills/categories',
          'Consider featured/highlighted projects',
        ],
        completionCriteria: ['cards.visible'],
        tips: [
          'Quality over quantity - show best work',
          'Use consistent image sizes',
          'Include project outcomes if possible',
        ],
      },
      {
        id: 'about',
        name: 'About Section',
        description: 'Tell your story and build connection',
        focusElements: ['content'],
        suggestedActions: [
          'Write a brief bio (2-3 paragraphs)',
          'List key skills or services',
          'Include work experience or clients',
          'Add a personal touch',
        ],
        completionCriteria: [],
        tips: [
          'Balance professional and personal',
          'Focus on client benefits',
          'Keep it scannable with bullet points',
        ],
      },
      {
        id: 'contact',
        name: 'Contact',
        description: 'Make it easy to get in touch',
        focusElements: ['footer', 'forms'],
        suggestedActions: [
          'Add contact form or email link',
          'Include social media links',
          'Consider adding availability status',
          'Add location if relevant',
        ],
        completionCriteria: ['footer.visible'],
        tips: [
          'Multiple contact options increase responses',
          'Set expectations for response time',
          'Make CTA clear (Hire Me, Get in Touch)',
        ],
      },
    ],
  },

  blog: {
    id: 'blog',
    name: 'Blog Design',
    description: 'Create a readable, engaging blog layout',
    estimatedSteps: 4,
    steps: [
      {
        id: 'header',
        name: 'Blog Header',
        description: 'Set up navigation and branding',
        focusElements: ['header', 'navigation'],
        suggestedActions: [
          'Add blog title/logo',
          'Create category navigation',
          'Add search functionality',
          'Include subscribe/newsletter CTA',
        ],
        completionCriteria: ['header.visible'],
        tips: [
          'Categories help readers find content',
          'Search is essential for blogs',
          'Keep header clean and focused',
        ],
      },
      {
        id: 'featured',
        name: 'Featured Content',
        description: 'Highlight your best or latest posts',
        focusElements: ['hero', 'cards'],
        suggestedActions: [
          'Create featured post section',
          'Add latest posts grid',
          'Include post thumbnails',
          'Show author and date',
        ],
        completionCriteria: ['cards.visible'],
        tips: [
          'Featured posts drive engagement',
          'Show 3-6 recent posts',
          'Include estimated read time',
        ],
      },
      {
        id: 'categories',
        name: 'Categories & Archive',
        description: 'Organize content for easy discovery',
        focusElements: ['cards', 'lists'],
        suggestedActions: [
          'Add category sections or sidebar',
          'Create archive links',
          'Add popular/trending posts',
          'Consider tags cloud',
        ],
        completionCriteria: [],
        tips: [
          'Popular posts increase page views',
          'Categories should be distinct',
          'Archive helps returning readers',
        ],
      },
      {
        id: 'sidebar-footer',
        name: 'Sidebar & Footer',
        description: 'Complete the blog with supporting elements',
        focusElements: ['sidebar', 'footer'],
        suggestedActions: [
          'Add about section or bio',
          'Include newsletter signup',
          'Add social media links',
          'Consider related posts widget',
        ],
        completionCriteria: ['footer.visible'],
        tips: [
          "Sidebar shouldn't distract from content",
          'Newsletter builds audience',
          'Social sharing increases reach',
        ],
      },
    ],
  },

  'saas-app': {
    id: 'saas-app',
    name: 'SaaS Marketing Page',
    description: 'Design a compelling SaaS product marketing page',
    estimatedSteps: 6,
    steps: [
      {
        id: 'hero',
        name: 'Hero & Value Prop',
        description: "Communicate your product's core value immediately",
        focusElements: ['hero', 'header'],
        suggestedActions: [
          'Write a clear, benefit-focused headline',
          'Add subheadline explaining what it does',
          'Include primary CTA (Start Free, Get Started)',
          'Consider product screenshot or demo video',
        ],
        completionCriteria: ['hero.visible', 'hero.hasCTA'],
        tips: [
          'Answer "what does this do for me?" immediately',
          'Show the product in action',
          'CTA should match signup flow',
        ],
      },
      {
        id: 'features',
        name: 'Feature Highlights',
        description: 'Showcase key features with benefits',
        focusElements: ['cards'],
        suggestedActions: [
          'List 3-6 key features',
          'Include icons or illustrations',
          'Write benefit-focused descriptions',
          'Consider feature screenshots',
        ],
        completionCriteria: ['cards.visible'],
        tips: [
          'Features should solve problems',
          'Use icons consistently',
          'Benefits > features in copy',
        ],
      },
      {
        id: 'social-proof',
        name: 'Social Proof',
        description: 'Build trust with testimonials and logos',
        focusElements: ['testimonials', 'logos'],
        suggestedActions: [
          'Add customer testimonials',
          'Include company logos',
          'Display metrics (users, ratings)',
          'Consider case study links',
        ],
        completionCriteria: [],
        tips: [
          'Real names and photos build trust',
          'Logos from known brands help',
          'Specific results are compelling',
        ],
      },
      {
        id: 'pricing',
        name: 'Pricing',
        description: 'Present pricing clearly and competitively',
        focusElements: ['cards', 'stats'],
        suggestedActions: [
          'Create pricing tier cards',
          'Highlight recommended plan',
          'List features per tier',
          'Add annual discount option',
        ],
        completionCriteria: [],
        tips: [
          '3 tiers is standard',
          'Highlight middle tier as "Popular"',
          'Include free trial or money-back guarantee',
        ],
      },
      {
        id: 'faq',
        name: 'FAQ Section',
        description: 'Address common questions and objections',
        focusElements: ['lists'],
        suggestedActions: [
          'Add FAQ accordion or list',
          'Address pricing questions',
          'Cover technical requirements',
          'Include support information',
        ],
        completionCriteria: [],
        tips: [
          'Address objections as questions',
          '5-10 FAQs is usually enough',
          'Link to docs for detailed answers',
        ],
      },
      {
        id: 'final-cta',
        name: 'Final CTA & Footer',
        description: 'Final conversion push and complete the page',
        focusElements: ['cta', 'footer'],
        suggestedActions: [
          'Add strong final CTA section',
          'Repeat key value proposition',
          'Include footer with links',
          'Add contact and support info',
        ],
        completionCriteria: ['footer.visible'],
        tips: [
          'Reinforce value before final CTA',
          'Include trust elements',
          'Make support accessible',
        ],
      },
    ],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a workflow by ID
 */
export function getWorkflow(workflowId: string): WorkflowTemplate | undefined {
  return DESIGN_WORKFLOWS[workflowId];
}

/**
 * Get all available workflows
 */
export function getAllWorkflows(): WorkflowTemplate[] {
  return Object.values(DESIGN_WORKFLOWS);
}

/**
 * Get workflow step by index
 */
export function getWorkflowStep(workflowId: string, stepIndex: number): WorkflowStep | undefined {
  const workflow = DESIGN_WORKFLOWS[workflowId];
  if (!workflow || stepIndex < 0 || stepIndex >= workflow.steps.length) {
    return undefined;
  }
  return workflow.steps[stepIndex];
}

/**
 * Create initial workflow state
 */
export function createWorkflowState(workflowId: string): WorkflowState | null {
  const workflow = DESIGN_WORKFLOWS[workflowId];
  if (!workflow) return null;

  return {
    workflowId,
    workflowType: workflow.name,
    currentStepIndex: 0,
    completedSteps: [],
    skippedSteps: [],
    stepNotes: {},
    startedAt: new Date().toISOString(),
  };
}

/**
 * Get progress percentage
 */
export function getWorkflowProgress(state: WorkflowState): number {
  const workflow = DESIGN_WORKFLOWS[state.workflowId];
  if (!workflow) return 0;

  const totalSteps = workflow.steps.length;
  const completedCount = state.completedSteps.length + state.skippedSteps.length;

  return Math.round((completedCount / totalSteps) * 100);
}

/**
 * Format workflow status for display
 */
export function formatWorkflowStatus(state: WorkflowState): string {
  const workflow = DESIGN_WORKFLOWS[state.workflowId];
  if (!workflow) return 'Unknown workflow';

  const currentStep = workflow.steps[state.currentStepIndex];
  const progress = getWorkflowProgress(state);

  return `**${workflow.name}** - ${progress}% complete
Current step: ${currentStep?.name || 'Complete'}
Completed: ${state.completedSteps.length}/${workflow.steps.length} steps`;
}
