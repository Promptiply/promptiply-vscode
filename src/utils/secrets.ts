/**
 * Secure API key storage using VSCode Secrets API
 * Provides automatic migration from settings to secure storage
 */

import * as vscode from 'vscode';
import Logger from './logger';

export class SecretsManager {
  private context: vscode.ExtensionContext;
  private migrationKey = 'promptiply.secretsMigrationCompleted';

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Get an API key securely
   * First checks Secrets API, then falls back to settings for backward compatibility
   */
  async getApiKey(provider: 'openai' | 'anthropic'): Promise<string> {
    const secretKey = `promptiply.${provider}.apiKey`;

    // First, try to get from secure storage
    const secretValue = await this.context.secrets.get(secretKey);
    if (secretValue) {
      return secretValue;
    }

    // Fallback to settings for backward compatibility
    const config = vscode.workspace.getConfiguration('promptiply');
    const settingsValue = config.get<string>(`${provider}.apiKey`, '');

    // If found in settings, automatically migrate to secure storage
    if (settingsValue && settingsValue.trim()) {
      Logger.info(`Migrating ${provider} API key from settings to secure storage`);
      await this.storeApiKey(provider, settingsValue);

      // Clear from settings after successful migration
      try {
        await config.update(
          `${provider}.apiKey`,
          undefined,
          vscode.ConfigurationTarget.Global
        );
        Logger.info(`Cleared ${provider} API key from settings`);
      } catch (error) {
        Logger.warn(`Could not clear ${provider} API key from settings: ${error}`);
      }

      return settingsValue;
    }

    return '';
  }

  /**
   * Store an API key securely
   */
  async storeApiKey(provider: 'openai' | 'anthropic', apiKey: string): Promise<void> {
    const secretKey = `promptiply.${provider}.apiKey`;

    if (!apiKey || !apiKey.trim()) {
      // Delete key if empty
      await this.context.secrets.delete(secretKey);
      Logger.info(`Deleted ${provider} API key from secure storage`);
      return;
    }

    await this.context.secrets.store(secretKey, apiKey.trim());
    Logger.info(`Stored ${provider} API key in secure storage`);
  }

  /**
   * Delete an API key from secure storage
   */
  async deleteApiKey(provider: 'openai' | 'anthropic'): Promise<void> {
    const secretKey = `promptiply.${provider}.apiKey`;
    await this.context.secrets.delete(secretKey);
    Logger.info(`Deleted ${provider} API key from secure storage`);
  }

  /**
   * Check if an API key is configured (either in secrets or settings)
   */
  async isApiKeyConfigured(provider: 'openai' | 'anthropic'): Promise<boolean> {
    const apiKey = await this.getApiKey(provider);
    return !!(apiKey && apiKey.trim().length > 0);
  }

  /**
   * Migrate all API keys from settings to secure storage
   * This is called automatically on extension activation
   */
  async migrateApiKeysFromSettings(): Promise<void> {
    // Check if migration already completed
    const migrationCompleted = this.context.globalState.get<boolean>(this.migrationKey, false);
    if (migrationCompleted) {
      return;
    }

    Logger.info('Starting API key migration from settings to secure storage');

    let migrated = false;

    // Migrate OpenAI key
    const openaiKey = await this.getApiKey('openai');
    if (openaiKey) {
      migrated = true;
    }

    // Migrate Anthropic key
    const anthropicKey = await this.getApiKey('anthropic');
    if (anthropicKey) {
      migrated = true;
    }

    if (migrated) {
      Logger.info('API key migration completed successfully');
      vscode.window.showInformationMessage(
        'Promptiply: API keys have been migrated to secure storage for better security.'
      );
    }

    // Mark migration as completed
    await this.context.globalState.update(this.migrationKey, true);
  }

  /**
   * Show a command to set API keys
   */
  static async promptForApiKey(
    manager: SecretsManager,
    provider: 'openai' | 'anthropic'
  ): Promise<string | undefined> {
    const providerName = provider === 'openai' ? 'OpenAI' : 'Anthropic';
    const currentKey = await manager.getApiKey(provider);
    const placeholder = currentKey
      ? `Current key: ${currentKey.substring(0, 8)}...`
      : `Enter your ${providerName} API key`;

    const newKey = await vscode.window.showInputBox({
      prompt: `${providerName} API Key`,
      placeHolder: placeholder,
      password: true,
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!value || !value.trim()) {
          return 'API key cannot be empty';
        }
        // Basic validation for OpenAI keys
        if (provider === 'openai' && !value.startsWith('sk-')) {
          return 'OpenAI API keys typically start with "sk-"';
        }
        // Basic validation for Anthropic keys
        if (provider === 'anthropic' && !value.startsWith('sk-ant-')) {
          return 'Anthropic API keys typically start with "sk-ant-"';
        }
        return null;
      }
    });

    if (newKey) {
      await manager.storeApiKey(provider, newKey);
      vscode.window.showInformationMessage(`${providerName} API key stored securely`);
      return newKey;
    }

    return undefined;
  }
}
