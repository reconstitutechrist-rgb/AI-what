import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { AppConcept } from "@/types/appConcept";
import { LayoutManifest } from "@/types/schema";

export class ArchitectService {
  private genAI: GoogleGenerativeAI;
  private fileManager: GoogleAIFileManager;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.fileManager = new GoogleAIFileManager(apiKey);
    
    // Gemini 3 Pro is required for "Deep Think" and Video Analysis
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-3-pro-preview", 
      generationConfig: { responseMimeType: "application/json" }
    });
  }

  /**
   * THE AUTOMATED INGEST PIPELINE
   * Replaces the manual "Ingest-Then-Edit" workflow.
   */
  async generateLayoutManifest(
    concept: AppConcept, 
    userPrompt: string,
    videoFile?: File
  ): Promise<LayoutManifest> {
    
    const systemPrompt = `
      ROLE: Expert Frontend Architect.
      CONTEXT: App "${concept.name}" - ${concept.purpose}.
      
      TASK:
      1. Analyze the input (Video/Image/Text).
      2. Construct a Recursive UI Schema (LayoutManifest).
      
      TEMPORAL INFERENCE RULES (Video Only):
      - INFER STATE: If a spinner appears, set 'state.isLoading = true'.
      - INFER TRANSITIONS: If a menu slides/fades, set 'state.isHidden = true' and 'styles.motion' props.
      - INFER TRIGGERS: If an element reacts to a cursor, set 'state.trigger = hover'.
      
      OUTPUT FORMAT: JSON only (LayoutManifest).
    `;

    const parts: any[] = [{ text: systemPrompt }];
    
    if (userPrompt) {
      parts.push({ text: `USER REQUEST: ${userPrompt}` });
    }

    // --- AUTOMATED INGESTION (No User Action Required) ---
    if (videoFile) {
      console.log("Uploading video for Temporal Inference...");
      
      try {
        // 1. Upload to Google File API (Solves the "Heavy Media" issue)
        const uploadResult = await this.uploadToGemini(videoFile);
        
        // 2. Pass the URI to the Model (The model reads from the server, not the browser)
        parts.push({ 
          fileData: { 
            mimeType: uploadResult.mimeType, 
            fileUri: uploadResult.uri 
          } 
        });
        
        parts.push({ text: "VIDEO ANALYSIS: Identify hidden states, transitions, and loading sequences." });
        
      } catch (e) {
        console.error("Video Ingest Failed", e);
        // Fallback or throw error
      }
    }
    // -----------------------------------------------------

    const result = await this.model.generateContent(parts);
    return JSON.parse(result.response.text());
  }

  /**
   * HELPER: Uploads file to Gemini API and waits for processing.
   */
  private async uploadToGemini(file: File): Promise<{ uri: string; mimeType: string }> {
    // Convert File to Buffer/ArrayBuffer for upload
    const buffer = await file.arrayBuffer();
    
    // Create temporary file path (Node.js environment) or Stream
    // Note: In a browser environment, you might need a proxy route to handle this 
    // because GoogleAIFileManager is a server-side SDK. 
    // This example assumes this service runs in a Next.js Server Action or API Route.
    
    // 1. Upload
    const uploadResponse = await this.fileManager.uploadFile(Buffer.from(buffer), {
      mimeType: file.type,
      displayName: file.name,
    });

    // 2. Wait for Processing (Video takes time to ingest)
    let fileState = await this.fileManager.getFile(uploadResponse.file.name);
    while (fileState.state === FileState.PROCESSING) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      fileState = await this.fileManager.getFile(uploadResponse.file.name);
    }

    if (fileState.state === FileState.FAILED) {
      throw new Error("Video processing failed.");
    }

    return { uri: fileState.uri, mimeType: fileState.mimeType };
  }
}
