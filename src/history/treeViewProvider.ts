/**
 * Tree view provider for prompt history
 */

import * as vscode from 'vscode';
import { HistoryManager } from './manager';
import { HistoryEntry, HistoryGroup } from './types';

export class HistoryTreeViewProvider implements vscode.TreeDataProvider<HistoryTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<HistoryTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private historyManager: HistoryManager) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: HistoryTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: HistoryTreeItem): Promise<HistoryTreeItem[]> {
    if (!element) {
      // Root level: show date groups
      const groups = await this.historyManager.getGroupedByDate();

      if (groups.length === 0) {
        return [];
      }

      return groups.map((group) => new HistoryGroupItem(group));
    } else if (element instanceof HistoryGroupItem) {
      // Group level: show entries
      return element.group.entries.map((entry) => new HistoryEntryItem(entry));
    }

    return [];
  }

  async getParent(element: HistoryTreeItem): Promise<HistoryTreeItem | undefined> {
    if (element instanceof HistoryEntryItem) {
      const groups = await this.historyManager.getGroupedByDate();
      const group = groups.find((g) =>
        g.entries.some((e) => e.id === element.entry.id)
      );
      return group ? new HistoryGroupItem(group) : undefined;
    }
    return undefined;
  }
}

type HistoryTreeItem = HistoryGroupItem | HistoryEntryItem;

class HistoryGroupItem extends vscode.TreeItem {
  constructor(public readonly group: HistoryGroup) {
    super(group.date, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = 'historyGroup';
    this.description = `${group.entries.length} refinement${group.entries.length !== 1 ? 's' : ''}`;
  }
}

class HistoryEntryItem extends vscode.TreeItem {
  constructor(public readonly entry: HistoryEntry) {
    super(truncateText(entry.originalPrompt, 50), vscode.TreeItemCollapsibleState.None);

    const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    this.description = time;
    this.tooltip = this.createTooltip();
    this.contextValue = 'historyEntry';
    this.iconPath = new vscode.ThemeIcon(this.getModeIcon());

    // Make it clickable to open in webview
    this.command = {
      command: 'promptiply.showHistoryEntry',
      title: 'Show History Entry',
      arguments: [entry],
    };
  }

  private createTooltip(): string {
    const lines = [
      `Profile: ${this.entry.profile || 'None'}`,
      `Mode: ${this.entry.mode}`,
      `Economy: ${this.entry.isEconomy ? 'Yes' : 'No'}`,
      '',
      'Original:',
      truncateText(this.entry.originalPrompt, 100),
      '',
      'Refined:',
      truncateText(this.entry.refinedPrompt, 100),
    ];

    if (this.entry.tokenUsage) {
      lines.push('', `Tokens: ${this.entry.tokenUsage.input + this.entry.tokenUsage.output}`);
    }

    return lines.join('\n');
  }

  private getModeIcon(): string {
    switch (this.entry.mode) {
      case 'vscode-lm':
        return 'github';
      case 'ollama':
        return 'device-desktop';
      case 'openai-api':
        return 'cloud';
      case 'anthropic-api':
        return 'cloud';
      default:
        return 'note';
    }
  }
}

function truncateText(text: string, maxLength: number): string {
  // Remove extra whitespace and newlines
  const cleaned = text.replace(/\s+/g, ' ').trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return cleaned.substring(0, maxLength - 3) + '...';
}
