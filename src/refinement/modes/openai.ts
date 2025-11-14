/**
 * OpenAI API integration
 */

import { RefinementResult } from '../../profiles/types';
import Logger from '../../utils/logger';

export interface OpenAIConfig {
  apiKey: string;
  economyModel: string;
  premiumModel: string;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Refine a prompt using OpenAI API
 */
export async function refineWithOpenAI(
  systemPrompt: string,
  userPrompt: string,
  useEconomy: boolean,
  config: OpenAIConfig,
  progressCallback?: (message: string) => void
): Promise<RefinementResult> {
  if (!config.apiKey || !config.apiKey.trim()) {
    throw new Error(
      'OpenAI API key not configured. Please add it in settings: promptiply.openai.apiKey'
    );
  }

  const model = useEconomy ? config.economyModel : config.premiumModel;

  progressCallback?.(`Connecting to OpenAI (${model})...`);

  const messages: OpenAIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_completion_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = (errorData as any).error?.message || response.statusText;

      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your settings.');
      } else if (response.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again later.');
      } else if (response.status === 403) {
        throw new Error('OpenAI API access forbidden. Check your API key permissions.');
      }

      throw new Error(`OpenAI API error (${response.status}): ${errorMessage}`);
    }

    const data = await response.json() as OpenAIResponse;

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenAI');
    }

    const content = data.choices[0].message.content;

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    progressCallback?.('Processing response...');

    // Parse response
    const result = parseResponse(content);

    // Log token usage if available
    if (data.usage) {
      Logger.debug(`OpenAI tokens used: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`);
    }

    return result;
  } catch (error: any) {
    if (error.message.includes('fetch')) {
      throw new Error(
        'Cannot connect to OpenAI API. Please check your internet connection.'
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

  // Fallback: treat entire response as refined prompt
  let cleaned = trimmed;
  const prefixes = [
    'Refined Prompt:',
    'Refined prompt:',
    'Here is the refined prompt:',
    'Here\'s the refined prompt:',
  ];

  for (const prefix of prefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length).trim();
      break;
    }
  }

  return {
    refinedPrompt: cleaned,
  };
}

/**
 * Check if OpenAI API key is configured
 */
export function isOpenAIConfigured(apiKey: string): boolean {
  return !!(apiKey && apiKey.trim().length > 0);
}
