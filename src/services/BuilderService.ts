import { GoogleGenerativeAI } from "@google/generative-ai";
import { LayoutManifest, LayoutManifestSchema, UISpecNode } from "@/types/schema";

export class BuilderService {
  private model: any;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    // CRITICAL: Using Gemini 3 Flash for "Stylistic Plasticity"
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
      generationConfig: { responseMimeType: "application/json" }
    });
  }

  /**
   * THE TWO-PART PROMPTING ARCHITECTURE
   * Prevents generic templates by locking in the "Physical Vibe" first.
   * Returns both the styled manifest and the metaphor for use in refineElement.
   */
  async applyVibe(manifest: LayoutManifest, userPrompt: string): Promise<{ manifest: LayoutManifest; metaphor: string }> {
    try {
      // PHASE 1: THE METAPHOR (Physics & Texture)
      // We force the AI away from "Web Terms" into "Physical Terms"
      const metaphor = await this.generatePhysicalMetaphor(userPrompt);
      console.log("Active Metaphor:", metaphor);

      // PHASE 2: THE SYNTHESIS (Flash UI Persona)
      // Translate physics -> Tailwind
      const styledManifest = await this.synthesizeStyles(manifest, metaphor);
      
      // Self-Healing Pass
      const validatedManifest = await this.validateAndFix(styledManifest);
      
      return { manifest: validatedManifest, metaphor };
    } catch (e) {
      console.error("Vibe Coding Failed:", e);
      return { manifest, metaphor: "Clean minimal matte paper" }; // Fail safe
    }
  }

  /**
   * SCULPTING WORKFLOW (Highlight-to-Refine)
   * Updates a single node's styles without regenerating the whole tree.
   * Latency target: <200ms
   */
  async refineElement(
    node: UISpecNode, 
    instruction: string, 
    currentMetaphor: string
  ): Promise<UISpecNode> {
    const prompt = `
      ROLE: You are "Flash UI".
      CONTEXT: The overall design metaphor is: "${currentMetaphor}".
      TASK: Refine this specific component based on: "${instruction}".
      
      CRITICAL RULE: Interpret adjectives as PHYSICAL properties.
      - "Heavier" -> Increase shadow opacity, darken background, thicken border.
      - "Lighter" -> Reduce alpha channels, increase backdrop-blur.
      - "More obsidian" -> Deeper blacks, sharper edges.
      - "More glass" -> More transparency, more blur.
      
      INPUT NODE: ${JSON.stringify(node)}
      OUTPUT: The same node with updated 'styles.tailwindClasses'.
    `;

    const result = await this.model.generateContent(prompt);
    const updatedNode = JSON.parse(result.response.text());
    
    // Localized Self-Healing
    return this.lintTailwindClasses(updatedNode);
  }

  // --- INTERNAL TWO-PART HELPERS ---

  private async generatePhysicalMetaphor(userPrompt: string): Promise<string> {
    // The Metaphor Prompt - Forces physical description, no web terms
    const prompt = `
      TASK: Convert this UI request into a "Physical Material Metaphor".
      USER REQUEST: "${userPrompt}"
      
      RULES:
      1. Do NOT use web terms (no "sidebar", "header", "css").
      2. Describe lighting, texture, material physics, and motion.
      3. Example: "Obsidian Glass" -> "Volcanic black glass, high gloss reflection, razor sharp edges, internal purple refraction."
      
      OUTPUT: Return as JSON: { "metaphor": "your description here" }
    `;
    
    const result = await this.model.generateContent(prompt);
    return JSON.parse(result.response.text()).metaphor || "Clean minimal matte paper"; 
  }

  private async synthesizeStyles(manifest: LayoutManifest, metaphor: string): Promise<LayoutManifest> {
    // The Synthesis Prompt - Flash UI translates physics to Tailwind
    const prompt = `
      ROLE: You are "Flash UI", a specialized Tailwind CSS engine.
      INPUT METAPHOR: "${metaphor}"
      TASK: Apply styles to the LayoutManifest matching this metaphor.
      
      MAPPING RULES:
      - Glass/Liquid -> backdrop-blur-xl, bg-opacity-*, border-white/20
      - Steel/Metal -> bg-gradient-to-br, silver borders, metallic shadows
      - Neon/Light -> shadow-[0_0_15px_rgba(...)], text-glow effects
      - Obsidian/Volcanic -> bg-black, sharp edges, minimal border-radius
      - Paper/Matte -> flat colors, subtle shadows, clean borders
      
      INSTRUCTION: Populate 'styles.tailwindClasses' for every node. Do NOT change the structure.
    `;

    const result = await this.model.generateContent([
      { text: prompt },
      { text: JSON.stringify(manifest) }
    ]);
    return JSON.parse(result.response.text());
  }

  // --- SELF-HEALING & LINTING ---

  async validateAndFix(jsonInput: any, attempt = 1): Promise<LayoutManifest> {
    const MAX_RETRIES = 3;
    try {
      const parsed = LayoutManifestSchema.parse(jsonInput);
      const cleanRoot = this.lintTailwindClasses(parsed.root);
      const cleanDefs: Record<string, UISpecNode> = {};
      Object.entries(parsed.definitions).forEach(([key, node]) => {
        cleanDefs[key] = this.lintTailwindClasses(node as UISpecNode);
      });
      return { 
        ...parsed, 
        root: cleanRoot, 
        definitions: cleanDefs,
        designSystem: {
          ...parsed.designSystem,
          colors: Object.fromEntries(
            Object.entries(parsed.designSystem.colors).map(([k, v]) => [k, String(v)])
          )
        }
      };
    } catch (error: any) {
      if (attempt > MAX_RETRIES) {
        console.error("Critical: Repair failed 3 times. Engaging Safe Mode.");
        return this.generateSafeModeManifest(jsonInput);
      }
      console.warn(`Validation Error (Attempt ${attempt}):`, error.message);
      const fixedJson = await this.repairJson(JSON.stringify(jsonInput), error.message);
      return this.validateAndFix(fixedJson, attempt + 1);
    }
  }

  private async repairJson(brokenJson: string, error: string): Promise<any> {
    const prompt = `Fix this JSON structure based on the error: ${error}.\n\n${brokenJson.slice(0, 2000)}`;
    const result = await this.model.generateContent(prompt);
    return JSON.parse(result.response.text());
  }

  private lintTailwindClasses(node: UISpecNode): UISpecNode {
    const validClassPattern = /^[a-z0-9\-:[\]/#.%]+$/i;
    const cleanClasses = node.styles.tailwindClasses
      .split(' ')
      .filter(cls => validClassPattern.test(cls))
      .join(' ');
    return {
      ...node,
      styles: { ...node.styles, tailwindClasses: cleanClasses },
      children: node.children?.map(c => this.lintTailwindClasses(c))
    };
  }

  private generateSafeModeManifest(input: any): LayoutManifest {
    return {
      id: "safe-mode-fallback",
      version: "1.0.0",
      root: {
        id: "root",
        type: "container",
        semanticTag: "safe-mode-container",
        styles: { tailwindClasses: "min-h-screen flex items-center justify-center bg-gray-100 p-8" },
        attributes: {},
        children: [
          {
            id: "error-card",
            type: "container",
            semanticTag: "error-card",
            styles: { tailwindClasses: "bg-white rounded-lg shadow-lg p-8 max-w-md text-center" },
            attributes: {},
            children: [
              {
                id: "error-icon",
                type: "icon",
                semanticTag: "warning-icon",
                styles: { tailwindClasses: "w-16 h-16 text-amber-500 mx-auto mb-4" },
                attributes: { src: "AlertTriangle" }
              },
              {
                id: "error-title",
                type: "text",
                semanticTag: "error-title",
                styles: { tailwindClasses: "text-xl font-semibold text-gray-900 mb-2" },
                attributes: { text: "Layout Generation Issue" }
              },
              {
                id: "error-description",
                type: "text",
                semanticTag: "error-description",
                styles: { tailwindClasses: "text-gray-600" },
                attributes: { text: "The layout could not be fully generated. This is a safe fallback view. Please try regenerating." }
              }
            ]
          }
        ]
      },
      definitions: {},
      detectedFeatures: [],
      designSystem: {
        colors: { primary: "#3b82f6", secondary: "#6b7280", background: "#f3f4f6", surface: "#ffffff", text: "#111827" },
        fonts: { heading: "Inter", body: "Inter" }
      }
    };
  }
}
