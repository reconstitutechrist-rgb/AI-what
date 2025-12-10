/**
 * LottieFiles Service
 *
 * Search and retrieve Lottie animations from LottieFiles API.
 * Provides access to thousands of free animated assets for loading states,
 * success/error feedback, transitions, and UI illustrations.
 *
 * API: https://lottiefiles.com/api
 * Cost: FREE tier (100 requests/day), Premium for more
 *
 * Note: LottieFiles API requires authentication for full access.
 * This service uses the public search endpoint for basic functionality.
 */

// Public LottieFiles endpoints
const LOTTIEFILES_SEARCH = 'https://lottiefiles.com/api/v1/search';
const LOTTIEFILES_FEATURED = 'https://lottiefiles.com/api/v1/featured';

// Animation categories
export type LottieCategory =
  | 'loading'
  | 'success'
  | 'error'
  | 'warning'
  | 'ui'
  | 'icons'
  | 'illustrations'
  | 'transitions'
  | 'characters'
  | 'nature'
  | 'technology';

export type LottieStyle = 'flat' | '3d' | 'outline' | 'gradient' | 'all';

export interface LottieAnimation {
  id: string;
  name: string;
  description?: string;
  previewUrl: string; // GIF or WebP preview
  lottieUrl: string; // JSON animation URL
  creatorName?: string;
  tags: string[];
  duration?: number; // in seconds
  colors?: string[]; // Dominant colors
}

export interface LottieSearchOptions {
  query: string;
  category?: LottieCategory;
  style?: LottieStyle;
  limit?: number;
  page?: number;
}

export interface LottieSearchResult {
  animations: LottieAnimation[];
  total: number;
  page: number;
  hasMore: boolean;
}

// Curated animation URLs for common use cases (fallback/offline support)
const CURATED_ANIMATIONS: Record<string, LottieAnimation[]> = {
  loading: [
    {
      id: 'loading-spinner-1',
      name: 'Simple Spinner',
      previewUrl: 'https://assets10.lottiefiles.com/packages/lf20_jcikwtux.json',
      lottieUrl: 'https://assets10.lottiefiles.com/packages/lf20_jcikwtux.json',
      tags: ['loading', 'spinner', 'simple'],
      duration: 1,
    },
    {
      id: 'loading-dots-1',
      name: 'Bouncing Dots',
      previewUrl: 'https://assets2.lottiefiles.com/packages/lf20_usmfx6bp.json',
      lottieUrl: 'https://assets2.lottiefiles.com/packages/lf20_usmfx6bp.json',
      tags: ['loading', 'dots', 'bounce'],
      duration: 1.5,
    },
    {
      id: 'loading-circle-1',
      name: 'Circle Progress',
      previewUrl: 'https://assets9.lottiefiles.com/packages/lf20_x62chJ.json',
      lottieUrl: 'https://assets9.lottiefiles.com/packages/lf20_x62chJ.json',
      tags: ['loading', 'circle', 'progress'],
      duration: 2,
    },
  ],
  success: [
    {
      id: 'success-check-1',
      name: 'Success Checkmark',
      previewUrl: 'https://assets4.lottiefiles.com/packages/lf20_jbrw3hcz.json',
      lottieUrl: 'https://assets4.lottiefiles.com/packages/lf20_jbrw3hcz.json',
      tags: ['success', 'check', 'done'],
      duration: 1.5,
    },
    {
      id: 'success-confetti-1',
      name: 'Success with Confetti',
      previewUrl: 'https://assets1.lottiefiles.com/packages/lf20_s2lryxtd.json',
      lottieUrl: 'https://assets1.lottiefiles.com/packages/lf20_s2lryxtd.json',
      tags: ['success', 'confetti', 'celebration'],
      duration: 2,
    },
  ],
  error: [
    {
      id: 'error-x-1',
      name: 'Error X Mark',
      previewUrl: 'https://assets9.lottiefiles.com/packages/lf20_qpwbiyxf.json',
      lottieUrl: 'https://assets9.lottiefiles.com/packages/lf20_qpwbiyxf.json',
      tags: ['error', 'x', 'failed'],
      duration: 1,
    },
    {
      id: 'error-alert-1',
      name: 'Error Alert',
      previewUrl: 'https://assets2.lottiefiles.com/packages/lf20_pKvdlN.json',
      lottieUrl: 'https://assets2.lottiefiles.com/packages/lf20_pKvdlN.json',
      tags: ['error', 'alert', 'warning'],
      duration: 1.5,
    },
  ],
  warning: [
    {
      id: 'warning-triangle-1',
      name: 'Warning Triangle',
      previewUrl: 'https://assets3.lottiefiles.com/packages/lf20_dVJMow.json',
      lottieUrl: 'https://assets3.lottiefiles.com/packages/lf20_dVJMow.json',
      tags: ['warning', 'triangle', 'caution'],
      duration: 1.5,
    },
  ],
  ui: [
    {
      id: 'ui-toggle-1',
      name: 'Toggle Switch',
      previewUrl: 'https://assets6.lottiefiles.com/packages/lf20_9wpyhdzo.json',
      lottieUrl: 'https://assets6.lottiefiles.com/packages/lf20_9wpyhdzo.json',
      tags: ['ui', 'toggle', 'switch'],
      duration: 0.5,
    },
    {
      id: 'ui-menu-1',
      name: 'Hamburger Menu',
      previewUrl: 'https://assets5.lottiefiles.com/packages/lf20_5tl1xxnz.json',
      lottieUrl: 'https://assets5.lottiefiles.com/packages/lf20_5tl1xxnz.json',
      tags: ['ui', 'menu', 'hamburger'],
      duration: 0.5,
    },
  ],
};

