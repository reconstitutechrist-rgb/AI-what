import type { LayoutManifest, UISpecNode } from '@/types/schema';

export interface DesignCritique {
  score: number;
  issues: string[];
  suggestions: string[];
  spatialFidelity?: number; // 0-100 score for hybrid layout support
}

/**
 * Analyze LayoutManifest for design quality
 */
export function critiqueDesign(manifest: LayoutManifest): DesignCritique {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const colors = manifest.designSystem?.colors;
  const fonts = manifest.designSystem?.fonts;

  // Rule 1: Check contrast (heuristic)
  if (colors?.background === colors?.text) {
    issues.push('Text color matches background color (low contrast).');
    score -= 20;
  }

  // Rule 2: Check typography
  if (!fonts?.heading || !fonts?.body) {
    suggestions.push('Define heading and body fonts for consistency.');
    score -= 5;
  }

  // Rule 3: Missing colors
  if (!colors?.primary) {
    suggestions.push('Define a primary color for the design system.');
    score -= 5;
  }

  // Rule 4: Spatial fidelity check for hybrid layout support
  const spatialFidelity = critiqueSpatialFidelity(manifest.root, issues);
  if (spatialFidelity < 50) {
    suggestions.push(
      'Add layout.bounds to major containers for pixel-perfect "Strict Mode" rendering.'
    );
    score -= 10;
  } else if (spatialFidelity < 80) {
    suggestions.push(
      'Some containers missing layout.bounds - consider adding for better layout precision.'
    );
    score -= 5;
  }

  return { score, issues, suggestions, spatialFidelity };
}

/**
 * Check spatial fidelity - how well the manifest supports hybrid layout mode
 * Returns a score from 0-100 indicating coverage of layout.bounds
 */
function critiqueSpatialFidelity(node: UISpecNode | undefined, issues: string[]): number {
  if (!node) return 0;

  // Structural node types that should have bounds for pixel-perfect mode
  const structuralTypes = ['container', 'header', 'footer', 'nav', 'section', 'article', 'main'];
  const importantSemanticTags = ['header', 'hero', 'footer', 'nav', 'main', 'sidebar'];

  let totalStructuralNodes = 0;
  let nodesWithBounds = 0;
  const missingBoundsNodes: string[] = [];

  function traverse(n: UISpecNode): void {
    const isStructural =
      structuralTypes.includes(n.type) ||
      importantSemanticTags.some((tag) => n.semanticTag?.toLowerCase().includes(tag));

    if (isStructural) {
      totalStructuralNodes++;

      if (n.layout?.mode === 'absolute' && n.layout?.bounds) {
        nodesWithBounds++;
      } else {
        missingBoundsNodes.push(`${n.semanticTag || n.type} (${n.id})`);
      }
    }

    // Recursively check children
    if (n.children && Array.isArray(n.children)) {
      n.children.forEach(traverse);
    }
  }

  traverse(node);

  // Log warnings for major missing bounds (only first 3 to avoid spam)
  if (missingBoundsNodes.length > 0 && missingBoundsNodes.length <= 5) {
    issues.push(
      `Missing layout.bounds on ${missingBoundsNodes.length} structural node(s): ${missingBoundsNodes.slice(0, 3).join(', ')}${missingBoundsNodes.length > 3 ? '...' : ''}`
    );
  } else if (missingBoundsNodes.length > 5) {
    issues.push(
      `Missing layout.bounds on ${missingBoundsNodes.length} structural nodes (Strict Mode will fall back to Flow)`
    );
  }

  // Calculate fidelity score
  if (totalStructuralNodes === 0) return 100; // No structural nodes to check
  return Math.round((nodesWithBounds / totalStructuralNodes) * 100);
}
