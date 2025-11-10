# Manual Testing Guide for Profile Sync

## ✅ Automated Tests (COMPLETED)

All automated tests passed (10/10 - 100% success rate):

- ✅ Valid VSCode sync file passes validation
- ✅ Invalid sync file fails validation correctly
- ✅ Chrome export format can be parsed
- ✅ VSCode sync format can be parsed by Chrome extension
- ✅ All required profile fields are present
- ✅ Evolving profile topics have correct structure
- ✅ Usage counts work for merge conflict resolution
- ✅ Chrome export envelope format is correct
- ✅ Null activeProfileId is handled correctly
- ✅ Empty profiles list is valid

---

## 📋 Manual Testing Checklist

### Prerequisites

1. **VSCode Extension:**
   - ✅ VSCode extension compiled successfully
   - Install from: `/home/user/promptiply/vscode-extension`
   - Press F5 in VSCode to launch Extension Development Host

2. **Chrome Extension:**
   - Load unpacked extension from: `/home/user/promptiply`
   - Chrome → Extensions → Developer mode → Load unpacked

3. **Test Data:**
   - Use the test files in `/home/user/promptiply/test-data/`

---

## Test Scenario 1: VSCode Export → Chrome Import

### Steps:

1. **Open VSCode Extension Development Host**
   ```
   - Open Command Palette (Ctrl+Shift+P)
   - Run: "Promptiply: Enable Profile Sync"
   - Verify status bar shows "Synced" icon
   ```

2. **Check Sync File Created**
   ```bash
   # Should exist at ~/.promptiply-profiles.json
   cat ~/.promptiply-profiles.json
   ```

   **Expected:** File contains VSCode format:
   ```json
   {
     "list": [...],
     "activeProfileId": "..."
   }
   ```

3. **Import to Chrome Extension**
   ```
   - Open Chrome extension options
   - Go to Profiles tab
   - Click "Import Profiles"
   - Select File → Choose ~/.promptiply-profiles.json
   - Choose "Merge" mode
   - Click Import
   ```

   **Expected:**
   - ✅ Toast shows "Detected VSCode sync file format"
   - ✅ Shows number of profiles imported
   - ✅ Profiles appear in Chrome extension
   - ✅ Active profile matches VSCode

---

## Test Scenario 2: Chrome Export → VSCode Import

### Steps:

1. **Create/Modify Profile in Chrome**
   ```
   - Open Chrome extension options
   - Create a new profile called "Chrome Test Profile"
   - Add persona: "Test persona from Chrome"
   - Add 2-3 style guidelines
   - Save profile
   ```

2. **Export for VSCode Sync**
   ```
   - Click "Export Profiles"
   - ✅ CHECK: "Export for VSCode Sync" checkbox
   - Select the profile(s) to export
   - Click "Export Selected"
   - Save as ~/.promptiply-profiles.json (replace existing)
   ```

   **Expected:**
   - ✅ File downloads as "promptiply-vscode-sync.json"
   - ✅ Toast shows "Exported X profile(s) (VSCode format)"

3. **Import to VSCode**
   ```
   # If auto-sync is enabled, it should auto-import
   # Otherwise:
   - Command Palette → "Promptiply: Sync Profiles Now"
   - Choose "📥 Import from Sync File"
   ```

   **Expected:**
   - ✅ Notification shows "Imported X profiles"
   - ✅ Shows active profile name
   - ✅ Status bar shows "Synced"
   - ✅ Profile appears in VSCode profile list

---

## Test Scenario 3: Two-Way Merge (Conflict Resolution)

### Setup:

1. **Create Profile in VSCode**
   ```
   - Create profile: "VSCode Exclusive"
   - Use it 5 times (usageCount will be 5)
   ```

2. **Create Profile in Chrome**
   ```
   - Create profile: "Chrome Exclusive"
   - Use it 3 times in refinements
   ```

3. **Create Conflicting Profile**
   ```
   In VSCode:
   - Create profile with ID: "shared_profile_1"
   - Use it 10 times

   In Chrome:
   - Create profile with SAME ID: "shared_profile_1"
   - Modify the persona text
   - Use it 15 times
   ```

### Steps:

1. **Export from Chrome**
   ```
   - Export with "Export for VSCode Sync" checked
   - Save to ~/.promptiply-profiles.json
   ```

2. **Merge in VSCode**
   ```
   - Command Palette → "Promptiply: Sync Profiles Now"
   - Choose "🔄 Two-Way Sync (Merge)"
   ```

   **Expected:**
   - ✅ Notification shows: "X profiles (Y added, Z updated, W kept local)"
   - ✅ VSCode Exclusive profile is kept (local only)
   - ✅ Chrome Exclusive profile is added (from sync)
   - ✅ shared_profile_1 uses Chrome version (higher usageCount: 15 > 10)
   - ✅ All profiles are now in sync file
   - ✅ Status bar shows "Synced"

---

## Test Scenario 4: Automatic Sync (File Watching)

### Steps:

1. **Enable Auto-Sync in VSCode**
   ```
   Settings → Promptiply → Sync → Enabled: ✅
   ```

2. **Make Change in Chrome and Export**
   ```
   - Modify a profile in Chrome
   - Export for VSCode Sync → Save to ~/.promptiply-profiles.json
   ```

3. **Observe VSCode**

   **Expected:**
   - ✅ VSCode automatically detects file change (within 1-2 seconds)
   - ✅ Status bar shows "Syncing..." briefly
   - ✅ Then shows "Synced"
   - ✅ Notification appears with import details
   - ✅ Profile changes are reflected immediately

