import { z } from 'zod';

// ============ SHARE TYPES ============

export interface ShareState {
  isPublic: boolean;
  previewSlug: string | null;
  previewUrl: string | null;
  previewEnabled: boolean;
}

export interface ShareResponse {
  success: boolean;
  previewUrl?: string;
  previewSlug?: string;
  error?: string;
}

// Zod Schemas
export const ShareToggleSchema = z.object({
  appId: z.string().uuid(),
});

export const PreviewSlugSchema = z.object({
  slug: z.string().min(8).max(16),
});

// ============ DEPLOYMENT TYPES (Phase 2) ============

export type DeploymentPlatform = 'vercel' | 'netlify';
export type DeploymentStatus = 'pending' | 'building' | 'ready' | 'error' | 'canceled';

export interface DeploymentResult {
  success: boolean;
  deploymentId?: string;
  url?: string;
  status?: DeploymentStatus;
  error?: string;
}

export interface VercelAccount {
  id: string;
  name: string;
  email?: string;
  connectedAt: string;
}

export interface UserIntegration {
  id: string;
  provider: DeploymentPlatform;
  accountId: string | null;
  accountName: string | null;
  connectedAt: string;
}

// Zod Schemas for Phase 2
export const DeployRequestSchema = z.object({
  appId: z.string().uuid(),
  projectName: z.string().min(1).max(100).optional(),
});

export const OAuthCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
});
