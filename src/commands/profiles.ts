/**
 * Profile management commands
 */

import * as vscode from 'vscode';
import { ProfileManager } from '../profiles/manager';
import { BUILTIN_PROFILES } from '../profiles/builtinProfiles';

export class ProfileCommands {
  private profileManager: ProfileManager;

  constructor(profileManager: ProfileManager) {
    this.profileManager = profileManager;
  }

  /**
   * Switch active profile
   */
  async switchProfile(): Promise<void> {
    const config = await this.profileManager.getProfiles();
    const activeProfile = await this.profileManager.getActiveProfile();

    const items = [
      {
        label: '$(circle-outline) No Profile',
        description: 'Use base refinement without customization',
        profileId: null,
        picked: activeProfile === null,
      },
      ...config.list.map(profile => ({
        label: `${activeProfile?.id === profile.id ? '$(check) ' : ''}${profile.name}`,
        description: `${profile.persona} • ${profile.tone}`,
        detail: profile.styleGuidelines.join(', '),
        profileId: profile.id,
        picked: activeProfile?.id === profile.id,
      })),
    ];

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a profile',
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (selected === undefined) {
      return; // User cancelled
    }

    await this.profileManager.setActiveProfile(selected.profileId);

    const name = selected.profileId
      ? config.list.find(p => p.id === selected.profileId)?.name
      : 'No Profile';

    vscode.window.showInformationMessage(`Profile changed to: ${name}`);
  }