---

## Test Scenario 5: Error Handling

### Test 5.1: Invalid JSON

1. **Create Invalid Sync File**
   ```bash
   echo "{ invalid json }" > ~/.promptiply-profiles.json
   ```

2. **Try to Import in VSCode**
   ```
   Command Palette → "Promptiply: Sync Profiles Now" → Import
   ```

   **Expected:**
   - ✅ Error notification with clear message
   - ✅ Status bar shows "Sync Error"
   - ✅ No profiles are corrupted
   - ✅ Previous profiles remain intact

### Test 5.2: Invalid Format (Missing Required Fields)

1. **Use Invalid Test File**
   ```bash
   cp /home/user/promptiply/test-data/invalid-missing-list.json ~/.promptiply-profiles.json
   ```

2. **Try to Import**

   **Expected:**
   - ✅ Error: "Invalid sync file format. Expected {list: [...], activeProfileId: ...}"
   - ✅ Status bar shows error
   - ✅ Profiles unchanged

### Test 5.3: Chrome Extension with Old Export Format

1. **Export Chrome Profiles (Standard Format)**
   ```
   - Export profiles WITHOUT checking "Export for VSCode Sync"
   - Try to import in VSCode
   ```

   **Expected:**
   - ✅ VSCode rejects the file (expects VSCode format in sync file)
   - ✅ OR: Create a command to import Chrome export format separately

---

## Test Scenario 6: Status Bar Integration

### Steps:

1. **Manual Sync**
   ```
   - Click status bar sync icon
   - OR Command: "Promptiply: Sync Profiles Now"
   ```

   **Expected During Sync:**
   - ✅ Icon changes to spinning sync icon (🔄)
   - ✅ Text shows "Syncing..."

   **Expected After Sync:**
   - ✅ Icon changes to cloud (☁️)
   - ✅ Text shows "Synced"
   - ✅ Notification with details

2. **Disable Sync**
   ```
   Command: "Promptiply: Disable Profile Sync"
   ```

   **Expected:**
   - ✅ Status bar icon disappears
   - ✅ File watching stops
   - ✅ Notification confirms disable

3. **Re-enable Sync**
   ```
   Command: "Promptiply: Enable Profile Sync"
   ```

   **Expected:**
   - ✅ Status bar icon appears
   - ✅ Immediately exports current profiles
   - ✅ File watching starts
   - ✅ Shows "Synced" status

---

## Test Scenario 7: Custom Sync Path

### Steps:

1. **Change Sync Path**
   ```
   - Command: "Promptiply: Set Sync File Path"
   - Enter: /tmp/my-custom-sync.json
   ```

2. **Export**
   ```
   - Command: "Promptiply: Sync Profiles Now" → Export
   ```

   **Expected:**
   - ✅ File created at /tmp/my-custom-sync.json
   - ✅ Notification shows new path
   - ✅ Settings updated

3. **Use Custom Path in Chrome**
   ```
   - Export from Chrome → Save to /tmp/my-custom-sync.json
   - VSCode auto-imports from new location
   ```

---

## Test Scenario 8: Active Profile Sync

### Steps:

1. **Set Active Profile in VSCode**
   ```
   - Select "Backend Developer" as active profile
   - Export to sync file
   ```

2. **Import to Chrome**
   ```
   - Import sync file
   ```

   **Expected:**
   - ✅ "Backend Developer" is set as active in Chrome
   - ✅ Extension icon shows active profile indicator

3. **Change Active in Chrome**
   ```
   - Select "Frontend Developer" as active
   - Export for VSCode Sync
   ```

4. **Import to VSCode**

   **Expected:**
   - ✅ "Frontend Developer" becomes active in VSCode
   - ✅ Status bar shows active profile name

---

## Verification Checklist

After running all tests, verify:

- [ ] ✅ All test files created and used
- [ ] ✅ VSCode can export to sync file
- [ ] ✅ VSCode can import from sync file
- [ ] ✅ Chrome can import VSCode format
- [ ] ✅ Chrome can export VSCode format
- [ ] ✅ Two-way merge works correctly
- [ ] ✅ Conflict resolution uses usage count
- [ ] ✅ Auto-sync (file watching) works
- [ ] ✅ Status bar updates correctly
- [ ] ✅ Error handling works
- [ ] ✅ Invalid files don't corrupt profiles
- [ ] ✅ Custom sync paths work
- [ ] ✅ Active profile syncs correctly
- [ ] ✅ Notifications are clear and helpful

---

## Reporting Issues

If any test fails, report with:

1. **Test scenario number and name**
2. **Steps to reproduce**
3. **Expected result**
4. **Actual result**
5. **Screenshots (if applicable)**
6. **Console errors (F12 in Chrome, Output panel in VSCode)**
7. **Sync file content** (sanitize any sensitive data)

---

## Quick Smoke Test (5 minutes)

If you just want to verify basic functionality:

1. ✅ Enable sync in VSCode → Check file created
2. ✅ Import that file in Chrome → Verify profiles appear
3. ✅ Export from Chrome (VSCode format) → Save to sync file
4. ✅ VSCode auto-imports → Verify changes reflected
5. ✅ Check status bar shows "Synced"

If all 5 steps work, the integration is functional! 🎉

---

## Performance Tests (Optional)

- [ ] Sync 100+ profiles (should be fast)
- [ ] Rapid sync (export/import 10 times in 1 minute)
- [ ] Large profile data (10KB+ persona text)
- [ ] Sync across network drive (cloud folder)

---

**Good luck with testing! 🧪**
