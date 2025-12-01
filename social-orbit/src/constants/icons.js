/**
 * Icon Configuration
 * Maps string names to Lucide React icon components
 */

import { 
  Heart, Zap, Ghost, Skull, Anchor, Briefcase, Coffee, Music, Gamepad2, 
  BookOpen, Rocket, Flame, Star, Sun, Moon, Cloud, Umbrella, Award, Shield, Sword,
  User
} from 'lucide-react';

// Mapping string names to actual components for the AI to select
export const ICON_MAP = {
  Heart, Zap, Ghost, Skull, Anchor, Briefcase, Coffee, Music, Gamepad2, 
  BookOpen, Rocket, Flame, Star, Sun, Moon, Cloud, Umbrella, Award, Shield, Sword,
  User // Fallback
};

// Comma-separated list for AI prompts
export const ICON_KEYS = Object.keys(ICON_MAP).join(', ');

// Array of icon keys for iteration
export const ICON_LIST = Object.keys(ICON_MAP);

// Default/fallback icon
export const DEFAULT_ICON = 'User';