  /**
   * Import profiles from JSON file
   */
  async importProfiles(): Promise<void> {
    const uri = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        'JSON Files': ['json'],
      },
      title: 'Select profile export file',
    });

    if (!uri || uri.length === 0) {
      return;
    }

    try {
      const content = await vscode.workspace.fs.readFile(uri[0]);
      const json = Buffer.from(content).toString('utf-8');

      const count = await this.profileManager.importProfiles(json);

      vscode.window.showInformationMessage(
        `Successfully imported ${count} profile${count === 1 ? '' : 's'}!`
      );
    } catch (error: any) {
      vscode.window.showErrorMessage(`Import failed: ${error.message}`);
    }
  }

  /**
   * Export profiles to JSON file
   */
  async exportProfiles(): Promise<void> {
    try {
      const json = await this.profileManager.exportProfiles();

      const uri = await vscode.window.showSaveDialog({
        filters: {
          'JSON Files': ['json'],
        },
        defaultUri: vscode.Uri.file('promptiply-profiles.json'),
        title: 'Save profile export',
      });

      if (!uri) {
        return;
      }

      await vscode.workspace.fs.writeFile(
        uri,
        Buffer.from(json, 'utf-8')
      );

      vscode.window.showInformationMessage('Profiles exported successfully!');
    } catch (error: any) {
      vscode.window.showErrorMessage(`Export failed: ${error.message}`);
    }
  }

  /**
   * Create a new profile
   */
  async createProfile(): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: 'Profile name',
      placeHolder: 'e.g., Technical Writer',
      validateInput: (value) => {
        if (!value.trim()) {
          return 'Name cannot be empty';
        }
        return null;
      },
    });

    if (!name) {
      return;
    }

    const persona = await vscode.window.showInputBox({
      prompt: 'Target persona',
      placeHolder: 'e.g., Senior Software Engineer',
      validateInput: (value) => {
        if (!value.trim()) {
          return 'Persona cannot be empty';
        }
        return null;
      },
    });

    if (!persona) {
      return;
    }

    const tone = await vscode.window.showInputBox({
      prompt: 'Target tone',
      placeHolder: 'e.g., clear, concise, professional',
      validateInput: (value) => {
        if (!value.trim()) {
          return 'Tone cannot be empty';
        }
        return null;
      },
    });

    if (!tone) {
      return;
    }

    const guidelinesInput = await vscode.window.showInputBox({
      prompt: 'Style guidelines (comma-separated)',
      placeHolder: 'e.g., Use simple language, Prefer examples, No fluff',
    });

    const styleGuidelines = guidelinesInput
      ? guidelinesInput.split(',').map(g => g.trim()).filter(Boolean)
      : [];

    const profile = await this.profileManager.addProfile({
      name,
      persona,
      tone,
      styleGuidelines,
    });

    const makeActive = await vscode.window.showInformationMessage(
      `Profile "${name}" created!`,
      'Make Active',
      'OK'
    );

    if (makeActive === 'Make Active') {
      await this.profileManager.setActiveProfile(profile.id);
    }
  }

  /**
   * Delete a profile
   */
  async deleteProfile(): Promise<void> {
    const config = await this.profileManager.getProfiles();

    if (config.list.length === 0) {
      vscode.window.showInformationMessage('No profiles to delete');
      return;
    }

    const items = config.list.map(profile => ({
      label: profile.name,
      description: `${profile.persona} • ${profile.tone}`,
      profileId: profile.id,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select profile to delete',
    });

    if (!selected) {
      return;
    }

    const confirm = await vscode.window.showWarningMessage(
      `Delete profile "${selected.label}"? This cannot be undone.`,
      'Delete',
      'Cancel'
    );

    if (confirm !== 'Delete') {
      return;
    }

    await this.profileManager.deleteProfile(selected.profileId);
    vscode.window.showInformationMessage(`Profile "${selected.label}" deleted`);
  }

  /**
   * View profile details
   */
  async viewProfile(): Promise<void> {
    const activeProfile = await this.profileManager.getActiveProfile();

    if (!activeProfile) {
      vscode.window.showInformationMessage(
        'No active profile. Use "Switch Profile" to select one.'
      );
      return;
    }

    const evolution = activeProfile.evolving_profile;
    const topTopics = evolution.topics.slice(0, 5);

    const message = [
      `**${activeProfile.name}**`,
      '',
      `**Persona:** ${activeProfile.persona}`,
      `**Tone:** ${activeProfile.tone}`,
      `**Guidelines:** ${activeProfile.styleGuidelines.join(', ')}`,
      '',
      `**Usage:** ${evolution.usageCount} times`,
      topTopics.length > 0
        ? `**Top Topics:** ${topTopics.map(t => t.name).join(', ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    // Show in a simple webview or info message
    const panel = vscode.window.createWebviewPanel(
      'promptiply-profile',
      `Profile: ${activeProfile.name}`,
      vscode.ViewColumn.Beside,
      {}
    );

    panel.webview.html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: var(--vscode-font-family);
              padding: 20px;
              color: var(--vscode-foreground);
            }
            h1 { color: var(--vscode-textLink-foreground); }
            .section { margin: 20px 0; }
            .label { font-weight: bold; color: var(--vscode-textLink-foreground); }
            .topic {
              display: inline-block;
              background: var(--vscode-badge-background);
              color: var(--vscode-badge-foreground);
              padding: 4px 8px;
              margin: 4px;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <h1>${activeProfile.name}</h1>
          <div class="section">
            <div class="label">Persona:</div>
            <div>${activeProfile.persona}</div>
          </div>
          <div class="section">
            <div class="label">Tone:</div>
            <div>${activeProfile.tone}</div>
          </div>
          <div class="section">
            <div class="label">Style Guidelines:</div>
            <ul>
              ${activeProfile.styleGuidelines.map(g => `<li>${g}</li>`).join('')}
            </ul>
          </div>
          <div class="section">
            <div class="label">Usage Statistics:</div>
            <div>Used ${evolution.usageCount} times</div>
            ${topTopics.length > 0 ? `
              <div class="label" style="margin-top: 10px;">Top Topics:</div>
              <div>
                ${topTopics.map(t => `<span class="topic">${t.name} (${t.count})</span>`).join('')}
              </div>
            ` : ''}
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Install a built-in profile template
   */
  async installBuiltInProfile(): Promise<void> {
    const items = BUILTIN_PROFILES.map(template => ({
      label: `$(star) ${template.name}`,
      description: template.description,
      detail: `Persona: ${template.profile.persona}`,
      template
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a built-in profile to install',
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (!selected) {
      return;
    }

    try {
      // Check if profile with same name already exists
      const existing = await this.profileManager.getProfiles();
      const existingProfile = existing.list.find(p => p.name === selected.template.name);

      if (existingProfile) {
        const overwrite = await vscode.window.showWarningMessage(
          `Profile "${selected.template.name}" already exists. Overwrite it?`,
          { modal: true },
          'Overwrite',
          'Cancel'
        );

        if (overwrite !== 'Overwrite') {
          return;
        }

        // Delete existing profile
        await this.profileManager.deleteProfile(existingProfile.id);
      }

      // Install the profile
      const profile = await this.profileManager.addProfile({
        name: selected.template.profile.name,
        persona: selected.template.profile.persona,
        tone: selected.template.profile.tone,
        styleGuidelines: selected.template.profile.styleGuidelines,
      });

      const makeActive = await vscode.window.showInformationMessage(
        `✅ Profile "${selected.template.name}" installed!`,
        'Make Active',
        'OK'
      );

      if (makeActive === 'Make Active') {
        await this.profileManager.setActiveProfile(profile.id);
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to install profile: ${error.message}`);
    }
  }

  /**
   * Reset all profiles to defaults (9 professional profiles)
   */
  async resetToDefaults(): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
      'Reset all profiles to the 9 professional defaults? This will DELETE all your current profiles.',
      { modal: true },
      'Reset to Defaults',
      'Cancel'
    );

    if (confirm !== 'Reset to Defaults') {
      return;
    }

    try {
      // Clear all profiles by setting an empty config
      await this.profileManager.saveProfiles({
        list: [],
        activeProfileId: null
      });

      // Get fresh defaults (this will trigger loading the 9 professional profiles)
      const config = await this.profileManager.getProfiles();

      vscode.window.showInformationMessage(
        `✅ Profiles reset! You now have ${config.list.length} professional profiles:\n${config.list.map(p => p.name).join(', ')}`
      );
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to reset profiles: ${error.message}`);
    }
  }
}
