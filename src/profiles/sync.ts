/**
 * Profile synchronization with browser extension
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ProfileManager } from './manager';
import { SyncStatusBarManager } from '../ui/syncStatusBar';

export class ProfileSyncManager {
  private context: vscode.ExtensionContext;
  private profileManager: ProfileManager;
  private watcher: vscode.FileSystemWatcher | undefined;
  private syncFilePath: string;
  private statusBarManager: SyncStatusBarManager | undefined;
  private profilesChangedListener: vscode.Disposable | undefined;
  private isImporting: boolean = false; // Prevent export loops

  constructor(context: vscode.ExtensionContext, profileManager: ProfileManager) {
    this.context = context;
    this.profileManager = profileManager;

    // Get sync file path from settings or use default
    const config = vscode.workspace.getConfiguration('promptiply');
    const customPath = config.get<string>('sync.filePath');

    if (customPath) {
      this.syncFilePath = customPath;
    } else {
      // Default to user's home directory
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      this.syncFilePath = path.join(homeDir, '.promptiply-profiles.json');
    }
  }

  /**
   * Set the status bar manager for sync status updates
   */
  setStatusBarManager(statusBarManager: SyncStatusBarManager): void {
    this.statusBarManager = statusBarManager;
  }

  /**
   * Enable automatic sync
   */
  async enableSync(): Promise<void> {
    // Export current profiles to sync file
    await this.exportToSyncFile();

    // Watch for changes to the sync file (for imports from browser extension)
    this.watcher = vscode.workspace.createFileSystemWatcher(this.syncFilePath);

    this.watcher.onDidChange(async () => {
      await this.importFromSyncFile();
    });

    this.context.subscriptions.push(this.watcher);

    // Listen for profile changes and auto-export (for changes in VSCode)
    this.profilesChangedListener = this.profileManager.onProfilesChanged(async () => {
      // Only export if we're not currently importing (to prevent loops)
      if (!this.isImporting) {
        await this.exportToSyncFile();
      }
    });

    this.context.subscriptions.push(this.profilesChangedListener);

    vscode.window.showInformationMessage(
      `✅ Automatic sync enabled! File: ${this.syncFilePath}`
    );
  }

  /**
   * Disable automatic sync
   */
  async disableSync(): Promise<void> {
    if (this.watcher) {
      this.watcher.dispose();
      this.watcher = undefined;
    }

    if (this.profilesChangedListener) {
      this.profilesChangedListener.dispose();
      this.profilesChangedListener = undefined;
    }

    vscode.window.showInformationMessage('Profile sync disabled');
  }

  /**
   * Check if sync is enabled
   */
  isSyncEnabled(): boolean {
    const config = vscode.workspace.getConfiguration('promptiply');
    return config.get<boolean>('sync.enabled', false);
  }

  /**
   * Export profiles to sync file
   * Uses Chrome extension's native format: {list, activeProfileId, profiles_storage_location}
   *
   * Note: The browser extension uses a hybrid storage approach:
   * - chrome.storage.sync (default, ~8KB limit, cross-device sync)
   * - chrome.storage.local (fallback, 10MB+, local only)
   *
   * The storage location preference is stored separately and synced across devices.
   */
  async exportToSyncFile(): Promise<void> {
    try {
      this.statusBarManager?.setSyncing();

      const config = await this.profileManager.getProfiles();

      // Use Chrome extension's storage format with hybrid storage support
      const syncData: any = {
        list: config.list,
        activeProfileId: config.activeProfileId,
      };

      // Include storage location preference if available (for browser extension compatibility)
      // The browser extension will use this to determine where to store profiles
      const storageLocation = this.context.globalState.get<string>('profiles_storage_location', 'sync');
      syncData.profiles_storage_location = storageLocation;

      const json = JSON.stringify(syncData, null, 2);

      // Ensure directory exists
      const dir = path.dirname(this.syncFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write to file
      fs.writeFileSync(this.syncFilePath, json, 'utf-8');

      this.statusBarManager?.setSynced();

      const profileCount = config.list.length;
      const activeProfile = config.list.find(p => p.id === config.activeProfileId);

      vscode.window.showInformationMessage(
        `✅ Exported ${profileCount} profile${profileCount !== 1 ? 's' : ''} to sync file${activeProfile ? ` (active: ${activeProfile.name})` : ''}`
      );
    } catch (error: any) {
      this.statusBarManager?.setError();
      vscode.window.showErrorMessage(`❌ Export failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Import profiles from sync file
   * Reads Chrome extension's native format: {list, activeProfileId, profiles_storage_location}
   *
   * Handles hybrid storage preferences from the browser extension.
   */
  async importFromSyncFile(): Promise<void> {
    try {
      this.isImporting = true; // Prevent export loop
      this.statusBarManager?.setSyncing();

      if (!fs.existsSync(this.syncFilePath)) {
        vscode.window.showWarningMessage('❌ Sync file not found');
        this.statusBarManager?.setError();
        return;
      }

      const json = fs.readFileSync(this.syncFilePath, 'utf-8');
      const syncData = JSON.parse(json);

      // Validate format
      if (!this.validateSyncData(syncData)) {
        throw new Error('Invalid sync file format. Expected {list: [...], activeProfileId: ...}');
      }

      // Import profiles
      const localConfig = await this.profileManager.getProfiles();
      const newProfiles = [...syncData.list];

      // Store storage location preference if present (from browser extension)
      if (syncData.profiles_storage_location) {
        await this.context.globalState.update('profiles_storage_location', syncData.profiles_storage_location);
      }

      // Update local storage (this will trigger onProfilesChanged, but isImporting flag prevents re-export)
      await this.profileManager.saveProfiles({
        list: newProfiles,
        activeProfileId: syncData.activeProfileId,
      });

      this.statusBarManager?.setSynced();

      const activeProfile = newProfiles.find(p => p.id === syncData.activeProfileId);

      vscode.window.showInformationMessage(
        `✅ Imported ${newProfiles.length} profile${newProfiles.length !== 1 ? 's' : ''} from sync file${activeProfile ? ` (active: ${activeProfile.name})` : ''}`
      );
    } catch (error: any) {
      this.statusBarManager?.setError();
      vscode.window.showErrorMessage(`❌ Import failed: ${error.message}`);
      throw error;
    } finally {
      this.isImporting = false; // Reset flag
    }
  }

  /**
   * Validate sync data format
   */
  private validateSyncData(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Must have list array
    if (!Array.isArray(data.list)) {
      return false;
    }

    // activeProfileId can be null or string
    if (data.activeProfileId !== null && typeof data.activeProfileId !== 'string') {
      return false;
    }

    // Validate each profile has required fields
    for (const profile of data.list) {
      if (!profile || typeof profile !== 'object') {
        return false;
      }

      if (!profile.id || !profile.name || !profile.persona || !profile.tone) {
        return false;
      }

      if (!Array.isArray(profile.styleGuidelines)) {
        return false;
      }

      // Validate evolving_profile structure
      if (!profile.evolving_profile || typeof profile.evolving_profile !== 'object') {
        return false;
      }

      if (!Array.isArray(profile.evolving_profile.topics)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get sync file path
   */
  getSyncFilePath(): string {
    return this.syncFilePath;
  }

  /**
   * Set sync file path
   */
  async setSyncFilePath(filePath: string): Promise<void> {
    this.syncFilePath = filePath;

    const config = vscode.workspace.getConfiguration('promptiply');
    await config.update('sync.filePath', filePath, vscode.ConfigurationTarget.Global);

    vscode.window.showInformationMessage(`Sync file updated: ${filePath}`);
  }

  /**
   * Get storage location preference
   * Used by browser extension for hybrid storage (sync vs local)
   */
  getStorageLocation(): string {
    return this.context.globalState.get<string>('profiles_storage_location', 'sync');
  }

  /**
   * Set storage location preference
   * Preference for browser extension's hybrid storage: 'sync' or 'local'
   */
  async setStorageLocation(location: 'sync' | 'local'): Promise<void> {
    await this.context.globalState.update('profiles_storage_location', location);
    vscode.window.showInformationMessage(`Storage location preference set to: ${location}`);
  }

  /**
   * Sync now (manual sync)
   */
  async syncNow(): Promise<void> {
    const action = await vscode.window.showQuickPick(
      [
        { label: '📤 Export to Sync File', value: 'export' },
        { label: '📥 Import from Sync File', value: 'import' },
        { label: '🔄 Two-Way Sync (Merge)', value: 'merge' },
      ],
      { placeHolder: 'Choose sync direction' }
    );

    if (!action) {
      return;
    }

    switch (action.value) {
      case 'export':
        await this.exportToSyncFile();
        break;
      case 'import':
        await this.importFromSyncFile();
        break;
      case 'merge':
        await this.mergeProfiles();
        break;
    }
  }

  /**
   * Merge profiles from sync file with local profiles
   * Uses Chrome extension's format with smart conflict resolution
   */
  private async mergeProfiles(): Promise<void> {
    try {
      this.statusBarManager?.setSyncing();

      if (!fs.existsSync(this.syncFilePath)) {
        vscode.window.showWarningMessage('Sync file not found. Creating new one...');
        await this.exportToSyncFile();
        return;
      }

      // Read sync file
      const json = fs.readFileSync(this.syncFilePath, 'utf-8');
      const syncData = JSON.parse(json);

      // Validate format
      if (!this.validateSyncData(syncData)) {
        throw new Error('Invalid sync file format');
      }

      // Get local profiles
      const localConfig = await this.profileManager.getProfiles();

      // Merge logic: use most recent version of each profile (based on usageCount)
      const merged = new Map();

      // Add all local profiles
      for (const profile of localConfig.list) {
        merged.set(profile.id, { profile, source: 'local' });
      }

      // Add/update from sync file
      let added = 0;
      let updated = 0;
      let kept = 0;

      for (const syncProfile of syncData.list) {
        if (merged.has(syncProfile.id)) {
          // Profile exists - check which is newer
          const { profile: local } = merged.get(syncProfile.id)!;
          const localUsage = local.evolving_profile?.usageCount || 0;
          const syncUsage = syncProfile.evolving_profile?.usageCount || 0;

          if (syncUsage > localUsage) {
            merged.set(syncProfile.id, { profile: syncProfile, source: 'sync' });
            updated++;
          } else {
            kept++;
          }
        } else {
          // New profile from sync
          merged.set(syncProfile.id, { profile: syncProfile, source: 'sync' });
          added++;
        }
      }

      // Save merged profiles
      const mergedList = Array.from(merged.values()).map(({ profile }) => profile);

      // Determine active profile: prefer sync if available and valid
      let activeProfileId = localConfig.activeProfileId;
      if (syncData.activeProfileId && merged.has(syncData.activeProfileId)) {
        activeProfileId = syncData.activeProfileId;
      }

      // Update both local and sync file
      const mergedConfig: any = {
        list: mergedList,
        activeProfileId,
      };

      // Preserve storage location preference
      if (syncData.profiles_storage_location) {
        mergedConfig.profiles_storage_location = syncData.profiles_storage_location;
        await this.context.globalState.update('profiles_storage_location', syncData.profiles_storage_location);
      } else {
        // Use current preference if not in sync file
        const currentLocation = this.getStorageLocation();
        mergedConfig.profiles_storage_location = currentLocation;
      }

      await this.profileManager.saveProfiles(mergedConfig);
      fs.writeFileSync(this.syncFilePath, JSON.stringify(mergedConfig, null, 2), 'utf-8');

      this.statusBarManager?.setSynced();

      const activeProfile = mergedList.find(p => p.id === activeProfileId);

      vscode.window.showInformationMessage(
        `✅ Sync complete! ${mergedList.length} profiles (${added} added, ${updated} updated, ${kept} kept local)${activeProfile ? ` • Active: ${activeProfile.name}` : ''}`
      );
    } catch (error: any) {
      this.statusBarManager?.setError();
      vscode.window.showErrorMessage(`❌ Merge failed: ${error.message}`);
      throw error;
    }
  }
}
