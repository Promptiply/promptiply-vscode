/**
 * Promptiply VSCode Extension
 * Main entry point
 */

import * as vscode from 'vscode';
import { ProfileManager } from './profiles/manager';
import { RefinementEngine } from './refinement/engine';
import { RefineCommands } from './commands/refine';
import { ProfileCommands } from './commands/profiles';
import { StatusBarManager } from './ui/statusBar';
import { HistoryManager } from './history/manager';
import { HistoryTreeViewProvider } from './history/treeViewProvider';
import { WebviewPanelManager } from './ui/webviewPanel';
import { RecommendationLearning } from './profiles/recommendationLearning';
import { SecretsManager } from './utils/secrets';
import Logger from './utils/logger';

// Lazy-loaded modules (loaded on demand)
let templateManager: any;
let templateCommands: any;
let chatParticipant: any;
let syncManager: any;
let syncStatusBar: any;

// Always-loaded UI managers
let statusBarManager: StatusBarManager | undefined;
let historyTreeView: HistoryTreeViewProvider | undefined;

// Core managers (shared across lazy-loaded modules)
let profileManager: ProfileManager;
let historyManager: HistoryManager;
let secretsManager: SecretsManager;
let engine: RefinementEngine;
let refineCommands: RefineCommands;
let profileCommands: ProfileCommands;
let context: vscode.ExtensionContext;

/**
 * Lazy load template system
 */
async function loadTemplateSystem() {
  if (!templateManager) {
    const { TemplateManager } = await import('./templates/manager');
    const { TemplateCommands } = await import('./commands/templates');
    templateManager = new TemplateManager(context);
    templateCommands = new TemplateCommands(templateManager, refineCommands);
  }
  return { templateManager, templateCommands };
}

/**
 * Lazy load chat participant
 */
async function loadChatParticipant() {
  if (!chatParticipant) {
    const module = await import('./chat/participant');
    chatParticipant = new module.PromptiplyChat(engine, profileManager, historyManager);
    const disposable = chatParticipant.register();
    context.subscriptions.push(disposable);
    module.registerChatCommands(context, engine, profileManager, historyManager);
  }
  return chatParticipant;
}

/**
 * Lazy load sync manager
 */
async function loadSyncManager() {
  if (!syncManager) {
    const { ProfileSyncManager } = await import('./profiles/sync');
    const { SyncStatusBarManager } = await import('./ui/syncStatusBar');

    syncManager = new ProfileSyncManager(context, profileManager);
    syncStatusBar = new SyncStatusBarManager(syncManager);

    await syncStatusBar.initialize();
    context.subscriptions.push(syncStatusBar);
    syncManager.setStatusBarManager(syncStatusBar);
  }
  return { syncManager, syncStatusBar };
}

/**
 * Extension activation
 */
