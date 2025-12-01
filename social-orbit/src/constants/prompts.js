/**
 * AI Prompts Configuration
 * 
 * OPTIMIZED TWO-STEP ANALYSIS SYSTEM:
 * 1. System prompt saved once (reusable)
 * 2. Context from similar past relationships (few-shot learning)
 * 3. Minimal user prompt with just the new friend data
 */

import { ICON_KEYS } from './icons';

// ============================================================================
// AXIS DEFINITIONS - Clear, descriptive labels
// ============================================================================

export const AXIS_DEFINITIONS = {
  x: {
    name: 'Emotional Bond Strength',
    description: 'How deep is the emotional connection and trust',
    scale: {
      0: 'Unbreakable Bond (family, soulmate, lifelong best friend)',
      25: 'Deep Connection (close friend, confidant, strong trust)',
      50: 'Moderate Bond (good friend, reliable, some personal sharing)',
      75: 'Surface Connection (acquaintance, casual, professional)',
      100: 'No Bond (stranger, no emotional investment)'
    }
  },
  y: {
    name: 'Communication Frequency',
    description: 'How often meaningful interaction occurs',
    scale: {
      0: 'Constant Contact (daily or near-daily meaningful interaction)',
      25: 'Regular Contact (multiple times per week)',
      50: 'Periodic Contact (weekly to monthly)',
      75: 'Infrequent Contact (few times per year)',
      100: 'No Contact (lost touch, no communication)'
    }
  }
};

// ============================================================================
// CORE SYSTEM PROMPT - Saved once, reused for all analyses
// ============================================================================

export const CORE_SYSTEM_PROMPT = `You are a Relationship Analyst that maps friendships onto a 2D coordinate system.

## COORDINATE SYSTEM:

### X-Axis: Emotional Bond Strength (0-100)
- 0 = Unbreakable Bond (soulmate, family you'd die for, lifelong best friend)
- 25 = Deep Connection (close friend, high trust, share personal struggles)
- 50 = Moderate Bond (good friend, reliable, enjoy each other's company)
- 75 = Surface Connection (acquaintance, coworker, casual interaction)
- 100 = No Bond (stranger, no emotional investment whatsoever)

### Y-Axis: Communication Frequency (0-100)
- 0 = Constant Contact (talk daily, always in touch)
- 25 = Regular Contact (few times a week)
- 50 = Periodic Contact (weekly to monthly)
- 75 = Infrequent Contact (few times a year, occasional)
- 100 = No Contact (lost touch completely, haven't talked in years)

## YOUR ROLE:
Analyze relationship descriptions and output precise X,Y coordinates based on the FACTS described, not the writing style or casual language used.`;

// ============================================================================
// EXTRACTION PROMPT - Extracts structured data from description
// ============================================================================

export const EXTRACTION_PROMPT = `${CORE_SYSTEM_PROMPT}

## CURRENT TASK: Extract Key Relationship Facts

Read the description and extract answers to these questions. Write natural sentences based on what's stated or clearly implied. If not mentioned, say "Not specified in description."

### Questions:

**Communication:**
1. How often do they actually communicate? (daily/weekly/monthly/yearly/never)
2. Through what channels? (in-person, calls, texts, social media)
3. When was their last meaningful conversation?

**Emotional Depth:**
4. Do they share personal problems or secrets with each other?
5. What level of trust exists between them?
6. Is there emotional support exchanged?

**Relationship Nature:**
7. How did they meet/know each other? (family/childhood/school/work/online)
8. How long have they known each other?
9. Would the user call them in a serious emergency?

**Current State:**
10. Is the relationship active, stable, or fading?
11. Are there barriers (distance, busy schedules, conflict)?
12. What's the overall sentiment about this relationship?

## OUTPUT (JSON only):
{
  "communication_frequency": "<sentence describing how often they talk>",
  "communication_channels": "<sentence about how they communicate>",
  "last_interaction": "<sentence about recent contact>",
  "sharing_depth": "<sentence about personal sharing level>",
  "trust_level": "<sentence about trust>",
  "emotional_support": "<sentence about support exchanged>",
  "how_they_met": "<sentence about origin of relationship>",
  "relationship_duration": "<sentence about how long known>",
  "emergency_call": "<sentence about if they'd call in emergency>",
  "relationship_status": "<sentence about if active/fading>",
  "barriers": "<sentence about obstacles>",
  "overall_sentiment": "<sentence about feelings toward relationship>"
}`;

// ============================================================================
// CALCULATION PROMPT - Calculates X,Y from extracted data
// ============================================================================

