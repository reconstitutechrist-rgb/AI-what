/**
 * Railway Preview Types
 * Centralized types for Railway integration
 */

import { z } from 'zod';

// ============================================================================
// SHARED TYPES
// ============================================================================

/**
 * File to be deployed
 */
export interface AppFile {
  path: string;
  content: string;
}

/**
 * Deployment status states
 */
export type RailwayDeploymentStatus =
  | 'creating'
  | 'building'
  | 'deploying'
  | 'ready'
  | 'error'
  | 'cleaning_up';

/**
 * Deployment record with user ownership
 */
export interface RailwayDeployment {
  id: string;
  projectId: string;
  serviceId: string;
  userId: string; // User who owns this deployment
  status: RailwayDeploymentStatus;
  previewUrl: string | null;
  buildLogs: string[];
  createdAt: string;
}

/**
 * Event handlers for deployment lifecycle
 */
export interface RailwayEvents {
  onStatusChange?: (status: RailwayDeploymentStatus) => void;
  onBuildLog?: (log: string) => void;
  onReady?: (url: string) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

/**
 * Allowed npm package name pattern
 * - Must start with letter, @, or _
 * - Can contain letters, numbers, -, _, /, @, .
 * - No path traversal or shell characters
 */
const packageNameRegex = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i;

/**
 * Allowed version patterns
 * - Semver: ^1.0.0, ~1.0.0, 1.0.0, >=1.0.0
 * - Latest: latest, next, beta
 * - No git URLs, file paths, or shell commands
 */
const versionRegex =
  /^(\^|~|>=?|<=?|=)?[0-9]+(\.[0-9]+)*(-[a-z0-9.-]+)?(\+[a-z0-9.-]+)?$|^(latest|next|beta|alpha|canary|rc|experimental)$/i;

/**
 * Schema for a single file
 */
export const AppFileSchema = z.object({
  path: z
    .string()
    .min(1, 'File path required')
    .max(500, 'File path too long')
    .refine((p) => !p.includes('..') && !p.includes('\0'), 'Invalid file path'),
  content: z.string().max(1024 * 1024, 'File content too large (max 1MB per file)'),
});

/**
 * Schema for dependencies object
 */
export const DependenciesSchema = z
  .record(
    z.string().regex(packageNameRegex, 'Invalid package name'),
    z.string().regex(versionRegex, 'Invalid version format')
  )
  .refine((deps) => Object.keys(deps).length <= 100, 'Too many dependencies (max 100)');

/**
 * Schema for deploy request
 */
export const DeployRequestSchema = z.object({
  files: z
    .array(AppFileSchema)
    .min(1, 'At least one file required')
    .max(200, 'Too many files (max 200)'),
  dependencies: DependenciesSchema.default({}),
  appName: z
    .string()
    .min(1, 'App name required')
    .max(100, 'App name too long')
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9-_ ]*$/,
      'App name must start with letter/number and contain only letters, numbers, hyphens, underscores, and spaces'
    )
    .default('preview-app'),
});

export type DeployRequest = z.infer<typeof DeployRequestSchema>;

/**
 * Schema for service/deployment ID
 */
export const DeploymentIdSchema = z
  .string()
  .min(1, 'ID required')
  .max(100, 'ID too long')
  .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid ID format');

// ============================================================================
// PREVIEW MODE TYPE
// ============================================================================

/**
 * Preview mode - centralized type
 */
export type PreviewMode = 'sandpack' | 'railway';
