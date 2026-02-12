/**
 * Tech Architecture Service — Dedicated Gemini 3 Pro Architecture Agent
 *
 * Separate from TechScout (which handles web research).
 * This service takes the TechDossier + VisionDocument and produces
 * a comprehensive architecture document with:
 *
 *   1. System architecture layers and their technologies
 *   2. Feature-to-technology mapping (every Vision Board feature)
 *   3. Key data flows with step-by-step technology labels
 *   4. Integration patterns between recommended technologies
 *
 * Uses Gemini 3 Pro (1M token context) — passes FULL, unabridged
 * TechDossier and VisionDocument. No truncation, no summarization.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { withGeminiRetry } from '@/utils/geminiRetry';
import { getGeminiApiKey, GEMINI_PRO_MODEL } from '@/services/titanPipeline/config';
import type {
  TechArchitectureDocument,
  TechDossier,
  TechRecommendation,
  VisionDocument,
  VisionFeature,
} from '@/types/titanPipeline';

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Maximum time for architecture analysis (ms) */
const ARCHITECTURE_TIMEOUT_MS = 30_000;

// ============================================================================
// PROMPT
// ============================================================================

const ARCHITECTURE_ANALYSIS_PROMPT = `### Role
You are a **System Architect** — an expert at designing scalable, production-grade software architectures. You analyze product visions and technology research to produce comprehensive architecture documents.

### Input
You receive two documents:
1. **TECH DOSSIER** — Research-backed technology recommendations from live web searches. Contains AI models, frameworks, libraries, versions, confidence levels, alternatives, emerging capabilities, and deprecation warnings.
2. **VISION DOCUMENT** — Complete product vision with features (each with user story, behavior, acceptance criteria, edge cases, UX notes), user flow, page breakdown, and design system.

### Task
Analyze BOTH documents thoroughly and produce a comprehensive architecture document. You MUST:

1. **System Architecture**:
   - Write a detailed overview paragraph describing the architectural philosophy, key patterns, and why this architecture fits the vision.
   - Define logical layers. Common layers include but are not limited to: Frontend/UI, State Management, API/Backend, Data Layer, Authentication, Real-time, AI/ML, File Storage, Analytics. Only include layers relevant to the vision.
   - For each layer:
     * \`name\`: Clear layer name
     * \`technologies\`: Specific technologies from the Tech Dossier (use exact names and versions)
     * \`responsibilities\`: What this layer handles (be specific, reference vision features)
     * \`connectsTo\`: Which other layers it communicates with

2. **Feature-Technology Mapping**:
   - Map EVERY feature from the Vision Document. Do not skip any.
   - For each feature:
     * \`featureTitle\`: Exact feature title from the vision
     * \`technologies\`: Specific technologies that implement this feature (from the dossier)
     * \`implementationApproach\`: Detailed explanation of HOW these technologies work together to produce this feature (2-4 sentences minimum)
     * \`architectureNotes\`: Integration considerations, dependencies on other features, performance notes, edge case handling

3. **Data Flows**:
   - Identify 3-6 key data flows based on the vision's user flow and features
   - Examples: user authentication, content creation, data fetching, real-time updates, file uploads, search
   - For each flow:
     * \`flowName\`: Descriptive name
     * \`steps\`: Detailed step-by-step breakdown (5-10 steps each), with the specific technology at each step
     * \`technologiesInvolved\`: All technologies in this flow

4. **Integration Patterns**:
   - Identify 3-6 key integration patterns that connect the technologies
   - Examples: State-UI binding, API communication, real-time sync, auth middleware, error handling, caching
   - For each pattern:
     * \`pattern\`: Clear pattern name
     * \`technologies\`: Technologies involved
     * \`rationale\`: Why this pattern fits (reference scalability, developer experience, or vision requirements)
     * \`example\`: Concrete code example or implementation description

### Output Schema (JSON)
{
  "systemArchitecture": {
    "overview": "Detailed architectural overview paragraph...",
    "layers": [
      {
        "name": "Frontend Layer",
        "technologies": ["React 19", "Tailwind CSS 4", "Framer Motion 11"],
        "responsibilities": ["UI rendering", "Client-side routing", "Form handling", "Animations"],
        "connectsTo": ["State Management", "API Layer"]
      }
    ]
  },
  "featureTechMap": [
    {
      "featureTitle": "Exact feature title from vision",
      "technologies": ["Tech A v1.0", "Tech B v2.0"],
      "implementationApproach": "Detailed explanation of how Tech A and Tech B work together to implement this feature. Tech A handles X while Tech B provides Y. The data flows from A through B to produce the user-facing result.",
      "architectureNotes": "Depends on Feature Z being implemented first. Consider caching for performance. Edge case: handle offline scenarios gracefully."
    }
  ],
  "dataFlows": [
    {
      "flowName": "User Authentication",
      "steps": [
        { "step": 1, "description": "User enters credentials in login form", "technology": "React 19" },
        { "step": 2, "description": "Form validation runs client-side", "technology": "Zod" },
        { "step": 3, "description": "POST request sent to auth endpoint", "technology": "Next.js API Route" },
        { "step": 4, "description": "Credentials verified against database", "technology": "Prisma + PostgreSQL" },
        { "step": 5, "description": "JWT token generated and returned", "technology": "NextAuth.js" },
        { "step": 6, "description": "Token stored in session state", "technology": "Zustand" },
        { "step": 7, "description": "UI updates to authenticated state", "technology": "React 19" }
      ],
      "technologiesInvolved": ["React 19", "Zod", "Next.js", "Prisma", "PostgreSQL", "NextAuth.js", "Zustand"]
    }
  ],
  "integrationPatterns": [
    {
      "pattern": "State-UI Integration",
      "technologies": ["Zustand 4.5", "React 19"],
      "rationale": "Centralized state management with minimal boilerplate, using selectors for performant re-renders",
      "example": "const user = useAppStore(state => state.user); // Single selector, no unnecessary re-renders"
    }
  ]
}

### CRITICAL RULES
- Return ONLY valid JSON. No markdown fences. No explanation text outside JSON.
- Map EVERY feature from the vision. Missing features = incomplete architecture.
- Use ONLY technologies from the Tech Dossier. Do not invent technologies not in the research.
- Be specific with versions: "React 19" not "React", "Zustand 4.5" not "state management".
- Data flow steps should be detailed (5-10 steps each) with the exact technology at each step.
- Implementation approaches should explain HOW technologies work together, not just list them.
- Integration patterns should include realistic code examples or detailed descriptions.
- Keep the architecture practical and production-ready — avoid over-engineering.`;

