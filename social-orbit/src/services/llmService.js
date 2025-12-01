/**
 * LLM Service
 * 
 * OPTIMIZED TWO-STEP ANALYSIS WITH CONTEXT:
 * 1. Find similar past relationships for context (few-shot learning)
 * 2. Extract structured data from description
 * 3. Calculate X,Y using context + extracted data
 * 
 * This provides consistent, context-aware results.
 */

import { 
  EXTRACTION_PROMPT, 
  CALCULATION_PROMPT, 
  BULK_EXTRACTION_PROMPT,
  BULK_CALCULATION_PROMPT,
  API_CONFIG 
} from '../constants';
import { extractFirstJsonObject, extractFirstJsonArray } from '../utils/jsonParser';
import { ICON_MAP, DEFAULT_ICON } from '../constants/icons';
import { buildContextForAnalysis, validateCoordinates } from './relationshipContext';

// ============================================================================
// MOCK DATA - For testing without API
// ============================================================================

const MOCK_EXTRACTION = {
  communication_frequency: 'We communicate about once a week',
  communication_channels: 'Mostly through text messages and occasional video calls',
  last_interaction: 'We had a meaningful conversation within the past week',
  sharing_depth: 'We share some personal things but not our deepest secrets',
  trust_level: 'I trust them with moderate personal matters',
  emotional_support: 'We offer each other support occasionally when needed',
  how_they_met: 'We met through work or mutual friends',
  relationship_duration: 'We have known each other for 2-5 years',
  emergency_call: 'I might call them in an emergency',
  relationship_status: 'The relationship is active and ongoing',
  barriers: 'Busy schedules sometimes limit our interaction',
  overall_sentiment: 'Overall I feel positive about this friendship'
};

export function generateMockAnalysis() {
  const x = Math.floor(Math.random() * 60) + 20;
  const y = Math.floor(Math.random() * 60) + 20;
  const icons = Object.keys(ICON_MAP);
  return {
    x,
    y,
    icon: icons[Math.floor(Math.random() * icons.length)],
    summary: "Simulated Analysis (Mock Mode)",
    reasoning: "Random coordinates generated because Mock Mode is active.",
    extractedData: { ...MOCK_EXTRACTION }
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

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

// ============================================================================
// API HELPER
// ============================================================================

async function callLLM(apiKey, model, systemPrompt, userContent) {
  const response = await fetch(API_CONFIG.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.href,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ]
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || `API Error: ${response.status}`);
  }
  
  return data.choices?.[0]?.message?.content || '';
}

// ============================================================================
// SINGLE FRIEND ANALYSIS (with context)
// ============================================================================

async function extractRelationshipData(apiKey, userPersona, friendData, contextStr = '') {
  const userContent = `${contextStr}
## User's Personality Context:
${JSON.stringify(userPersona, null, 2)}

## NEW Friend to Analyze:
- Name: ${friendData.name}
- Gender: ${friendData.gender}
- Age: ${friendData.age}

## Relationship Description:
${friendData.description}

Extract the 12 key facts from this description.`;

  const response = await callLLM(apiKey, API_CONFIG.extractionModel, EXTRACTION_PROMPT, userContent);
  return extractFirstJsonObject(response);
}

async function calculateCoordinates(apiKey, extractedData, friendName, contextStr = '') {
  const userContent = `${contextStr}
## Friend: ${friendName}

## Extracted Relationship Data:
${JSON.stringify(extractedData, null, 2)}

Calculate the X and Y coordinates based on this data.`;

  const response = await callLLM(apiKey, API_CONFIG.calculationModel, CALCULATION_PROMPT, userContent);
  return extractFirstJsonObject(response);
}

/**
 * Analyze a single friend with context from similar past relationships
 */
