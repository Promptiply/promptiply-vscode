# Quick Sync Setup Guide

## ✅ NEW: Automatic Sync from VSCode!

**VSCode now automatically syncs profiles!** When sync is enabled:
- ✅ Auto-exports when you change profiles in VSCode
- ✅ Auto-imports when the sync file changes (from browser extension)

## VSCode → Browser Extension Sync

### Step 1: Enable Automatic Sync in VSCode

1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type and select: `Promptiply: Enable Profile Sync`
3. VSCode creates `~/.promptiply-profiles.json` and starts auto-sync

**That's it!** Now whenever you:
- Create/edit/delete a profile in VSCode → Automatically exports to sync file
- Make changes in browser extension → VSCode auto-imports (when file changes)

### Step 2: Initial Import in Browser Extension

(One-time setup - manual for now)

1. Open Chrome/Edge browser
2. Click Promptiply extension icon → **Options**
3. Go to **Profiles** tab
4. Click **Import Profiles**
5. Select **"Select File"**
6. Browse to: `~/.promptiply-profiles.json` (in your home folder)
7. Choose import mode and click **Import**

### Ongoing Sync

**VSCode → Browser:**
- Make changes in VSCode → File auto-updates → Manually import in browser
- (Browser extension auto-import coming soon - see automatic-sync-guide.md)

**Browser → VSCode:**
- Export from browser to `~/.promptiply-profiles.json` → VSCode **auto-imports** ✅

---

## How It Works Now

```
┌─────────────────┐              ┌──────────────────────┐
│   VSCode        │              │ Browser Extension    │
│                 │              │                      │
│  Create/Edit/   │              │  Create/Edit/        │
│  Delete Profile │              │  Delete Profile      │
│       ↓         │              │       ↓              │
│  AUTO-EXPORT ✅ │              │  Manual Export ⚠️    │
└────────┬────────┘              └──────┬───────────────┘
         │                              │
         └──────────►┌─────────────────┐◄
                     │  Sync File      │
         ┌───────────┤ ~/.promptiply   │
         │           │  -profiles.json │
         ▼           └─────────────────┘
    AUTO-IMPORT ✅
                                Manual Import ⚠️
```

### What's Automatic
- ✅ VSCode export (on any profile change)
- ✅ VSCode import (when file changes)
- ⚠️ Browser export (manual - you export when needed)
- ⚠️ Browser import (manual - you import when needed)

---

## Troubleshooting

### "File not found" error
- Make sure you exported from VSCode first
- Check the file location: Run `ls ~/.promptiply-profiles.json` in terminal
- Verify custom path: Check VSCode settings → Promptiply → Sync File Path

### "Import failed" in browser
- Ensure you selected the correct file
- Check file format is valid JSON
- Try export → import again

### Changes not syncing
This is **manual sync** using a shared file. You need to:
1. Export from one extension (creates/updates the file)
2. Import in the other extension (reads from the file)

It's not automatic real-time sync between the two extensions.