// ============================================================================
// SERVICE
// ============================================================================

export class TechArchitectureService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = getGeminiApiKey();
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Analyze vision + tech dossier to produce architecture document.
   *
   * IMPORTANT: Passes the FULL, unabridged TechDossier and VisionDocument
   * to Gemini Pro (1M context). No truncation or summarization.
   */
  async analyze(
    dossier: TechDossier,
    vision: VisionDocument
  ): Promise<TechArchitectureDocument> {
    const start = Date.now();
    console.log('[TechArchitecture] Starting architecture analysis...');
    console.log(
      `[TechArchitecture] Input: ${dossier.aiModels.length} AI models, ` +
      `${dossier.frameworks.length} frameworks, ` +
      `${vision.features?.length ?? 0} features`
    );

    try {
      const result = await Promise.race([
        this._runAnalysis(dossier, vision),
        this._timeout(),
      ]);

      const elapsed = Date.now() - start;
      console.log(
        `[TechArchitecture] Analysis complete in ${elapsed}ms. ` +
        `Layers: ${result.systemArchitecture?.layers.length ?? 0}, ` +
        `Features mapped: ${result.featureTechMap?.length ?? 0}, ` +
        `Data flows: ${result.dataFlows?.length ?? 0}, ` +
        `Patterns: ${result.integrationPatterns?.length ?? 0}`
      );

      return result;
    } catch (error) {
      console.error('[TechArchitecture] Analysis failed:', error);
      return this._emptyDocument();
    }
  }

  /**
   * Core analysis: build full-context prompt, call Gemini Pro, parse response.
   */
  private async _runAnalysis(
    dossier: TechDossier,
    vision: VisionDocument
  ): Promise<TechArchitectureDocument> {
    const model = this.genAI.getGenerativeModel({
      model: GEMINI_PRO_MODEL,
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    // Serialize FULL context — no truncation
    const dossierContext = this._serializeDossierFull(dossier);
    const visionContext = this._serializeVisionFull(vision);

    const prompt = `${ARCHITECTURE_ANALYSIS_PROMPT}\n\n### TECH DOSSIER (complete research data)\n${dossierContext}\n\n### VISION DOCUMENT (complete product vision)\n${visionContext}`;

    console.log(`[TechArchitecture] Prompt length: ${prompt.length} chars`);
    console.log('[TechArchitecture] Generating architecture with Gemini Pro...');

    const result = await withGeminiRetry(() => model.generateContent(prompt));
    const responseText = result.response.text();

    try {
      const parsed = JSON.parse(responseText);
      return this._validateAndNormalize(parsed);
    } catch (e) {
      console.error('[TechArchitecture] Failed to parse JSON response:', e);
      console.error('[TechArchitecture] Raw response (first 500 chars):', responseText.slice(0, 500));
      return this._emptyDocument();
    }
  }

  // ============================================================================
  // SERIALIZERS — Full context, no truncation
  // ============================================================================

  /**
   * Serialize the COMPLETE TechDossier into readable text.
   * Every field, every recommendation, every alternative — nothing omitted.
   */
  private _serializeDossierFull(dossier: TechDossier): string {
    const sections: string[] = [];

    if (dossier.aiModels.length > 0) {
      sections.push('## AI Model Recommendations');
      for (const rec of dossier.aiModels) {
        sections.push(this._serializeRecommendation(rec));
      }
    }

    if (dossier.frameworks.length > 0) {
      sections.push('\n## Framework & Library Recommendations');
      for (const rec of dossier.frameworks) {
        sections.push(this._serializeRecommendation(rec));
      }
    }

    if (dossier.emergingCapabilities.length > 0) {
      sections.push('\n## Emerging Capabilities');
      for (const cap of dossier.emergingCapabilities) {
        sections.push(`- ${cap}`);
      }
    }

    if (dossier.deprecationWarnings.length > 0) {
      sections.push('\n## Deprecation Warnings');
      for (const warn of dossier.deprecationWarnings) {
        sections.push(`- ${warn}`);
      }
    }

    if (dossier.sources.length > 0) {
      sections.push('\n## Research Sources');
      for (const source of dossier.sources) {
        sections.push(`- ${source}`);
      }
    }

    sections.push(`\nResearched at: ${dossier.researchedAt}`);

    return sections.join('\n');
  }

  /**
   * Serialize a single TechRecommendation with ALL fields.
   */
  private _serializeRecommendation(rec: TechRecommendation): string {
    const lines: string[] = [];
    lines.push(`\n### ${rec.name}`);
    lines.push(`- **Category:** ${rec.category}`);
    lines.push(`- **Recommendation:** ${rec.recommendation}`);
    if (rec.latestVersion) {
      lines.push(`- **Latest Version:** ${rec.latestVersion}`);
    }
    if (rec.alternatives && rec.alternatives.length > 0) {
      lines.push(`- **Alternatives:** ${rec.alternatives.join(', ')}`);
    }
    lines.push(`- **Confidence:** ${rec.confidence}`);
    return lines.join('\n');
  }

  /**
   * Serialize the COMPLETE VisionDocument into readable text.
   * Every feature with ALL fields — nothing omitted.
   */
  private _serializeVisionFull(vision: VisionDocument): string {
    const sections: string[] = [];

    sections.push(`# ${vision.name}`);

    if (vision.overview) {
      sections.push(`\n## Overview\n${vision.overview}`);
    }

    if (vision.corePurpose) {
      sections.push(`\n## Core Purpose\n${vision.corePurpose}`);
    }

    if (vision.targetAudience) {
      sections.push(`\n## Target Audience\n${vision.targetAudience}`);
    }

    if (vision.competitiveEdge) {
      sections.push(`\n## Competitive Edge\n${vision.competitiveEdge}`);
    }

    if (vision.features && vision.features.length > 0) {
      sections.push(`\n## Features (${vision.features.length} total)`);
      for (let i = 0; i < vision.features.length; i++) {
        sections.push(this._serializeFeatureFull(vision.features[i], i + 1));
      }
    }

    if (vision.userFlow) {
      sections.push(`\n## User Flow\n${vision.userFlow}`);
    }

    if (vision.pageBreakdown) {
      sections.push(`\n## Page Breakdown\n${vision.pageBreakdown}`);
    }

    if (vision.designSystem) {
      sections.push(`\n## Design System\n${vision.designSystem}`);
    }

    if (vision.marketAnalysis) {
      sections.push(`\n## Market Analysis\n${vision.marketAnalysis}`);
    }

    return sections.join('\n');
  }

  /**
   * Serialize a single VisionFeature with ALL fields — nothing omitted.
   */
  private _serializeFeatureFull(feature: VisionFeature, index: number): string {
    const lines: string[] = [];
    lines.push(`\n### Feature ${index}: ${feature.title}`);
    lines.push(`- **ID:** ${feature.id}`);
    lines.push(`- **User Story:** ${feature.userStory}`);
    lines.push(`- **Description:** ${feature.description}`);
    lines.push(`- **Behavior:** ${feature.behavior}`);
    if (feature.acceptanceCriteria && feature.acceptanceCriteria.length > 0) {
      lines.push(`- **Acceptance Criteria:**`);
      for (const criterion of feature.acceptanceCriteria) {
        lines.push(`  - ${criterion}`);
      }
    }
    lines.push(`- **Edge Cases:** ${feature.edgeCases}`);
    lines.push(`- **UX Notes:** ${feature.uxNotes}`);
    lines.push(`- **Complexity:** ${feature.complexityLevel}`);
    return lines.join('\n');
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Validate and normalize the parsed JSON into a TechArchitectureDocument.
   */
  private _validateAndNormalize(parsed: Record<string, unknown>): TechArchitectureDocument {
    const doc: TechArchitectureDocument = {
      generatedAt: new Date().toISOString(),
    };

    // System Architecture
    if (parsed.systemArchitecture && typeof parsed.systemArchitecture === 'object') {
      const arch = parsed.systemArchitecture as Record<string, unknown>;
      doc.systemArchitecture = {
        overview: typeof arch.overview === 'string' ? arch.overview : '',
        layers: Array.isArray(arch.layers)
          ? arch.layers.map((layer: Record<string, unknown>) => ({
              name: String(layer.name || 'Unknown Layer'),
              technologies: Array.isArray(layer.technologies) ? layer.technologies.map(String) : [],
              responsibilities: Array.isArray(layer.responsibilities) ? layer.responsibilities.map(String) : [],
              connectsTo: Array.isArray(layer.connectsTo) ? layer.connectsTo.map(String) : [],
            }))
          : [],
      };
    }

    // Feature-Tech Map
    if (Array.isArray(parsed.featureTechMap)) {
      doc.featureTechMap = parsed.featureTechMap.map((m: Record<string, unknown>) => ({
        featureTitle: String(m.featureTitle || 'Unknown Feature'),
        technologies: Array.isArray(m.technologies) ? m.technologies.map(String) : [],
        implementationApproach: String(m.implementationApproach || ''),
        architectureNotes: String(m.architectureNotes || ''),
      }));
    }

    // Data Flows
    if (Array.isArray(parsed.dataFlows)) {
      doc.dataFlows = parsed.dataFlows.map((f: Record<string, unknown>) => ({
        flowName: String(f.flowName || 'Unknown Flow'),
        steps: Array.isArray(f.steps)
          ? f.steps.map((s: Record<string, unknown>) => ({
              step: typeof s.step === 'number' ? s.step : 0,
              description: String(s.description || ''),
              technology: String(s.technology || ''),
            }))
          : [],
        technologiesInvolved: Array.isArray(f.technologiesInvolved) ? f.technologiesInvolved.map(String) : [],
      }));
    }

    // Integration Patterns
    if (Array.isArray(parsed.integrationPatterns)) {
      doc.integrationPatterns = parsed.integrationPatterns.map((p: Record<string, unknown>) => ({
        pattern: String(p.pattern || 'Unknown Pattern'),
        technologies: Array.isArray(p.technologies) ? p.technologies.map(String) : [],
        rationale: String(p.rationale || ''),
        example: String(p.example || ''),
      }));
    }

    return doc;
  }

  // ============================================================================
  // TIMEOUT & FALLBACK
  // ============================================================================

  private _timeout(): Promise<TechArchitectureDocument> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.warn(`[TechArchitecture] Timed out after ${ARCHITECTURE_TIMEOUT_MS}ms`);
        resolve(this._emptyDocument());
      }, ARCHITECTURE_TIMEOUT_MS);
    });
  }

  private _emptyDocument(): TechArchitectureDocument {
    return {
      systemArchitecture: undefined,
      featureTechMap: [],
      dataFlows: [],
      integrationPatterns: [],
      generatedAt: new Date().toISOString(),
    };
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: TechArchitectureService | null = null;

export function getTechArchitectureService(): TechArchitectureService {
  if (!_instance) {
    _instance = new TechArchitectureService();
  }
  return _instance;
}

// ============================================================================
// SERIALIZER FOR BUILDER PROMPT INJECTION
// ============================================================================

/**
 * Serialize TechArchitectureDocument into text for the Builder's prompt.
 * Includes ALL sections with full detail — no truncation.
 */
export function serializeArchitectureForPrompt(
  doc: TechArchitectureDocument
): string {
  const sections: string[] = [];

  sections.push('=== TECH ARCHITECTURE (generated ' + doc.generatedAt + ') ===');

  if (doc.systemArchitecture) {
    sections.push('\n## System Architecture');
    sections.push(doc.systemArchitecture.overview);

    if (doc.systemArchitecture.layers.length > 0) {
      sections.push('\n### Architecture Layers');
      for (const layer of doc.systemArchitecture.layers) {
        sections.push(`\n**${layer.name}**`);
        sections.push(`  Technologies: ${layer.technologies.join(', ')}`);
        sections.push(`  Responsibilities: ${layer.responsibilities.join('; ')}`);
        if (layer.connectsTo.length > 0) {
          sections.push(`  Connects to: ${layer.connectsTo.join(', ')}`);
        }
      }
    }
  }

  if (doc.featureTechMap && doc.featureTechMap.length > 0) {
    sections.push('\n## Feature-Technology Mapping');
    for (const mapping of doc.featureTechMap) {
      sections.push(`\n### ${mapping.featureTitle}`);
      sections.push(`Technologies: ${mapping.technologies.join(', ')}`);
      sections.push(`Approach: ${mapping.implementationApproach}`);
      if (mapping.architectureNotes) {
        sections.push(`Notes: ${mapping.architectureNotes}`);
      }
    }
  }

  if (doc.dataFlows && doc.dataFlows.length > 0) {
    sections.push('\n## Key Data Flows');
    for (const flow of doc.dataFlows) {
      sections.push(`\n### ${flow.flowName}`);
      for (const step of flow.steps) {
        sections.push(`  ${step.step}. ${step.description} [${step.technology}]`);
      }
      sections.push(`  Technologies: ${flow.technologiesInvolved.join(' → ')}`);
    }
  }

  if (doc.integrationPatterns && doc.integrationPatterns.length > 0) {
    sections.push('\n## Integration Patterns');
    for (const pattern of doc.integrationPatterns) {
      sections.push(`\n### ${pattern.pattern}`);
      sections.push(`Technologies: ${pattern.technologies.join(' + ')}`);
      sections.push(`Rationale: ${pattern.rationale}`);
      if (pattern.example) {
        sections.push(`Example: ${pattern.example}`);
      }
    }
  }

  sections.push('\n=== END TECH ARCHITECTURE ===');

  return sections.join('\n');
}

export type { TechArchitectureService as TechArchitectureServiceInstance };