export async function activate(ctx: vscode.ExtensionContext) {
  context = ctx;

  // Initialize logger
  Logger.initialize();

  // Initialize core managers (required immediately)
  profileManager = new ProfileManager(context);
  historyManager = new HistoryManager(context);
  secretsManager = new SecretsManager(context);
  engine = new RefinementEngine(profileManager, secretsManager);

  // Migrate API keys from settings to secure storage (if needed)
  await secretsManager.migrateApiKeysFromSettings();

  // Initialize core commands (required immediately)
  refineCommands = new RefineCommands(engine, profileManager, historyManager);
  profileCommands = new ProfileCommands(profileManager);

  // Initialize webview panel manager
  WebviewPanelManager.initialize(context);

  // Initialize status bar
  statusBarManager = new StatusBarManager(profileManager);
  await statusBarManager.initialize();
  context.subscriptions.push(statusBarManager);

  // Initialize history tree view
  historyTreeView = new HistoryTreeViewProvider(historyManager);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('promptiply.history', historyTreeView)
  );

  // Initialize recommendation learning system
  await RecommendationLearning.initialize(context);

  // Register commands for managing API keys
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'promptiply.setOpenAIKey',
      async () => {
        await SecretsManager.promptForApiKey(secretsManager, 'openai');
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.setAnthropicKey',
      async () => {
        await SecretsManager.promptForApiKey(secretsManager, 'anthropic');
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.clearOpenAIKey',
      async () => {
        await secretsManager.deleteApiKey('openai');
        vscode.window.showInformationMessage('OpenAI API key cleared');
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.clearAnthropicKey',
      async () => {
        await secretsManager.deleteApiKey('anthropic');
        vscode.window.showInformationMessage('Anthropic API key cleared');
      }
    )
  );

  // Lazy load chat participant only when chat API is available
  // This improves activation time for users not using chat features
  if (vscode.lm) {
    // Defer chat participant loading slightly to prioritize core activation
    setTimeout(() => loadChatParticipant().catch(console.error), 100);
  }

  // Lazy load sync manager only if sync is enabled
  const syncConfig = vscode.workspace.getConfiguration('promptiply');
  if (syncConfig.get<boolean>('sync.enabled', false)) {
    const { syncManager: sm, syncStatusBar: ssb } = await loadSyncManager();
    await sm.enableSync();
    await ssb.updateStatus();
  }

  // Register commands
  context.subscriptions.push(
    // Refinement commands
    vscode.commands.registerCommand(
      'promptiply.refineSelection',
      () => refineCommands.refineSelection()
    ),
    vscode.commands.registerCommand(
      'promptiply.refineFile',
      () => refineCommands.refineFile()
    ),
    vscode.commands.registerCommand(
      'promptiply.refineFromClipboard',
      () => refineCommands.refineFromClipboard()
    ),
    vscode.commands.registerCommand(
      'promptiply.refineFromInput',
      () => refineCommands.refineFromInput()
    ),

    // Profile commands
    vscode.commands.registerCommand(
      'promptiply.switchProfile',
      async () => {
        await profileCommands.switchProfile();
        await statusBarManager?.update();
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.importProfiles',
      () => profileCommands.importProfiles()
    ),
    vscode.commands.registerCommand(
      'promptiply.exportProfiles',
      () => profileCommands.exportProfiles()
    ),
    vscode.commands.registerCommand(
      'promptiply.createProfile',
      async () => {
        await profileCommands.createProfile();
        await statusBarManager?.update();
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.deleteProfile',
      async () => {
        await profileCommands.deleteProfile();
        await statusBarManager?.update();
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.viewProfile',
      () => profileCommands.viewProfile()
    ),
    vscode.commands.registerCommand(
      'promptiply.installBuiltInProfile',
      async () => {
        await profileCommands.installBuiltInProfile();
        await statusBarManager?.update();
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.resetProfilesToDefaults',
      async () => {
        await profileCommands.resetToDefaults();
        await statusBarManager?.update();
      }
    ),

    // Template commands (lazy-loaded on first use)
    vscode.commands.registerCommand(
      'promptiply.useTemplate',
      async () => {
        const { templateCommands: tc } = await loadTemplateSystem();
        return tc.useTemplate();
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.createTemplate',
      async () => {
        const { templateCommands: tc } = await loadTemplateSystem();
        return tc.createTemplate();
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.manageTemplates',
      async () => {
        const { templateCommands: tc } = await loadTemplateSystem();
        return tc.manageTemplates();
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.importTemplates',
      async () => {
        const { templateCommands: tc } = await loadTemplateSystem();
        return tc.importTemplates();
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.exportTemplates',
      async () => {
        const { templateCommands: tc } = await loadTemplateSystem();
        return tc.exportTemplates();
      }
    ),

    // History commands
    vscode.commands.registerCommand(
      'promptiply.showHistory',
      () => vscode.commands.executeCommand('promptiply.history.focus')
    ),
    vscode.commands.registerCommand(
      'promptiply.clearHistory',
      async () => {
        const confirm = await vscode.window.showWarningMessage(
          'Clear all refinement history?',
          'Clear',
          'Cancel'
        );
        if (confirm === 'Clear') {
          await historyManager.clear();
          historyTreeView?.refresh();
          vscode.window.showInformationMessage('History cleared');
        }
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.showHistoryEntry',
      (entry) => {
        WebviewPanelManager.showHistoryEntry(entry);
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.deleteHistoryEntry',
      async (item) => {
        await historyManager.deleteById(item.entry.id);
        historyTreeView?.refresh();
        vscode.window.showInformationMessage('History entry deleted');
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.refreshHistory',
      () => historyTreeView?.refresh()
    ),

    // Sync commands (lazy-loaded on first use)
    vscode.commands.registerCommand(
      'promptiply.enableSync',
      async () => {
        const { syncManager: sm, syncStatusBar: ssb } = await loadSyncManager();
        ssb.setSyncing();
        await sm.enableSync();
        const config = vscode.workspace.getConfiguration('promptiply');
        await config.update('sync.enabled', true, vscode.ConfigurationTarget.Global);
        ssb.setSynced();
        ssb.show();
        vscode.window.showInformationMessage('✅ Profile sync enabled');
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.disableSync',
      async () => {
        const { syncManager: sm, syncStatusBar: ssb } = await loadSyncManager();
        await sm.disableSync();
        const config = vscode.workspace.getConfiguration('promptiply');
        await config.update('sync.enabled', false, vscode.ConfigurationTarget.Global);
        ssb.hide();
        vscode.window.showInformationMessage('Profile sync disabled');
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.syncNow',
      async () => {
        const { syncManager: sm, syncStatusBar: ssb } = await loadSyncManager();
        try {
          ssb.setSyncing();
          await sm.syncNow();
          ssb.setSynced();
          vscode.window.showInformationMessage('✅ Profiles synced successfully');
        } catch (error) {
          ssb.setError('Sync failed');
        }
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.setSyncPath',
      async () => {
        const { syncManager: sm } = await loadSyncManager();
        const currentPath = sm.getSyncFilePath();
        const newPath = await vscode.window.showInputBox({
          prompt: 'Enter sync file path',
          value: currentPath,
          placeHolder: '~/.promptiply-profiles.json',
        });

        if (newPath) {
          await sm.setSyncFilePath(newPath);
        }
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.setStorageLocation',
      async () => {
        const { syncManager: sm } = await loadSyncManager();
        const currentLocation = sm.getStorageLocation();
        const selected = await vscode.window.showQuickPick(
          [
            {
              label: '$(cloud) Sync Storage (chrome.storage.sync)',
              description: 'Cross-device sync, ~8KB limit',
              detail: 'Recommended for most users. Your profiles will sync across devices.',
              value: 'sync',
              picked: currentLocation === 'sync'
            },
            {
              label: '$(database) Local Storage (chrome.storage.local)',
              description: 'Local only, 10MB+ capacity',
              detail: 'For users with many or large profiles. No cross-device sync.',
              value: 'local',
              picked: currentLocation === 'local'
            }
          ],
          {
            placeHolder: `Current: ${currentLocation}`,
            title: 'Browser Extension Storage Location'
          }
        );

        if (selected) {
          await sm.setStorageLocation(selected.value as 'sync' | 'local');
          // Export to sync file with new preference
          await sm.exportToSyncFile();
        }
      }
    ),

    // Settings commands
    vscode.commands.registerCommand(
      'promptiply.toggleEconomy',
      async () => {
        const config = vscode.workspace.getConfiguration('promptiply');
        const current = config.get('useEconomyModel', true);
        await config.update(
          'useEconomyModel',
          !current,
          vscode.ConfigurationTarget.Global
        );
        await statusBarManager?.update();
        vscode.window.showInformationMessage(
          `Switched to ${!current ? 'Economy' : 'Premium'} mode`
        );
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.openSettings',
      () => {
        vscode.commands.executeCommand(
          'workbench.action.openSettings',
          'promptiply'
        );
      }
    )
  );

  // Watch for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('promptiply')) {
        await statusBarManager?.update();
      }
    })
  );

  // Show welcome message on first install
  const hasShownWelcome = context.globalState.get('hasShownWelcome', false);
  if (!hasShownWelcome) {
    const action = await vscode.window.showInformationMessage(
      'Welcome to Promptiply! Refine your AI prompts for better results.',
      'View Settings',
      'Switch Profile'
    );

    if (action === 'View Settings') {
      vscode.commands.executeCommand('promptiply.openSettings');
    } else if (action === 'Switch Profile') {
      vscode.commands.executeCommand('promptiply.switchProfile');
    }

    await context.globalState.update('hasShownWelcome', true);
  }
}

/**
 * Extension deactivation
 */
export function deactivate() {
  // Dispose logger
  Logger.dispose();

  // Cleanup handled automatically by VSCode subscriptions
}