export async function analyzeFriend({ apiKey, userPersona, friendData, useMockMode, existingFriends = [] }) {
  if (useMockMode || !apiKey) {
    await new Promise(r => setTimeout(r, 1500));
    return validateAnalysis(generateMockAnalysis());
  }

  try {
    // Step 0: Build context from similar relationships
    const { context, similarCount } = buildContextForAnalysis(friendData, existingFriends);
    console.log(`Found ${similarCount} similar relationships for context`);

    // Step 1: Extract structured data
    console.log('Step 1: Extracting relationship data...');
    const extractedData = await extractRelationshipData(apiKey, userPersona, friendData, context);
    console.log('Extracted:', extractedData);

    // Step 2: Calculate coordinates
    console.log('Step 2: Calculating coordinates...');
    const coordinates = await calculateCoordinates(apiKey, extractedData, friendData.name, context);
    console.log('Calculated:', coordinates);

    // Step 3: Validate against typical ranges
    const validation = validateCoordinates(coordinates.x, coordinates.y, friendData.description);
    if (validation.warnings.length > 0) {
      console.warn('Coordinate validation warnings:', validation.warnings);
    }

    return validateAnalysis({
      ...coordinates,
      extractedData,
      category: validation.category,
      validationWarnings: validation.warnings
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

// ============================================================================
// BULK ANALYSIS (with cross-referencing)
// ============================================================================

async function extractBulkData(apiKey, userPersona, friendsList) {
  const friendsText = friendsList.map((f, i) => `
### Friend ${i + 1}: ${f.name}
- Gender: ${f.gender}
- Age: ${f.age}
- Description: ${f.description}
`).join('\n---\n');

  const userContent = `
## User's Personality:
${JSON.stringify(userPersona, null, 2)}

## Friends to Analyze:
${friendsText}

Extract the 12 key facts for EACH friend.`;

  const response = await callLLM(apiKey, API_CONFIG.bulkModel, BULK_EXTRACTION_PROMPT, userContent);
  return extractFirstJsonArray(response);
}

async function calculateBulkCoordinates(apiKey, extractedDataArray) {
  const userContent = `
## Extracted Data for All Friends:
${JSON.stringify(extractedDataArray, null, 2)}

Calculate X,Y for each friend. Be CONSISTENT - similar data = similar scores.`;

  const response = await callLLM(apiKey, API_CONFIG.bulkModel, BULK_CALCULATION_PROMPT, userContent);
  return extractFirstJsonArray(response);
}

export async function analyzeFriendsBulk({ apiKey, userPersona, friendsList, useMockMode, existingFriends = [] }) {
  const validItems = friendsList.filter(item => item.name?.trim() && item.description?.trim());
  
  if (validItems.length === 0) {
    throw new Error("No valid friends to analyze");
  }

  if (useMockMode || !apiKey) {
    await new Promise(r => setTimeout(r, 2000));
    return validItems.map(item => ({
      ...validateAnalysis(generateMockAnalysis()),
      name: item.name,
      gender: item.gender,
      age: item.age,
      description: item.description
    }));
  }

  try {
    // Log context info
    if (existingFriends.length > 0) {
      console.log(`Using ${existingFriends.length} existing friends for consistency reference`);
    }
    
    console.log('Bulk Step 1: Extracting data for', validItems.length, 'friends...');
    const extractedDataArray = await extractBulkData(apiKey, userPersona, validItems);

    console.log('Bulk Step 2: Calculating coordinates...');
    const coordinatesArray = await calculateBulkCoordinates(apiKey, extractedDataArray);

    return coordinatesArray.map((coords, index) => {
      const original = validItems[index];
      const extracted = extractedDataArray[index];
      return validateAnalysis({
        ...coords,
        name: original.name,
        gender: original.gender,
        age: original.age,
        description: original.description,
        extractedData: extracted
      });
    });
    
  } catch (error) {
    console.error('Bulk analysis error:', error);
    throw error;
  }
}

// ============================================================================
// RECALCULATE (with full context)
// ============================================================================

export async function recalculateFriends({ apiKey, userPersona, friendsToRecalculate, useMockMode, allFriends = [] }) {
  if (friendsToRecalculate.length === 0) {
    throw new Error("No friends selected for recalculation");
  }

  if (useMockMode || !apiKey) {
    await new Promise(r => setTimeout(r, 1500));
    return friendsToRecalculate.map(friend => ({
      id: friend.id,
      ...validateAnalysis(generateMockAnalysis())
    }));
  }

  try {
    // Get context from friends NOT being recalculated (for reference)
    const contextFriends = allFriends.filter(f => 
      !friendsToRecalculate.some(r => r.id === f.id)
    );

    const friendsList = friendsToRecalculate.map(f => ({
      name: f.name,
      gender: f.gender,
      age: f.age,
      description: f.description
    }));

    // Log context for debugging
    if (contextFriends.length > 0) {
      const samples = contextFriends.slice(0, 5).map(f => 
        `${f.name}: X=${Math.round(f.x)}, Y=${Math.round(f.y)}`
      ).join(', ');
      console.log(`Using ${contextFriends.length} friends for context reference: ${samples}`);
    }

    console.log('Recalculate: Extracting data...');
    const extractedDataArray = await extractBulkData(apiKey, userPersona, friendsList);

    console.log('Recalculate: Calculating coordinates...');
    const coordinatesArray = await calculateBulkCoordinates(apiKey, extractedDataArray);

    return coordinatesArray.map((coords, index) => {
      const original = friendsToRecalculate[index];
      return {
        id: original.id,
        ...validateAnalysis(coords),
        extractedData: extractedDataArray[index]
      };
    });
    
  } catch (error) {
    console.error('Recalculate error:', error);
    throw error;
  }
}
