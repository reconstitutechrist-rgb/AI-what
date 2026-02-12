/**
 * Blueprint Planner Service
 *
 * Gemini 3 Pro agent that takes the FULL concept (every word) + Tech Dossier
 * and produces verified, phased build instructions.
 *
 * Two internal steps:
 *   1. PLAN — Decompose concept + tech into ordered phases
 *   2. SELF-REVIEW — Compare phases against original concept, fix gaps
 *
 * Called AFTER the Router (for CREATE/EDIT mode), BEFORE the Builder.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiApiKey, GEMINI_PRO_MODEL } from '@/services/titanPipeline/config';
import { withGeminiRetry } from '@/utils/geminiRetry';
import type { BlueprintPlan, BlueprintPhase, TechDossier } from '@/types/titanPipeline';

// ============================================================================
// PROMPTS
// ============================================================================

const PLAN_PROMPT = `### Role
You are the **Blueprint Planner** — a meticulous project planner for web applications.

### Input
You receive:
1. **FULL CONCEPT** — The complete, unabridged product concept. EVERY word matters.
2. **TECH DOSSIER** — Researched technology recommendations (may be empty).

### Task
Decompose the ENTIRE concept into ordered **build phases**. You must account for:
- Every feature mentioned in the concept
- Every user interaction described
- Every design element, animation, or visual described
- Every page, screen, or section mentioned
- Every edge case or behavior described

### Rules
1. **Nothing gets dropped.** If the concept mentions it, it MUST appear in a phase.
2. **Order by dependency.** Phase 1 should be the foundation (layout, navigation). Later phases build on earlier ones.
3. **Be specific.** List exact component names, interactions, and tech for each phase.
4. **Use the tech dossier.** If the dossier recommends a library/model, reference it in the relevant phase.
5. **Max 5 phases.** Combine related features to keep phases manageable.

### Output Format
Return ONLY valid JSON matching this schema (no markdown fences, no extra text):
{
  "phases": [
    {
      "name": "Phase Name",
      "priority": 1,
      "features": ["Feature A from concept", "Feature B from concept"],
      "components": ["ComponentName", "AnotherComponent"],
      "interactions": ["Click to toggle", "Drag to reorder"],
      "techNotes": ["Use framer-motion for animations", "Use Zustand for state"]
    }
  ],
  "techStack": ["react", "framer-motion", "zustand"],
  "totalEstimatedComplexity": "medium"
}`;

const REVIEW_PROMPT = `### Role
You are a **Coverage Auditor**. You verify that a build plan covers EVERY requirement from a concept.

### Task
Compare the BUILD PLAN against the ORIGINAL CONCEPT word by word.

For each item in the concept, check:
- Is this feature assigned to a phase? Which one?
- Is this interaction covered? Which phase?
- Is this design element included? Which phase?
- Is this page/screen accounted for? Which phase?

### Output Format
Return ONLY valid JSON (no markdown fences, no extra text):
{
  "coverageReport": "All 12 features covered across 4 phases. User flow from onboarding to dashboard fully mapped.",
  "missedItems": ["Feature X from concept not found in any phase", "Animation Y described but not assigned"],
  "patchedPhases": [
    // ONLY include phases that need changes (adding missed items)
    // Use the same format as the original phases
    {
      "name": "Existing Phase Name",
      "priority": 2,
      "features": ["...original features...", "NEW: Feature X that was missed"],
      "components": ["...original components...", "NewComponentForX"],
      "interactions": ["...original interactions..."],
      "techNotes": ["...original techNotes..."]
    }
  ]
}

If nothing is missed, return:
{
  "coverageReport": "Complete coverage verified. All N features covered.",
  "missedItems": [],
  "patchedPhases": []
}`;

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Plan the build from the full concept + tech dossier.
 * Returns a verified BlueprintPlan with phased instructions.
 */
