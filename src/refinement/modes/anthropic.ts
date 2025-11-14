/**
 * Anthropic API integration
 */

import { RefinementResult } from '../../profiles/types';
import Logger from '../../utils/logger';

export interface AnthropicConfig {
  apiKey: string;
  economyModel: string;
  premiumModel: string;
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Refine a prompt using Anthropic API
 */
export async function refineWithAnthropic(
  systemPrompt: string,
  userPrompt: string,
  useEconomy: boolean,
  config: AnthropicConfig,
  progressCallback?: (message: string) => void
): Promise<RefinementResult> {
  if (!config.apiKey || !config.apiKey.trim()) {
    throw new Error(
      'Anthropic API key not configured. Please add it in settings: promptiply.anthropic.apiKey'
    );
  }

  const model = useEconomy ? config.economyModel : config.premiumModel;

  progressCallback?.(`Connecting to Anthropic (${model})...`);

  const messages: AnthropicMessage[] = [
    { role: 'user', content: userPrompt },
  ];

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        system: systemPrompt,
        messages: messages,
        temperature: 0.2,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = (errorData as any).error?.message || response.statusText;

      if (response.status === 401) {
        throw new Error('Invalid Anthropic API key. Please check your settings.');
      } else if (response.status === 429) {
        throw new Error('Anthropic rate limit exceeded. Please try again later.');
      } else if (response.status === 403) {
        throw new Error('Anthropic API access forbidden. Check your API key permissions.');
      }

      throw new Error(`Anthropic API error (${response.status}): ${errorMessage}`);
    }

    const data = await response.json() as AnthropicResponse;

    if (!data.content || data.content.length === 0) {
      throw new Error('No response from Anthropic');
    }

    const content = data.content[0].text;

    if (!content) {
      throw new Error('Empty response from Anthropic');
    }

    progressCallback?.('Processing response...');

    // Parse response
    const result = parseResponse(content);

    // Log token usage if available
    if (data.usage) {
      Logger.debug(`Anthropic tokens used: ${data.usage.input_tokens + data.usage.output_tokens} (input: ${data.usage.input_tokens}, output: ${data.usage.output_tokens})`);
    }

    return result;
  } catch (error: any) {
    if (error.message.includes('fetch')) {
      throw new Error(
        'Cannot connect to Anthropic API. Please check your internet connection.'
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
 * Check if Anthropic API key is configured
 */
export function isAnthropicConfigured(apiKey: string): boolean {
  return !!(apiKey && apiKey.trim().length > 0);
}
