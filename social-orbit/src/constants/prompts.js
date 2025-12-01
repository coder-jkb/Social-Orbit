/**
 * AI Prompts Configuration
 * 
 * STRUCTURED TWO-STEP ANALYSIS:
 * 1. Extract factual relationship data via questions
 * 2. Calculate coordinates based on extracted data
 */

import { ICON_KEYS } from './icons';

// ============================================================================
// AXIS DEFINITIONS
// ============================================================================

export const AXIS_DEFINITIONS = {
  x: {
    name: 'Emotional Bond Strength',
    description: 'How deep is the emotional connection and trust',
    scale: {
      0: 'Unbreakable Bond (family, soulmate)',
      25: 'Deep Connection (close friend, confidant)',
      50: 'Moderate Bond (good friend, reliable)',
      75: 'Surface Connection (acquaintance, casual)',
      100: 'No Bond (stranger)'
    }
  },
  y: {
    name: 'Communication Frequency',
    description: 'How often meaningful interaction occurs',
    scale: {
      0: 'Constant Contact (daily interaction)',
      25: 'Regular Contact (multiple times per week)',
      50: 'Periodic Contact (weekly to monthly)',
      75: 'Infrequent Contact (few times per year)',
      100: 'No Contact (lost touch)'
    }
  }
};

// ============================================================================
// EXTRACTION PROMPT - Get structured facts from description
// ============================================================================

export const EXTRACTION_PROMPT = `You are a Relationship Data Extractor. Your job is to extract FACTUAL information from a relationship description.

## QUESTIONS TO ANSWER:

### Communication Pattern
Q1. How frequently do they communicate?
Options: daily, few_times_week, weekly, few_times_month, monthly, few_times_year, rarely, never

Q2. What are the primary communication channels?
Options: in_person, video_calls, phone_calls, texting, social_media, email, none

Q3. Who typically initiates contact?
Options: user_initiates, friend_initiates, both_equally, neither

Q4. When was their last meaningful interaction?
Options: today, this_week, this_month, few_months_ago, over_six_months, over_a_year, years_ago

### Emotional Depth
Q5. What level of personal sharing occurs?
Options: share_everything, share_personal_struggles, share_some_personal, surface_conversations_only, no_sharing

Q6. What topics do they typically discuss?
Options: deep_life_issues, personal_problems, work_and_hobbies, casual_small_talk, practical_matters_only

Q7. Do they provide emotional support to each other?
Options: always_there, often_supportive, occasionally, rarely, never

Q8. What is the trust level in this relationship?
Options: complete_trust, high_trust, moderate_trust, low_trust, no_trust

### Relationship Context
Q9. How did they meet or know each other?
Options: family, childhood_friend, school, college, work, mutual_friends, online, hobby_activity, romantic, neighbor, other

Q10. How long have they known each other?
Options: less_than_year, one_to_two_years, two_to_five_years, five_to_ten_years, over_ten_years, lifetime

Q11. What is their physical proximity?
Options: live_together, same_neighborhood, same_city, different_city, different_country

Q12. Would the user call this person in an emergency?
Options: definitely_first_call, probably_would, depends_on_situation, probably_not, definitely_not

### Current Status
Q13. What is the current state of the relationship?
Options: very_active, active, stable, cooling_off, dormant, ended

Q14. Are there any barriers to the relationship?
Options: none, busy_schedules, distance, life_changes, conflict, grew_apart

Q15. What is the overall sentiment about this relationship?
Options: cherished, positive, neutral, mixed, negative

## OUTPUT FORMAT:
Output ONLY a valid JSON object with your answers:
{
  "q1_frequency": "<answer>",
  "q2_channels": "<answer>",
  "q3_initiator": "<answer>",
  "q4_last_interaction": "<answer>",
  "q5_sharing": "<answer>",
  "q6_topics": "<answer>",
  "q7_support": "<answer>",
  "q8_trust": "<answer>",
  "q9_origin": "<answer>",
  "q10_duration": "<answer>",
  "q11_proximity": "<answer>",
  "q12_emergency": "<answer>",
  "q13_status": "<answer>",
  "q14_barriers": "<answer>",
  "q15_sentiment": "<answer>"
}

IMPORTANT: Only output the JSON, no explanations.`;

// ============================================================================
// CALCULATION PROMPT - Calculate X,Y from extracted data
// ============================================================================

