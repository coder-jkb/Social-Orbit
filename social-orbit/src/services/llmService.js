/**
 * LLM Service
 * Handles all AI/LLM related operations
 */

import { SINGLE_ANALYSIS_PROMPT, BULK_ANALYSIS_PROMPT, RECALCULATE_PROMPT, API_CONFIG } from '../constants';
import { extractFirstJsonObject, extractFirstJsonArray } from '../utils/jsonParser';
import { ICON_MAP, DEFAULT_ICON } from '../constants/icons';

/**
 * Generate mock analysis data for testing without API
 * @returns {Object} Mock analysis result
 */
export function generateMockAnalysis() {
  const x = Math.floor(Math.random() * 90);
  const y = Math.floor(Math.random() * 90);
  const icons = Object.keys(ICON_MAP);
  return {
    x,
    y,
    icon: icons[Math.floor(Math.random() * icons.length)],
    summary: "Simulated Analysis (Mock Mode)",
    reasoning: "Random coordinates generated because Mock Mode is active."
  };
}

/**
 * Validate and normalize analysis result
 * @param {Object} analysis - Raw analysis from AI
 * @returns {Object} Validated analysis with defaults applied
 */
function validateAnalysis(analysis) {
  return {
    ...analysis,
    x: Math.min(Math.max(Number(analysis.x) || 50, 0), 100),
    y: Math.min(Math.max(Number(analysis.y) || 50, 0), 100),
    icon: ICON_MAP[analysis.icon] ? analysis.icon : DEFAULT_ICON,
    summary: analysis.summary || 'No summary',
    reasoning: analysis.reasoning || 'No reasoning provided'
  };
}

/**
 * Analyze a single friend using AI
 * @param {Object} params - Analysis parameters
 * @param {string} params.apiKey - OpenRouter API key
 * @param {Object} params.userPersona - User's persona data
 * @param {Object} params.friendData - Friend's form data
 * @param {boolean} params.useMockMode - Whether to use mock mode
 * @returns {Promise<Object>} Analysis result
 */
export async function analyzeFriend({ apiKey, userPersona, friendData, useMockMode }) {
  // Use mock mode if enabled or no API key
  if (useMockMode || !apiKey) {
    await new Promise(r => setTimeout(r, 1000)); // Simulate delay
    return validateAnalysis(generateMockAnalysis());
  }

  try {
    const response = await fetch(API_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.href,
      },
      body: JSON.stringify({
        model: API_CONFIG.singleModel,
        messages: [
          { role: "system", content: SINGLE_ANALYSIS_PROMPT },
          { role: "user", content: `My Persona: ${JSON.stringify(userPersona)}\nFriend: ${JSON.stringify(friendData)}` }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || `API Error: ${response.status}`);
    }
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI returned an empty response. Try again.");
    }

    const analysis = extractFirstJsonObject(content);
    return validateAnalysis(analysis);
    
  } catch (error) {
    console.error('LLM Analysis Error:', error);
    throw error;
  }
}

/**
 * Analyze multiple friends in bulk using AI
 * @param {Object} params - Analysis parameters
 * @param {string} params.apiKey - OpenRouter API key
 * @param {Object} params.userPersona - User's persona data
 * @param {Array} params.friendsList - Array of friend data objects
 * @param {boolean} params.useMockMode - Whether to use mock mode
 * @returns {Promise<Array>} Array of analysis results
 */
export async function analyzeFriendsBulk({ apiKey, userPersona, friendsList, useMockMode }) {
  // Filter out empty items
  const validItems = friendsList.filter(item => 
    item.name?.trim() && item.description?.trim()
  );
  
  if (validItems.length === 0) {
    throw new Error("No valid friends to analyze");
  }

  // Use mock mode if enabled or no API key
  if (useMockMode || !apiKey) {
    await new Promise(r => setTimeout(r, 1500)); // Simulate delay
    return validItems.map(item => ({
      ...validateAnalysis(generateMockAnalysis()),
      name: item.name,
      gender: item.gender,
      age: item.age,
      description: item.description
    }));
  }

  try {
    // Construct structured text prompt from list
    const friendsText = validItems.map((f, i) => 
      `Friend ${i + 1}: Name: ${f.name}, Gender: ${f.gender}, Age: ${f.age}. Description: ${f.description}`
    ).join('\n\n');

    const response = await fetch(API_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.href,
      },
      body: JSON.stringify({
        model: API_CONFIG.bulkModel,
        messages: [
          { role: "system", content: BULK_ANALYSIS_PROMPT },
          { role: "user", content: `My Persona: ${JSON.stringify(userPersona)}\n\nFriends List to Analyze:\n${friendsText}` }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || `API Error: ${response.status}`);
    }
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI returned an empty response.");
    }

    const results = extractFirstJsonArray(content);
    return results.map(item => validateAnalysis(item));
    
  } catch (error) {
    console.error('LLM Bulk Analysis Error:', error);
    throw error;
  }
}

/**
 * Recalculate positions for selected friends
 * @param {Object} params - Recalculation parameters
 * @param {string} params.apiKey - OpenRouter API key
 * @param {Object} params.userPersona - User's persona data
 * @param {Array} params.friendsToRecalculate - Array of friend objects to recalculate
 * @param {boolean} params.useMockMode - Whether to use mock mode
 * @returns {Promise<Array>} Array of recalculated results with original IDs
 */
export async function recalculateFriends({ apiKey, userPersona, friendsToRecalculate, useMockMode }) {
  if (friendsToRecalculate.length === 0) {
    throw new Error("No friends selected for recalculation");
  }

  // Use mock mode if enabled or no API key
  if (useMockMode || !apiKey) {
    await new Promise(r => setTimeout(r, 1500));
    return friendsToRecalculate.map(friend => ({
      id: friend.id,
      ...validateAnalysis(generateMockAnalysis())
    }));
  }

  try {
    // Construct structured text for recalculation
    const friendsText = friendsToRecalculate.map((f, i) => 
      `Friend ${i + 1} (ID: ${f.id}):
       Name: ${f.name}
       Gender: ${f.gender}
       Age: ${f.age}
       Description: ${f.description}`
    ).join('\n\n---\n\n');

    const response = await fetch(API_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.href,
      },
      body: JSON.stringify({
        model: API_CONFIG.recalculateModel,
        messages: [
          { role: "system", content: RECALCULATE_PROMPT },
          { role: "user", content: `My Persona: ${JSON.stringify(userPersona)}\n\nFriends to Recalculate:\n${friendsText}` }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || `API Error: ${response.status}`);
    }
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI returned an empty response.");
    }

    const results = extractFirstJsonArray(content);
    
    // Validate and map results back to original IDs
    return results.map((result, index) => ({
      id: result.id || friendsToRecalculate[index].id,
      ...validateAnalysis(result)
    }));
    
  } catch (error) {
    console.error('LLM Recalculate Error:', error);
    throw error;
  }
}

