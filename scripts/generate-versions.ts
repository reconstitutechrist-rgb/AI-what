#!/usr/bin/env tsx
/**
 * Build-time version generator
 * Reads package.json + curated versions and generates typed version config
 *
 * Run: npx tsx scripts/generate-versions.ts
 * Auto-runs: prebuild hook
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const CURATED_PATH = path.join(ROOT, 'src/config/curated-versions.ts');
const OUTPUT_PATH = path.join(ROOT, 'src/config/versions.generated.ts');

interface PackageJson {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

function extractVersion(version: string): string {
  // Handle workspace:*, file:, link:, etc.
  if (
    version.startsWith('workspace:') ||
    version.startsWith('file:') ||
    version.startsWith('link:')
  ) {
    return 'latest';
  }
  return version;
}

function parseCuratedVersions(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract the CURATED_VERSIONS object using regex
  // Use [\s\S] instead of . with 's' flag for cross-line matching
  const match = content.match(/export const CURATED_VERSIONS\s*=\s*\{([\s\S]*?)\}\s*as\s*const/);
  if (!match) {
    console.warn('Warning: Could not parse CURATED_VERSIONS, using empty object');
    return {};
  }

  const objectContent = match[1];
  const versions: Record<string, string> = {};

  // Match key-value pairs like: 'package-name': '^1.0.0', or packageName: '^1.0.0',
  const pairRegex = /['"]?([^'":,\s]+)['"]?\s*:\s*['"]([^'"]+)['"]/g;
  let pairMatch;

  while ((pairMatch = pairRegex.exec(objectContent)) !== null) {
    const [, key, value] = pairMatch;
    versions[key] = value;
  }

  return versions;
}

async function main() {
  console.log('Generating version configuration...');

  // 1. Read package.json
  const pkgJson: PackageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));

  // 2. Extract relevant versions from project
  const projectVersions: Record<string, string> = {
    // Core framework
    react: extractVersion(pkgJson.dependencies.react || '^19.0.0'),
    'react-dom': extractVersion(pkgJson.dependencies['react-dom'] || '^19.0.0'),
    next: extractVersion(pkgJson.dependencies.next || '^15.0.0'),

    // TypeScript
    typescript: extractVersion(pkgJson.devDependencies.typescript || '^5.0.0'),

    // Styling
    tailwindcss: extractVersion(pkgJson.devDependencies.tailwindcss || '^3.4.0'),
    autoprefixer: extractVersion(pkgJson.devDependencies.autoprefixer || '^10.4.0'),
    postcss: extractVersion(pkgJson.devDependencies.postcss || '^8.4.0'),

    // Validation
    zod: extractVersion(pkgJson.dependencies.zod || '^3.23.0'),

    // State management
    zustand: extractVersion(pkgJson.dependencies.zustand || '^4.5.0'),
    immer: extractVersion(pkgJson.dependencies.immer || '^10.0.0'),
  };

  // 3. Parse curated versions from file
  const curatedVersions = parseCuratedVersions(CURATED_PATH);

  // 4. Merge with project versions taking precedence
  const allVersions = { ...curatedVersions, ...projectVersions };

  // 5. Generate the output file
  const generatedDate = new Date().toISOString();

  const output = `/**
 * AUTO-GENERATED - DO NOT EDIT
 * Generated: ${generatedDate}
 * Source: package.json + curated-versions.ts
 *
 * Run 'npm run generate:versions' to regenerate
 */

// Project versions (from package.json)
export const PROJECT_VERSIONS = ${JSON.stringify(projectVersions, null, 2)} as const;

// Curated versions (for generated apps)
export const CURATED_VERSIONS = ${JSON.stringify(curatedVersions, null, 2)} as const;

// Combined versions (project takes precedence)
export const VERSIONS = ${JSON.stringify(allVersions, null, 2)} as const;

// Type-safe version getter
export type VersionedPackage = keyof typeof VERSIONS;

export function getVersion(pkg: VersionedPackage): string {
  return VERSIONS[pkg];
}

// Version instructions for AI prompts
export const VERSION_INSTRUCTIONS = \`
## DEPENDENCY VERSIONS
Use these EXACT versions in the ===DEPENDENCIES=== section:

**Core Framework:**
- react: \${VERSIONS.react}
- react-dom: \${VERSIONS['react-dom']}
- next: \${VERSIONS.next}
- typescript: \${VERSIONS.typescript}

**Styling:**
- tailwindcss: \${VERSIONS.tailwindcss}
- autoprefixer: \${VERSIONS.autoprefixer}
- postcss: \${VERSIONS.postcss}

**Database & Auth (if needed):**
- prisma: \${VERSIONS.prisma}
- @prisma/client: \${VERSIONS['@prisma/client']}
- next-auth: \${VERSIONS['next-auth']}

**Validation & State:**
- zod: \${VERSIONS.zod}
- zustand: \${VERSIONS.zustand}

**UI Components (if needed):**
- lucide-react: \${VERSIONS['lucide-react']}
- @radix-ui/react-dialog: \${VERSIONS['@radix-ui/react-dialog']}
- class-variance-authority: \${VERSIONS['class-variance-authority']}
- clsx: \${VERSIONS.clsx}
- tailwind-merge: \${VERSIONS['tailwind-merge']}

IMPORTANT: Always use these current versions. Never use outdated versions like react ^18.x or next ^14.x.
\`.trim();
`;

  // 6. Write output
  fs.writeFileSync(OUTPUT_PATH, output, 'utf-8');
  console.log(`Generated ${OUTPUT_PATH}`);
  console.log(`  - ${Object.keys(projectVersions).length} project versions`);
  console.log(`  - ${Object.keys(curatedVersions).length} curated versions`);
  console.log(`  - ${Object.keys(allVersions).length} total versions`);
}

main().catch(console.error);
