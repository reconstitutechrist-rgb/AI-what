/**
 * Version Management
 *
 * Provides type-safe access to dependency versions for:
 * 1. AI prompt injection (examples, instructions)
 * 2. Generated app package.json creation
 * 3. Version validation and consistency
 */

// Re-export generated versions
export {
  VERSIONS,
  PROJECT_VERSIONS,
  CURATED_VERSIONS,
  getVersion,
  VERSION_INSTRUCTIONS,
  type VersionedPackage,
} from './versions.generated';

// Re-export curated versions type
export type { CuratedPackage } from './curated-versions';
