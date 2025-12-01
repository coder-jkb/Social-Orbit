/**
 * Vector Store Service
 * 
 * Lightweight client-side vector storage for relationship context.
 * 
 * FREE EMBEDDING OPTIONS:
 * 1. Hugging Face Inference API (free tier) - Used by default
 * 2. Keyword-based fallback - Always available, no API needed
 * 
 * The HuggingFace free tier has rate limits but is completely free.
 */

// ============================================================================
// EMBEDDING CONFIG - DISABLED (HuggingFace has CORS issues from browsers)
// ============================================================================

const EMBEDDING_CONFIG = {
  // HuggingFace Inference API doesn't support CORS from browsers
  // Using keyword-based similarity instead (see relationshipContext.js)
  enabled: false
};

// ============================================================================
// VECTOR MATH
// ============================================================================

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal)
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

// ============================================================================
// EMBEDDING GENERATION - HUGGING FACE FREE API
// ============================================================================

/**
 * Generate embedding using HuggingFace Inference API (FREE)
 */
export async function generateEmbedding(apiKey, text) {
  // Skip if disabled or no text
  if (!EMBEDDING_CONFIG.enabled || !text) return null;
  
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add HF token if available (for higher rate limits)
    if (EMBEDDING_CONFIG.hfToken) {
      headers['Authorization'] = `Bearer ${EMBEDDING_CONFIG.hfToken}`;
    }
    
    const response = await fetch(EMBEDDING_CONFIG.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        inputs: text.substring(0, 512), // Model max length
        options: { wait_for_model: true }
      })
    });
    
    if (response.status === 503) {
      // Model loading, will be ready soon
      console.log('HuggingFace model loading, using keyword fallback...');
      return null;
    }
    
    if (response.status === 429) {
      // Rate limited
      console.log('HuggingFace rate limit, using keyword fallback...');
      return null;
    }
    
    if (!response.ok) {
      console.warn('HuggingFace API error:', response.status);
      return null;
    }
    
    const embedding = await response.json();
    
    // Response is directly the embedding array
    if (Array.isArray(embedding) && embedding.length === EMBEDDING_CONFIG.dimensions) {
      return embedding;
    }
    
    // Sometimes nested in array
    if (Array.isArray(embedding) && Array.isArray(embedding[0])) {
      return embedding[0];
    }
    
    return null;
    
  } catch (error) {
    console.warn('Embedding error (using keyword fallback):', error.message);
    return null;
  }
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddingsBatch(apiKey, texts) {
  if (!EMBEDDING_CONFIG.enabled || !texts || texts.length === 0) {
    return texts.map(() => null);
  }
  
  // Process one at a time to avoid rate limits
  const results = [];
  for (const text of texts) {
    const embedding = await generateEmbedding(apiKey, text);
    results.push(embedding);
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 100));
  }
  return results;
}

// ============================================================================
// VECTOR STORE CLASS
// ============================================================================

class VectorStore {
  constructor() {
    this.vectors = new Map(); // friendId -> { embedding, metadata }
    this.initialized = false;
  }
  
  /**
   * Initialize store with existing friend data
   */
  async initialize(friends) {
    this.vectors.clear();
    
    for (const friend of friends) {
      if (friend.embedding) {
        this.vectors.set(friend.id, {
          embedding: friend.embedding,
          metadata: {
            name: friend.name,
            x: friend.x,
            y: friend.y,
            summary: friend.summary,
            description: friend.description
          }
        });
      }
    }
    
    this.initialized = true;
    console.log(`Vector store initialized with ${this.vectors.size} embeddings`);
  }
  
  /**
   * Add or update a friend's embedding
   */
  async upsert(friendId, embedding, metadata) {
    if (!embedding) return false;
    
    this.vectors.set(friendId, { embedding, metadata });
    return true;
  }
  
  /**
   * Remove a friend's embedding
   */
  remove(friendId) {
    return this.vectors.delete(friendId);
  }
  
