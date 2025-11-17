# Automatic Profile Sync Guide

## ✅ VSCode Side: FULLY AUTOMATIC (Implemented!)

### What's Automatic in VSCode

When you enable sync in VSCode, the following happens automatically:

1. **Auto-Export on Changes** ✅
   - Any profile change in VSCode → Immediately exports to sync file
   - Create profile → Auto-export
   - Edit profile → Auto-export
   - Delete profile → Auto-export
   - Switch active profile → Auto-export

2. **Auto-Import on File Changes** ✅
   - Browser extension exports → VSCode detects file change → Auto-imports
   - File watcher monitors `~/.promptiply-profiles.json`
   - Real-time sync when file is updated

### How to Enable (VSCode)

**Option 1: Command Palette**
```
Ctrl+Shift+P → Promptiply: Enable Profile Sync
```

**Option 2: Settings**
```json
{
  "promptiply.sync.enabled": true
}
```

That's it! VSCode will now automatically:
- Export profiles whenever you make changes
- Import profiles when the sync file changes

---

## ⚠️ Browser Extension Side: MANUAL (Needs Enhancement)

### Current Limitation

Browser extensions **cannot** automatically watch arbitrary filesystem files due to browser security restrictions. They can only:
- Read files when user explicitly selects them (file picker)
- Download files to Downloads folder
- Access chrome.storage API

### Current Workflow (Manual)

**Browser → VSCode:**
1. Open browser extension Options
2. Export Profiles → Save to `~/.promptiply-profiles.json`
3. VSCode **automatically imports** (this part is automatic!)

**VSCode → Browser:**
1. Make changes in VSCode
2. VSCode **automatically exports** to `~/.promptiply-profiles.json` (automatic!)
3. Open browser extension Options
4. Import Profiles → Select `~/.promptiply-profiles.json` (manual step)

---

## 🚀 Solutions for Full Automation

### Option 1: Native Messaging Host (Recommended for Desktop)

Create a small background service that bridges VSCode and browser extension.

**Architecture:**
```
┌─────────────┐    Native      ┌──────────────────┐    Chrome      ┌──────────────────┐
│   VSCode    │◄──Messaging───►│  Native Host     │◄──Messaging──►│ Browser Extension│
│  Extension  │                 │  (Background)    │                │                  │
└─────────────┘                 └──────────────────┘                └──────────────────┘
       │                                │                                    │
       │                                ▼                                    │
       │                         Watches filesystem                          │
       │                         & relays changes                            │
       │                                                                     │
       └────────────────────► ~/.promptiply-profiles.json ◄─────────────────┘
```

**Benefits:**
- ✅ True bidirectional sync
- ✅ Real-time updates
- ✅ No manual import/export
- ✅ Works offline

**Implementation:**
- Create a Node.js/Python script that runs in background
- Watches `~/.promptiply-profiles.json` for changes
- Communicates with browser extension via Chrome Native Messaging API
- Automatically updates browser extension's chrome.storage when file changes

**Files needed:**
1. `native-host/promptiply-sync-host.js` - Background service
2. `native-host/manifest.json` - Native messaging manifest
3. Browser extension update to use native messaging

Would you like me to implement this?

---

### Option 2: Local WebSocket Server (VSCode Extension)

VSCode extension runs a local WebSocket server, browser extension connects to it.

**Architecture:**
```
┌─────────────┐    WebSocket    ┌──────────────────┐
│   VSCode    │◄───Connection──►│ Browser Extension│
│  Extension  │   localhost:9876│                  │
│   +Server   │                 │                  │
└─────────────┘                 └──────────────────┘
```

**Benefits:**
- ✅ Real-time bidirectional sync
- ✅ No native messaging setup
- ✅ Works across network (could sync across devices on same network)

**Limitations:**
- ⚠️ Requires VSCode to be running
- ⚠️ Requires port configuration
- ⚠️ Firewall considerations

**Implementation:**
- VSCode extension starts WebSocket server on port 9876
- Browser extension connects to `ws://localhost:9876`
- Both sides send/receive profile updates in real-time

