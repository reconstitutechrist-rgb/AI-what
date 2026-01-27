/**
 * Architect API Route - Generate Layout Manifest
 *
 * Multi-Strategy Architecture for source types:
 * - STATIC IMAGE: Visual Fidelity with absolute bounds
 * - VIDEO: Precision Flow with arbitrary Tailwind (NO absolute - kills animation)
 * - DUAL-SOURCE (Director's Cut): Image for visuals, Video for motions
 */

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import type { AppConcept } from '@/types/appConcept';
import type { LayoutManifest, UISpecNode } from '@/types/schema';
import { sanitizeManifest } from '@/utils/manifestSanitizer';
import type { ColorPalette } from '@/utils/colorExtraction';
import { geminiImageService } from '@/services/GeminiImageService';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

interface GenerateManifestRequest {
  concept?: AppConcept;
  userPrompt: string;
  images?: Array<{ base64: string; mimeType: string; name: string }>;
  videoBase64?: string;
  videoMimeType?: string;
  videoFileName?: string;
  extractedColors?: ColorPalette;
}

/**
 * Recursively find a node tagged for background generation.
 * Looks for nodes with semanticTag: 'custom-background-layer'.
 */
function findBackgroundNode(node: UISpecNode): UISpecNode | null {
  if (node.semanticTag === 'custom-background-layer') return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findBackgroundNode(child);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Count total nodes in a manifest tree (for validation)
 */
function countNodes(node: UISpecNode): number {
  if (!node) return 0;
  return 1 + (node.children?.reduce((sum, child) => sum + countNodes(child), 0) || 0);
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Google AI API key not configured.' }, { status: 500 });
    }

    const body: GenerateManifestRequest = await request.json();
    const {
      concept,
      userPrompt,
      images,
      videoBase64,
      videoMimeType,
      videoFileName,
      extractedColors,
    } = body;

    // --- SOURCE DETECTION ---
    const hasVideo = !!videoBase64;
    const hasImages = images && images.length > 0;
    const isMergeMode = hasVideo && hasImages;

    console.log('[generate-manifest] Source detection:', {
      hasVideo,
      hasImages,
      isMergeMode,
      imageCount: images?.length ?? 0,
    });

    // --- SINGLE-PROMPT FLOW (All sources: image, video, merge, or none) ---
    const genAI = new GoogleGenerativeAI(apiKey);
    const fileManager = new GoogleAIFileManager(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const contextLine = concept
      ? `CONTEXT: App "${concept.name}" - ${concept.purpose}.`
      : 'CONTEXT: Analyzing provided reference material to create a UI layout.';

    // Color injection for design system
    const colorInjectionLine = extractedColors
      ? `
DESIGN SYSTEM (GROUND TRUTH - EXTRACTED FROM SOURCE):
- Primary: ${extractedColors.primary} → USE CLASS: "bg-primary" or "text-primary"
- Secondary: ${extractedColors.secondary} → USE CLASS: "bg-secondary"
- Accent: ${extractedColors.accent} → USE CLASS: "bg-accent"
- Background: ${extractedColors.background} → USE CLASS: "bg-background"
- Surface: ${extractedColors.surface} → USE CLASS: "bg-surface"
- Text: ${extractedColors.text} → USE CLASS: "text-text"
- Text Muted: ${extractedColors.textMuted} → USE CLASS: "text-text-muted"
- Border: ${extractedColors.border} → USE CLASS: "border-border"

USE SEMANTIC CLASSES (bg-primary, text-text, etc.) - NOT arbitrary hex values.
`
      : '';

    // --- STRATEGY SELECTION ---
    let strategyInstruction = '';

    if (isMergeMode) {
      strategyInstruction = `
STRATEGY: **DUAL-SOURCE MERGE (The "Director's Cut")**
The user wants to combine the VISUALS of the Image with the MOTIONS of the Video.

1. **VISUAL SOURCE (The Image)**:
   - Use the Image to define the Layout, Colors, Typography, and Component Structure.
   - Use "layout.bounds" to replicate the Image's exact spacing and positioning.
   - The 'styles.tailwindClasses' MUST match the Image.

2. **MOTION SOURCE (The Video)**:
   - Ignore the Video's visual layout/colors.
   - ANALYZE ONLY THE MOVEMENT: transitions, hover states, scroll effects, entrance animations.
   - APPLY these motions to the Image's components via 'styles.motion'.

3. **MAPPING LOGIC**:
   - If Video shows a list sliding in -> Make the Image's list slide in.
   - If Video buttons bounce on click -> Make the Image's buttons bounce.
   - If Video header is sticky -> Make the Image's header sticky.

4. **OUTPUT GOAL**:
   - A layout that LOOKS like the Image but BEHAVES like the Video.
`;
    } else if (hasVideo) {
      strategyInstruction = `
STRATEGY: **VIDEO DETECTED -> ENABLE "PRECISION FLOW" MODE**
The user wants the EXACT "Look and Feel" of this video.

1. **THE LOOK (Precision Flow)**:
   - Do NOT use absolute positioning (it kills animation).
   - MUST USE ARBITRARY VALUES: 'w-[375px]', 'gap-[18px]', 'rounded-[22px]'.
   - This creates a pixel-perfect layout that can still animate.
   - Use 'layout.mode: "flow"' for ALL elements.

2. **THE FEEL (Motion Extraction)**:
   - Analyze movement between frames.
   - Populate 'styles.motion' objects with Framer Motion props.
   - Example: { "initial": { "opacity": 0, "y": 20 }, "animate": { "opacity": 1, "y": 0 } }
`;
    } else {
      // FORENSIC MODE - Maximum Accuracy for Image Replication
      strategyInstruction = `
STRATEGY: **FORENSIC REPLICATION MODE (100% Accuracy Target)**
⚠️ USER DEMANDS EXACT REPLICA - This is a visual forensics exercise.

═══════════════════════════════════════════════════════════
🎯 CRITICAL RULES - ZERO TOLERANCE FOR APPROXIMATION:
═══════════════════════════════════════════════════════════

1. **COUNT EVERYTHING**: Detect 30-50+ components minimum (every icon, button, text, image)
2. **MEASURE EXACTLY**: Use precise pixel values in customCSS or arbitrary Tailwind - NEVER approximate
3. **MATCH COLORS EXACTLY**: Use the extracted palette provided (GROUND TRUTH)
4. **DETECT ALL ELEMENTS**: Every visible component gets its own UISpecNode
5. **ABSOLUTE POSITIONING**: Lock every element in place with exact bounds

═══════════════════════════════════════════════════════════
📋 FORENSIC DETECTION CHECKLIST (Execute Systematically):
═══════════════════════════════════════════════════════════

**STEP 1: LAYOUT STRUCTURE ANALYSIS**
□ Header Section (measure: top %, height %, sticky behavior?)
□ Navigation Bar (measure: items count, spacing, alignment)
□ Hero/Banner Section (measure: exact height in px, background type)
□ Content Sections (count them, measure vertical spacing between)
□ Sidebar (if present, measure: width %, position)
□ Footer (measure: height %, column count, spacing)

**STEP 2: ICON FORENSICS (CRITICAL - Most Common Failure Point)**
For EVERY icon visible, you MUST:
1. Identify the exact shape visually:
   - 3 horizontal lines = "Menu"
   - Magnifying glass = "Search"
   - Person silhouette = "User"
   - Chevron/Arrow pointing down = "ChevronDown"
   - Chevron/Arrow pointing right = "ChevronRight"
   - X or close symbol = "X"
   - Heart shape = "Heart"
   - Star shape = "Star"
   - Gear/cog = "Settings"
   - Envelope = "Mail"
   - Phone = "Phone"
   - Shopping bag/cart = "ShoppingCart"
   - Circle (default if unsure) = "Circle"

2. Create exact node structure:
{
  "type": "icon",
  "semanticTag": "header-menu-icon",
  "attributes": { "src": "Menu" },
  "styles": { 
    "tailwindClasses": "w-6 h-6 text-text",
    "customCSS": ""
  },
  "layout": {
    "mode": "absolute",
    "bounds": { "x": 2, "y": 2, "width": 2, "height": 2, "unit": "%" }
  }
}

**STEP 3: BUTTON FORENSICS**
For EVERY clickable element:
1. Measure exact dimensions (width x height in px)
2. Extract border-radius (e.g., "8px", "12px", "24px", "50%")
3. Extract padding (e.g., "12px 24px", "16px 32px")
4. Extract background (solid color, gradient with stops, or image)
5. Extract box-shadow (full CSS: "0 4px 14px rgba(0,0,0,0.15)")
6. Extract text color, font-size, font-weight
7. Store ALL measurements in customCSS:

{
  "type": "button",
  "semanticTag": "hero-cta-button",
  "attributes": { "text": "Get Started" },
  "styles": {
    "tailwindClasses": "font-semibold cursor-pointer",
    "customCSS": "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 16px 32px; box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4); color: #ffffff; font-size: 16px; font-weight: 600;"
  },
  "layout": {
    "mode": "absolute",
    "bounds": { "x": 42, "y": 65, "width": 16, "height": 6, "unit": "%" }
  }
}

**STEP 4: TEXT FORENSICS**
For EVERY text element:
1. Identify type: headline, subheading, paragraph, caption, label
2. Measure font-size in px (e.g., "64px", "48px", "24px", "16px", "14px")
3. Measure line-height (e.g., "1.2", "1.5", "1.8")
4. Measure letter-spacing if notable (e.g., "-0.02em", "0.05em")
5. Extract font-weight (e.g., "400", "500", "600", "700", "800")
6. Store in customCSS for exactness

**STEP 5: IMAGE/VISUAL FORENSICS**
For EVERY image, photo, illustration, or graphic:
1. Measure exact bounds (x, y, width, height as %)
2. Note aspect ratio
3. Detect border-radius if rounded
4. Detect shadow/effects
5. Create image node with placeholder URL

**STEP 6: SPACING FORENSICS**
1. Measure gap between nav items (e.g., "gap-[24px]")
2. Measure padding inside sections (e.g., "p-[80px]" or "px-[120px] py-[80px]")
3. Measure margin between sections (e.g., "mt-[60px]")
4. Use arbitrary Tailwind values: 'gap-[18px]', 'p-[24px]', NOT presets

**STEP 7: EFFECT FORENSICS**
□ Glassmorphism detected? → Extract: 'backdrop-filter: blur(12px); background: rgba(255,255,255,0.1);'
□ Gradient detected? → Extract: 'background: linear-gradient(135deg, #color1 0%, #color2 100%);'
□ Shadow detected? → Extract: 'box-shadow: 0 Xpx Ypx Zpx rgba(0,0,0,0.N);'
□ Border detected? → Extract: 'border: Npx solid #color; border-radius: Npx;'

═══════════════════════════════════════════════════════════
🎨 ABSOLUTE POSITIONING PROTOCOL:
═══════════════════════════════════════════════════════════

**ROOT CONTAINER (CRITICAL):**
- MUST use 'layout.mode: "flow"'
- MUST have "relative" class (to contain absolute children)
- Acts as positioning context for all children

**ALL CHILD ELEMENTS:**
- MUST use 'layout.mode: "absolute"' with precise bounds
- Bounds format: { "x": 0-100, "y": 0-100, "width": 0-100, "height": 0-100, "unit": "%" }
- Calculate percentages relative to viewport dimensions

**SPATIAL ZONES (Reference Guide):**
- Header: y: 0-12%
- Hero: y: 12-55%
- Content: y: 55-90%
- Footer: y: 90-100%

═══════════════════════════════════════════════════════════
🎨 COLOR FIDELITY (GROUND TRUTH - DO NOT DEVIATE):
═══════════════════════════════════════════════════════════

The extracted color palette is PROVIDED and is GROUND TRUTH.
USE SEMANTIC CLASSES - NEVER invent new colors:
- Primary → "bg-primary" or "text-primary"
- Secondary → "bg-secondary" or "text-secondary"
- Accent → "bg-accent" or "text-accent"
- Background → "bg-background"
- Surface → "bg-surface"
- Text → "text-text"
- Text Muted → "text-text-muted"
- Border → "border-border"

If a button has a gradient, use customCSS with the palette colors.

═══════════════════════════════════════════════════════════
✅ QUALITY GATES (All Must Pass):
═══════════════════════════════════════════════════════════

Before returning the manifest, verify:
□ Detected 30+ components minimum?
□ Every icon has correct Lucide name (not "icon" text)?
□ Every button has exact border-radius in px?
□ Every text has exact font-size in px?
□ All colors use semantic palette classes?
□ Every element has layout.bounds with exact coordinates?
□ Root is relative + flow, children are absolute?
□ No vague terms used ("large", "spacious", "rounded")?

If ANY gate fails → REGENERATE with more precision.

═══════════════════════════════════════════════════════════
📊 COMPONENT COUNT TARGET: 30-50+ UISpecNodes
═══════════════════════════════════════════════════════════

Remember: Every visible element = a node. DO NOT summarize.
`;
    }

    const preImageContext = `
ROLE: Expert Frontend Architect (Multimodal).
${contextLine}
${strategyInstruction}
TASK: Generate a complete Hybrid LayoutManifest (JSON).
`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [{ text: preImageContext }];

    // --- ADD MEDIA ---

    // 1. Add Image (Visual Truth)
    if (images && images.length > 0) {
      console.log(`[generate-manifest] Processing ${images.length} image(s)...`);
      images.forEach((img, index) => {
        parts.push({
          inlineData: { mimeType: img.mimeType, data: img.base64 },
        });
        parts.push({
          text: `[VISUAL SOURCE: Image ${index + 1}] - Use this for Layout & Style`,
        });
      });
    }

    // 2. Add Video (Motion Truth)
    if (videoBase64 && videoMimeType) {
      console.log('[generate-manifest] Uploading video for motion analysis...');
      try {
        const buffer = Buffer.from(videoBase64, 'base64');
        const uploadResponse = await fileManager.uploadFile(buffer, {
          mimeType: videoMimeType,
          displayName: videoFileName || 'uploaded-video',
        });

        let fileState = await fileManager.getFile(uploadResponse.file.name);
        let attempts = 0;
        while (fileState.state === FileState.PROCESSING && attempts < 15) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          fileState = await fileManager.getFile(uploadResponse.file.name);
          attempts++;
        }

        if (fileState.state === FileState.ACTIVE) {
          parts.push({
            fileData: { mimeType: fileState.mimeType, fileUri: fileState.uri },
          });
          parts.push({
            text: '[MOTION SOURCE: Video] - Use this for Animation & Behavior ONLY',
          });
          console.log('[generate-manifest] Video uploaded successfully');
        } else {
          throw new Error(`Video processing state: ${fileState.state}`);
        }
      } catch (e) {
        console.error('[generate-manifest] Video upload failed:', e);
        parts.push({
          text: '[SYSTEM: Video upload failed. Ignoring motion source.]',
        });
      }
    }

    const postImageInstructions = `
${colorInjectionLine}

**COMPONENT PROTOCOLS:**

BUTTON_DETECTION_PROTOCOL:
- Any element that looks clickable (Pills, Rectangles with text) IS A BUTTON.
- Use type: "button" for these. DO NOT simplify to text.

**ICON PROTOCOL (ZERO TOLERANCE):**
- **ICONS ARE VOID ELEMENTS.** They CANNOT have children or text content.
- **NEVER** use { "type": "text", "attributes": { "text": "icon" } }. This is lazy and FORBIDDEN.
- **NEVER** use attributes.text on icon nodes. Icons have NO text content.
- **ALWAYS** use { "type": "icon", "attributes": { "src": "IconName" } }.
- Detect the icon shape: Hamburger/3-lines -> "Menu", Magnifier -> "Search", Chevron -> "ChevronDown", Person -> "User", X -> "X".
- Valid Lucide names: "Menu", "Search", "User", "Heart", "Star", "ChevronDown", "ChevronUp", "ChevronLeft", "ChevronRight", "X", "Check", "Plus", "Minus", "Settings", "Home", "Mail", "Github", "ArrowRight", "ArrowLeft", "AlertTriangle", "Bell", "Calendar", "Camera", "Clock", "Download", "Edit", "Eye", "EyeOff", "Filter", "Folder", "Image", "Info", "Link", "Lock", "MapPin", "MoreHorizontal", "MoreVertical", "Phone", "Play", "Pause", "Send", "Share", "ShoppingCart", "Trash", "Upload", "Circle"
- If unsure of the icon, use "Circle".
- Example: { "type": "icon", "attributes": { "src": "Menu" }, "styles": { "tailwindClasses": "w-6 h-6" } }

NAVIGATION SPACING PROTOCOL:
- Nav containers MUST use "flex items-center gap-4" or "gap-6".
- Headers should use "justify-between" to spread logo/nav apart.

TEXT SPACING PROTOCOL:
- Text containers: "flex flex-col gap-4" or "space-y-4".
- Headlines: "text-4xl font-bold leading-tight mb-4".
- Paragraphs: "text-lg leading-relaxed mb-4".

**BACKGROUND PROTOCOL:**
- Root MUST have "bg-background min-h-screen w-full".
- Each section needs an explicit bg- class (bg-background, bg-surface, bg-primary).
- Dark backgrounds pair with "text-white".
- **FOR COMPLEX BACKGROUNDS (gradient, pattern, photo):**
  - The ROOT or section container MUST have a customCSS style.
  - Set 'styles.customCSS': "background-image: url('https://placehold.co/1920x1080/333/666?text=Background'); background-size: cover;"
  - For gradients: 'styles.customCSS': "background: linear-gradient(135deg, #hex1, #hex2);"
  - Tag it as 'semanticTag': 'custom-background-layer'.

**HYBRID LAYOUT PROTOCOL:**
1. **Flow Truth (Tailwind)**: Standard classes (flex, grid, gap).
2. **Visual Truth (Bounds)**: Exact percentage coordinates.

For structural elements, populate the "layout" field:
"layout": {
  "mode": "flow" | "absolute",
  "bounds": { "x": 0, "y": 0, "width": 100, "height": 10, "unit": "%" },
  "zIndex": 10
}

MODE DECISION RULES:
- Is it a section container (header, hero, footer)? → Consider "absolute" for exact replica
- Is it text flowing naturally? → "flow"
- Is it a floating/overlapping element? → "absolute"
- VIDEO SOURCE? → Always "flow" (absolute kills animation)

**MOTION PROTOCOL (For Video/Merge):**
- Populate 'styles.motion' with Framer Motion props.
- Example: "initial": { "opacity": 0, "y": 20 }, "animate": { "opacity": 1, "y": 0 }

**ADVANCED VISUAL FIDELITY PROTOCOL:**
1. **Glassmorphism**: If semi-transparent blur is seen, apply 'backdrop-filter: blur(12px)' and 'background: rgba(255,255,255,0.1)' in styles.customCSS.
2. **Mesh Gradients**: Detect multi-color backgrounds; use 'background: linear-gradient(...)' in customCSS with extracted colors.
3. **Precision Spacing**: Use Tailwind arbitrary values like 'p-[24px]', 'gap-[18px]', 'h-[850px]' - NOT vague presets.
4. **Neumorphism**: Double shadows → 'box-shadow: -4px -4px 8px #light, 4px 4px 8px #dark' in customCSS.
5. **Border Radius Precision**: Extract exact values - 'rounded-[16px]' or 'rounded-[24px]', not 'rounded-lg'.
6. **Font Size Precision**: Detect exact sizes - 'text-[64px]' for hero headings, 'text-[16px]' for body.

REQUIRED OUTPUT SCHEMA:
{
  "id": "manifest-id",
  "version": "1.0.0",
  "root": { /* UISpecNode */ },
  "definitions": {},
  "detectedFeatures": [],
  "designSystem": { "colors": {...}, "fonts": {...} }
}

UISpecNode REQUIRED FIELDS:
- id: string (unique like "hero-section-1")
- type: "container" | "text" | "button" | "input" | "list" | "icon" | "image"
- semanticTag: string (like "hero-section", "cta-button")
- styles: { tailwindClasses: "..." }
- attributes: {}
- children?: UISpecNode[] (only for non-void elements)
- layout?: { mode, bounds, zIndex }

VOID ELEMENTS (image, input, icon, video) MUST NOT have children arrays or text attributes.

IMAGE URL RULE:
- Use placeholder URLs like "https://placehold.co/400x300/e2e8f0/64748b?text=Image"
- NEVER use local filenames.

OUTPUT: Complete JSON LayoutManifest with ALL required fields.
`;

    parts.push({ text: postImageInstructions });

    if (userPrompt) {
      parts.push({ text: `USER REQUEST: ${userPrompt}` });
    }

    const result = await model.generateContent(parts);
    const responseText = result.response.text();

    const cleanJson = (text: string): string => {
      return text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
    };

    let manifest: LayoutManifest;
    try {
      manifest = JSON.parse(cleanJson(responseText));
    } catch {
      console.error('[generate-manifest] Failed to parse JSON:', responseText.slice(0, 500));
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON', rawResponse: responseText },
        { status: 500 }
      );
    }

    // --- POST-PROCESSING ---

    // Ensure root.children is always an array
    if (manifest.root && !Array.isArray(manifest.root.children)) {
      manifest.root.children = [];
    }

    // Force extracted colors into manifest
    if (extractedColors) {
      console.log('[generate-manifest] Force-applying extracted colors');
      if (!manifest.designSystem) {
        manifest.designSystem = { colors: {}, fonts: { heading: 'Inter', body: 'Inter' } };
      }
      if (!manifest.designSystem.colors) {
        manifest.designSystem.colors = {};
      }
      manifest.designSystem.colors = {
        ...manifest.designSystem.colors,
        primary: extractedColors.primary,
        secondary: extractedColors.secondary,
        background: extractedColors.background,
        surface: extractedColors.surface,
        text: extractedColors.text,
        textMuted: extractedColors.textMuted || extractedColors.text,
        border: extractedColors.border,
        accent: extractedColors.accent,
      };
    }

    // Sanitize image URLs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function sanitizeImageUrls(node: any): any {
      if (!node) return node;
      if (node.type === 'image' && node.attributes) {
        const src = node.attributes.src;
        if (src && typeof src === 'string') {
          const isValidUrl =
            src.startsWith('http://') ||
            src.startsWith('https://') ||
            src.startsWith('data:') ||
            src.startsWith('/');
          if (!isValidUrl) {
            const width = node.attributes.width || 400;
            const height = node.attributes.height || 300;
            node.attributes.src = `https://placehold.co/${width}x${height}/e2e8f0/64748b?text=Image`;
            if (!node.attributes.alt) node.attributes.alt = 'Placeholder image';
          }
        }
      }
      if (node.children && Array.isArray(node.children)) {
        node.children = node.children.map(sanitizeImageUrls);
      }
      return node;
    }

    if (manifest.root) {
      manifest.root = sanitizeImageUrls(manifest.root);
    }

    // --- AUTOMATIC BACKGROUND GENERATION (The Wiring) ---
    const backgroundNode = manifest.root ? findBackgroundNode(manifest.root) : null;
    const hasReferenceImage = images && images.length > 0;

    if (backgroundNode && hasReferenceImage) {
      console.log('[Architect] Custom background layer detected. Triggering Artist...');
      try {
        const generationResult = await geminiImageService.generateBackgroundFromReference({
          referenceImage: images[0].base64,
          colorPalette: extractedColors || {
            primary: '#000000',
            secondary: '#333333',
            accent: '#666666',
            background: '#ffffff',
            surface: '#f5f5f5',
            text: '#333333',
            textMuted: '#888888',
          },
          vibe: userPrompt || 'Professional UI background',
          vibeKeywords: ['ui', 'background', 'website', 'abstract'],
          resolution: '1K',
        });

        if (generationResult.imageUrl) {
          console.log('[Architect] Background generated:', generationResult.imageUrl);
          backgroundNode.styles.customCSS = `background-image: url('${generationResult.imageUrl}'); background-size: cover; background-position: center;`;
        }
      } catch (error) {
        console.error('[Architect] Background generation failed:', error);
      }
    }

    // Force root background & layout
    if (manifest.root) {
      if (!manifest.root.styles) manifest.root.styles = { tailwindClasses: '' };
      let classes = manifest.root.styles.tailwindClasses || '';
      if (!classes.includes('min-h-screen')) classes = `min-h-screen ${classes}`;
      if (!classes.includes('w-full')) classes = `w-full ${classes}`;
      if (!classes.includes('bg-background')) classes = `${classes} bg-background`;
      // CRITICAL: Root must have relative positioning to contain absolute children
      if (!classes.includes('relative')) classes = `relative ${classes}`;
      manifest.root.styles.tailwindClasses = classes.trim();

      // CRITICAL: Force root to flow mode - root must NEVER be absolute
      // When root is absolute, it has no height guarantee and collapses to 0px (invisible layout)
      if (manifest.root.layout?.mode === 'absolute') {
        manifest.root.layout.mode = 'flow';
        delete manifest.root.layout.bounds;
        console.log('[Architect] Forced root from absolute to flow mode');
      }
    }

    // Sanitize manifest (remove children from void elements)
    const {
      manifest: sanitizedManifest,
      totalRemovedChildren,
      affectedNodes,
    } = sanitizeManifest(manifest);

    if (totalRemovedChildren > 0) {
      console.log(
        `[generate-manifest] Sanitized: Removed ${totalRemovedChildren} children from ${affectedNodes.length} void elements`
      );
    }

    // Component count validation (quality check)
    const componentCount = countNodes(sanitizedManifest.root);
    console.log(`[generate-manifest] Component count: ${componentCount}`);

    if (hasImages && !hasVideo && componentCount < 20) {
      console.warn(
        '[generate-manifest] ⚠️  LOW COMPONENT COUNT - Layout may lack detail. Expected 30+, got',
        componentCount
      );
    } else if (componentCount >= 30) {
      console.log('[generate-manifest] ✅ Component count meets quality threshold');
    }

    console.log('[generate-manifest] FINAL MANIFEST:', {
      id: sanitizedManifest.id,
      rootType: sanitizedManifest.root?.type,
      rootChildrenCount: sanitizedManifest.root?.children?.length ?? 0,
      componentCount,
      strategy: isMergeMode ? 'MERGE' : hasVideo ? 'VIDEO_FLOW' : 'IMAGE_FIDELITY',
    });

    return NextResponse.json({ manifest: sanitizedManifest });
  } catch (error) {
    console.error('[generate-manifest] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Architect API - Multi-Strategy Layout Generator',
    version: '4.0',
    description: 'Forensic Mode - Maximum accuracy layout replication with Gemini 3 Flash',
    strategies: {
      IMAGE: 'Forensic Replication Mode - 30-50+ components with exact measurements',
      VIDEO: 'Precision Flow with arbitrary Tailwind (no absolute)',
      MERGE: 'Directors Cut - Image visuals + Video motions',
    },
    features: {
      forensicMode: 'Systematic analysis with 30+ component minimum',
      colorExtraction: 'Client-side color palette detection (ground truth)',
      backgroundGeneration: 'Custom background image generation via Imagen 4 Ultra',
      componentValidation: 'Automatic quality checks on component count',
    },
    model: 'gemini-3-flash-preview',
  });
}
