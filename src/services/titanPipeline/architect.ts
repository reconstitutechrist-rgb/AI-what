/**
 * Architect Step (Step 1)
 *
 * Structure building using Claude Opus - creates component structure from manifests.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { VisualManifest, MergeStrategy, ComponentStructure } from '@/types/titanPipeline';
import { getAnthropicApiKey, CLAUDE_OPUS_MODEL } from './config';

// ============================================================================
// ARCHITECT PROMPT
// ============================================================================

const ARCHITECT_PROMPT = `### Role
You are the **Architect**. Output a clean structure.json (DOM Tree).
If 'dom_tree' is provided in manifests, RESPECT IT.
Use semantic tags. Add data-id to everything. Return JSON.`;

// ============================================================================
// ARCHITECT FUNCTION
// ============================================================================

/**
 * Build component structure from visual manifests using Claude
 */
export async function buildStructure(
  manifests: VisualManifest[],
  _strategy: MergeStrategy,
  instructions: string
): Promise<ComponentStructure> {
  const apiKey = getAnthropicApiKey();
  const anthropic = new Anthropic({ apiKey });

  const msg = await anthropic.messages.create({
    model: CLAUDE_OPUS_MODEL,
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `${ARCHITECT_PROMPT}\nInstructions: ${instructions}\nManifests: ${JSON.stringify(manifests)}`,
      },
    ],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { tree: [], layout_strategy: 'flex' };
  } catch {
    return { tree: [], layout_strategy: 'flex' };
  }
}