export const CALCULATION_PROMPT = `${CORE_SYSTEM_PROMPT}

## CURRENT TASK: Calculate Precise Coordinates

Based on the extracted relationship data, calculate X and Y values.

### X-Axis (Emotional Bond) - Start at 50, adjust:
| Factor | Strong Indicator | Adjustment |
|--------|------------------|------------|
| Trust | "Complete trust / would trust with life" | -20 |
| Trust | "High trust / very reliable" | -15 |
| Trust | "Moderate trust" | -5 |
| Trust | "Low trust / guarded" | +15 |
| Sharing | "Share deepest secrets" | -15 |
| Sharing | "Share personal issues" | -10 |
| Sharing | "Surface conversations only" | +10 |
| Support | "Always there for each other" | -15 |
| Support | "Occasional support" | 0 |
| Support | "No emotional support" | +10 |
| Emergency | "Would definitely call first" | -10 |
| Emergency | "Might call, depends" | 0 |
| Emergency | "Would not call" | +10 |
| Origin | "Family member" | -15 |
| Origin | "Childhood friend" | -10 |
| Sentiment | "Very positive/cherished" | -5 |
| Sentiment | "Negative feelings" | +10 |

### Y-Axis (Communication Frequency) - Start at 50, adjust:
| Factor | Indicator | Adjustment |
|--------|-----------|------------|
| Frequency | "Talk every day" | -45 |
| Frequency | "Few times a week" | -30 |
| Frequency | "Weekly" | -15 |
| Frequency | "Few times a month" | 0 |
| Frequency | "Monthly or less" | +10 |
| Frequency | "Few times a year" | +25 |
| Frequency | "Rarely/never" | +40 |
| Last Contact | "Today/this week" | -10 |
| Last Contact | "This month" | 0 |
| Last Contact | "Months ago" | +15 |
| Last Contact | "Over a year" | +30 |
| Status | "Very active" | -10 |
| Status | "Fading/dormant" | +15 |
| Barriers | "Distance/busy" | +5 each |

### Clamp both values to [0, 100]

## OUTPUT (JSON only):
{
  "x": <integer 0-100>,
  "y": <integer 0-100>,
  "x_factors": "<which factors influenced X and how>",
  "y_factors": "<which factors influenced Y and how>",
  "icon": "<ONE from: ${ICON_KEYS}>",
  "summary": "<5 word description>",
  "reasoning": "<1 sentence explaining position>"
}`;

// ============================================================================
// FEW-SHOT CONTEXT PROMPT - Adds examples from similar past relationships
// ============================================================================

export const createContextPrompt = (similarRelationships) => {
  if (!similarRelationships || similarRelationships.length === 0) {
    return '';
  }

  const examples = similarRelationships.map((rel, i) => `
Example ${i + 1}: ${rel.name}
- Description snippet: "${rel.description?.substring(0, 150)}..."
- Result: X=${rel.x}, Y=${rel.y}
- Reasoning: ${rel.reasoning}`).join('\n');

  return `
## CONTEXT: Similar relationships previously analyzed
Use these as reference for consistency:
${examples}

Now analyze the new relationship with similar patterns producing similar scores.`;
};

// ============================================================================
// BULK PROMPTS
// ============================================================================

export const BULK_EXTRACTION_PROMPT = `${CORE_SYSTEM_PROMPT}

## CURRENT TASK: Extract data for multiple friends

For EACH friend, extract the 12 key facts. Output a JSON array.

[
  {
    "name": "Friend Name",
    "communication_frequency": "...",
    "communication_channels": "...",
    "last_interaction": "...",
    "sharing_depth": "...",
    "trust_level": "...",
    "emotional_support": "...",
    "how_they_met": "...",
    "relationship_duration": "...",
    "emergency_call": "...",
    "relationship_status": "...",
    "barriers": "...",
    "overall_sentiment": "..."
  },
  ...
]`;

export const BULK_CALCULATION_PROMPT = `${CORE_SYSTEM_PROMPT}

## CURRENT TASK: Calculate coordinates for multiple friends

Apply the scoring rules consistently to each friend's extracted data.
Similar relationship patterns MUST produce similar X,Y values.

Output JSON array:
[
  {
    "name": "Friend Name",
    "x": <0-100>,
    "y": <0-100>,
    "icon": "<icon>",
    "summary": "<5 words>",
    "reasoning": "<1 sentence>"
  },
  ...
]`;

// ============================================================================
// LEGACY EXPORTS (backward compatibility)
// ============================================================================

export const SINGLE_ANALYSIS_PROMPT = EXTRACTION_PROMPT;
export const RECALCULATE_PROMPT = BULK_EXTRACTION_PROMPT;

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API_CONFIG = {
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  extractionModel: 'anthropic/claude-3.5-haiku',
  calculationModel: 'anthropic/claude-3.5-haiku',
  bulkModel: 'anthropic/claude-3.5-haiku',
};

// ============================================================================
// RELATIONSHIP SIMILARITY KEYWORDS - For finding similar past relationships
// ============================================================================

export const RELATIONSHIP_KEYWORDS = {
  family: ['family', 'mom', 'dad', 'mother', 'father', 'sister', 'brother', 'cousin', 'aunt', 'uncle', 'relative'],
  childhood: ['childhood', 'school', 'grew up', 'known forever', 'since kids', 'classmate'],
  work: ['work', 'colleague', 'office', 'coworker', 'job', 'professional'],
  romantic: ['dating', 'boyfriend', 'girlfriend', 'partner', 'romantic', 'love'],
  online: ['online', 'internet', 'social media', 'gaming', 'discord'],
  close: ['best friend', 'close', 'trust', 'secrets', 'always there', 'support'],
  distant: ['distant', 'fading', 'rarely', 'lost touch', 'busy', 'far away'],
};
