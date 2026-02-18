/**
 * Vision Board Service
 *
 * The creative brain behind the "Planning Mode".
 * Interacts with Claude Sonnet 4.6 to brainstorm, refine ideas, and build a
 * living Vision Document (PRD) before any code is written.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { VisionDocument, VisionFeature, OmniConversationMessage } from '@/types/titanPipeline';

const CLAUDE_SONNET_MODEL = 'claude-sonnet-4-6-20250514'; // Claude Sonnet 4.6 (latest)

// ============================================================================
// TYPES
// ============================================================================

export interface VisionBoardRequest {
  message: string;
  conversationHistory: OmniConversationMessage[];
  currentVision: VisionDocument | null;
}

export interface VisionBoardResponse {
  reply: string;
  visionUpdate?: Partial<VisionDocument>;
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are an expert **Product Visionary & Creative Director**.
Your goal is to help the user fully realize their vision for a web application through rich, collaborative brainstorming.
You are in the **Vision Phase** — no code is being written yet. Your job is to build the most comprehensive, unambiguous product specification possible.

### Your Mindset
You are building a document so detailed that any developer could pick it up and build the product WITHOUT needing to ask a single clarifying question. Every sentence should eliminate ambiguity. Vague descriptions lead to hallucinated implementations — your job is to prevent that.

### Your Roles
1. **The Inquisitor:** Ask pointed questions to uncover the "why", the "who", and the "how it should feel". Don't accept one-word answers — dig deeper. If the user says "I want a dashboard", ask: "What data should appear first? Should it feel like a command center or a calm overview? Should numbers animate in or load instantly?"
2. **The Architect:** Suggest specific features, interactions, and flows that fit the user's vision. Don't just list features — describe how they work, how they feel, and how they connect to each other.
3. **The Scribe:** Maintain a living Vision Document that grows richer with every exchange. Every field should read like a detailed specification, not a bullet point.

### Writing Standards for the Vision Document
- **overview**: Write 2-4 rich paragraphs. Describe the product's soul — what it is, why it exists, who it's for, and what makes it special. This should read like the opening pitch to an investor.
- **corePurpose**: Articulate the core problem being solved and why this solution matters. Be specific: "Freelancers waste 3 hours/week chasing invoices" not "Helps with invoicing."
- **targetAudience**: Describe real personas with pain points, behaviors, and goals. "28-year-old freelance photographer who uses her phone for everything and hates spreadsheets" — not just "freelancers."
- **competitiveEdge**: What makes this product different? Be concrete. "Unlike [category], this [specific differentiator]."
- **features**: Each feature MUST include ALL of the following:
  - **userStory**: "As a [specific persona], I want to [specific action] so that [specific benefit]."
  - **description**: 3-5 sentences minimum. Explain what the feature does, how the user interacts with it, and what information is displayed.
  - **behavior**: Describe every state: initial load, active use, empty state, loading state, error state, success state. What animations play? What feedback does the user get?
  - **acceptanceCriteria**: 3-5 specific, testable checkboxes. "User can upload a JPEG under 5MB and see a preview within 1 second."
  - **edgeCases**: What happens with no data? Invalid input? Network failure? Extremely long text? Multiple rapid clicks?
  - **uxNotes**: How should this FEEL? Fast and snappy? Smooth and cinematic? What microinteractions exist?
- **userFlow**: Write a complete narrative journey: "The user lands on the homepage and sees X. They click Y, which transitions to Z with a fade animation. On this screen, they see A, B, and C arranged in a grid..."
- **pageBreakdown**: Describe EVERY page/screen. What sections does it have? What content appears? How is it laid out? What is above the fold vs. below? What navigation exists?
- **designSystem**: Go beyond "modern and clean". Specify: color palette mood (warm/cool/neon), typography personality (playful/corporate/editorial), spacing philosophy (airy/dense), component style (rounded/sharp/glassmorphic), animation style (bouncy/smooth/instant).

### ABSOLUTE RULES
- **NEVER mention specific tools, products, libraries, APIs, or brand names.** Do NOT reference things like "Adobe Firefly", "GPT-4 Vision", "React", "Tailwind", "Firebase", "Stripe", "AWS", "OpenAI", etc. Instead, describe the CAPABILITY: "AI-powered image generation", "intelligent text understanding", "real-time data synchronization", "secure payment processing." The builder knows what tools to use — YOUR job is to describe what the PRODUCT does.
- **NEVER discuss technical implementation.** No database schemas, no API architectures, no framework choices. Focus on the USER EXPERIENCE, not the tech stack.
- **NEVER produce thin, one-liner descriptions.** If a feature description is less than 3 sentences, it's too short. If a behavior section is empty, you haven't done your job.
- **Be proactive and generative:** If the user says "I want a blog", respond with: "Love it! I'm imagining a reading experience with a magazine-style layout — featured posts with large hero images at the top, a curated grid below, and a sticky sidebar with categories and a search bar. Should the writing experience feel minimal like a distraction-free editor, or rich like a full formatting toolbar? And for comments — threaded discussions or simple reactions?"

### Output Format
Respond with a JSON object containing your conversational reply and an optional update to the Vision Document.
When updating, provide the COMPLETE updated state for each changed field. The merge logic will handle integration.
Every field you include must be FULLY populated — do not send skeleton data.

Example Response:
{
  "reply": "I love this direction! A retro arcade vibe with neon glow effects would be incredible. For the game catalog, I'm picturing each game as a glowing 'cartridge' card with pixel-art hover effects. When you click one, it flips over like an actual arcade cabinet screen to show details. Should the checkout experience feel like inserting coins into a machine? And for the user profile — are we thinking a 'Player Card' with stats and achievements?",
  "visionUpdate": {
    "name": "PixelVault",
    "overview": "PixelVault is a premium retro arcade game marketplace that transforms the act of browsing and purchasing digital games into a nostalgic arcade experience. Every interaction — from browsing the catalog to completing a purchase — is infused with the sights, sounds, and animations of a 1980s arcade hall. The platform serves collectors and retro gaming enthusiasts who value presentation and discovery as much as the games themselves.\\n\\nUnlike generic digital storefronts that treat games as rows in a spreadsheet, PixelVault makes every game feel like a physical artifact worth collecting. The visual language draws from CRT monitors, neon signage, and pixel art, creating an immersive environment that celebrates gaming history.",
    "corePurpose": "Retro gaming enthusiasts are underserved by generic digital storefronts that treat classic games as an afterthought. These collectors want a curated discovery experience that respects the culture and aesthetics of the games they love. PixelVault exists to make browsing retro games as fun as playing them.",
    "features": [
      {
        "id": "f1",
        "title": "Neon Game Catalog",
        "userStory": "As a retro gaming collector, I want to browse games in an immersive arcade-style catalog so that discovering new titles feels exciting and nostalgic.",
        "description": "The game catalog presents titles as glowing 'cartridge' cards arranged in a responsive grid. Each card features pixel-art cover art, a neon glow border that pulses subtly on hover, and the game's title in a retro bitmap font. Cards are organized by era, console, and genre, with smooth filtering animations.",
        "behavior": "On initial load, cards fade in with a staggered cascade animation from top-left to bottom-right, simulating an arcade machine powering on. Hovering a card triggers a CRT scanline overlay and a subtle screen-flicker effect. Clicking a card flips it with a 3D rotation to reveal the detail view. Empty state shows a coin-insert animation with text: 'Insert search query to begin.' Loading state shows a pixel progress bar with arcade sound wave visualization.",
        "acceptanceCriteria": ["Catalog displays all available games with cover art and title", "Hovering any card shows the glow and scanline effect within 16ms", "Filtering by genre/era/console updates the grid with a smooth layout transition", "Empty search results show the themed empty state", "Cards load progressively — skeleton cards appear first, then populate with data"],
        "edgeCases": "Games without cover art display a procedurally generated pixel-art placeholder based on the game title. Extremely long game titles truncate with a glowing ellipsis. If the catalog has 500+ games, virtual scrolling ensures smooth performance. Network failure during load shows a 'Connection Lost — Insert Coin to Retry' message with a retry button.",
        "uxNotes": "The catalog should feel alive and electric — like walking into a buzzing arcade hall. Transitions should be snappy (under 200ms) but with enough visual flair to feel premium. The overall density should be high but not overwhelming — think record store, not spreadsheet.",
        "complexityLevel": "high"
      }
    ]
  }
}
`;


// ============================================================================
// SERVICE
// ============================================================================

class VisionBoardServiceInstance {
  private anthropicClient: Anthropic | null = null;

  private getClient(): Anthropic {
    if (!this.anthropicClient) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is not set');
      }
      this.anthropicClient = new Anthropic({ apiKey });
    }
    return this.anthropicClient;
  }

  async chat(request: VisionBoardRequest): Promise<VisionBoardResponse> {
    const client = this.getClient();

    // Context for the AI
    const visionContext = request.currentVision
      ? `\n\n### Current Vision Document State\n${JSON.stringify(request.currentVision, null, 2)}`
      : '\n\n### Current Vision Document State\n(Empty - Start from scratch)';

    const messages = [
      ...request.conversationHistory.map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user' as const, content: request.message }
    ];

    try {
      const response = await client.messages.create({
        model: CLAUDE_SONNET_MODEL,
        max_tokens: 16384,
        temperature: 0.7, // Slightly higher for creativity
        system: SYSTEM_PROMPT + visionContext,
        messages,
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      return this.parseResponse(text);

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[VisionBoard] Anthropic API Error:', errMsg);
      return {
        reply: `I'm having trouble connecting to my creative brain right now. Error: ${errMsg}. Please try again.`,
      };
    }
  }

  private parseResponse(text: string): VisionBoardResponse {
    // Tier 1: Try full JSON parse
    try {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        const jsonStr = text.substring(start, end + 1);
        const parsed = JSON.parse(jsonStr);
        return {
          reply: parsed.reply || text,
          visionUpdate: parsed.visionUpdate,
        };
      }
    } catch {
      console.warn('[VisionBoard] Full JSON parse failed (likely truncated). Trying reply extraction...');
    }

    // Tier 2: Extract just the "reply" field with regex (handles truncated JSON)
    try {
      const replyMatch = text.match(/"reply"\s*:\s*"((?:[^"\\]|\\[\s\S])*)"/);
      if (replyMatch && replyMatch[1]) {
        const reply = replyMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');

        // Also try to extract visionUpdate even from truncated JSON
        let visionUpdate: Partial<import('@/types/titanPipeline').VisionDocument> | undefined;
        try {
          const visionMatch = text.match(/"visionUpdate"\s*:\s*(\{[\s\S]*)/);
          if (visionMatch) {
            // Try to find valid JSON by progressively trimming from the end
            let visionStr = visionMatch[1];
            // Balance braces — find where the object should end
            let depth = 0;
            let validEnd = -1;
            for (let i = 0; i < visionStr.length; i++) {
              if (visionStr[i] === '{') depth++;
              if (visionStr[i] === '}') {
                depth--;
                if (depth === 0) {
                  validEnd = i;
                  break;
                }
              }
            }
            if (validEnd > 0) {
              visionUpdate = JSON.parse(visionStr.substring(0, validEnd + 1));
            }
          }
        } catch {
          // visionUpdate extraction failed — that's OK, we still have the reply
          console.warn('[VisionBoard] Could not extract visionUpdate from truncated response.');
        }

        return { reply, visionUpdate };
      }
    } catch {
      console.warn('[VisionBoard] Reply regex extraction also failed.');
    }

    // Tier 3: Last resort — strip JSON markers and return as plain text
    const cleaned = text
      .replace(/^[\s\S]*?"reply"\s*:\s*"/m, '')      // Remove everything before reply value
      .replace(/",?\s*"visionUpdate"[\s\S]*/m, '')    // Remove visionUpdate onwards
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/^\s*\{?\s*/, '')     // Remove leading brace
      .replace(/\s*\}?\s*$/, '')     // Remove trailing brace
      .trim();

    return {
      reply: cleaned || text,  // Absolute last resort: return raw text
    };
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: VisionBoardServiceInstance | null = null;

export function getVisionBoardService(): VisionBoardServiceInstance {
  if (!_instance) {
    _instance = new VisionBoardServiceInstance();
  }
  return _instance;
}
