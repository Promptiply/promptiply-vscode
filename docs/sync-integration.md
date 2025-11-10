# Profile Sync Integration Guide

## Overview

Promptiply now supports seamless profile synchronization between the VSCode extension and Chrome browser extension. This allows you to maintain consistent profiles across both platforms.

## How It Works

### Sync File Format

Both extensions use a unified sync file format:
```json
{
  "list": [
    {
      "id": "profile_id",
      "name": "Profile Name",
      "persona": "...",
      "tone": "...",
      "styleGuidelines": [...],
      "evolving_profile": {
        "topics": [...],
        "lastUpdated": "...",
        "usageCount": 0,
        "lastPrompt": ""
      }
    }
  ],
  "activeProfileId": "profile_id_or_null"
}
```

### Default Sync Location

- **VSCode Extension**: `~/.promptiply-profiles.json` (can be customized)
- **Chrome Extension**: Exports to Downloads folder (user can save to sync location)

## VSCode Extension Setup

### 1. Enable Sync

**Via Command Palette:**
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run `Promptiply: Enable Profile Sync`
3. Your profiles will be exported to `~/.promptiply-profiles.json`

**Via Settings:**
```json
{
  "promptiply.sync.enabled": true,
  "promptiply.sync.filePath": "~/.promptiply-profiles.json"  // Optional custom path
}
```

### 2. Sync Status Bar

When sync is enabled, you'll see a sync status indicator in the status bar:
- 🔄 **Syncing...** - Sync in progress
- ☁️ **Synced** - Profiles synced successfully
- ⚠️ **Sync Error** - Sync failed (click to retry)

Click the status bar item to manually trigger a sync.

### 3. Manual Sync

Run `Promptiply: Sync Profiles Now` and choose:
- **📤 Export to Sync File** - Save VSCode profiles to sync file
- **📥 Import from Sync File** - Load profiles from sync file
- **🔄 Two-Way Sync (Merge)** - Smart merge based on usage count

### 4. Automatic Sync

When sync is enabled, VSCode watches the sync file for changes:
- Any update to the sync file automatically imports new profiles
- Profiles are updated in real-time

## Chrome Extension Setup

### 1. Export for VSCode

1. Open Promptiply Options (right-click extension icon → Options)
2. Go to **Profiles** tab
3. Click **Export Profiles**
4. ✅ Check **"Export for VSCode Sync"**
5. Select profiles to export
6. Click **Export Selected**
7. Save as `~/.promptiply-profiles.json` (or your custom sync path)

### 2. Import from VSCode

1. Open Promptiply Options
2. Go to **Profiles** tab
3. Click **Import Profiles**
4. Choose **Select File**
5. Navigate to `~/.promptiply-profiles.json`
6. Select import mode:
   - **Replace All** - Replace all profiles with imported ones
   - **Merge** - Keep both, skip duplicates
   - **Overwrite Duplicates** - Replace existing profiles with same ID

The Chrome extension automatically detects the VSCode sync format!

## Sync Workflow Examples

### Scenario 1: VSCode → Chrome

1. Create/modify profiles in VSCode
2. VSCode automatically exports to `~/.promptiply-profiles.json` (if sync enabled)
3. Open Chrome extension options
4. Import → Select File → Choose `~/.promptiply-profiles.json`
5. Profiles now synced to Chrome!

### Scenario 2: Chrome → VSCode

1. Create/modify profiles in Chrome extension
2. Export → Check "Export for VSCode Sync"
3. Save to `~/.promptiply-profiles.json`
4. VSCode automatically detects change and imports (if sync enabled)
   - OR manually run `Promptiply: Sync Profiles Now` → Import
5. Profiles now synced to VSCode!

### Scenario 3: Two-Way Merge

**Situation:** You've made changes in both VSCode and Chrome

**Solution:**
1. Export from Chrome (VSCode format) to sync file
2. In VSCode, run `Promptiply: Sync Profiles Now` → Two-Way Sync
3. VSCode merges profiles using smart logic:
   - Profiles with higher `usageCount` are preferred
   - New profiles from both sides are kept
   - Active profile preference follows sync file

