/**
 * Manages prompt refinement history
 */

import * as vscode from 'vscode';
import { HistoryEntry, HistoryGroup } from './types';

const MAX_HISTORY_ENTRIES = 100;

export class HistoryManager {
  private context: vscode.ExtensionContext;
  private readonly HISTORY_KEY = 'promptiply.history';

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Add a new history entry
   */
  async addEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): Promise<HistoryEntry> {
    const fullEntry: HistoryEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    const history = await this.getAll();
    history.unshift(fullEntry);

    // Keep only the most recent entries
    const trimmedHistory = history.slice(0, MAX_HISTORY_ENTRIES);
    await this.context.globalState.update(this.HISTORY_KEY, trimmedHistory);

    return fullEntry;
  }

  /**
   * Get all history entries
   */
  async getAll(): Promise<HistoryEntry[]> {
    return this.context.globalState.get<HistoryEntry[]>(this.HISTORY_KEY, []);
  }

  /**
   * Get history grouped by date
   */
  async getGroupedByDate(): Promise<HistoryGroup[]> {
    const entries = await this.getAll();
    const groups = new Map<string, HistoryEntry[]>();

    for (const entry of entries) {
      const date = this.formatDate(entry.timestamp);
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(entry);
    }

    return Array.from(groups.entries()).map(([date, entries]) => ({
      date,
      entries,
    }));
  }

  /**
   * Get entry by ID
   */
  async getById(id: string): Promise<HistoryEntry | undefined> {
    const history = await this.getAll();
    return history.find((entry) => entry.id === id);
  }

  /**
   * Delete entry by ID
   */
  async deleteById(id: string): Promise<void> {
    const history = await this.getAll();
    const filtered = history.filter((entry) => entry.id !== id);
    await this.context.globalState.update(this.HISTORY_KEY, filtered);
  }

  /**
   * Clear all history
   */
  async clear(): Promise<void> {
    await this.context.globalState.update(this.HISTORY_KEY, []);
  }

  /**
   * Search history by text
   */
  async search(query: string): Promise<HistoryEntry[]> {
    const history = await this.getAll();
    const lowerQuery = query.toLowerCase();

    return history.filter(
      (entry) =>
        entry.originalPrompt.toLowerCase().includes(lowerQuery) ||
        entry.refinedPrompt.toLowerCase().includes(lowerQuery) ||
        entry.profile?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    total: number;
    byMode: Record<string, number>;
    byProfile: Record<string, number>;
    totalTokensUsed: number;
  }> {
    const history = await this.getAll();

    const byMode: Record<string, number> = {};
    const byProfile: Record<string, number> = {};
    let totalTokensUsed = 0;

    for (const entry of history) {
      byMode[entry.mode] = (byMode[entry.mode] || 0) + 1;

      if (entry.profile) {
        byProfile[entry.profile] = (byProfile[entry.profile] || 0) + 1;
      }

      if (entry.tokenUsage) {
        totalTokensUsed += entry.tokenUsage.input + entry.tokenUsage.output;
      }
    }

    return {
      total: history.length,
      byMode,
      byProfile,
      totalTokensUsed,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();

    if (dateStr === todayStr) {
      return 'Today';
    } else if (dateStr === yesterdayStr) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  }
}
