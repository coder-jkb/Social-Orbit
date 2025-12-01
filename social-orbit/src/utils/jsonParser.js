/**
 * JSON Parsing Utilities
 * Robust parsers for extracting JSON from AI responses
 * 
 * AI responses may include extra commentary, markdown formatting,
 * or incomplete JSON. These helpers extract valid JSON robustly.
 */

/**
 * Extract the first valid JSON object from a raw string
 * Handles markdown code blocks and trailing text
 * @param {string} raw - Raw AI response text
 * @returns {Object} Parsed JSON object
 * @throws {Error} If no valid JSON object found
 */
export function extractFirstJsonObject(raw) {
  if (!raw) throw new Error("Empty AI response");
  
  // Clean markdown formatting
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  
  // Attempt direct parse first
  try { 
    return JSON.parse(cleaned); 
  } catch {
    // Continue to fallback parsing
  }
  
  // Scan for first complete JSON object
  let depth = 0;
  let start = -1;
  
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const candidate = cleaned.slice(start, i + 1);
        try { 
          return JSON.parse(candidate); 
        } catch {
          // Continue scanning
        }
      }
    }
  }
  
  // Last resort: trim from start to last brace
  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace !== -1) {
    const candidate = cleaned.slice(0, lastBrace + 1);
    try { 
      return JSON.parse(candidate); 
    } catch {
      // Final attempt failed
    }
  }
  
  throw new Error("Failed to parse AI JSON object");
}

/**
 * Extract the first valid JSON array from a raw string
 * Handles markdown code blocks and trailing text
 * @param {string} raw - Raw AI response text
 * @returns {Array} Parsed JSON array
 * @throws {Error} If no valid JSON array found
 */
export function extractFirstJsonArray(raw) {
  if (!raw) throw new Error("Empty AI response");
  
  // Clean markdown formatting
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  
  // Attempt direct parse first
  try { 
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Continue to fallback parsing
  }
  
  // Scan for first complete JSON array
  let depth = 0;
  let start = -1;
  
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '[') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === ']') {
      depth--;
      if (depth === 0 && start !== -1) {
        const candidate = cleaned.slice(start, i + 1);
        try { 
          const parsed = JSON.parse(candidate);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // Continue scanning
        }
      }
    }
  }
  
  // Last resort: trim from start to last bracket
  const lastBracket = cleaned.lastIndexOf(']');
  if (lastBracket !== -1) {
    const candidate = cleaned.slice(0, lastBracket + 1);
    try { 
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Final attempt failed
    }
  }
  
  throw new Error("Failed to parse AI JSON array");
}

