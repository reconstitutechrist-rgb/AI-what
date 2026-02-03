/**
 * Embedding Service
 *
 * Wrapper around OpenAI's text-embedding-3-small model for generating
 * vector embeddings used by the Skill Library for similarity search.
 *
 * Uses 1536-dimensional vectors to match the pgvector column definition.
 * Server-side only — called from API routes, not client code.
 */

import OpenAI from 'openai';

// ============================================================================
// CONFIGURATION
// ============================================================================

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required for embeddings');
  }
  return new OpenAI({ apiKey });
}

// ============================================================================
// SERVICE
// ============================================================================

class EmbeddingServiceInstance {
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = getOpenAIClient();
    }
    return this.client;
  }

  /**
   * Generate a vector embedding for a single text input.
   * Returns a 1536-dimensional float array.
   */
  async embed(text: string): Promise<number[]> {
    const client = this.getClient();

    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8192), // Model max is 8191 tokens, truncate as safety
      dimensions: EMBEDDING_DIMENSIONS,
    });

    return response.data[0].embedding;
  }

  /**
   * Generate embeddings for multiple texts in a single API call.
   * More efficient than calling embed() in a loop.
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const client = this.getClient();

    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts.map((t) => t.slice(0, 8192)),
      dimensions: EMBEDDING_DIMENSIONS,
    });

    // Sort by index to maintain order
    return response.data
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
  }

  /**
   * Build an embedding-friendly text representation of a skill.
   * Combines the goal description with key reasoning for better similarity matching.
   */
  buildSkillText(goalDescription: string, reasoningSummary?: string, tags?: string[]): string {
    const parts = [goalDescription];
    if (reasoningSummary) {
      parts.push(`Approach: ${reasoningSummary.slice(0, 1000)}`);
    }
    if (tags && tags.length > 0) {
      parts.push(`Tags: ${tags.join(', ')}`);
    }
    return parts.join('\n');
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: EmbeddingServiceInstance | null = null;

export function getEmbeddingService(): EmbeddingServiceInstance {
  if (!_instance) {
    _instance = new EmbeddingServiceInstance();
  }
  return _instance;
}

export type { EmbeddingServiceInstance };
