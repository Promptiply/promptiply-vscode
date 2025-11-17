# Sync Architecture Comparison

## How Other Extensions Do It

### Bitwarden / 1Password / LastPass
```
Browser Ext ←HTTPS→ Cloud Server ←HTTPS→ Desktop App
              ↓                      ↓
         WebSocket              WebSocket
           (Push)                (Push)
```

**Tech Stack:**
- Backend: Node.js/Rust server on AWS/Azure
- Database: PostgreSQL/MongoDB
- Real-time: WebSocket connections
- Auth: OAuth 2.0 / JWT
- Encryption: AES-256, end-to-end

**Benefits:**
- ✅ True real-time sync (push notifications)
- ✅ Works across networks/devices
- ✅ Automatic conflict resolution
- ✅ Built-in backup/versioning

**Drawbacks:**
- ❌ Requires running a server ($$$)
- ❌ Privacy concerns (data leaves device)
- ❌ Requires internet connection
- ❌ Complex infrastructure

---

### GitHub Extension
```
Browser Ext ←→ GitHub API ←→ VSCode Extension
```

**How it works:**
- Uses GitHub's existing cloud infrastructure
- Both extensions call same REST API
- GitHub servers handle sync/conflicts
- No custom server needed

**Benefits:**
- ✅ Leverages existing platform
- ✅ No custom backend needed
- ✅ Reliable infrastructure

**Drawbacks:**
- ❌ Requires GitHub account
- ❌ Data stored on GitHub
- ❌ Rate limits apply
- ❌ Requires internet

---

## Options for Promptiply

### Option 1: Simple Cloud Sync (Recommended for Public Release)

Use a free cloud storage provider as the "server":

**Architecture:**
```
Browser Ext ←→ Dropbox/Google Drive API ←→ VSCode Ext
                         ↓
              promptiply-profiles.json
                  (in cloud)
```

**Implementation:**
1. Use Dropbox/Google Drive SDK in both extensions
2. Both extensions watch the same cloud file
3. Use file versioning for conflict resolution
4. Encrypt data before upload (optional)

**Code Example (Dropbox):**
```typescript
// In both VSCode and browser extension
import { Dropbox } from 'dropbox';

const dbx = new Dropbox({ accessToken: USER_TOKEN });

// Watch for changes
setInterval(async () => {
  const response = await dbx.filesDownload({
    path: '/promptiply-profiles.json'
  });

  if (response.result.rev !== lastRev) {
    // File changed, import profiles
    await importProfiles(response.result.fileBlob);
    lastRev = response.result.rev;
  }
}, 5000); // Poll every 5 seconds

// On profile change, upload
async function saveProfiles(profiles) {
  await dbx.filesUpload({
    path: '/promptiply-profiles.json',
    contents: JSON.stringify(profiles),
    mode: 'overwrite'
  });
}
```

**Benefits:**
- ✅ No server to maintain
- ✅ Free tier available
- ✅ Automatic backups
- ✅ Works across devices/networks
- ✅ Relatively simple implementation

**Drawbacks:**
- ⚠️ User must connect cloud account
- ⚠️ Requires internet
- ⚠️ 5-10 second sync delay (polling)
- ⚠️ Privacy (data in cloud)

**Best for:** Public users, multi-device sync

---

### Option 2: Native Messaging Host (Best for Local Sync)

Create a small background service that bridges browser and VSCode.

**Architecture:**
```
Browser Ext ←Native Msg→ Background Service ←IPC→ VSCode Ext
                              ↓
                    Watch ~/.promptiply-profiles.json
```

**Implementation:**

**1. Create Native Host (`promptiply-sync-host.js`):**
```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SYNC_FILE = path.join(process.env.HOME, '.promptiply-profiles.json');

// Native messaging protocol
function sendMessage(message) {
  const buffer = Buffer.from(JSON.stringify(message));
  const header = Buffer.alloc(4);
  header.writeUInt32LE(buffer.length, 0);
  process.stdout.write(header);
  process.stdout.write(buffer);
}

function readMessage() {
  return new Promise((resolve) => {
    const header = Buffer.alloc(4);
    process.stdin.read(4);
    // ... read message
  });
}

// Watch file for changes
fs.watch(SYNC_FILE, (eventType) => {
  const content = fs.readFileSync(SYNC_FILE, 'utf-8');
  sendMessage({
    type: 'profiles_updated',
    data: JSON.parse(content)
  });
});

// Listen for messages from browser
(async () => {
  while (true) {
    const message = await readMessage();

    if (message.type === 'update_profiles') {
      fs.writeFileSync(SYNC_FILE, JSON.stringify(message.data, null, 2));
    }
  }
})();
```

**2. Install Native Host:**
```bash
# Create manifest
cat > ~/.config/google-chrome/NativeMessagingHosts/com.promptiply.sync.json <<EOF
{
  "name": "com.promptiply.sync",
  "description": "Promptiply Profile Sync Host",
  "path": "/usr/local/bin/promptiply-sync-host.js",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://YOUR_EXTENSION_ID/"
  ]
}
EOF
```

**3. Browser Extension Code:**
```javascript
// Connect to native host
const port = chrome.runtime.connectNative('com.promptiply.sync');

// Receive updates
port.onMessage.addListener((message) => {
  if (message.type === 'profiles_updated') {
    chrome.storage.local.set({ profiles: message.data });
  }
});

// Send updates
chrome.storage.onChanged.addListener((changes) => {
  if (changes.profiles) {
    port.postMessage({
      type: 'update_profiles',
      data: changes.profiles.newValue
    });
  }
});
```

