/**
 * Model Configuration
 * 
 * Uses Claude 3.5 Haiku via OpenRouter for high-quality analysis.
 */

// ============================================================================
// MODEL CONFIGURATION
// ============================================================================

export const API_CONFIG = {
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  
  // Claude 3.5 Haiku - Fast, smart, affordable
  model: 'anthropic/claude-3.5-haiku',
  
  // Settings
  maxTokens: 1024,
  temperature: 0.3  // Lower for consistent JSON output
};

// ============================================================================
// LLM CALL FUNCTION
// ============================================================================

/**
 * Call Claude via OpenRouter
 */
export async function callLLM(apiKey, systemPrompt, userContent, options = {}) {
  if (!apiKey) {
    throw new Error('API key required. Get one at openrouter.ai');
  }
  
  const model = options.model || API_CONFIG.model;
  const maxTokens = options.maxTokens || API_CONFIG.maxTokens;
  
  console.log(`Calling: ${model}`);
  
  const response = await fetch(API_CONFIG.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.href,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: API_CONFIG.temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ]
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    const errorMsg = data.error?.message || `API Error: ${response.status}`;
    throw new Error(errorMsg);
  }
  
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from AI');
  }
  
  console.log('AI Response received');
  return content;
}

// ============================================================================
// UTILITY
// ============================================================================

export function getModelInfo() {
  return {
    model: API_CONFIG.model,
    provider: 'OpenRouter',
    description: 'Claude 3.5 Haiku - Fast and intelligent'
  };
}