export const CALCULATION_PROMPT = `You are a Relationship Coordinate Calculator. Calculate X and Y values from structured relationship data.

## COORDINATE SYSTEM:
- X-Axis (Emotional Bond): 0 = Soulmate/Family → 100 = Stranger
- Y-Axis (Communication): 0 = Daily Contact → 100 = No Contact

## SCORING RULES:

### X-Axis (Emotional Bond) - Start at 50, adjust:

| Factor | Condition | Adjustment |
|--------|-----------|------------|
| Trust | complete_trust | -25 |
| Trust | high_trust | -15 |
| Trust | moderate_trust | -5 |
| Trust | low_trust | +15 |
| Trust | no_trust | +25 |
| Sharing | share_everything | -20 |
| Sharing | share_personal_struggles | -15 |
| Sharing | share_some_personal | -5 |
| Sharing | surface_conversations_only | +10 |
| Support | always_there | -15 |
| Support | often_supportive | -10 |
| Support | occasionally | 0 |
| Support | rarely/never | +10 |
| Emergency | definitely_first_call | -15 |
| Emergency | probably_would | -10 |
| Emergency | depends | 0 |
| Emergency | probably_not | +10 |
| Origin | family | -20 |
| Origin | childhood_friend | -15 |
| Origin | romantic | -15 |
| Sentiment | cherished | -10 |
| Sentiment | positive | -5 |
| Sentiment | negative | +15 |

### Y-Axis (Communication) - Start at 50, adjust:

| Factor | Condition | Adjustment |
|--------|-----------|------------|
| Frequency | daily | -45 |
| Frequency | few_times_week | -30 |
| Frequency | weekly | -20 |
| Frequency | few_times_month | -10 |
| Frequency | monthly | 0 |
| Frequency | few_times_year | +20 |
| Frequency | rarely | +35 |
| Frequency | never | +45 |
| Last Interaction | today/this_week | -10 |
| Last Interaction | this_month | 0 |
| Last Interaction | few_months_ago | +10 |
| Last Interaction | over_six_months | +20 |
| Last Interaction | over_a_year | +35 |
| Status | very_active | -15 |
| Status | active | -10 |
| Status | stable | 0 |
| Status | cooling_off | +15 |
| Status | dormant | +30 |
| Proximity | live_together | -15 |
| Proximity | same_neighborhood | -10 |
| Proximity | same_city | -5 |
| Proximity | different_city | +5 |
| Proximity | different_country | +10 |

### FINAL RULES:
- Clamp X to [0, 100]
- Clamp Y to [0, 100]
- Family relationships: X should be 0-35
- Romantic partners: X should be 0-25
- Daily contact: Y should be 0-20

## AVAILABLE ICONS:
${ICON_KEYS}

## OUTPUT FORMAT:
{
  "x": <integer 0-100>,
  "y": <integer 0-100>,
  "x_reasoning": "<brief explanation of X score>",
  "y_reasoning": "<brief explanation of Y score>",
  "icon": "<best matching icon from list>",
  "summary": "<exactly 5 words describing relationship>",
  "reasoning": "<1 sentence overall explanation>"
}

IMPORTANT: Only output the JSON, no explanations.`;

// ============================================================================
// CONTEXT PROMPT - For similar relationships
// ============================================================================

export const createContextPrompt = (similarRelationships) => {
  if (!similarRelationships || similarRelationships.length === 0) {
    return '';
  }

  const examples = similarRelationships.map((rel, i) => 
    `${i + 1}. ${rel.name}: X=${Math.round(rel.x)}, Y=${Math.round(rel.y)} (${rel.summary})`
  ).join('\n');

  return `
## REFERENCE - Similar relationships for consistency:
${examples}

Ensure similar relationship patterns produce similar scores.
`;
};

// ============================================================================
// BULK PROMPTS
// ============================================================================

export const BULK_EXTRACTION_PROMPT = `${EXTRACTION_PROMPT}

For MULTIPLE friends, output a JSON array:
[
  { "name": "Friend1", "q1_frequency": "...", ... },
  { "name": "Friend2", "q1_frequency": "...", ... }
]`;

export const BULK_CALCULATION_PROMPT = `${CALCULATION_PROMPT}

For MULTIPLE friends, output a JSON array:
[
  { "name": "Friend1", "x": 45, "y": 30, ... },
  { "name": "Friend2", "x": 60, "y": 50, ... }
]`;

// ============================================================================
// LEGACY EXPORTS
// ============================================================================

export const CORE_SYSTEM_PROMPT = EXTRACTION_PROMPT;
export const SINGLE_ANALYSIS_PROMPT = EXTRACTION_PROMPT;
export const RECALCULATE_PROMPT = BULK_EXTRACTION_PROMPT;

// ============================================================================
// RELATIONSHIP KEYWORDS - For fallback similarity
// ============================================================================

export const RELATIONSHIP_KEYWORDS = {
  family: ['family', 'mom', 'dad', 'mother', 'father', 'sister', 'brother', 'cousin', 'aunt', 'uncle'],
  childhood: ['childhood', 'school', 'grew up', 'known forever', 'since kids'],
  work: ['work', 'colleague', 'office', 'coworker', 'job', 'professional'],
  romantic: ['dating', 'boyfriend', 'girlfriend', 'partner', 'romantic', 'love'],
  close: ['best friend', 'close', 'trust', 'secrets', 'always there'],
  distant: ['distant', 'fading', 'rarely', 'lost touch', 'busy'],
};