  /**
   * Find most similar relationships by embedding
   */
  findSimilar(queryEmbedding, topK = 5, excludeIds = []) {
    if (!queryEmbedding) return [];
    
    const results = [];
    
    for (const [id, data] of this.vectors) {
      if (excludeIds.includes(id)) continue;
      
      const similarity = cosineSimilarity(queryEmbedding, data.embedding);
      results.push({
        id,
        similarity,
        ...data.metadata
      });
    }
    
    // Sort by similarity (highest first)
    results.sort((a, b) => b.similarity - a.similarity);
    
    return results.slice(0, topK);
  }
  
  /**
   * Find similar relationships by text (generates embedding first)
   */
  async findSimilarByText(apiKey, text, topK = 5, excludeIds = []) {
    const embedding = await generateEmbedding(apiKey, text);
    if (!embedding) return [];
    
    return this.findSimilar(embedding, topK, excludeIds);
  }
  
  /**
   * Get statistics about the store
   */
  getStats() {
    return {
      totalVectors: this.vectors.size,
      initialized: this.initialized,
      embeddingsEnabled: EMBEDDING_CONFIG.enabled
    };
  }
  
  /**
   * Export all vectors for persistence
   */
  export() {
    const data = {};
    for (const [id, entry] of this.vectors) {
      data[id] = entry;
    }
    return data;
  }
  
  /**
   * Import vectors from persistence
   */
  import(data) {
    this.vectors.clear();
    for (const [id, entry] of Object.entries(data)) {
      this.vectors.set(id, entry);
    }
    this.initialized = true;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const vectorStore = new VectorStore();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create text for embedding from friend data
 */
export function createFriendEmbeddingText(friend) {
  const parts = [
    `Friend: ${friend.name}`,
    friend.gender ? `Gender: ${friend.gender}` : '',
    `Description: ${friend.description}`,
    friend.summary ? `Summary: ${friend.summary}` : ''
  ];
  
  return parts.filter(Boolean).join('. ');
}

/**
 * Build context from similar relationships for LLM prompt
 */
export function buildVectorContext(similarResults) {
  if (!similarResults || similarResults.length === 0) {
    return '';
  }
  
  const examples = similarResults
    .filter(r => r.similarity > 0.5)
    .map((r, i) => {
      return `Reference ${i + 1} (${Math.round(r.similarity * 100)}% similar):
  - Name: ${r.name}
  - Position: X=${Math.round(r.x)}, Y=${Math.round(r.y)}
  - Summary: ${r.summary || 'N/A'}`;
    });
  
  if (examples.length === 0) return '';
  
  return `
## CONTEXT: Semantically similar relationships
${examples.join('\n\n')}
---
`;
}

// ============================================================================
// INTEGRATION HELPERS
// ============================================================================

/**
 * Enrich friend with embedding (async, non-blocking)
 */
export async function enrichFriendWithEmbedding(apiKey, friend) {
  if (!EMBEDDING_CONFIG.enabled) return friend;
  
  const text = createFriendEmbeddingText(friend);
  const embedding = await generateEmbedding(apiKey, text);
  
  if (embedding) {
    await vectorStore.upsert(friend.id, embedding, {
      name: friend.name,
      x: friend.x,
      y: friend.y,
      summary: friend.summary,
      description: friend.description
    });
    
    return { ...friend, embedding };
  }
  
  return friend;
}

/**
 * Get vector context for analysis (falls back gracefully)
 */
export async function getVectorContextForAnalysis(apiKey, friendDescription, excludeIds = []) {
  if (!EMBEDDING_CONFIG.enabled || vectorStore.getStats().totalVectors === 0) {
    return { context: '', similarCount: 0, similar: [] };
  }
  
  const similar = await vectorStore.findSimilarByText(apiKey, friendDescription, 3, excludeIds);
  return {
    context: buildVectorContext(similar),
    similarCount: similar.length,
    similar
  };
}
