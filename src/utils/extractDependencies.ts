/**
 * Extract npm package dependencies from generated code files.
 *
 * Scans import/require statements to determine which third-party
 * packages the generated code needs, then returns a version map
 * suitable for Sandpack's `customSetup.dependencies` or package.json.
 *
 * Uses curated pinned versions when available, falls back to 'latest'.
 */

import { CURATED_VERSIONS } from '@/config/curated-versions';
import type { AppFile } from '@/types/railway';

/**
 * Packages already provided by Sandpack's react-ts template.
 * These should never appear in the extracted dependency map.
 */
const TEMPLATE_BUILTINS = new Set([
  'react',
  'react-dom',
  'react/jsx-runtime',
]);

/**
 * Three separate regexes to avoid cross-line matching bugs.
 *
 * A single combined regex with [\s\S]*? can accidentally match
 * across multiple import statements (e.g. consuming a bare
 * `import 'pkg'` while looking for a `from` on a later line).
 *
 * Splitting into three simple patterns prevents this:
 */

/** Matches `from 'pkg'` — covers `import X from 'pkg'` and multiline imports */
const FROM_REGEX = /\bfrom\s+['"]([^'"./][^'"]*)['"]/g;

/** Matches bare side-effect imports: `import 'pkg'` (no `from` keyword) */
const BARE_IMPORT_REGEX = /^\s*import\s+['"]([^'"./][^'"]*)['"]/gm;

/** Matches CommonJS: `require('pkg')` */
const REQUIRE_REGEX = /require\s*\(\s*['"]([^'"./][^'"]*)['"]\s*\)/g;

/** Matches dynamic imports: `import('pkg')` or `await import('pkg')` */
const DYNAMIC_IMPORT_REGEX = /\bimport\s*\(\s*['"]([^'"./][^'"]*)['"]\s*\)/g;

/**
 * Extract the npm package name from an import specifier.
 *
 * Handles scoped packages: `@react-three/fiber/foo` → `@react-three/fiber`
 * Handles regular packages: `three/src/math` → `three`
 */
function toPackageName(specifier: string): string {
  if (specifier.startsWith('@')) {
    const parts = specifier.split('/');
    return parts.slice(0, 2).join('/');
  }
  return specifier.split('/')[0];
}

/**
 * Scan generated AppFile[] for third-party npm dependencies.
 *
 * @returns Record<packageName, version> — version is pinned from
 *          CURATED_VERSIONS when available, otherwise 'latest'.
 */
export function extractDependencies(
  files: AppFile[]
): Record<string, string> {
  const packages = new Set<string>();

  for (const file of files) {
    const content = file.content;
    for (const match of content.matchAll(FROM_REGEX)) {
      packages.add(toPackageName(match[1]));
    }
    for (const match of content.matchAll(BARE_IMPORT_REGEX)) {
      packages.add(toPackageName(match[1]));
    }
    for (const match of content.matchAll(REQUIRE_REGEX)) {
      packages.add(toPackageName(match[1]));
    }
    for (const match of content.matchAll(DYNAMIC_IMPORT_REGEX)) {
      packages.add(toPackageName(match[1]));
    }
  }

  const result: Record<string, string> = {};
  for (const pkg of packages) {
    if (!TEMPLATE_BUILTINS.has(pkg)) {
      result[pkg] =
        (CURATED_VERSIONS as Record<string, string>)[pkg] ?? 'latest';
    }
  }
  return result;
}