export async function planBlueprint(
  fullConcept: string,
  techDossier?: TechDossier
): Promise<BlueprintPlan> {
  const apiKey = getGeminiApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_PRO_MODEL,
    generationConfig: {
      temperature: 0.3, // Low temp for structured planning
      responseMimeType: 'application/json',
    },
  });

  // Build tech context
  const techContext = techDossier
    ? `\n\n### TECH DOSSIER (use these recommendations)\n` +
      `**AI Models:** ${techDossier.aiModels.map((m) => `${m.name} (${m.recommendation})`).join(', ') || 'None'}\n` +
      `**Frameworks:** ${techDossier.frameworks.map((f) => `${f.name}${f.latestVersion ? ` v${f.latestVersion}` : ''} (${f.recommendation})`).join(', ') || 'None'}\n` +
      `**Emerging:** ${techDossier.emergingCapabilities.join(', ') || 'None'}\n` +
      `**Warnings:** ${techDossier.deprecationWarnings.join(', ') || 'None'}`
    : '';

  // =========================================================================
  // STEP 1: PLAN
  // =========================================================================
  console.log('[BlueprintPlanner] Step 1: Planning build phases...');
  const planStart = Date.now();

  const planResult = await withGeminiRetry(() =>
    model.generateContent(
      `${PLAN_PROMPT}${techContext}\n\n### FULL CONCEPT (every word matters — do NOT skip anything)\n${fullConcept}`
    )
  );

  let rawPlan: { phases: BlueprintPhase[]; techStack: string[]; totalEstimatedComplexity: string };
  try {
    rawPlan = JSON.parse(planResult.response.text());
  } catch (e) {
    console.error('[BlueprintPlanner] Failed to parse plan JSON:', e);
    console.error('[BlueprintPlanner] Raw:', planResult.response.text().slice(0, 500));
    // Return a fallback single-phase plan
    return {
      phases: [
        {
          name: 'Full Build',
          priority: 1,
          features: ['All features from concept'],
          components: ['App'],
          interactions: [],
          techNotes: [],
        },
      ],
      techStack: techDossier?.frameworks.map((f) => f.name) || [],
      coverageReport: 'Fallback: plan parsing failed, using single-phase build.',
      missedItems: [],
      totalEstimatedComplexity: 'medium',
    };
  }

  console.log(
    `[BlueprintPlanner] Step 1 complete in ${Date.now() - planStart}ms — ` +
      `${rawPlan.phases.length} phases, ${rawPlan.phases.reduce((sum, p) => sum + p.features.length, 0)} features`
  );

  // =========================================================================
  // STEP 2: SELF-REVIEW
  // =========================================================================
  console.log('[BlueprintPlanner] Step 2: Self-reviewing against original concept...');
  const reviewStart = Date.now();

  const reviewResult = await withGeminiRetry(() =>
    model.generateContent(
      `${REVIEW_PROMPT}\n\n### ORIGINAL CONCEPT\n${fullConcept}\n\n### BUILD PLAN TO VERIFY\n${JSON.stringify(rawPlan, null, 2)}`
    )
  );

  let review: { coverageReport: string; missedItems: string[]; patchedPhases: BlueprintPhase[] };
  try {
    review = JSON.parse(reviewResult.response.text());
  } catch (e) {
    console.warn('[BlueprintPlanner] Self-review parse failed, using unreviewed plan:', e);
    review = {
      coverageReport: 'Self-review parsing failed. Plan may have gaps.',
      missedItems: [],
      patchedPhases: [],
    };
  }

  // Apply patches from self-review
  let finalPhases = [...rawPlan.phases];
  if (review.patchedPhases.length > 0) {
    for (const patch of review.patchedPhases) {
      const idx = finalPhases.findIndex((p) => p.name === patch.name);
      if (idx >= 0) {
        finalPhases[idx] = patch;
      } else {
        // New phase from review — append it
        finalPhases.push(patch);
      }
    }
    console.log(
      `[BlueprintPlanner] Step 2: Patched ${review.patchedPhases.length} phases, ` +
        `${review.missedItems.length} initially missed items recovered`
    );
  } else {
    console.log('[BlueprintPlanner] Step 2: Complete coverage verified, no patches needed');
  }

  console.log(`[BlueprintPlanner] Self-review complete in ${Date.now() - reviewStart}ms`);
  console.log(`[BlueprintPlanner] Coverage: ${review.coverageReport}`);

  const blueprint: BlueprintPlan = {
    phases: finalPhases.sort((a, b) => a.priority - b.priority),
    techStack: rawPlan.techStack || [],
    coverageReport: review.coverageReport,
    missedItems: review.missedItems || [],
    totalEstimatedComplexity:
      (rawPlan.totalEstimatedComplexity as BlueprintPlan['totalEstimatedComplexity']) || 'medium',
  };

  console.log(
    `[BlueprintPlanner] Final blueprint: ${blueprint.phases.length} phases, ` +
      `${blueprint.phases.reduce((sum, p) => sum + p.features.length, 0)} total features, ` +
      `complexity: ${blueprint.totalEstimatedComplexity}`
  );

  return blueprint;
}

// ============================================================================
// SERIALIZER (for injecting into Builder prompt)
// ============================================================================

/**
 * Serialize a BlueprintPlan into a human-readable string for the Builder prompt.
 */
export function serializeBlueprintForPrompt(plan: BlueprintPlan): string {
  const lines: string[] = [
    `## BUILD BLUEPRINT (${plan.phases.length} phases, complexity: ${plan.totalEstimatedComplexity})`,
    `Tech Stack: ${plan.techStack.join(', ')}`,
    `Coverage: ${plan.coverageReport}`,
    '',
  ];

  for (const phase of plan.phases) {
    lines.push(`### Phase ${phase.priority}: ${phase.name}`);
    lines.push(`**Features:** ${phase.features.join(' | ')}`);
    lines.push(`**Components:** ${phase.components.join(', ')}`);
    if (phase.interactions.length > 0) {
      lines.push(`**Interactions:** ${phase.interactions.join(' | ')}`);
    }
    if (phase.techNotes.length > 0) {
      lines.push(`**Tech:** ${phase.techNotes.join(' | ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: { planBlueprint: typeof planBlueprint } | null = null;

export function getBlueprintPlannerService() {
  if (!_instance) {
    _instance = { planBlueprint };
  }
  return _instance;
}
