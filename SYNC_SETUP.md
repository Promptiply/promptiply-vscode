# Quick Sync Setup Guide

## VSCode → Browser Extension Sync

### Step 1: Enable Sync in VSCode

1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type and select: `Promptiply: Enable Profile Sync`
3. VSCode will create `~/.promptiply-profiles.json` and export your profiles

### Step 2: Import in Browser Extension

1. Open Chrome/Edge browser
2. Click Promptiply extension icon → **Options**
3. Go to **Profiles** tab
4. Click **Import Profiles**
5. Select **"Select File"**
6. Browse to: `~/.promptiply-profiles.json` (in your home folder)
7. Choose import mode and click **Import**

### Step 3: Verify Sync

- Your VSCode profiles should now appear in the browser extension!
- The storage location preference (sync/local) will also be imported

---

## Browser Extension → VSCode Sync

### Step 1: Export from Browser Extension

1. Open Promptiply Options in browser
2. Go to **Profiles** tab
3. Click **Export Profiles**
4. ✅ Check **"Export for VSCode Sync"**
5. Save as: `~/.promptiply-profiles.json`

### Step 2: Import in VSCode

**If sync is enabled:** VSCode will auto-detect and import

**If sync is disabled:**
1. Command Palette → `Promptiply: Sync Profiles Now`
2. Select **Import from Sync File**

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
