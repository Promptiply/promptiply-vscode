/**
 * Profile types - Compatible with Chrome extension format
 */

export interface Topic {
  name: string;
  count: number;
  lastUsed: string; // ISO date string
}

export interface EvolvingProfile {
  topics: Topic[];
  lastUpdated: string;
  usageCount: number;
  lastPrompt: string; // Truncated to 200 chars
}

export interface Profile {
  id: string;
  name: string;
  persona: string;
  tone: string;
  styleGuidelines: string[];
  evolving_profile: EvolvingProfile;
}

export interface ProfilesConfig {
  list: Profile[];
  activeProfileId: string | null;
}

export interface RefinementResult {
  refinedPrompt: string;
  topics?: string[];
  reasoning?: string;
  tokenUsage?: {
    input: number;
    output: number;
  };
}
