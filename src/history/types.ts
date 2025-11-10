/**
 * Types for prompt refinement history
 */

export interface HistoryEntry {
  id: string;
  timestamp: number;
  originalPrompt: string;
  refinedPrompt: string;
  profile?: string;
  mode: 'vscode-lm' | 'ollama' | 'openai-api' | 'anthropic-api';
  isEconomy: boolean;
  tokenUsage?: {
    input: number;
    output: number;
  };
  topics?: string[];
}

export interface HistoryGroup {
  date: string;
  entries: HistoryEntry[];
}
