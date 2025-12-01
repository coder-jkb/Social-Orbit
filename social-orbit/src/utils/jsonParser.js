/**
 * JSON Parsing Utilities
 * Robust parsers for extracting JSON from AI responses
 * 
 * AI responses may include extra commentary, markdown formatting,
 * or incomplete JSON. These helpers extract valid JSON robustly.
 */

/**
 * Extract the first valid JSON object from a raw string
 * Handles markdown code blocks, trailing text, and malformed JSON
 * @param {string} raw - Raw AI response text
 * @returns {Object} Parsed JSON object
 * @throws {Error} If no valid JSON object found
 */
export function extractFirstJsonObject(raw) {
  if (!raw) throw new Error("Empty AI response");
  
  // Clean markdown formatting and common issues
  let cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/^\s*[\r\n]+/, '') // Remove leading newlines
    .trim();
  
  // Remove thinking/reasoning blocks that some models output
  cleaned = cleaned
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
    .trim();
  
  // Attempt direct parse first
  try { 
    return JSON.parse(cleaned); 
  } catch {
    // Continue to fallback parsing
  }
  
  // Scan for first complete JSON object
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;
  
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    
    if (escape) {
      escape = false;
      continue;
    }
    
    if (ch === '\\') {
      escape = true;
      continue;
    }
    
    if (ch === '"' && !escape) {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
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
  
  // Try to fix common JSON issues and parse again
  const fixedJson = tryFixJson(cleaned);
  if (fixedJson) {
    try {
      return JSON.parse(fixedJson);
    } catch {
      // Continue to fallback
    }
  }
  
  // Last resort: extract values manually
  const extracted = extractValuesManually(cleaned);
  if (extracted && Object.keys(extracted).length > 0) {
    console.warn('Used manual extraction for malformed JSON');
    return extracted;
  }
  
  throw new Error("Failed to parse AI JSON object");
}

/**
 * Try to fix common JSON formatting issues
 */
function tryFixJson(text) {
  // Find the JSON-like content
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  
  let json = jsonMatch[0];
  
  // Fix trailing commas
  json = json.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix unquoted keys
  json = json.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  // Fix single quotes to double quotes (careful with apostrophes)
  json = json.replace(/'([^']+)'(\s*[,}\]])/g, '"$1"$2');
  
  return json;
}

/**
 * Manually extract key values when JSON is malformed
 * Returns object with x, y, icon, summary, reasoning if found
 */
function extractValuesManually(text) {
  const result = {};
  
  // Extract x value
  const xMatch = text.match(/["']?x["']?\s*[:=]\s*(\d+)/i);
  if (xMatch) result.x = parseInt(xMatch[1], 10);
  
  // Extract y value  
  const yMatch = text.match(/["']?y["']?\s*[:=]\s*(\d+)/i);
  if (yMatch) result.y = parseInt(yMatch[1], 10);
  
  // Extract icon
  const iconMatch = text.match(/["']?icon["']?\s*[:=]\s*["']?(\w+)["']?/i);
  if (iconMatch) result.icon = iconMatch[1];
  
  // Extract summary
  const summaryMatch = text.match(/["']?summary["']?\s*[:=]\s*["']([^"']+)["']/i);
  if (summaryMatch) result.summary = summaryMatch[1];
  
  // Extract reasoning
  const reasoningMatch = text.match(/["']?reasoning["']?\s*[:=]\s*["']([^"']+)["']/i);
  if (reasoningMatch) result.reasoning = reasoningMatch[1];
  
  // Only return if we got at least x and y
  if (result.x !== undefined && result.y !== undefined) {
    return result;
  }
  
  // Try to find any numbers that could be coordinates
  const numbers = text.match(/\b(\d{1,3})\b/g);
  if (numbers && numbers.length >= 2) {
    const [x, y] = numbers.map(n => parseInt(n, 10)).filter(n => n >= 0 && n <= 100);
    if (x !== undefined && y !== undefined) {
      return { x, y, icon: 'User', summary: 'Analyzed', reasoning: 'Extracted from response' };
    }
  }
  
  return null;
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
  let cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim();
  
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
  let inString = false;
  let escape = false;
  
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    
    if (escape) {
      escape = false;
      continue;
    }
    
    if (ch === '\\') {
      escape = true;
      continue;
    }
    
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
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
  
  // Last resort: trim and try
  const lastBracket = cleaned.lastIndexOf(']');
  const firstBracket = cleaned.indexOf('[');
  if (lastBracket !== -1 && firstBracket !== -1) {
    const candidate = cleaned.slice(firstBracket, lastBracket + 1);
    try { 
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Final attempt failed
    }
  }
  
  throw new Error("Failed to parse AI JSON array");
}