**Benefits:**
- ✅ True bidirectional real-time sync
- ✅ No internet required
- ✅ No cloud, fully local
- ✅ Instant updates (no polling)
- ✅ Secure (stays on device)

**Drawbacks:**
- ⚠️ Requires native host installation
- ⚠️ More complex setup for users
- ⚠️ Platform-specific (Windows/Mac/Linux)
- ⚠️ Browser security prompt

**Best for:** Power users, local-only sync

---

### Option 3: WebSocket Server in VSCode

VSCode extension runs a local WebSocket server, browser connects.

**Architecture:**
```
Browser Ext ←WebSocket→ VSCode Extension
          localhost:9876        ↓
                         ProfileManager
```

**Implementation:**

**1. VSCode Extension (Server):**
```typescript
import * as WebSocket from 'ws';

export class SyncServer {
  private wss: WebSocket.Server;

  start() {
    this.wss = new WebSocket.Server({ port: 9876 });

    this.wss.on('connection', (ws) => {
      console.log('Browser extension connected');

      // Send current profiles
      ws.send(JSON.stringify({
        type: 'init',
        profiles: await profileManager.getProfiles()
      }));

      // Receive updates from browser
      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'update_profiles') {
          profileManager.saveProfiles(message.profiles);
        }
      });
    });

    // When profiles change in VSCode, broadcast
    profileManager.onProfilesChanged((profiles) => {
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'profiles_updated',
            profiles
          }));
        }
      });
    });
  }
}
```

**2. Browser Extension (Client):**
```javascript
// Connect to VSCode WebSocket server
let ws = null;

function connect() {
  ws = new WebSocket('ws://localhost:9876');

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.type === 'init' || message.type === 'profiles_updated') {
      chrome.storage.local.set({ profiles: message.profiles });
    }
  };

  ws.onclose = () => {
    // Reconnect after 5 seconds
    setTimeout(connect, 5000);
  };
}

connect();

// Send updates to VSCode
chrome.storage.onChanged.addListener((changes) => {
  if (changes.profiles && ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'update_profiles',
      profiles: changes.profiles.newValue
    }));
  }
});
```

**Benefits:**
- ✅ Real-time bidirectional sync
- ✅ No native host installation
- ✅ Works locally, no cloud
- ✅ Simple protocol

**Drawbacks:**
- ⚠️ VSCode must be running
- ⚠️ Port configuration
- ⚠️ Firewall issues
- ⚠️ Browser security (local WebSocket)

**Best for:** Development, local sync when VSCode is open

---

### Option 4: File System Access API (Browser-Side Polling)

Browser extension requests folder access and polls the file.

**Browser Extension Code:**
```javascript
let dirHandle = null;
let lastModified = 0;

// Request folder access (one-time)
async function setupSync() {
  dirHandle = await window.showDirectoryPicker({
    mode: 'readwrite'
  });

  // Store handle for future use
  await chrome.storage.local.set({ syncDirHandle: dirHandle });

  startPolling();
}

async function startPolling() {
  setInterval(async () => {
    try {
      const fileHandle = await dirHandle.getFileHandle('.promptiply-profiles.json');
      const file = await fileHandle.getFile();

      if (file.lastModified > lastModified) {
        const text = await file.text();
        const profiles = JSON.parse(text);

        // Import to chrome.storage
        await chrome.storage.sync.set({ profiles: profiles.list });

        lastModified = file.lastModified;
        console.log('Imported profiles from file');
      }
    } catch (e) {
      console.error('Sync error:', e);
    }
  }, 10000); // Poll every 10 seconds
}

// Export to file when profiles change
chrome.storage.onChanged.addListener(async (changes) => {
  if (changes.profiles && dirHandle) {
    const fileHandle = await dirHandle.getFileHandle('.promptiply-profiles.json', { create: true });
    const writable = await fileHandle.createWritable();

    await writable.write(JSON.stringify({
      list: changes.profiles.newValue,
      activeProfileId: '...'
    }, null, 2));

    await writable.close();
  }
});
```

**Benefits:**
- ✅ No external dependencies
- ✅ Browser-native API
- ✅ No server needed
- ✅ Works offline

**Drawbacks:**
- ⚠️ Requires Chrome 86+
- ⚠️ User grants folder access (one-time prompt)
- ⚠️ 10-30 second delay (polling)
- ⚠️ Uses CPU/battery for polling

**Best for:** Simple implementation, no infrastructure

---

## Recommendation Matrix

| Use Case | Best Solution | Why |
|----------|---------------|-----|
| **Personal use, local only** | Native Messaging Host | Real-time, secure, no cloud |
| **Public release, multi-device** | Cloud Sync (Dropbox/Drive) | Easy setup, works anywhere |
| **Development/testing** | WebSocket Server | Quick to implement, good for testing |
| **Minimal setup** | File System API Polling | No infrastructure, browser-native |

---

## What I Can Implement Now

I can implement any of these for you:

### A) Cloud Sync (Dropbox/Google Drive)
- Add Dropbox SDK to both extensions
- OAuth flow for user authentication
- Automatic sync every 5-10 seconds

### B) Native Messaging Host
- Create the background service
- Installation script for Mac/Linux/Windows
- True real-time sync

### C) WebSocket Server
- Add WebSocket server to VSCode extension
- Browser client code
- Real-time when VSCode is running

### D) File System API Polling
- Add to browser extension
- One-time folder access prompt
- 10-second polling interval

**Which would you prefer?**

For a **production-ready solution**, I recommend:
- **Short term (now):** File System API Polling (simplest, works immediately)
- **Long term (best UX):** Cloud Sync with Dropbox/Drive (works everywhere, multi-device)
