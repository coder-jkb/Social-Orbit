/**
 * Relationship Context Service
 * 
 * Lightweight alternative to vector DB for finding similar relationships.
 * Uses keyword matching and simple scoring to find relevant context.
 * 
 * Benefits:
 * - No external dependencies
 * - Works entirely client-side
 * - Provides few-shot examples for consistency
 */

import { RELATIONSHIP_KEYWORDS } from '../constants/prompts';

// ============================================================================
// KEYWORD EXTRACTION
// ============================================================================

/**
 * Extract relationship type keywords from a description
 */
export function extractKeywords(description) {
  if (!description) return [];
  
  const text = description.toLowerCase();
  const found = [];
  
  for (const [category, keywords] of Object.entries(RELATIONSHIP_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        found.push({ category, keyword });
      }
    }
  }
  
  return found;
}

/**
 * Categorize a relationship based on description
 */
export function categorizeRelationship(description) {
  const keywords = extractKeywords(description);
  const categories = {};
  
  for (const { category } of keywords) {
    categories[category] = (categories[category] || 0) + 1;
  }
  
  // Return primary category (most matches)
  const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : 'other';
}

// ============================================================================
// SIMILARITY SCORING
// ============================================================================

/**
 * Calculate similarity score between two relationship descriptions
 * Returns 0-100 (higher = more similar)
 */
export function calculateSimilarity(desc1, desc2) {
  if (!desc1 || !desc2) return 0;
  
  const keywords1 = extractKeywords(desc1);
  const keywords2 = extractKeywords(desc2);
  
  if (keywords1.length === 0 || keywords2.length === 0) return 0;
  
  // Count matching categories
  const cats1 = new Set(keywords1.map(k => k.category));
  const cats2 = new Set(keywords2.map(k => k.category));
  
  let matches = 0;
  for (const cat of cats1) {
    if (cats2.has(cat)) matches++;
  }
  
  // Calculate Jaccard-like similarity
  const union = new Set([...cats1, ...cats2]).size;
  const similarity = (matches / union) * 100;
  
  return Math.round(similarity);
}

/**
 * Find most similar relationships from a list
 */
export function findSimilarRelationships(newDescription, existingFriends, limit = 3) {
  if (!existingFriends || existingFriends.length === 0) return [];
  
  const scored = existingFriends
    .filter(f => f.description && f.x !== undefined && f.y !== undefined)
    .map(friend => ({
      ...friend,
      similarity: calculateSimilarity(newDescription, friend.description)
    }))
    .filter(f => f.similarity > 20) // Only include if somewhat similar
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
  
  return scored;
}

// ============================================================================
// CONTEXT BUILDING
// ============================================================================

/**
 * Build context string for LLM prompt with similar relationships
 */
export function buildContextForAnalysis(newFriend, existingFriends) {
  const similar = findSimilarRelationships(newFriend.description, existingFriends);
  
  if (similar.length === 0) {
    return { context: '', similarCount: 0 };
  }
  
  const contextLines = similar.map((rel, i) => {
    const snippet = rel.description?.substring(0, 120).replace(/\n/g, ' ') || '';
    return `Reference ${i + 1} (${rel.similarity}% similar):
  Name: ${rel.name}
  Type: ${categorizeRelationship(rel.description)}
  Description: "${snippet}..."
  Position: X=${Math.round(rel.x)}, Y=${Math.round(rel.y)}
  Summary: ${rel.summary || 'N/A'}`;
  });
  
  const context = `
## REFERENCE: Similar relationships you've analyzed before
Use these for consistency - similar patterns should produce similar scores:

${contextLines.join('\n\n')}

---
Now analyze the NEW relationship below. If it's similar to a reference, the scores should be comparable.
`;
  
  return { context, similarCount: similar.length, similar };
}

// ============================================================================
// COORDINATE RANGE HELPERS
// ============================================================================

/**
 * Get typical coordinate ranges for a relationship category
 */
export function getTypicalRanges(category) {
  const ranges = {
    family: { x: [0, 30], y: [0, 50], note: 'Family bonds are typically strong (low X)' },
    childhood: { x: [10, 50], y: [20, 70], note: 'Childhood friends vary based on maintained contact' },
    work: { x: [40, 80], y: [20, 60], note: 'Work relationships are often moderate emotional depth' },
    romantic: { x: [0, 30], y: [0, 30], note: 'Romantic partners are usually close with frequent contact' },
    online: { x: [40, 80], y: [10, 50], note: 'Online friends can have frequent contact but moderate depth' },
    close: { x: [0, 40], y: [0, 50], note: 'Close friends have strong bonds' },
    distant: { x: [50, 90], y: [50, 100], note: 'Distant relationships have weaker bonds and less contact' },
    other: { x: [30, 70], y: [30, 70], note: 'General relationships vary widely' }
  };
  
  return ranges[category] || ranges.other;
}

/**
 * Validate coordinates against typical ranges (for sanity checking)
 */
export function validateCoordinates(x, y, description) {
  const category = categorizeRelationship(description);
  const ranges = getTypicalRanges(category);
  
  const warnings = [];
  
  if (x < ranges.x[0] || x > ranges.x[1]) {
    warnings.push(`X=${x} is unusual for ${category} relationships (typical: ${ranges.x[0]}-${ranges.x[1]})`);
  }
  
  if (y < ranges.y[0] || y > ranges.y[1]) {
    warnings.push(`Y=${y} is unusual for ${category} relationships (typical: ${ranges.y[0]}-${ranges.y[1]})`);
  }
  
  return {
    valid: warnings.length === 0,
    category,
    expectedRanges: ranges,
    warnings
  };
}

// ============================================================================
// ANALYSIS STATISTICS
// ============================================================================

/**
 * Get statistics about analyzed relationships (for debugging/display)
 */
export function getRelationshipStats(friends) {
  if (!friends || friends.length === 0) {
    return { total: 0, categories: {}, avgX: 0, avgY: 0 };
  }
  
  const categories = {};
  let sumX = 0, sumY = 0, count = 0;
  
  for (const friend of friends) {
    const cat = categorizeRelationship(friend.description);
    categories[cat] = (categories[cat] || 0) + 1;
    
    if (friend.x !== undefined && friend.y !== undefined) {
      sumX += friend.x;
      sumY += friend.y;
      count++;
    }
  }
  
  return {
    total: friends.length,
    categories,
    avgX: count > 0 ? Math.round(sumX / count) : 0,
    avgY: count > 0 ? Math.round(sumY / count) : 0
  };
}

