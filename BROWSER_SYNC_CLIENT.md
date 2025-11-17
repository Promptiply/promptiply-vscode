# Browser Extension Sync Client

This file contains the code needed to add HTTP sync support to the Promptiply browser extension.

## Overview

The sync uses a local HTTP server running in VSCode on `http://localhost:8765` to enable real-time bidirectional sync between the browser extension and VSCode.

## Implementation

### 1. Create `background/vscode-sync.js`

Add this new file to your browser extension:

```javascript
/**
 * VSCode Sync Client
 * Connects to VSCode's HTTP sync server for real-time profile synchronization
 */

class VSCodeSyncClient {
  constructor() {
    this.serverUrl = 'http://localhost:8765';
    this.connected = false;
    this.eventSource = null;
    this.retryTimeout = null;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Check if VSCode sync server is running
   */
  async checkConnection() {
    try {
      const response = await fetch(`${this.serverUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        this.connected = data.status === 'ok';
        return this.connected;
      }

      this.connected = false;
      return false;
    } catch (error) {
      this.connected = false;
      return false;
    }
  }

  /**
   * Get profiles from VSCode
   */
  async getProfilesFromVSCode() {
    try {
      const response = await fetch(`${this.serverUrl}/profiles`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[VSCode Sync] Failed to get profiles:', error);
      throw error;
    }
  }

  /**
   * Send profiles to VSCode
   */
  async sendProfilesToVSCode(profiles) {
    try {
      const response = await fetch(`${this.serverUrl}/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profiles)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[VSCode Sync] Profiles sent successfully:', result);
      return result;
    } catch (error) {
      console.error('[VSCode Sync] Failed to send profiles:', error);
      throw error;
    }
  }

  /**
   * Start listening for real-time updates from VSCode
   */
  startSync() {
    if (this.eventSource) {
      console.log('[VSCode Sync] Already connected');
      return;
    }

    console.log('[VSCode Sync] Starting Server-Sent Events connection...');

    this.eventSource = new EventSource(`${this.serverUrl}/sync`);

    this.eventSource.onopen = () => {
      console.log('[VSCode Sync] Connected to VSCode sync server');
      this.connected = true;
      this.retryDelay = 5000; // Reset retry delay

      // Clear any pending retry
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
        this.retryTimeout = null;
      }
    };

    this.eventSource.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[VSCode Sync] Received:', data.type);

        switch (data.type) {
          case 'connected':
            console.log('[VSCode Sync]', data.message);
            // Initial connection - sync our profiles to VSCode
            const localProfiles = await chrome.storage.local.get(['profiles']);
            if (localProfiles.profiles) {
              await this.sendProfilesToVSCode(localProfiles.profiles);
            }
            break;

          case 'profiles_updated':
            if (data.source === 'vscode') {
              // VSCode updated profiles - import them
              console.log('[VSCode Sync] Importing profiles from VSCode');
              await chrome.storage.local.set({ profiles: data.profiles });

              // Notify user
              chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('icons/icon128.png'),
                title: 'Promptiply',
                message: 'Profiles synced from VSCode'
              });
            }
            break;
        }
      } catch (error) {
        console.error('[VSCode Sync] Error processing message:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('[VSCode Sync] Connection error:', error);
      this.connected = false;

      // Close the connection
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      // Retry connection with exponential backoff
      console.log(`[VSCode Sync] Retrying in ${this.retryDelay / 1000}s...`);
      this.retryTimeout = setTimeout(() => {
        this.retryDelay = Math.min(this.retryDelay * 2, 60000); // Max 60 seconds
        this.checkConnection().then(connected => {
          if (connected) {
            this.startSync();
          }
        });
      }, this.retryDelay);
    };
  }

  /**
   * Stop listening for updates
   */
  stopSync() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    this.connected = false;
    console.log('[VSCode Sync] Disconnected');
  }

  /**
   * Get connection status
   */
  isConnected() {
    return this.connected;
  }
}

// Create global instance
const vscodeSync = new VSCodeSyncClient();

// Initialize on extension load
chrome.runtime.onStartup.addListener(async () => {
  console.log('[VSCode Sync] Extension startup - checking for VSCode...');
  const connected = await vscodeSync.checkConnection();
  if (connected) {
    vscodeSync.startSync();
  }
});

// Also try on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[VSCode Sync] Extension installed - checking for VSCode...');
  const connected = await vscodeSync.checkConnection();
  if (connected) {
    vscodeSync.startSync();
  }
});

// Auto-sync when browser profiles change
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'local' && changes.profiles && vscodeSync.isConnected()) {
    try {
      console.log('[VSCode Sync] Local profiles changed - syncing to VSCode...');
      await vscodeSync.sendProfilesToVSCode(changes.profiles.newValue);
    } catch (error) {
      console.error('[VSCode Sync] Failed to sync:', error);
    }
  }
});

// Expose to other parts of the extension
self.vscodeSync = vscodeSync;
```

### 2. Update `manifest.json`

Add the new sync script to your service worker:

```json
{
  "background": {
    "service_worker": "background/service_worker.js",
    "type": "module"
  },
  "permissions": [
    "storage",
    "notifications"
  ],
  "host_permissions": [
    "http://localhost:8765/*"
  ]
}
```

### 3. Update `background/service_worker.js`

Import the sync client at the top:

```javascript
// Import VSCode sync client
importScripts('background/vscode-sync.js');

// Your existing service worker code...
```

### 4. Add UI for Sync Status (Optional)

Add to `popup/index.html`:

```html
<div class="sync-status">
  <div id="vscode-sync-indicator" style="display: none;">
    <span id="sync-icon">⚠️</span>
    <span id="sync-text">VSCode: Not Connected</span>
  </div>
</div>
```

Add to `popup/index.js`:

```javascript
// Check VSCode sync status
async function updateVSCodeSyncStatus() {
  const bg = await chrome.runtime.getBackgroundPage();
  const connected = bg.vscodeSync.isConnected();

  const indicator = document.getElementById('vscode-sync-indicator');
  const icon = document.getElementById('sync-icon');
  const text = document.getElementById('sync-text');

  if (connected) {
    icon.textContent = '✅';
    text.textContent = 'VSCode: Connected';
    indicator.style.display = 'block';
  } else {
    icon.textContent = '⚠️';
    text.textContent = 'VSCode: Not Connected';
    indicator.style.display = 'none'; // Hide if not connected
  }
}

// Update on popup open
updateVSCodeSyncStatus();
```

## How It Works

### Browser → VSCode
1. User changes profile in browser extension
2. `chrome.storage.onChanged` detects change
3. Browser sends POST to `http://localhost:8765/profiles`
4. VSCode updates its profiles
5. VSCode broadcasts to all connected browsers (including the sender)

### VSCode → Browser
1. User changes profile in VSCode
2. VSCode broadcasts via Server-Sent Events
3. Browser extension's EventSource receives update
4. Browser updates `chrome.storage.local`
5. Extension UI auto-updates

## Testing

### 1. Enable Sync in VSCode
1. Open VSCode with Promptiply extension
2. Click sync status bar (bottom right)
3. Click "Enable Sync"
4. You should see: "✅ Profile sync enabled! Browser extension can connect to http://localhost:8765"

### 2. Test Browser Extension
1. Open browser console (F12)
2. Check for: `[VSCode Sync] Connected to VSCode sync server`
3. Change a profile in VSCode → Check if browser updates
4. Change a profile in browser → Check if VSCode updates

### 3. Test Disconnection
1. Close VSCode
2. Browser should show: `[VSCode Sync] Connection error`
3. Browser will retry every 5-60 seconds
4. Reopen VSCode → Browser should reconnect automatically

## Troubleshooting

### Browser can't connect to VSCode

**Check:**
- Is VSCode running?
- Is sync enabled in VSCode? (Click status bar → Enable Sync)
- Check browser console for error messages
- Check VSCode's "Output" panel → Select "Promptiply"

### Profiles not syncing

**Check:**
- Both extensions use same profile format: `{ list: [], activeProfileId: null }`
- Check browser console for errors
- Click "Sync Now" in VSCode to force a broadcast
- Check VSCode status bar → Shows number of connected browsers

### Port 8765 already in use

**Solutions:**
- Close other VSCode windows
- Change port in VSCode settings (if we add this feature)
- Kill process using port: `lsof -ti:8765 | xargs kill -9` (Mac/Linux)

## Advanced Features (Future)

- **Conflict Resolution**: When both sides change the same profile
- **Sync History**: Track sync operations
- **Selective Sync**: Choose which profiles to sync
- **Multi-Device**: Sync across multiple computers via cloud storage
- **Encryption**: Encrypt profiles before syncing
