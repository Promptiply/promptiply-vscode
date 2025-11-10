/**
 * Webview panel for displaying refinement results with rich UI
 */

import * as vscode from 'vscode';
import { HistoryEntry } from '../history/types';
import { RefinementResult } from '../profiles/types';

export class WebviewPanelManager {
  private static currentPanel: vscode.WebviewPanel | undefined;
  private static context: vscode.ExtensionContext;

  static initialize(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Show refinement result in webview
   */
  static showRefinement(
    original: string,
    result: RefinementResult,
    profile?: string
  ): vscode.WebviewPanel {
    const panel = this.getOrCreatePanel();

    panel.webview.html = this.getRefinementHtml(original, result, profile);
    panel.reveal();

    return panel;
  }

  /**
   * Show history entry in webview
   */
  static showHistoryEntry(entry: HistoryEntry): vscode.WebviewPanel {
    const panel = this.getOrCreatePanel();

    panel.webview.html = this.getHistoryEntryHtml(entry);
    panel.reveal();

    return panel;
  }

  private static getOrCreatePanel(): vscode.WebviewPanel {
    if (this.currentPanel) {
      return this.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      'promptiplyRefinement',
      'Promptiply Refinement',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    panel.iconPath = vscode.Uri.joinPath(
      this.context.extensionUri,
      'media',
      'icon.png'
    );

    panel.onDidDispose(() => {
      this.currentPanel = undefined;
    });

    this.currentPanel = panel;
    return panel;
  }

  private static getRefinementHtml(
    original: string,
    result: RefinementResult,
    profile?: string
  ): string {
    const timestamp = new Date().toLocaleString();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Refined Prompt</title>
  <style>
    ${this.getStyles()}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Prompt Refined</h1>
      <div class="metadata">
        <span class="badge">${profile || 'No Profile'}</span>
        <span class="timestamp">${timestamp}</span>
      </div>
    </div>

    <div class="section">
      <h2>📝 Original Prompt</h2>
      <div class="prompt-box original">
        <pre>${this.escapeHtml(original)}</pre>
      </div>
      <div class="stats">
        ${original.length} characters, ${original.split(/\s+/).length} words
      </div>
    </div>

    <div class="section">
      <h2>🎯 Refined Prompt</h2>
      <div class="prompt-box refined">
        <pre>${this.escapeHtml(result.refinedPrompt)}</pre>
      </div>
      <div class="stats">
        ${result.refinedPrompt.length} characters, ${result.refinedPrompt.split(/\s+/).length} words
        ${result.tokenUsage ? `• ${result.tokenUsage.input + result.tokenUsage.output} tokens used` : ''}
      </div>
    </div>

    ${result.reasoning ? `
    <div class="section">
      <h2>💭 Reasoning</h2>
      <div class="reasoning-box">
        <pre>${this.escapeHtml(result.reasoning)}</pre>
      </div>
    </div>
    ` : ''}

    ${result.topics && result.topics.length > 0 ? `
    <div class="section">
      <h2>🏷️ Detected Topics</h2>
      <div class="topics">
        ${result.topics.map((topic: string) => `<span class="topic-tag">${this.escapeHtml(topic)}</span>`).join('')}
      </div>
    </div>
    ` : ''}

    <div class="actions">
      <button onclick="copyToClipboard('refined')">📋 Copy Refined</button>
      <button onclick="copyToClipboard('original')">📋 Copy Original</button>
    </div>
  </div>

  <script>
    ${this.getScript()}
  </script>
</body>
</html>`;
  }

  private static getHistoryEntryHtml(entry: HistoryEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleString();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>History Entry</title>
  <style>
    ${this.getStyles()}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📜 History Entry</h1>
      <div class="metadata">
        <span class="badge">${entry.profile || 'No Profile'}</span>
        <span class="badge">${entry.mode}</span>
        <span class="badge">${entry.isEconomy ? 'Economy' : 'Premium'}</span>
        <span class="timestamp">${timestamp}</span>
      </div>
    </div>

    <div class="section">
      <h2>📝 Original Prompt</h2>
      <div class="prompt-box original">
        <pre>${this.escapeHtml(entry.originalPrompt)}</pre>
      </div>
      <div class="stats">
        ${entry.originalPrompt.length} characters, ${entry.originalPrompt.split(/\s+/).length} words
      </div>
    </div>

    <div class="section">
      <h2>🎯 Refined Prompt</h2>
      <div class="prompt-box refined">
        <pre>${this.escapeHtml(entry.refinedPrompt)}</pre>
      </div>
      <div class="stats">
        ${entry.refinedPrompt.length} characters, ${entry.refinedPrompt.split(/\s+/).length} words
        ${entry.tokenUsage ? `• ${entry.tokenUsage.input + entry.tokenUsage.output} tokens used` : ''}
      </div>
    </div>

    ${entry.topics && entry.topics.length > 0 ? `
    <div class="section">
      <h2>🏷️ Topics</h2>
      <div class="topics">
        ${entry.topics.map((topic: string) => `<span class="topic-tag">${this.escapeHtml(topic)}</span>`).join('')}
      </div>
    </div>
    ` : ''}

    <div class="actions">
      <button onclick="copyToClipboard('refined')">📋 Copy Refined</button>
      <button onclick="copyToClipboard('original')">📋 Copy Original</button>
    </div>
  </div>

  <script>
    ${this.getScript()}
  </script>
</body>
</html>`;
  }

  private static getStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: var(--vscode-font-family);
        font-size: var(--vscode-font-size);
        color: var(--vscode-foreground);
        background: var(--vscode-editor-background);
        padding: 20px;
        line-height: 1.6;
      }

      .container {
        max-width: 900px;
        margin: 0 auto;
      }

      .header {
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--vscode-panel-border);
      }

