/**
 * Constants barrel export
 */

export * from './icons';
export * from './colors';
export * from './prompts';

// Re-export specific prompts for clarity
export { 
  EXTRACTION_PROMPT, 
  CALCULATION_PROMPT,
  BULK_EXTRACTION_PROMPT,
  BULK_CALCULATION_PROMPT,
  API_CONFIG,
  RELATIONSHIP_QUESTIONS 
} from './prompts';

