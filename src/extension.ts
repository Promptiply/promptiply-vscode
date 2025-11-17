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
 * Lazy load sync server
 */
async function loadSyncManager() {
  if (!syncManager) {
    const { ProfileSyncServer } = await import('./profiles/syncServer');
    const { SyncStatusBarManager } = await import('./ui/syncStatusBar');

    syncManager = new ProfileSyncServer(profileManager);
    syncStatusBar = new SyncStatusBarManager(syncManager);

    await syncStatusBar.initialize();
    context.subscriptions.push(syncStatusBar);
    syncManager.setStatusBarManager(syncStatusBar);
  }
  return { syncManager, syncStatusBar };
}

/**
 * Show mode selector menu
 */
async function showModeSelector() {
  const config = vscode.workspace.getConfiguration('promptiply');
  const currentMode = config.get<string>('mode', 'vscode-lm');

  const modes = [
    {
      label: '$(copilot) VSCode LM (Copilot)',
      description: 'Free - Uses GitHub Copilot',
      detail: currentMode === 'vscode-lm' ? '✓ Currently selected' : 'Requires GitHub Copilot subscription',
      mode: 'vscode-lm'
    },
    {
      label: '$(server) Ollama',
      description: 'Free - Local AI models',
      detail: currentMode === 'ollama' ? '✓ Currently selected' : 'Requires Ollama running locally',
      mode: 'ollama'
    },
    {
      label: '$(cloud) OpenAI API',
      description: 'Paid - GPT-4, GPT-3.5',
      detail: currentMode === 'openai-api' ? '✓ Currently selected' : 'Requires OpenAI API key',
      mode: 'openai-api'
    },
    {
      label: '$(robot) Anthropic API',
      description: 'Paid - Claude models',
      detail: currentMode === 'anthropic-api' ? '✓ Currently selected' : 'Requires Anthropic API key',
      mode: 'anthropic-api'
    }
  ];

  const selected = await vscode.window.showQuickPick(modes, {
    placeHolder: 'Select AI mode',
    matchOnDescription: true,
    matchOnDetail: true
  });

  if (selected && selected.mode !== currentMode) {
    await config.update('mode', selected.mode, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`Switched to ${selected.label}`);
  }
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
  engine = new RefinementEngine(profileManager);

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

  // Lazy load chat participant only when chat API is available
  // This improves activation time for users not using chat features
  if (vscode.lm) {
    // Defer chat participant loading slightly to prioritize core activation
    setTimeout(() => loadChatParticipant().catch(console.error), 100);
  }

  // Always load sync server - makes sync feature discoverable
  const { syncManager: sm, syncStatusBar: ssb } = await loadSyncManager();
  const syncConfig = vscode.workspace.getConfiguration('promptiply');
  if (syncConfig.get<boolean>('sync.enabled', false)) {
    try {
      await sm.start();
    } catch (error) {
      console.error('Failed to start sync server:', error);
    }
  }
  await ssb.updateStatus();

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

    // Sync commands (HTTP server-based)
    vscode.commands.registerCommand(
      'promptiply.enableSync',
      async () => {
        const { syncManager: sm, syncStatusBar: ssb } = await loadSyncManager();
        try {
          ssb.setSyncing();
          await sm.start();
          const config = vscode.workspace.getConfiguration('promptiply');
          await config.update('sync.enabled', true, vscode.ConfigurationTarget.Global);
          ssb.setSynced();
          const info = sm.getServerInfo();
          vscode.window.showInformationMessage(
            `✅ Profile sync enabled! Browser extension can connect to http://localhost:${info.port}`
          );
        } catch (error: any) {
          ssb.setError('Failed to start server');
          vscode.window.showErrorMessage(`Failed to enable sync: ${error.message}`);
        }
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.disableSync',
      async () => {
        const { syncManager: sm, syncStatusBar: ssb } = await loadSyncManager();
        await sm.stop();
        const config = vscode.workspace.getConfiguration('promptiply');
        await config.update('sync.enabled', false, vscode.ConfigurationTarget.Global);
        await ssb.updateStatus();
        vscode.window.showInformationMessage('Profile sync disabled');
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.syncNow',
      async () => {
        const { syncManager: sm, syncStatusBar: ssb } = await loadSyncManager();
        try {
          ssb.setSyncing();
          // Notify browser extension of current profiles
          await sm.notifyProfilesChanged();
          ssb.setSynced();
          const info = sm.getServerInfo();
          vscode.window.showInformationMessage(
            `✅ Profiles broadcast to ${info.clients} connected browser(s)`
          );
        } catch (error) {
          ssb.setError('Sync failed');
          vscode.window.showErrorMessage('Failed to sync profiles');
        }
      }
    ),
    vscode.commands.registerCommand(
      'promptiply.syncMenu',
      async () => {
        const { syncManager: sm, syncStatusBar: ssb } = await loadSyncManager();
        const config = vscode.workspace.getConfiguration('promptiply');
        const syncEnabled = config.get<boolean>('sync.enabled', false);
        const info = sm.getServerInfo();

        const actions = [];

        if (syncEnabled) {
          actions.push(
            {
              label: '$(sync) Sync Now',
              description: `Broadcast to ${info.clients} connected browser(s)`,
              action: 'sync'
            },
            {
              label: '$(server) Server Status',
              description: `http://localhost:${info.port} - ${info.clients} client(s) connected`,
              action: 'status'
            },
            {
              label: '$(circle-slash) Disable Sync',
              description: 'Stop sync server',
              action: 'disable'
            }
          );
        } else {
          actions.push({
            label: '$(cloud-upload) Enable Sync',
            description: 'Start HTTP sync server for browser extension',
            action: 'enable'
          });
        }

        actions.push({
          label: '$(info) About Sync',
          description: 'Learn about profile synchronization',
          action: 'info'
        });

        const placeholder = syncEnabled
          ? `Sync Server Running - ${info.clients} browser(s) connected`
          : 'Sync is disabled';

        const selected = await vscode.window.showQuickPick(actions, {
          placeHolder: placeholder
        });

        if (selected) {
          switch (selected.action) {
            case 'enable':
              await vscode.commands.executeCommand('promptiply.enableSync');
              break;
            case 'disable':
              await vscode.commands.executeCommand('promptiply.disableSync');
              await ssb.updateStatus();
              break;
            case 'sync':
              await vscode.commands.executeCommand('promptiply.syncNow');
              break;
            case 'status':
              vscode.window.showInformationMessage(
                `Promptiply Sync Server\n\n` +
                `Status: Running\n` +
                `URL: http://localhost:${info.port}\n` +
                `Connected Browsers: ${info.clients}\n\n` +
                `Browser extension connects to this server for real-time profile sync.`,
                'Copy URL'
              ).then(action => {
                if (action === 'Copy URL') {
                  vscode.env.clipboard.writeText(`http://localhost:${info.port}`);
                  vscode.window.showInformationMessage('Sync server URL copied to clipboard');
                }
              });
              break;
            case 'info':
              vscode.window.showInformationMessage(
                'Profile Sync uses a local HTTP server to share profiles between VSCode and your browser extension. ' +
                'When enabled, VSCode runs a server on localhost:8765 that your browser extension can connect to for real-time sync.',
                'Learn More'
              ).then(action => {
                if (action === 'Learn More') {
                  vscode.env.openExternal(vscode.Uri.parse('https://github.com/Promptiply/promptiply-vscode#profile-sync'));
                }
              });
              break;
          }
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
    ),
    vscode.commands.registerCommand(
      'promptiply.statusBarMenu',
      async () => {
        const config = vscode.workspace.getConfiguration('promptiply');
        const mode = config.get('mode', 'vscode-lm');
        const useEconomy = config.get('useEconomyModel', true);
        const isFreeMode = mode === 'vscode-lm';

        const actions = [
          {
            label: '$(person) Switch Profile',
            description: 'Change active refinement profile',
            action: 'profile'
          },
          {
            label: '$(globe) Change Mode',
            description: 'Switch between Copilot, Ollama, OpenAI, Claude',
            action: 'mode'
          }
        ];

        // Only show economy toggle for paid API modes
        if (!isFreeMode) {
          actions.push({
            label: useEconomy ? '$(star) Switch to Premium' : '$(graph) Switch to Economy',
            description: useEconomy ? 'Better quality, slower, more expensive' : 'Faster, cheaper, good quality',
            action: 'economy'
          });
        }

        actions.push({
          label: '$(gear) Open Settings',
          description: 'Configure Promptiply',
          action: 'settings'
        });

        const selected = await vscode.window.showQuickPick(actions, {
          placeHolder: 'What would you like to change?'
        });

        if (selected) {
          switch (selected.action) {
            case 'profile':
              await vscode.commands.executeCommand('promptiply.switchProfile');
              break;
            case 'mode':
              await showModeSelector();
              await statusBarManager?.update();
              break;
            case 'economy':
              await vscode.commands.executeCommand('promptiply.toggleEconomy');
              break;
            case 'settings':
              await vscode.commands.executeCommand('promptiply.openSettings');
              break;
          }
        }
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
export async function deactivate() {
  // Stop sync server if running
  if (syncManager) {
    try {
      await syncManager.stop();
    } catch (error) {
      console.error('Error stopping sync server:', error);
    }
  }

  // Dispose logger
  Logger.dispose();

  // Cleanup handled automatically by VSCode subscriptions
}