      h1 {
        font-size: 28px;
        margin-bottom: 10px;
        color: var(--vscode-foreground);
      }

      h2 {
        font-size: 18px;
        margin-bottom: 12px;
        color: var(--vscode-foreground);
        font-weight: 600;
      }

      .metadata {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
      }

      .badge {
        display: inline-block;
        padding: 4px 12px;
        background: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }

      .timestamp {
        color: var(--vscode-descriptionForeground);
        font-size: 13px;
      }

      .section {
        margin-bottom: 30px;
      }

      .prompt-box {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        padding: 16px;
        background: var(--vscode-textCodeBlock-background);
        margin-bottom: 8px;
      }

      .prompt-box.original {
        border-left: 3px solid var(--vscode-editorWarning-foreground);
      }

      .prompt-box.refined {
        border-left: 3px solid var(--vscode-editorInfo-foreground);
      }

      .prompt-box pre {
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: var(--vscode-editor-font-family);
        font-size: 14px;
        line-height: 1.5;
      }

      .stats {
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
        margin-bottom: 8px;
      }

      .reasoning-box {
        padding: 16px;
        background: var(--vscode-textBlockQuote-background);
        border-left: 3px solid var(--vscode-textBlockQuote-border);
        border-radius: 4px;
      }

      .reasoning-box pre {
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: var(--vscode-editor-font-family);
        font-size: 13px;
        line-height: 1.5;
        color: var(--vscode-descriptionForeground);
      }

      .topics {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .topic-tag {
        display: inline-block;
        padding: 6px 12px;
        background: var(--vscode-terminal-ansiBlue);
        color: var(--vscode-terminal-ansiBrightBlack);
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      }

      .actions {
        display: flex;
        gap: 12px;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid var(--vscode-panel-border);
      }

      button {
        padding: 10px 20px;
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background 0.2s;
      }

      button:hover {
        background: var(--vscode-button-hoverBackground);
      }

      button:active {
        transform: translateY(1px);
      }

      .copy-feedback {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: var(--vscode-notificationsInfoIcon-foreground);
        color: white;
        border-radius: 4px;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
        z-index: 1000;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
  }

  private static getScript(): string {
    return `
      function copyToClipboard(type) {
        const boxes = document.querySelectorAll('.prompt-box');
        const text = type === 'refined'
          ? boxes[boxes.length > 1 ? 1 : 0].textContent
          : boxes[0].textContent;

        navigator.clipboard.writeText(text.trim()).then(() => {
          showCopyFeedback(type === 'refined' ? 'Refined prompt' : 'Original prompt');
        });
      }

      function showCopyFeedback(what) {
        const feedback = document.createElement('div');
        feedback.className = 'copy-feedback';
        feedback.textContent = what + ' copied to clipboard!';
        document.body.appendChild(feedback);

        setTimeout(() => {
          feedback.remove();
        }, 2000);
      }
    `;
  }

  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
