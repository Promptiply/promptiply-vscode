/**
 * VSCode Language Model API integration
 * Uses the user's Copilot subscription (free for existing Copilot users!)
 */

import * as vscode from 'vscode';
import { RefinementResult } from '../../profiles/types';

export interface VSCodeLMConfig {
  economyFamily: string;
  premiumFamily: string;
}

/**
 * Refine a prompt using VSCode Language Model API (Copilot)
 */
export async function refineWithVSCodeLM(
  systemPrompt: string,
  userPrompt: string,
  useEconomy: boolean,
  config: VSCodeLMConfig,
  token: vscode.CancellationToken
): Promise<RefinementResult> {
  const family = useEconomy ? config.economyFamily : config.premiumFamily;

  // Get available models with the specified family
  const models = await vscode.lm.selectChatModels({
    vendor: 'copilot',
    family: family,
  });

  if (models.length === 0) {
    throw new Error(
      `No Copilot models available with family "${family}". ` +
      'Please ensure you are signed in to GitHub Copilot.'
    );
  }

  const model = models[0];

  // Build messages
  const messages = [
    vscode.LanguageModelChatMessage.User(systemPrompt),
    vscode.LanguageModelChatMessage.User(userPrompt),
  ];

  try {
    // Send request
    const response = await model.sendRequest(messages, {}, token);

    // Stream and collect response
    let fullResponse = '';
    for await (const chunk of response.text) {
      if (token.isCancellationRequested) {
        throw new Error('Refinement cancelled by user');
      }
      fullResponse += chunk;
    }

    if (!fullResponse.trim()) {
      throw new Error('Empty response from Copilot');
    }

    // Try to parse as JSON first (for profile-based refinement)
    const result = parseResponse(fullResponse);
    return result;
  } catch (error: any) {
    // Handle specific VSCode LM API errors
    if (error instanceof vscode.LanguageModelError) {
      throw new Error(`Copilot error: ${error.message} (code: ${error.code})`);
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
    // Not JSON, continue to plain text parsing
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
      // Continue to plain text
    }
  }

  // Fallback: treat entire response as refined prompt
  // Remove common prefixes
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
 * Check if VSCode LM API is available
 */
export async function isVSCodeLMAvailable(): Promise<boolean> {
  try {
    const models = await vscode.lm.selectChatModels({
      vendor: 'copilot',
    });
    return models.length > 0;
  } catch (error) {
    return false;
  }
}
