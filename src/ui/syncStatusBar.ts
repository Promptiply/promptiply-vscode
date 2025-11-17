/**
 * Sync Status Bar Integration
 * Shows profile sync status in the status bar
 */

import * as vscode from 'vscode';
import { ProfileSyncManager } from '../profiles/sync';

export enum SyncStatus {
  Disabled = 'disabled',
  Synced = 'synced',
  Syncing = 'syncing',
  Error = 'error',
  NotConfigured = 'not-configured'
}

export class SyncStatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private syncManager: ProfileSyncManager;
  private currentStatus: SyncStatus = SyncStatus.Disabled;

  constructor(syncManager: ProfileSyncManager) {
    this.syncManager = syncManager;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      99 // Just to the left of the main Promptiply status
    );
    this.statusBarItem.command = 'promptiply.syncMenu';
  }

  /**
   * Initialize and show status bar (always visible)
   */
  async initialize(): Promise<void> {
    await this.updateStatus();
    // Always show - makes sync feature discoverable
    this.statusBarItem.show();
  }

  /**
   * Update the sync status
   */
  async updateStatus(status?: SyncStatus): Promise<void> {
    if (status) {
      this.currentStatus = status;
    } else {
      // Auto-detect status
      const config = vscode.workspace.getConfiguration('promptiply');
      const syncEnabled = config.get<boolean>('sync.enabled', false);

      if (!syncEnabled) {
        this.currentStatus = SyncStatus.Disabled;
      } else {
        this.currentStatus = SyncStatus.Synced;
      }
    }

    this.render();
  }

  /**
   * Set syncing status
   */
  setSyncing(): void {
    this.currentStatus = SyncStatus.Syncing;
    this.render();
    this.statusBarItem.show();
  }

  /**
   * Set synced status
   */
  setSynced(): void {
    this.currentStatus = SyncStatus.Synced;
    this.render();
  }

  /**
   * Set error status
   */
  setError(message?: string): void {
    this.currentStatus = SyncStatus.Error;
    this.render();
    if (message) {
      vscode.window.showErrorMessage(`Promptiply Sync: ${message}`);
    }
  }

  /**
   * Show the status bar
   */
  show(): void {
    this.statusBarItem.show();
  }

  /**
   * Hide the status bar
   */
  hide(): void {
    this.statusBarItem.hide();
  }

  /**
   * Render the status bar
   */
  private render(): void {
    const parts: string[] = [];

    switch (this.currentStatus) {
      case SyncStatus.Disabled:
        parts.push('$(cloud-upload)');
        parts.push('Sync Off');
        this.statusBarItem.tooltip = 'Profile sync is disabled\nClick to enable sync with browser extension';
        this.statusBarItem.backgroundColor = undefined;
        break;

      case SyncStatus.Synced:
        parts.push('$(cloud-upload)');
        parts.push('Synced');
        this.statusBarItem.tooltip = 'Profiles synced with browser extension\nClick to sync now or disable';
        this.statusBarItem.backgroundColor = undefined;
        break;

      case SyncStatus.Syncing:
        parts.push('$(sync~spin)');
        parts.push('Syncing...');
        this.statusBarItem.tooltip = 'Syncing profiles...';
        this.statusBarItem.backgroundColor = undefined;
        break;

      case SyncStatus.Error:
        parts.push('$(warning)');
        parts.push('Sync Error');
        this.statusBarItem.tooltip = 'Sync error - Click to retry or disable';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.errorBackground'
        );
        break;

      case SyncStatus.NotConfigured:
        parts.push('$(cloud-upload)');
        parts.push('Sync Available');
        this.statusBarItem.tooltip = 'Profile sync available - Click to configure';
        this.statusBarItem.backgroundColor = undefined;
        break;
    }

    this.statusBarItem.text = parts.join(' ');
  }

  /**
   * Should the status bar be shown?
   */
  private shouldShow(): boolean {
    return this.currentStatus !== SyncStatus.Disabled;
  }

  /**
   * Dispose the status bar
   */
  dispose(): void {
    this.statusBarItem.dispose();
  }
}
