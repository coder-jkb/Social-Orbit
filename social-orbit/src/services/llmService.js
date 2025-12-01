/**
 * LLM Service
 * 
 * TWO-STEP STRUCTURED ANALYSIS with Claude 3.5 Haiku:
 * 1. Extract structured data via 15 questions
 * 2. Calculate coordinates using scoring rules
 */

import { 
  EXTRACTION_PROMPT, 
  CALCULATION_PROMPT, 
  BULK_EXTRACTION_PROMPT,
  BULK_CALCULATION_PROMPT,
  createContextPrompt
} from '../constants';
import { callLLM } from '../constants/models';
import { extractFirstJsonObject, extractFirstJsonArray } from '../utils/jsonParser';
import { ICON_MAP, DEFAULT_ICON } from '../constants/icons';
import { buildContextForAnalysis, validateCoordinates } from './relationshipContext';
import { 
  vectorStore, 
  getVectorContextForAnalysis, 
  enrichFriendWithEmbedding
} from './vectorStore';

// ============================================================================
// MOCK DATA
// ============================================================================

export function generateMockAnalysis() {
  const x = Math.floor(Math.random() * 60) + 20;
  const y = Math.floor(Math.random() * 60) + 20;
  const icons = Object.keys(ICON_MAP);
  return {
    x,
    y,
    icon: icons[Math.floor(Math.random() * icons.length)],
    summary: "Mock Mode Active",
    reasoning: "Random values - Mock Mode"
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
    summary: analysis.summary || 'Analyzed',
    reasoning: analysis.reasoning || 'Analysis complete'
  };
}

// ============================================================================
// TWO-STEP ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Step 1: Extract structured relationship data
 */
async function extractRelationshipData(apiKey, userPersona, friendData, contextStr = '') {
  const userContent = `${contextStr}
## User Context:
${userPersona ? JSON.stringify(userPersona, null, 2) : 'Not provided'}

## Friend to Analyze:
- Name: ${friendData.name}
- Gender: ${friendData.gender || 'Not specified'}
- Age: ${friendData.age || 'Not specified'}

## Relationship Description:
${friendData.description}

Answer the 15 questions based on this description.`;

  const response = await callLLM(apiKey, EXTRACTION_PROMPT, userContent);
  return extractFirstJsonObject(response);
}

/**
 * Step 2: Calculate coordinates from extracted data
 */
async function calculateCoordinates(apiKey, extractedData, friendName, contextStr = '') {
  const userContent = `${contextStr}
## Friend: ${friendName}

## Extracted Relationship Data:
${JSON.stringify(extractedData, null, 2)}

Calculate X and Y coordinates using the scoring rules.`;

  const response = await callLLM(apiKey, CALCULATION_PROMPT, userContent);
  return extractFirstJsonObject(response);
}

// ============================================================================
// SINGLE FRIEND ANALYSIS
// ============================================================================

export async function analyzeFriend({ apiKey, userPersona, friendData, useMockMode, existingFriends = [] }) {
  if (useMockMode || !apiKey) {
    await new Promise(r => setTimeout(r, 1000));
    return validateAnalysis(generateMockAnalysis());
  }

  console.log(`\n=== Analyzing: ${friendData.name} ===`);

  // Get context from similar relationships
  let context = '';
  try {
    if (vectorStore.getStats().totalVectors > 0) {
      const vc = await getVectorContextForAnalysis(apiKey, friendData.description);
      context = vc.context || '';
    }
    if (!context && existingFriends.length > 0) {
      const kc = buildContextForAnalysis(friendData, existingFriends);
      context = kc.context || '';
    }
  } catch (e) {
    console.log('Context gathering skipped');
  }

  // Step 1: Extract structured data
  console.log('Step 1: Extracting relationship data...');
  const extractedData = await extractRelationshipData(apiKey, userPersona, friendData, context);
  console.log('Extracted:', extractedData);

  // Step 2: Calculate coordinates
  console.log('Step 2: Calculating coordinates...');
  const coordinates = await calculateCoordinates(apiKey, extractedData, friendData.name, context);
  console.log('Calculated:', coordinates);

  // Validate
  const validation = validateCoordinates(coordinates.x, coordinates.y, friendData.description);
  if (validation.warnings?.length > 0) {
    console.warn('Validation warnings:', validation.warnings);
  }

  const result = validateAnalysis({
    ...coordinates,
    extractedData,
    category: validation.category
  });

  // Store embedding for future context (non-blocking)
  enrichFriendWithEmbedding(apiKey, { ...friendData, ...result }).catch(() => {});

  return result;
}

