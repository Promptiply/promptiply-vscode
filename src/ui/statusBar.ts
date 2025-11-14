/**
 * Status bar integration - shows active profile and mode
 */

import * as vscode from 'vscode';
import { ProfileManager } from '../profiles/manager';

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private profileManager: ProfileManager;
  private updateTimeout: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_MS = 100;

  constructor(profileManager: ProfileManager) {
    this.profileManager = profileManager;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'promptiply.switchProfile';
  }

  /**
   * Initialize and show status bar
   */
  async initialize(): Promise<void> {
    await this.performUpdate(); // Initial update without debounce
    this.statusBarItem.show();
  }

  /**
   * Update status bar text (debounced)
   */
  async update(): Promise<void> {
    // Clear existing timeout
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    // Schedule update
    return new Promise<void>((resolve) => {
      this.updateTimeout = setTimeout(async () => {
        await this.performUpdate();
        this.updateTimeout = null;
        resolve();
      }, this.DEBOUNCE_MS);
    });
  }

  /**
   * Perform the actual status bar update
   */
  private async performUpdate(): Promise<void> {
    const config = vscode.workspace.getConfiguration('promptiply');
    const mode = config.get('mode', 'vscode-lm');
    const useEconomy = config.get('useEconomyModel', true);
    const activeProfile = await this.profileManager.getActiveProfile();

    // Build status text
    const parts: string[] = [];

    // Icon
    parts.push('$(sparkle)');

    // Profile name or "No Profile"
    if (activeProfile) {
      parts.push(activeProfile.name);
    } else {
      parts.push('Promptiply');
    }

    // Mode indicator
    const modeText = this.getModeText(mode);
    parts.push('|');
    parts.push(modeText);

    // Economy/Premium indicator
    parts.push(useEconomy ? '💰' : '⭐');

    this.statusBarItem.text = parts.join(' ');

    // Tooltip
    const tooltip = new vscode.MarkdownString();
    tooltip.appendMarkdown('**Promptiply**\n\n');

    if (activeProfile) {
      tooltip.appendMarkdown(`**Profile:** ${activeProfile.name}\n`);
      tooltip.appendMarkdown(`**Persona:** ${activeProfile.persona}\n`);
      tooltip.appendMarkdown(`**Tone:** ${activeProfile.tone}\n\n`);
    } else {
      tooltip.appendMarkdown('**Profile:** None\n\n');
    }

    tooltip.appendMarkdown(`**Mode:** ${this.getModeName(mode)}\n`);
    tooltip.appendMarkdown(`**Quality:** ${useEconomy ? 'Economy (faster, cheaper)' : 'Premium (better, slower)'}\n\n`);
    tooltip.appendMarkdown('_Click to switch profile_');

    this.statusBarItem.tooltip = tooltip;
  }

  /**
   * Get short mode text for status bar
   */
  private getModeText(mode: string): string {
    switch (mode) {
      case 'vscode-lm':
        return 'Copilot';
      case 'ollama':
        return 'Ollama';
      case 'openai-api':
        return 'OpenAI';
      case 'anthropic-api':
        return 'Claude';
      default:
        return mode;
    }
  }

  /**
   * Get full mode name
   */
  private getModeName(mode: string): string {
    switch (mode) {
      case 'vscode-lm':
        return 'VSCode LM (Copilot)';
      case 'ollama':
        return 'Ollama (Local)';
      case 'openai-api':
        return 'OpenAI API';
      case 'anthropic-api':
        return 'Anthropic API';
      default:
        return mode;
    }
  }

  /**
   * Dispose status bar
   */
  dispose(): void {
    this.statusBarItem.dispose();
  }
}
