/**
 * Dependency Graph Service
 *
 * Scans all loaded files for import statements and builds a directed
 * dependency graph. Used by Dream Mode to:
 *
 * 1. Impact Analysis — When a file is patched, identify all files that
 *    import it (directly or transitively) and need re-testing.
 * 2. Feature Discovery — Identify orphaned/disconnected files that are
 *    never imported from any entry point.
 * 3. Crash Diagnosis — Trace error origins through the import chain.
 *
 * Handles: ES module imports, CommonJS require, @/ alias paths,
 * relative paths, and npm package imports.
 */

import type { AppFile } from '@/types/railway';
import type { DependencyNode, DependencyGraph } from '@/types/dream';

// ============================================================================
// IMPORT PARSING
// ============================================================================

/**
 * Regex patterns for extracting import sources from TypeScript/JavaScript files.
 *
 * Matches:
 *   import X from 'path'
 *   import { X } from 'path'
 *   import * as X from 'path'
 *   import 'path'
 *   import type { X } from 'path'
 *   const X = require('path')
 *   export { X } from 'path'
 *   export * from 'path'
 */
const IMPORT_PATTERNS = [
  // ES module imports: import ... from 'path'
  /import\s+(?:type\s+)?(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+))?\s+from\s+)?['"]([^'"]+)['"]/g,
  // CommonJS require: require('path')
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  // Re-exports: export { ... } from 'path' / export * from 'path'
  /export\s+(?:type\s+)?(?:\{[^}]*\}|\*)\s+from\s+['"]([^'"]+)['"]/g,
];

/** File extensions to try when resolving import paths */
const RESOLVE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json'];

/** Index file names to try when resolving directory imports */
const INDEX_FILES = ['index.ts', 'index.tsx', 'index.js', 'index.jsx'];

// ============================================================================
// SERVICE
// ============================================================================

class DependencyGraphServiceInstance {
  /**
   * Build a dependency graph from a set of files.
   *
   * @param files - All project files (from RepoLoader or WebContainer)
   * @returns A DependencyGraph with forward and reverse edges
   */
  buildGraph(files: AppFile[]): DependencyGraph {
    // Build a set of known file paths for resolution
    const knownPaths = new Set(files.map((f) => f.path));

    // Initialize nodes for all files
    const nodes = new Map<string, DependencyNode>();
    for (const file of files) {
      nodes.set(file.path, {
        file: file.path,
        imports: [],
        importedBy: [],
      });
    }

    // Parse imports for each file and build edges
    for (const file of files) {
      if (!this.isCodeFile(file.path)) continue;

      const importSources = this.extractImports(file.content);
      const node = nodes.get(file.path)!;

      for (const source of importSources) {
        // Resolve the import source to an actual file path
        const resolved = this.resolveImport(source, file.path, knownPaths);
        if (!resolved) continue; // External npm package or unresolvable

        node.imports.push(resolved);

        // Add reverse edge
        const targetNode = nodes.get(resolved);
        if (targetNode) {
          targetNode.importedBy.push(file.path);
        }
      }
    }

    // Build the graph object with getImpacted method
    const graph: DependencyGraph = {
      nodes,
      getImpacted: (changedFile: string) =>
        this.getImpactedFiles(nodes, changedFile),
    };

    return graph;
  }

  /**
   * Get all files impacted by a change to a given file.
   * Uses BFS to traverse reverse edges (importedBy) transitively.
   *
   * @returns Array of file paths that depend on the changed file
   */
  getImpactedFiles(
    nodes: Map<string, DependencyNode>,
    changedFile: string
  ): string[] {
    const visited = new Set<string>();
    const queue: string[] = [changedFile];
    const impacted: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const node = nodes.get(current);
      if (!node) continue;

      for (const dependent of node.importedBy) {
        if (!visited.has(dependent)) {
          impacted.push(dependent);
          queue.push(dependent);
        }
      }
    }

    return impacted;
  }

  /**
   * Find all files reachable from a set of entry points.
   * Uses BFS forward traversal (imports).
   *
   * @returns Set of file paths reachable from entry points
   */
  getReachableFiles(
    graph: DependencyGraph,
    entryPoints: string[]
  ): Set<string> {
    const visited = new Set<string>();
    const queue = [...entryPoints];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const node = graph.nodes.get(current);
      if (!node) continue;

      for (const imported of node.imports) {
        if (!visited.has(imported)) {
          queue.push(imported);
        }
      }
    }

    return visited;
  }

  /**
   * Find entry points in a file set.
   * Entry points are files that are never imported by anything.
   * Also includes known Next.js entry patterns.
   */
  findEntryPoints(files: AppFile[]): string[] {
    const entryPatterns = [
      /\/page\.tsx?$/,
      /\/layout\.tsx?$/,
      /\/route\.ts$/,
      /\/middleware\.ts$/,
      /\/App\.tsx?$/,
      /\/main\.tsx?$/,
      /\/index\.tsx?$/,
    ];

    return files
      .filter((f) => entryPatterns.some((p) => p.test(f.path)))
      .map((f) => f.path);
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  /**
   * Extract all import source strings from a file's content.
   */
  private extractImports(content: string): string[] {
    const sources: string[] = [];

    for (const pattern of IMPORT_PATTERNS) {
      // Reset regex state (global flag)
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1]) {
          sources.push(match[1]);
        }
      }
    }

    // Deduplicate
    return [...new Set(sources)];
  }

  /**
   * Resolve an import source to an actual file path in the project.
   * Returns null for npm packages (non-relative, non-alias imports).
   */
  private resolveImport(
    source: string,
    fromFile: string,
    knownPaths: Set<string>
  ): string | null {
    // Skip npm packages (no ./ or ../ or @/ prefix)
    if (!source.startsWith('.') && !source.startsWith('@/')) {
      return null;
    }

    let targetPath: string;

    if (source.startsWith('@/')) {
      // @/ alias → /src/
      targetPath = '/src/' + source.slice(2);
    } else {
      // Relative import — resolve from the importing file's directory
      const fromDir = fromFile.substring(0, fromFile.lastIndexOf('/'));
      targetPath = this.resolvePath(fromDir, source);
    }

    // Try exact match first
    if (knownPaths.has(targetPath)) return targetPath;

    // Try adding extensions
    for (const ext of RESOLVE_EXTENSIONS) {
      const withExt = targetPath + ext;
      if (knownPaths.has(withExt)) return withExt;
    }

    // Try as directory with index file
    for (const indexFile of INDEX_FILES) {
      const withIndex = targetPath + '/' + indexFile;
      if (knownPaths.has(withIndex)) return withIndex;
    }

    return null;
  }

  /**
   * Resolve a relative path against a base directory.
   * Handles .. and . segments.
   */
  private resolvePath(baseDir: string, relativePath: string): string {
    const baseParts = baseDir.split('/').filter(Boolean);
    const relParts = relativePath.split('/').filter(Boolean);

    const result = [...baseParts];

    for (const part of relParts) {
      if (part === '..') {
        result.pop();
      } else if (part !== '.') {
        result.push(part);
      }
    }

    return '/' + result.join('/');
  }

  /**
   * Check if a file is a code file that should be parsed for imports.
   */
  private isCodeFile(path: string): boolean {
    return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(path);
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: DependencyGraphServiceInstance | null = null;

export function getDependencyGraphService(): DependencyGraphServiceInstance {
  if (!_instance) {
    _instance = new DependencyGraphServiceInstance();
  }
  return _instance;
}

export type { DependencyGraphServiceInstance };
