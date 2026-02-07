/**
 * Zod Validation Schemas for API Routes
 *
 * Runtime validation for incoming request bodies.
 * Replaces unsafe `as Type` assertions with `.parse()`.
 */

import { z } from 'zod';

// ============================================================================
// PIPELINE
// ============================================================================

const FileInputSchema = z.object({
  base64: z.string().default(''),
  mimeType: z.string().default('image/png'),
  filename: z.string()
    .max(255)
    .refine((name) => !name.includes('..'), { message: 'Path traversal not allowed' })
    .default('unnamed'),
});

export const PipelineRequestSchema = z.object({
  action: z.string().optional(),
  // Live-edit fields
  currentCode: z.string().optional().nullable(),
  selectedDataId: z.string().optional(),
  instruction: z.string().optional(),
  // Full pipeline fields
  files: z.array(FileInputSchema).max(50, 'Maximum 50 files allowed').optional(),
  instructions: z.string().optional(),
  appContext: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// CHAT
// ============================================================================

const ConversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const ChatRequestSchema = z.object({
  message: z.string().min(1, 'message is required'),
  conversationHistory: z.array(ConversationMessageSchema).optional().default([]),
  currentCode: z.string().optional().nullable(),
  appContext: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// REPAIR
// ============================================================================

const AppFileSchema = z.object({
  path: z.string(),
  content: z.string(),
});

const SandboxErrorSchema = z.object({
  type: z.enum(['syntax', 'import', 'runtime', 'build', 'unknown']),
  message: z.string(),
  file: z.string().optional(),
  line: z.number().optional(),
  column: z.number().optional(),
  raw: z.string().optional(),
});

export const RepairRequestSchema = z.object({
  files: z.array(AppFileSchema).min(1, 'files array is required'),
  errors: z.array(SandboxErrorSchema).min(1, 'errors array is required'),
  originalInstructions: z.string().default(''),
  attempt: z.number().int().min(1).default(1),
});

// ============================================================================
// CRITIQUE
// ============================================================================

export const CritiqueRequestSchema = z.object({
  files: z.array(AppFileSchema).min(1, 'files array is required'),
  originalInstructions: z.string().min(1, 'originalInstructions is required'),
  appContext: z.record(z.string(), z.unknown()).optional(),
  is3D: z.boolean().optional(),
});

// ============================================================================
// SCREENSHOT
// ============================================================================

const ViewportSchema = z.object({
  width: z.number().int().min(100).max(3840).default(1280),
  height: z.number().int().min(100).max(2160).default(800),
});

export const ScreenshotRequestSchema = z.object({
  html: z.string().optional(),
  css: z.string().optional(),
  files: z.array(AppFileSchema).optional(),
  viewport: ViewportSchema.optional().default({ width: 1280, height: 800 }),
});

// ============================================================================
// AUTONOMY FEEDBACK
// ============================================================================

export const AutonomyFeedbackRequestSchema = z.object({
  feedback: z.object({
    commandId: z.string(),
    output: z.string(),
    exitCode: z.number(),
    screenshot: z.string().optional(),
  }),
  suspendedState: z.object({
    swarm: z.record(z.string(), z.unknown()),
    command: z.record(z.string(), z.unknown()).optional(),
    memory: z.record(z.string(), z.unknown()).optional(),
    globalFiles: z.record(z.string(), z.unknown()).optional(),
  }),
});

// ============================================================================
// SKILLS
// ============================================================================

const SkillFileSchema = z.object({
  path: z.string(),
  content: z.string(),
});

export const SkillSaveRequestSchema = z.object({
  goalDescription: z.string().min(1, 'goalDescription is required'),
  reasoningSummary: z.string().min(1, 'reasoningSummary is required'),
  solutionCode: z.string().min(1, 'solutionCode is required'),
  tags: z.array(z.string()).optional(),
  solutionFiles: z.array(SkillFileSchema).optional().default([]),
  qualityScore: z.number().optional(),
});

export const UpdateQualityRequestSchema = z.object({
  skillId: z.string().min(1, 'skillId is required'),
  qualityScore: z.number().min(1).max(10, 'qualityScore must be between 1 and 10'),
});
