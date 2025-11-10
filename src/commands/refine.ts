/**
 * Refine commands - main user interface
 */

import * as vscode from 'vscode';
import { RefinementEngine } from '../refinement/engine';
import { ProfileManager } from '../profiles/manager';
import { HistoryManager } from '../history/manager';
import { WebviewPanelManager } from '../ui/webviewPanel';

export class RefineCommands {
  private engine: RefinementEngine;
  private profileManager: ProfileManager;
  private historyManager: HistoryManager;

  constructor(engine: RefinementEngine, profileManager: ProfileManager, historyManager: HistoryManager) {
    this.engine = engine;
    this.profileManager = profileManager;
    this.historyManager = historyManager;
  }

  /**
   * Refine selected text
   */
  async refineSelection(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    const selection = editor.selection;
    const text = editor.document.getText(selection);

    if (!text.trim()) {
      vscode.window.showErrorMessage('Please select some text to refine');
      return;
    }

    await this.refineText(text, editor, selection);
  }

  /**
   * Refine entire file
   */
  async refineFile(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    const text = editor.document.getText();

    if (!text.trim()) {
      vscode.window.showErrorMessage('File is empty');
      return;
    }

    const fullRange = new vscode.Range(
      editor.document.positionAt(0),
      editor.document.positionAt(text.length)
    );

    await this.refineText(text, editor, fullRange);
  }

  /**
   * Refine from clipboard - perfect for AI chat interfaces!
   * 1. Copy your prompt from chat (Cmd+C)
   * 2. Trigger this command (Cmd+Shift+Alt+R)
   * 3. Refined prompt is copied back to clipboard
   * 4. Paste into chat (Cmd+V)
   */
  async refineFromClipboard(): Promise<void> {
    // Read clipboard
    const clipboardText = await vscode.env.clipboard.readText();

    if (!clipboardText.trim()) {
      vscode.window.showErrorMessage('Clipboard is empty. Copy some text first!');
      return;
    }

    // Refine without editor
    await this.refineAndCopy(clipboardText, 'Clipboard');
  }

  /**
   * Refine from input box - type or paste your prompt
   * Perfect for quick refinements without leaving your workflow
   */
  async refineFromInput(): Promise<void> {
    const input = await vscode.window.showInputBox({
      prompt: 'Enter the prompt you want to refine (you can paste multiline text)',
      placeHolder: 'e.g., make a function that sorts arrays',
      ignoreFocusOut: true,
    });

    if (!input || !input.trim()) {
      return; // User cancelled or empty
    }

    await this.refineAndCopy(input, 'Input');
  }