## Conflict Resolution

When the same profile exists in both locations:
- Profile with **higher usage count** wins
- This ensures the most recently used version is kept
- Manual merge allows you to review before syncing

## Sync File Validation

Both extensions validate the sync file format:
- ✅ Must have `list` array and `activeProfileId` field
- ✅ Each profile must have: `id`, `name`, `persona`, `tone`, `styleGuidelines`
- ✅ Each profile must have valid `evolving_profile` structure
- ⚠️ Invalid files show error messages

## Best Practices

### 1. Regular Exports
- Export from Chrome whenever you make significant changes
- VSCode automatically exports when sync is enabled

### 2. Use Custom Sync Path
If `~/.promptiply-profiles.json` doesn't work:
```json
{
  "promptiply.sync.filePath": "/path/to/your/sync/file.json"
}
```

### 3. Cloud Sync
Place sync file in a cloud-synced folder:
- **Dropbox:** `~/Dropbox/promptiply-sync.json`
- **Google Drive:** `~/Google Drive/promptiply-sync.json`
- **OneDrive:** `~/OneDrive/promptiply-sync.json`

Then both Chrome and VSCode can use the same file across machines!

### 4. Backup Before Large Changes
Export profiles before making major modifications:
- VSCode: `Promptiply: Export Profiles`
- Chrome: Export (standard format for backup)

## Troubleshooting

### Sync Not Working

1. **Check sync is enabled** in VSCode settings
2. **Verify file path** - Run `Promptiply: Set Sync File Path`
3. **Check file permissions** - Ensure VSCode can read/write the file
4. **Check Output panel** - View → Output → "Promptiply" for errors

### Import Fails

1. **Validate JSON** - Ensure file is valid JSON
2. **Check format** - Must have `list` and `activeProfileId` fields
3. **Check browser console** (F12) for Chrome extension errors

### Profiles Not Updating

1. **Manual sync** - Run `Promptiply: Sync Profiles Now` → Import
2. **Check active profile** - Ensure correct profile is selected
3. **Restart VSCode/Chrome** - Force reload of profiles

## Technical Details

### VSCode Extension

- **Sync Manager:** `src/profiles/sync.ts`
- **Status Bar:** `src/ui/syncStatusBar.ts`
- **File Watcher:** Watches sync file for external changes
- **Storage:** Uses VSCode's `globalState` for profiles

### Chrome Extension

- **Import Parser:** `options/index.js` - `parseImportEnvelope()`
- **Export Function:** `options/index.js` - `exportProfiles()`
- **Storage:** Uses `chrome.storage.sync` API
- **Format Detection:** Automatically detects VSCode sync format

### Sync Format vs Export Format

**VSCode Sync Format** (for cross-platform sync):
```json
{
  "list": [...],
  "activeProfileId": "..."
}
```

**Chrome Export Format** (for backup/sharing):
```json
{
  "schemaVersion": 1,
  "exportedAt": "2025-01-09T...",
  "profiles": [...]
}
```

Both extensions support **both formats** for maximum compatibility!

## Security & Privacy

- ✅ **Local-only** - Sync file is stored locally on your machine
- ✅ **No cloud service** - No data sent to external servers
- ✅ **User control** - You choose where and when to sync
- ✅ **Format validation** - Both extensions validate file integrity

## Future Enhancements

Potential improvements for future versions:
- [ ] Automatic conflict resolution UI
- [ ] Sync history/versioning
- [ ] Cloud storage integration (Google Drive, Dropbox API)
- [ ] Real-time sync via local server
- [ ] Sync across multiple devices
- [ ] Profile diff viewer

## Feedback & Issues

Found a bug or have a suggestion?
- Open an issue on GitHub
- Include sync file (with sensitive info removed)
- Describe your workflow and OS

---

**Happy Syncing! 🔄**