// ============================================================================
// BATCH CONFIGURATION
// ============================================================================

const BATCH_CONFIG = {
  batchSize: 3,
  delayBetweenItems: 2000,
  delayBetweenBatches: 5000
};

// ============================================================================
// BULK ANALYSIS
// ============================================================================

export async function analyzeFriendsBulk({ 
  apiKey, 
  userPersona, 
  friendsList, 
  useMockMode, 
  existingFriends = [],
  onProgress = null
}) {
  const validItems = friendsList.filter(item => item.name?.trim() && item.description?.trim());
  
  if (validItems.length === 0) {
    throw new Error("No valid friends to analyze");
  }

  if (useMockMode || !apiKey) {
    await new Promise(r => setTimeout(r, 1500));
    return validItems.map(item => ({
      ...validateAnalysis(generateMockAnalysis()),
      name: item.name,
      gender: item.gender,
      age: item.age,
      description: item.description
    }));
  }

  const total = validItems.length;
  const results = [];
  let processed = 0;

  // Process in batches
  const batches = [];
  for (let i = 0; i < total; i += BATCH_CONFIG.batchSize) {
    batches.push(validItems.slice(i, i + BATCH_CONFIG.batchSize));
  }

  console.log(`Processing ${total} friends in ${batches.length} batches`);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];

    for (const item of batch) {
      try {
        const result = await analyzeFriend({
          apiKey,
          userPersona,
          friendData: item,
          useMockMode: false,
          existingFriends
        });
        results.push({
          ...result,
          name: item.name,
          gender: item.gender,
          age: item.age,
          description: item.description
        });
      } catch (e) {
        console.error(`Failed for ${item.name}:`, e.message);
        results.push({
          ...validateAnalysis({ x: 50, y: 50, icon: 'User', summary: 'Analysis failed', reasoning: e.message }),
          name: item.name,
          gender: item.gender,
          age: item.age,
          description: item.description
        });
      }

      processed++;
      if (onProgress) {
        onProgress({ processed, total, current: item.name });
      }

      if (processed < total) {
        await new Promise(r => setTimeout(r, BATCH_CONFIG.delayBetweenItems));
      }
    }

    if (batchIndex < batches.length - 1) {
      await new Promise(r => setTimeout(r, BATCH_CONFIG.delayBetweenBatches));
    }
  }

  return results;
}

// ============================================================================
// RECALCULATE
// ============================================================================

export async function recalculateFriends({ 
  apiKey, 
  userPersona, 
  friendsToRecalculate, 
  useMockMode, 
  allFriends = [],
  onProgress = null
}) {
  if (friendsToRecalculate.length === 0) {
    throw new Error("No friends selected");
  }

  if (useMockMode || !apiKey) {
    await new Promise(r => setTimeout(r, 1000));
    return friendsToRecalculate.map(friend => ({
      id: friend.id,
      ...validateAnalysis(generateMockAnalysis())
    }));
  }

  const total = friendsToRecalculate.length;
  const results = [];
  let processed = 0;

  // Split into batches
  const batches = [];
  for (let i = 0; i < total; i += BATCH_CONFIG.batchSize) {
    batches.push(friendsToRecalculate.slice(i, i + BATCH_CONFIG.batchSize));
  }

  console.log(`Recalculating ${total} friends in ${batches.length} batches`);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];

    for (const friend of batch) {
      try {
        const result = await analyzeFriend({
          apiKey,
          userPersona,
          friendData: friend,
          useMockMode: false,
          existingFriends: allFriends
        });
        results.push({ id: friend.id, ...result });
      } catch (e) {
        console.error(`Recalculate failed for ${friend.name}:`, e.message);
        results.push({
          id: friend.id,
          x: friend.x,
          y: friend.y,
          icon: friend.icon,
          summary: 'Recalculation failed',
          reasoning: e.message
        });
      }

      processed++;
      if (onProgress) {
        onProgress({ processed, total, current: friend.name });
      }

      if (processed < total) {
        await new Promise(r => setTimeout(r, BATCH_CONFIG.delayBetweenItems));
      }
    }

    if (batchIndex < batches.length - 1) {
      console.log('Waiting between batches...');
      await new Promise(r => setTimeout(r, BATCH_CONFIG.delayBetweenBatches));
    }
  }

  console.log(`Recalculation complete: ${results.length}/${total}`);
  return results;
}