  /**
   * Main refinement logic
   */
  private async refineText(
    text: string,
    editor: vscode.TextEditor,
    range: vscode.Range | vscode.Selection
  ): Promise<void> {
    // Get UI mode preference
    const config = vscode.workspace.getConfiguration('promptiply');
    const uiMode = config.get('ui.defaultMode', 'ask');

    // Ask user if mode is 'ask'
    let selectedMode = uiMode;
    if (uiMode === 'ask') {
      const choice = await vscode.window.showQuickPick(
        [
          { label: '$(replace) Replace Inline', value: 'inline', description: 'Replace text immediately' },
          { label: '$(window) Open in Panel', value: 'webview', description: 'Review before applying' },
          { label: '$(diff) Show Diff', value: 'diff', description: 'Side-by-side comparison' },
          { label: '$(clippy) Copy to Clipboard', value: 'copy', description: 'Just copy, don\'t replace' },
        ],
        {
          placeHolder: 'How would you like to view the refined prompt?',
        }
      );

      if (!choice) {
        return; // User cancelled
      }

      selectedMode = choice.value;
    }

    // Show progress
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Refining prompt...',
        cancellable: true,
      },
      async (progress, token) => {
        try {
          const config = RefinementEngine.getConfig();

          // Refine
          const result = await this.engine.refine(
            text,
            config,
            (message) => {
              progress.report({ message });
            },
            token
          );

          if (token.isCancellationRequested) {
            return;
          }

          // Save to history
          await this.saveToHistory(text, result, config);

          // Apply based on selected mode
          switch (selectedMode) {
            case 'inline':
              await this.applyInline(editor, range, result.refinedPrompt);
              break;

            case 'webview':
              await this.showInWebview(text, result, editor, range);
              break;

            case 'diff':
              await this.showDiff(text, result.refinedPrompt, editor, range);
              break;

            case 'copy':
              await vscode.env.clipboard.writeText(result.refinedPrompt);
              vscode.window.showInformationMessage('✨ Refined prompt copied to clipboard!');
              break;

            default:
              await this.applyInline(editor, range, result.refinedPrompt);
          }
        } catch (error: any) {
          vscode.window.showErrorMessage(`Refinement failed: ${error.message}`);
        }
      }
    );
  }

  /**
   * Refine and copy to clipboard (for AI chat integration)
   */
  async refineAndCopy(text: string, source: string): Promise<void> {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Refining ${source.toLowerCase()} content...`,
        cancellable: true,
      },
      async (progress, token) => {
        try {
          const config = RefinementEngine.getConfig();

          // Refine
          const result = await this.engine.refine(
            text,
            config,
            (message) => {
              progress.report({ message });
            },
            token
          );

          if (token.isCancellationRequested) {
            return;
          }

          // Save to history
          await this.saveToHistory(text, result, config);

          const refined = result.refinedPrompt;

          // Show refined prompt in a nice dialog with options
          const action = await vscode.window.showInformationMessage(
            `✨ Prompt refined! (${refined.length} characters)`,
            { modal: false },
            'Copy to Clipboard',
            'Edit Before Copying',
            'View Original'
          );

          if (action === 'Copy to Clipboard') {
            await vscode.env.clipboard.writeText(refined);
            vscode.window.showInformationMessage('📋 Copied! Paste into your AI chat (Cmd+V)');
          } else if (action === 'Edit Before Copying') {
            const edited = await vscode.window.showInputBox({
              prompt: 'Edit the refined prompt if needed',
              value: refined,
              ignoreFocusOut: true,
            });

            if (edited !== undefined) {
              await vscode.env.clipboard.writeText(edited);
              vscode.window.showInformationMessage('📋 Edited version copied! Paste into your AI chat (Cmd+V)');
            }
          } else if (action === 'View Original') {
            // Show original vs refined in a quick pick
            const choice = await vscode.window.showQuickPick(
              [
                {
                  label: '✨ Refined (Recommended)',
                  description: refined.substring(0, 100) + (refined.length > 100 ? '...' : ''),
                  detail: `${refined.length} characters`,
                  value: refined,
                },
                {
                  label: '📝 original',
                  description: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                  detail: `${text.length} characters`,
                  value: text,
                },
              ],
              {
                placeHolder: 'Choose which version to copy',
              }
            );

            if (choice) {
              await vscode.env.clipboard.writeText(choice.value);
              vscode.window.showInformationMessage('📋 Copied! Paste into your AI chat (Cmd+V)');
            }
          } else {
            // User dismissed, still copy refined version for convenience
            await vscode.env.clipboard.writeText(refined);
          }
        } catch (error: any) {
          vscode.window.showErrorMessage(`Refinement failed: ${error.message}`);
        }
      }
    );
  }

  /**
   * Apply refinement inline (replace immediately)
   */
  private async applyInline(
    editor: vscode.TextEditor,
    range: vscode.Range | vscode.Selection,
    refined: string
  ): Promise<void> {
    await editor.edit(editBuilder => {
      editBuilder.replace(range, refined);
    });

    vscode.window.showInformationMessage('✨ Prompt refined! (Cmd+Z to undo)');
  }

  /**
   * Show refinement in webview panel
   */
  private async showInWebview(
    original: string,
    result: any,
    editor: vscode.TextEditor,
    range: vscode.Range | vscode.Selection
  ): Promise<void> {
    // Get active profile name
    const profile = await this.profileManager.getActiveProfile();
    const profileName = profile?.name;

    // Show in webview panel
    WebviewPanelManager.showRefinement(original, result, profileName);

    // Ask if user wants to apply to editor
    const apply = await vscode.window.showInformationMessage(
      'Apply refined prompt to editor?',
      'Apply',
      'Cancel'
    );

    if (apply === 'Apply') {
      await editor.edit(editBuilder => {
        editBuilder.replace(range, result.refinedPrompt);
      });
      vscode.window.showInformationMessage('✨ Prompt applied!');
    }
  }

  /**
   * Save refinement to history
   */
  private async saveToHistory(
    originalPrompt: string,
    result: any,
    config: any
  ): Promise<void> {
    const profile = await this.profileManager.getActiveProfile();

    await this.historyManager.addEntry({
      originalPrompt,
      refinedPrompt: result.refinedPrompt,
      profile: profile?.name,
      mode: config.mode,
      isEconomy: config.useEconomyModel,
      tokenUsage: result.tokenUsage,
      topics: result.topics,
    });
  }

  /**
   * Show refinement in diff editor
   */
  private async showDiff(
    original: string,
    refined: string,
    editor: vscode.TextEditor,
    range: vscode.Range | vscode.Selection
  ): Promise<void> {
    // Create temporary documents for diff
    const originalUri = vscode.Uri.parse(`promptiply-original:Original Prompt`);
    const refinedUri = vscode.Uri.parse(`promptiply-refined:Refined Prompt`);

    // Register text document content provider
    const provider = new (class implements vscode.TextDocumentContentProvider {
      provideTextDocumentContent(uri: vscode.Uri): string {
        if (uri.scheme === 'promptiply-original') {
          return original;
        }
        if (uri.scheme === 'promptiply-refined') {
          return refined;
        }
        return '';
      }
    })();

    const disposable = vscode.workspace.registerTextDocumentContentProvider(
      'promptiply-original',
      provider
    );
    const disposable2 = vscode.workspace.registerTextDocumentContentProvider(
      'promptiply-refined',
      provider
    );

    try {
      // Show diff
      await vscode.commands.executeCommand(
        'vscode.diff',
        originalUri,
        refinedUri,
        'Promptiply: Original ↔ Refined'
      );

      // Ask if user wants to apply
      const apply = await vscode.window.showInformationMessage(
        'Apply refined prompt?',
        'Apply',
        'Cancel'
      );

      if (apply === 'Apply') {
        await editor.edit(editBuilder => {
          editBuilder.replace(range, refined);
        });
        vscode.window.showInformationMessage('✨ Prompt applied!');
      }
    } finally {
      disposable.dispose();
      disposable2.dispose();
    }
  }
}
