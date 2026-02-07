/**
 * OmniChat Service
 *
 * The AI brain behind the OmniChat interface.
 * Uses Claude Sonnet 4.5 for fast conversational responses + intent classification.
 *
 * Core philosophy: "Anything is possible. Figure it out."
 * The AI NEVER refuses a request. If it doesn't know how to do something,
 * it triggers the autonomy system to research, learn, and build it.
 *
 * Returns a structured response with:
 *   - reply: Natural language response to the user
 *   - action: What to do next (pipeline | autonomy | live-edit | none)
 *   - actionPayload: Refined instructions for the action
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  OmniChatRequest,
  OmniChatResponse,
  OmniChatAction,
  OmniConversationMessage,
  AppContext,
} from '@/types/titanPipeline';
import { getSkillLibraryService } from './SkillLibraryService';
import type { SkillMatch } from '@/types/skillLibrary';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CLAUDE_SONNET_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_CODE_PREVIEW_LINES = 200;
const MAX_HISTORY_MESSAGES = 20;

function getAnthropicApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('Anthropic API key missing');
  return key;
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

function buildSystemPrompt(currentCode: string | null, appContext?: AppContext): string {
  const codeSection = currentCode
    ? `\n\n### Current Generated Code (preview)\n\`\`\`tsx\n${truncateCode(currentCode)}\n\`\`\``
    : '\n\n### Current Generated Code\nNo code has been generated yet.';

  const contextSection = appContext?.name
    ? `\n\n### App Context\n- Name: ${appContext.name}\n- Color Scheme: ${appContext.colorScheme || 'not set'}\n- Primary Color: ${appContext.primaryColor || 'not set'}\n- Style: ${appContext.style || 'not set'}`
    : '';

  return `### Role
You are an **omnipotent creation engine** inside a virtual reality builder. ANYTHING the user asks for is possible. There are no impossible requests — only problems that haven't been solved yet.

### Core Principle
You NEVER say "I can't do that", "That's not possible", or "I don't support that."
If you don't know how to build something, you trigger autonomy mode. The autonomy system will:
1. Research the topic using Google Search
2. Fabricate specialist AI agents dynamically
3. Construct the solution from scratch
4. Self-correct if the first attempt fails

### Your Capabilities
You have access to these action modes:

1. **pipeline** — Standard generation for UI layouts, components, styling, visual design.
   Use when: creating new layouts, building UI components, generating visual elements.

2. **autonomy** — Self-teaching mode for ANYTHING unknown, complex, or novel.
   Use when: the request involves technologies, algorithms, simulations, 3D, physics,
   game engines, data structures, or ANY concept you're not 100% confident about.
   The system will research it, fabricate expert agents, and build it.

3. **live-edit** — Quick code modification for simple changes to existing code.
   Use when: small CSS changes, color tweaks, text updates, simple additions to existing code.
   Requires existing generated code.

4. **none** — Pure conversation, no code action needed.
   Use when: the user is asking questions, discussing strategy, or chatting.

### Decision Rules
- If no code exists yet AND user wants to build something standard → **pipeline**
- If no code exists yet AND user wants something novel/complex → **autonomy**
- If code exists AND user wants a small tweak → **live-edit**
- If code exists AND user wants significant changes → **pipeline**
- If request involves unknown tech, algorithms, simulations, 3D, physics → **autonomy**
- If user is just chatting or asking questions → **none**
- When in doubt between pipeline and autonomy, prefer **autonomy** (it can handle everything)
${contextSection}${codeSection}

### Output Format
You MUST respond with valid JSON only. No markdown fences, no extra text.
{
  "reply": "Your conversational response to the user",
  "action": "pipeline" | "autonomy" | "live-edit" | "none",
  "actionPayload": {
    "instructions": "Refined, detailed instructions for the action system (only if action is not 'none')",
    "selectedDataId": "data-id of selected element (only for live-edit)"
  }
}

If action is "none", omit actionPayload entirely.`;
}

// ============================================================================
// HELPERS
// ============================================================================

function truncateCode(code: string): string {
  const lines = code.split('\n');
  if (lines.length <= MAX_CODE_PREVIEW_LINES) return code;
  return lines.slice(0, MAX_CODE_PREVIEW_LINES).join('\n') + `\n// ... (${lines.length - MAX_CODE_PREVIEW_LINES} more lines)`;
}

function buildMessages(
  history: OmniConversationMessage[],
  currentMessage: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const trimmed = history.slice(-MAX_HISTORY_MESSAGES);
  return [
    ...trimmed.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: currentMessage },
  ];
}

function parseResponse(text: string): OmniChatResponse {
  // Try to parse as JSON directly
  try {
    const parsed = JSON.parse(text);
    return validateResponse(parsed);
  } catch {
    // Try extracting the first balanced JSON object from the response.
    // The previous greedy regex /\{[\s\S]*\}/ would match from the first {
    // to the LAST }, potentially capturing invalid JSON across multiple objects.
    const extracted = extractFirstJsonObject(text);
    if (extracted) {
      try {
        const parsed = JSON.parse(extracted);
        return validateResponse(parsed);
      } catch {
        // Fall through
      }
    }
    // Fallback: treat the entire response as a conversational reply
    return {
      reply: text,
      action: 'none',
    };
  }
}

/**
 * Extract the first balanced JSON object from a string.
 * Tracks brace depth to find the matching closing brace,
 * correctly handling strings (which may contain braces).
 */
