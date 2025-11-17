/**
 * Ollama local model integration
 * Free, offline, private
 */

import * as vscode from 'vscode';
import { RefinementResult } from '../../profiles/types';
import { fetchWithResilience } from '../../utils/apiResilience';

export interface OllamaConfig {
  endpoint: string;
  economyModel: string;
  premiumModel: string;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * Refine a prompt using Ollama
 */
export async function refineWithOllama(
  systemPrompt: string,
  userPrompt: string,
  useEconomy: boolean,
  config: OllamaConfig,
  progressCallback?: (message: string) => void
): Promise<RefinementResult> {
  const model = useEconomy ? config.economyModel : config.premiumModel;

  // Combine system and user prompts
  const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

  const url = `${config.endpoint}/api/generate`;

  progressCallback?.(`Connecting to Ollama (${model})...`);

  try {
    const response = await fetchWithResilience(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: combinedPrompt,
        stream: false,
        options: {
          temperature: 0.2,
          top_p: 0.9,
        },
      }),
      timeout: 120000, // 120 second timeout for local models (can be slower)
      retries: 1, // Retry once on failure
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Ollama request failed (${response.status}): ${errorText}`
      );
    }

    const data = await response.json() as OllamaResponse;

    if (!data.response) {
      throw new Error('Empty response from Ollama');
    }

    progressCallback?.('Processing response...');

    // Parse response
    const result = parseResponse(data.response);
    return result;
  } catch (error: any) {
    if (error.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to Ollama at ${config.endpoint}. ` +
        'Please ensure Ollama is running (ollama serve) and the endpoint is correct.'
      );
    }
    throw error;
  }
}

/**
 * Parse the response - handles both JSON and plain text formats
 */
function parseResponse(response: string): RefinementResult {
  const trimmed = response.trim();

  // Try to parse as JSON
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.refinedPrompt && typeof parsed.refinedPrompt === 'string') {
      return {
        refinedPrompt: parsed.refinedPrompt.trim(),
        topics: Array.isArray(parsed.topics)
          ? parsed.topics.filter((t: any) => typeof t === 'string')
          : undefined,
      };
    }
  } catch (e) {
    // Not JSON, continue
  }

  // Try to extract JSON from markdown code blocks
  const jsonMatch = trimmed.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.refinedPrompt && typeof parsed.refinedPrompt === 'string') {
        return {
          refinedPrompt: parsed.refinedPrompt.trim(),
          topics: Array.isArray(parsed.topics)
            ? parsed.topics.filter((t: any) => typeof t === 'string')
            : undefined,
        };
      }
    } catch (e) {
      // Continue
    }
  }

  // Fallback: treat entire response as refined prompt
  let cleaned = trimmed;
  const prefixes = [
    'Refined Prompt:',
    'Refined prompt:',
    'Here is the refined prompt:',
    'Here\'s the refined prompt:',
    '{',
  ];

  for (const prefix of prefixes) {
    if (cleaned.startsWith(prefix)) {
      if (prefix === '{') {
        // Try to extract just the refinedPrompt value
        const match = cleaned.match(/"refinedPrompt"\s*:\s*"([^"]*)"/);
        if (match) {
          cleaned = match[1];
        }
      } else {
        cleaned = cleaned.slice(prefix.length).trim();
      }
      break;
    }
  }

  return {
    refinedPrompt: cleaned,
  };
}

/**
 * Check if Ollama is available
 */
export async function isOllamaAvailable(endpoint: string): Promise<boolean> {
  try {
    const response = await fetch(`${endpoint}/api/tags`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * List available Ollama models
 */
export async function listOllamaModels(endpoint: string): Promise<string[]> {
  try {
    const response = await fetch(`${endpoint}/api/tags`, {
      method: 'GET',
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json() as { models?: Array<{ name: string }> };
    if (data.models && Array.isArray(data.models)) {
      return data.models.map((m: any) => m.name);
    }

    return [];
  } catch (error) {
    return [];
  }
}