Would you like me to implement this?

---

### Option 3: Cloud Sync Service (Universal)

Use a cloud storage provider for sync.

**Architecture:**
```
┌─────────────┐                  ┌──────────────────┐
│   VSCode    │                  │ Browser Extension│
│  Extension  │                  │                  │
└──────┬──────┘                  └────────▲─────────┘
       │                                  │
       │ Upload                    Download
       │                                  │
       ▼                                  │
┌─────────────────────────────────────────────────┐
│  Cloud Storage (Dropbox/Google Drive/etc)      │
│  promptiply-profiles.json                       │
└─────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Works across different devices
- ✅ No local setup required
- ✅ Backup built-in

**Limitations:**
- ⚠️ Requires internet
- ⚠️ Requires cloud provider API setup
- ⚠️ Privacy considerations

---

### Option 4: Browser Extension Background Polling (Simplest)

Add periodic polling to the browser extension's background script.

**How it works:**
1. Browser extension requests persistent file access to `~/.promptiply-profiles.json`
2. Background script polls file every 5-30 seconds
3. If file modified time changed → Import automatically

**Benefits:**
- ✅ Relatively simple
- ✅ No additional infrastructure
- ✅ Works offline

**Limitations:**
- ⚠️ Requires File System Access API (Chrome 86+)
- ⚠️ User must grant folder access permission once
- ⚠️ Slight delay (polling interval)
- ⚠️ Uses some CPU/battery

**Implementation in browser extension:**
```javascript
// Request folder access (one-time, user grants permission)
const dirHandle = await window.showDirectoryPicker();

// Background script polls
setInterval(async () => {
  try {
    const fileHandle = await dirHandle.getFileHandle('.promptiply-profiles.json');
    const file = await fileHandle.getFile();

    if (file.lastModified > lastImportTime) {
      const text = await file.text();
      const profiles = JSON.parse(text);
      await importProfiles(profiles);
      lastImportTime = file.lastModified;
    }
  } catch (e) {
    // File not found or access denied
  }
}, 10000); // Check every 10 seconds
```

This requires changes to the browser extension repository.

---

## 📊 Comparison

| Solution | Setup Complexity | Sync Speed | Offline | Cross-Device | Implementation |
|----------|-----------------|------------|---------|--------------|----------------|
| **Native Messaging** | Medium | Instant | ✅ | ❌ | VSCode + Browser + Native host |
| **WebSocket Server** | Low-Medium | Instant | ✅ | ❌ (same network) | VSCode + Browser |
| **Cloud Sync** | Medium | 1-5 sec | ❌ | ✅ | VSCode + Browser + Cloud API |
| **File System Polling** | Low | 5-30 sec | ✅ | ❌ | Browser extension only |

---

## 🎯 Recommended Approach

**For your use case (single user, local machine):**

I recommend **Option 1 (Native Messaging Host)** because:
- ✅ True bidirectional automatic sync
- ✅ Instant updates (no polling delay)
- ✅ Works offline
- ✅ Secure (all local)
- ✅ No external dependencies

**Quick Start Option:**

If you want something working **NOW** with minimal changes:
- VSCode side is already automatic! ✅
- For browser side: Add **Option 4 (File System Polling)** to the browser extension
  - Requires Chrome 86+ File System Access API
  - User grants folder access once
  - Browser checks file every 10-30 seconds

---

## 💡 What I Can Implement Now

I can implement:

1. ✅ **Done**: VSCode automatic export on changes
2. ✅ **Done**: VSCode automatic import on file changes
3. 🔨 **Can do**: Native Messaging Host (create the host service)
4. 🔨 **Can do**: WebSocket Server in VSCode extension
5. ❌ **Can't do**: Browser extension changes (different repo)

**Would you like me to:**
- **A)** Create a Native Messaging Host implementation?
- **B)** Add a WebSocket server to the VSCode extension?
- **C)** Create documentation for browser extension polling (for the browser extension repo)?
- **D)** Something else?

Let me know which solution you prefer, and I'll implement it!