function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

function validateResponse(parsed: Record<string, unknown>): OmniChatResponse {
  const validActions: OmniChatAction[] = ['pipeline', 'autonomy', 'live-edit', 'none'];
  const action = validActions.includes(parsed.action as OmniChatAction)
    ? (parsed.action as OmniChatAction)
    : 'none';

  const response: OmniChatResponse = {
    reply: typeof parsed.reply === 'string' ? parsed.reply : 'I understand. Let me work on that.',
    action,
  };

  if (action !== 'none' && parsed.actionPayload && typeof parsed.actionPayload === 'object') {
    const payload = parsed.actionPayload as Record<string, unknown>;
    response.actionPayload = {
      instructions: typeof payload.instructions === 'string' ? payload.instructions : '',
      selectedDataId: typeof payload.selectedDataId === 'string' ? payload.selectedDataId : undefined,
    };
  }

  return response;
}

// ============================================================================
// SERVICE
// ============================================================================

class OmniChatServiceInstance {
  private anthropicClient: Anthropic | null = null;

  private getClient(): Anthropic {
    if (!this.anthropicClient) {
      this.anthropicClient = new Anthropic({ apiKey: getAnthropicApiKey() });
    }
    return this.anthropicClient;
  }

  async chat(request: OmniChatRequest): Promise<OmniChatResponse> {
    const anthropic = this.getClient();

    // Query skill library for cached solutions before calling Claude
    let skillContext = '';
    let cachedSkillMatch: SkillMatch | null = null;

    try {
      cachedSkillMatch = await this.querySkillLibrary(request.message);
      if (cachedSkillMatch) {
        skillContext = this.buildSkillContext(cachedSkillMatch);
        console.log(
          `[OmniChat] Skill match found: "${cachedSkillMatch.skill.goal_description}" ` +
          `(similarity: ${cachedSkillMatch.similarity.toFixed(3)})`
        );
      }
    } catch (err) {
      // Skill library query is non-critical — proceed without it
      console.warn('[OmniChat] Skill library query failed:', err);
    }

    const systemPrompt = buildSystemPrompt(request.currentCode, request.appContext) + skillContext;
    const messages = buildMessages(request.conversationHistory, request.message);

    const msg = await anthropic.messages.create({
      model: CLAUDE_SONNET_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    const firstBlock = msg.content[0];
    const text = firstBlock && firstBlock.type === 'text' ? firstBlock.text : '';
    const response = parseResponse(text);

    // If the AI chose to use a cached skill's solution, inject skillId and increment usage
    // Only increment usage if the AI actually referenced the cached skill in its instructions
    if (cachedSkillMatch && response.action !== 'none' && response.actionPayload) {
      const usedCachedSkill = response.actionPayload.instructions?.includes(`USE_CACHED_SKILL:${cachedSkillMatch.skill.id}`);
      if (usedCachedSkill) {
        response.actionPayload.cachedSkillId = cachedSkillMatch.skill.id;
        this.incrementSkillUsage(cachedSkillMatch.skill.id).catch(() => {});
      }
    }

    return response;
  }

  /**
   * Query the skill library for a cached solution matching the user's message.
   * Returns the best match above threshold, or null.
   */
  private async querySkillLibrary(message: string): Promise<SkillMatch | null> {
    const skillLibrary = getSkillLibraryService();
    const matches = await skillLibrary.findSimilarSkills({
      query: message,
      similarityThreshold: 0.78,
      limit: 1,
      minQualityScore: 0.4,
    });

    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Build a system prompt section with cached skill context.
   * This gives Claude knowledge of the cached solution so it can
   * decide whether to reuse it or generate fresh.
   */
  private buildSkillContext(match: SkillMatch): string {
    const { skill, similarity } = match;
    const preview = skill.solution_code.slice(0, 2000);

    return `\n\n### Cached Solution (Skill Library Match)
A similar problem was solved before with ${(similarity * 100).toFixed(0)}% similarity.

**Previous Goal:** ${skill.goal_description}
**Approach:** ${skill.reasoning_summary.slice(0, 500)}
**Quality Score:** ${(skill.quality_score * 10).toFixed(1)}/10
**Times Reused:** ${skill.usage_count}

**Cached Code Preview:**
\`\`\`tsx
${preview}${skill.solution_code.length > 2000 ? '\n// ... (truncated)' : ''}
\`\`\`

If this cached solution matches the user's intent, you should use action "pipeline" and include in your instructions: "USE_CACHED_SKILL:${skill.id}" so the pipeline can reuse the validated code directly. If the user's request differs significantly, ignore this cache and generate fresh.`;
  }

  /**
   * Increment usage count for a matched skill (fire-and-forget).
   */
  private async incrementSkillUsage(skillId: string): Promise<void> {
    const skillLibrary = getSkillLibraryService();
    await skillLibrary.incrementUsage(skillId);
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: OmniChatServiceInstance | null = null;

export function getOmniChatService(): OmniChatServiceInstance {
  if (!_instance) {
    _instance = new OmniChatServiceInstance();
  }
  return _instance;
}