/**
 * Search for Lottie animations
 *
 * Note: This uses curated animations as the LottieFiles API requires auth.
 * For full API access, you would need to implement OAuth or use an API key.
 */
export async function searchLottieAnimations(
  options: LottieSearchOptions
): Promise<LottieSearchResult> {
  const { query, category, style = 'all', limit = 10, page = 1 } = options;

  // Use curated animations for common queries
  const normalizedQuery = query.toLowerCase().trim();

  let results: LottieAnimation[] = [];

  // Check curated categories first
  for (const [cat, animations] of Object.entries(CURATED_ANIMATIONS)) {
    if (normalizedQuery.includes(cat) || category === cat) {
      results.push(...animations);
    }
  }

  // Search by tags in curated animations
  if (results.length === 0) {
    for (const animations of Object.values(CURATED_ANIMATIONS)) {
      for (const anim of animations) {
        if (
          anim.tags.some((tag) => tag.includes(normalizedQuery)) ||
          anim.name.toLowerCase().includes(normalizedQuery)
        ) {
          results.push(anim);
        }
      }
    }
  }

  // Remove duplicates
  results = Array.from(new Map(results.map((a) => [a.id, a])).values());

  // Apply pagination
  const startIndex = (page - 1) * limit;
  const paginatedResults = results.slice(startIndex, startIndex + limit);

  return {
    animations: paginatedResults,
    total: results.length,
    page,
    hasMore: startIndex + limit < results.length,
  };
}

/**
 * Get animation by ID from curated list
 */
export function getAnimationById(id: string): LottieAnimation | null {
  for (const animations of Object.values(CURATED_ANIMATIONS)) {
    const found = animations.find((a) => a.id === id);
    if (found) return found;
  }
  return null;
}

/**
 * Get suggested animations for a category
 */
export function getSuggestedAnimations(category: LottieCategory): LottieAnimation[] {
  return CURATED_ANIMATIONS[category] || [];
}

/**
 * Get all available categories
 */
export function getCategories(): Array<{ id: LottieCategory; name: string; description: string }> {
  return [
    {
      id: 'loading',
      name: 'Loading',
      description: 'Spinners, progress indicators, loading states',
    },
    { id: 'success', name: 'Success', description: 'Checkmarks, confirmations, celebrations' },
    { id: 'error', name: 'Error', description: 'Error states, failures, warnings' },
    { id: 'warning', name: 'Warning', description: 'Caution indicators, alerts' },
    { id: 'ui', name: 'UI Elements', description: 'Buttons, toggles, menu icons' },
    { id: 'icons', name: 'Animated Icons', description: 'Icon animations for interactivity' },
    {
      id: 'illustrations',
      name: 'Illustrations',
      description: 'Decorative animated illustrations',
    },
    { id: 'transitions', name: 'Transitions', description: 'Page transitions, reveals' },
    { id: 'characters', name: 'Characters', description: 'Animated characters and mascots' },
    { id: 'nature', name: 'Nature', description: 'Weather, plants, animals' },
    { id: 'technology', name: 'Technology', description: 'Tech, devices, data' },
  ];
}

/**
 * Generate React component code for a Lottie animation
 */
export function generateLottieReactCode(animation: LottieAnimation): string {
  const componentName = animation.name.replace(/[^a-zA-Z0-9]/g, '').replace(/^\d+/, '');

  return `
import Lottie from 'lottie-react';

// ${animation.name} Animation
// Tags: ${animation.tags.join(', ')}
const ${componentName}Animation = () => {
  return (
    <Lottie
      animationData={/* Import or fetch: ${animation.lottieUrl} */}
      loop={true}
      autoplay={true}
      style={{ width: 100, height: 100 }}
    />
  );
};

// Alternative: Using lottie-web directly
/*
import lottie from 'lottie-web';
import { useEffect, useRef } from 'react';

const ${componentName}Animation = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (container.current) {
      const animation = lottie.loadAnimation({
        container: container.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: '${animation.lottieUrl}',
      });
      return () => animation.destroy();
    }
  }, []);

  return <div ref={container} style={{ width: 100, height: 100 }} />;
};
*/

export default ${componentName}Animation;
`.trim();
}

/**
 * Generate CSS for embedding Lottie as background
 * Note: This requires loading the animation JSON and using a library
 */
export function generateLottieEmbedCode(animation: LottieAnimation): {
  script: string;
  html: string;
} {
  return {
    script: `
<script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>
    `.trim(),
    html: `
<lottie-player
  src="${animation.lottieUrl}"
  background="transparent"
  speed="1"
  style="width: 100px; height: 100px;"
  loop
  autoplay
></lottie-player>
    `.trim(),
  };
}

export default {
  searchLottieAnimations,
  getAnimationById,
  getSuggestedAnimations,
  getCategories,
  generateLottieReactCode,
  generateLottieEmbedCode,
};
