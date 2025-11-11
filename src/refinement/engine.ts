/**
 * Main refinement engine - coordinates all refinement modes
 */

import * as vscode from 'vscode';
import { Profile, RefinementResult } from '../profiles/types';
import { ProfileManager } from '../profiles/manager';
import { buildSystemPrompt, buildUserPrompt } from './systemPrompt';
import { refineWithVSCodeLM, isVSCodeLMAvailable } from './modes/vscodeLM';
import { refineWithOllama, isOllamaAvailable } from './modes/ollama';
import { refineWithOpenAI, isOpenAIConfigured } from './modes/openai';
import { refineWithAnthropic, isAnthropicConfigured } from './modes/anthropic';

export type RefinementMode = 'vscode-lm' | 'ollama' | 'openai-api' | 'anthropic-api';

export interface RefinementConfig {
  mode: RefinementMode;
  useEconomyModel: boolean;
  vscodeLM: {
    economyFamily: string;
    premiumFamily: string;
  };
  ollama: {
    endpoint: string;
    economyModel: string;
    premiumModel: string;
  };
  openai: {
    apiKey: string;
    economyModel: string;
    premiumModel: string;
  };
  anthropic: {
    apiKey: string;
    economyModel: string;
    premiumModel: string;
  };
}

export class RefinementEngine {
  private profileManager: ProfileManager;

  constructor(profileManager: ProfileManager) {
    this.profileManager = profileManager;
  }

  /**
   * Refine a prompt
   */
  async refine(
    prompt: string,
    config: RefinementConfig,
    progressCallback?: (message: string) => void,
    token?: vscode.CancellationToken
  ): Promise<RefinementResult> {
    if (!prompt.trim()) {
      throw new Error('Prompt cannot be empty');
    }

    // Get active profile
    const profile = await this.profileManager.getActiveProfile();

    // Build prompts
    const systemPrompt = buildSystemPrompt(profile);
    const userPrompt = buildUserPrompt(prompt, profile);

    // Refine based on mode
    let result: RefinementResult;

    progressCallback?.(`Refining with ${config.mode}...`);

    const cancellationToken = token || new vscode.CancellationTokenSource().token;

    switch (config.mode) {
      case 'vscode-lm':
        result = await this.refineWithVSCodeLM(
          systemPrompt,
          userPrompt,
          config.useEconomyModel,
          config.vscodeLM,
          cancellationToken
        );
        break;

      case 'ollama':
        result = await this.refineWithOllama(
          systemPrompt,
          userPrompt,
          config.useEconomyModel,
          config.ollama,
          progressCallback
        );
        break;

      case 'openai-api':
        result = await this.refineWithOpenAI(
          systemPrompt,
          userPrompt,
          config.useEconomyModel,
          config.openai,
          progressCallback
        );
        break;

      case 'anthropic-api':
        result = await this.refineWithAnthropic(
          systemPrompt,
          userPrompt,
          config.useEconomyModel,
          config.anthropic,
          progressCallback
        );
        break;

      default:
        throw new Error(`Unknown refinement mode: ${config.mode}`);
    }

    // Evolve profile if we got topics
    if (profile && result.topics && result.topics.length > 0) {
      await this.profileManager.evolveProfile(
        profile.id,
        prompt,
        result.topics
      );
    }

    progressCallback?.('Refinement complete!');

    return result;
  }

  /**
   * Refine with VSCode LM
   */
  private async refineWithVSCodeLM(
    systemPrompt: string,
    userPrompt: string,
    useEconomy: boolean,
    config: RefinementConfig['vscodeLM'],
    token: vscode.CancellationToken
  ): Promise<RefinementResult> {
    const available = await isVSCodeLMAvailable();
    if (!available) {
      throw new Error(
        'GitHub Copilot is not available. Please sign in to GitHub Copilot or switch to another mode.'
      );
    }

    return refineWithVSCodeLM(
      systemPrompt,
      userPrompt,
      useEconomy,
      config,
      token
    );
  }

  /**
   * Refine with Ollama
   */
  private async refineWithOllama(
    systemPrompt: string,
    userPrompt: string,
    useEconomy: boolean,
    config: RefinementConfig['ollama'],
    progressCallback?: (message: string) => void
  ): Promise<RefinementResult> {
    const available = await isOllamaAvailable(config.endpoint);
    if (!available) {
      throw new Error(
        `Cannot connect to Ollama at ${config.endpoint}. ` +
        'Please ensure Ollama is running (ollama serve) and the endpoint is correct in settings.'
      );
    }

    return refineWithOllama(
      systemPrompt,
      userPrompt,
      useEconomy,
      config,
      progressCallback
    );
  }

  /**
   * Refine with OpenAI API
   */
  private async refineWithOpenAI(
    systemPrompt: string,
    userPrompt: string,
    useEconomy: boolean,
    config: RefinementConfig['openai'],
    progressCallback?: (message: string) => void
  ): Promise<RefinementResult> {
    if (!isOpenAIConfigured(config.apiKey)) {
      throw new Error(
        'OpenAI API key not configured. Please add it in Settings: promptiply.openai.apiKey'
      );
    }

    return refineWithOpenAI(
      systemPrompt,
      userPrompt,
      useEconomy,
      config,
      progressCallback
    );
  }

  /**
   * Refine with Anthropic API
   */
  private async refineWithAnthropic(
    systemPrompt: string,
    userPrompt: string,
    useEconomy: boolean,
    config: RefinementConfig['anthropic'],
    progressCallback?: (message: string) => void
  ): Promise<RefinementResult> {
    if (!isAnthropicConfigured(config.apiKey)) {
      throw new Error(
        'Anthropic API key not configured. Please add it in Settings: promptiply.anthropic.apiKey'
      );
    }

    return refineWithAnthropic(
      systemPrompt,
      userPrompt,
      useEconomy,
      config,
      progressCallback
    );
  }

  /**
   * Get configuration from workspace settings
   */
  static getConfig(): RefinementConfig {
    const config = vscode.workspace.getConfiguration('promptiply');

    return {
      mode: config.get('mode', 'vscode-lm') as RefinementMode,
      useEconomyModel: config.get('useEconomyModel', true),
      vscodeLM: {
        economyFamily: config.get('vscodeLM.economyFamily', 'gpt-3.5-turbo'),
        premiumFamily: config.get('vscodeLM.premiumFamily', 'gpt-4o'),
      },
      ollama: {
        endpoint: config.get('ollama.endpoint', 'http://localhost:11434'),
        economyModel: config.get('ollama.economyModel', 'llama3.2:3b'),
        premiumModel: config.get('ollama.premiumModel', 'llama3.1:8b'),
      },
      openai: {
        apiKey: config.get('openai.apiKey', ''),
        economyModel: config.get('openai.economyModel', 'gpt-4o-mini'),
        premiumModel: config.get('openai.premiumModel', 'gpt-4o'),
      },
      anthropic: {
        apiKey: config.get('anthropic.apiKey', ''),
        economyModel: config.get('anthropic.economyModel', 'claude-3-5-haiku-20241022'),
        premiumModel: config.get('anthropic.premiumModel', 'claude-3-5-sonnet-20241022'),
      },
    };
  }
}
