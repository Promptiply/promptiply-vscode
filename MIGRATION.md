# Migration Guide

This document provides guidance for upgrading between major versions of Promptiply.

## Table of Contents

- [Upgrading to v0.5.1](#upgrading-to-v051)
- [General Migration Tips](#general-migration-tips)

---

## Upgrading to v0.5.1

**Release Date:** TBD
**Breaking Changes:** Yes (AI model configuration)
**Migration Effort:** Low (5-10 minutes)

### What's New

✨ **New Features:**
- API resilience with automatic retry and exponential backoff
- Request timeout protection (60s for cloud APIs, 120s for Ollama)
- Rate limiting to prevent API quota exhaustion
- Code coverage tracking in CI/CD
- Comprehensive production runbook

🔧 **Improvements:**
- Updated to correct AI model names (GPT-4o, Claude 3.5)
- Better error handling and timeout messages
- Enhanced security recommendations
- Improved documentation

### Breaking Changes

#### 1. AI Model Configuration Names

The default AI model names have been corrected to match actual provider offerings.

**Before (v0.0.1):**
```jsonc
{
  "promptiply.openai.economyModel": "gpt-5-mini",          // ❌ Incorrect
  "promptiply.openai.premiumModel": "gpt-5-2025-08-07",    // ❌ Incorrect
  "promptiply.anthropic.economyModel": "claude-haiku-4-5", // ❌ Incorrect
  "promptiply.anthropic.premiumModel": "claude-sonnet-4-5" // ❌ Incorrect
}
```

**After (v0.5.1):**
```jsonc
{
  "promptiply.openai.economyModel": "gpt-4o-mini",              // ✅ Correct
  "promptiply.openai.premiumModel": "gpt-4o",                   // ✅ Correct
  "promptiply.anthropic.economyModel": "claude-3-5-haiku-20241022",  // ✅ Correct
  "promptiply.anthropic.premiumModel": "claude-3-5-sonnet-20241022"  // ✅ Correct
}
```

### Migration Steps

#### Step 1: Backup Your Configuration (Recommended)

```bash
# Backup your VSCode settings
cp ~/.config/Code/User/settings.json ~/settings-backup.json

# Or export your profiles
# Command Palette → "Promptiply: Export Profiles"
```

#### Step 2: Update Extension

The extension will update automatically, or you can manually update:

1. Open VSCode
2. Press `Ctrl/Cmd + Shift + X` (Extensions)
3. Find "Promptiply"
4. Click "Update"

#### Step 3: Update Settings (If Using OpenAI or Anthropic)

**Option A: Automatic (Recommended)**

The extension will use the new defaults automatically. If you haven't customized model names, **no action needed**.

**Option B: Manual Update**

If you previously customized model names in settings:

1. Open Settings: `Ctrl/Cmd + ,`
2. Search for "promptiply"
3. Update the following settings:

   - `promptiply.openai.economyModel`: Change to `gpt-4o-mini`
   - `promptiply.openai.premiumModel`: Change to `gpt-4o`
   - `promptiply.anthropic.economyModel`: Change to `claude-3-5-haiku-20241022`
   - `promptiply.anthropic.premiumModel`: Change to `claude-3-5-sonnet-20241022`

**Option C: Via settings.json**

```jsonc
// Press Ctrl/Cmd + Shift + P → "Preferences: Open Settings (JSON)"
{
  "promptiply.openai.economyModel": "gpt-4o-mini",
  "promptiply.openai.premiumModel": "gpt-4o",
  "promptiply.anthropic.economyModel": "claude-3-5-haiku-20241022",
  "promptiply.anthropic.premiumModel": "claude-3-5-sonnet-20241022"
}
```

#### Step 4: Test the Migration

1. Open any file in VSCode
2. Select some text
3. Press `Ctrl/Cmd + Shift + R` to refine
4. Verify the refinement works as expected

### What If Something Breaks?

#### Issue: API Errors After Upgrade

**Error:** `Invalid model: gpt-5-mini`

**Solution:**
1. Update settings as described in Step 3
2. Reload VSCode window: `Ctrl/Cmd + Shift + P` → "Reload Window"

#### Issue: Timeout Errors

**Error:** `Request timeout after 60000ms`

This is the new timeout protection feature. It means the AI provider is slow or unavailable.

**Solutions:**
1. Try again (automatic retry already attempted 2x)
2. Switch to economy model (faster)
3. Check provider status:
   - OpenAI: https://status.openai.com
   - Anthropic: https://status.anthropic.com
4. Try a different provider (VSCode LM or Ollama)

#### Issue: Rate Limit Errors

**Error:** `Rate limit exceeded`

This is the new rate limiting feature preventing API quota exhaustion.

**Solutions:**
1. Wait 1-2 seconds between requests (automatic throttling)
2. Upgrade your API provider tier
3. Use VSCode LM or Ollama (no rate limits)

### Rollback to v0.0.1 (If Needed)

If you encounter critical issues:

1. Uninstall the extension
2. Download v0.0.1 from [Releases](https://github.com/Promptiply/promptiply-vscode/releases/tag/v0.0.1)
3. Install from VSIX file
4. Report the issue on [GitHub Issues](https://github.com/Promptiply/promptiply-vscode/issues)

---

## General Migration Tips

### Before Upgrading

1. **Export your profiles** to avoid data loss
2. **Note your custom settings** (model names, API keys, etc.)
3. **Read the CHANGELOG** to understand what's changing
4. **Test in a separate VSCode workspace** if possible

### After Upgrading

1. **Check the output panel** for any errors
2. **Test core functionality** (refine, switch profiles, etc.)
3. **Review new settings** that may be available
4. **Read new documentation** (RUNBOOK.md, updated README)

### Reporting Issues

If you encounter problems during migration:

1. Check existing [GitHub Issues](https://github.com/Promptiply/promptiply-vscode/issues)
2. Open a new issue with:
   - Previous version number
   - Current version number
   - Exact error message
   - Steps to reproduce
   - VSCode version and OS

---

## Version Compatibility

| Promptiply Version | VSCode Version | Node Version | Status |
|-------------------|----------------|--------------|--------|
| 0.5.1 | >= 1.85.0 | 18.x, 20.x, 22.x | Current |
| 0.0.1 | >= 1.85.0 | 18.x, 20.x | Legacy |

---

## API Provider Compatibility

### OpenAI

| Promptiply Version | Supported Models |
|-------------------|------------------|
| 0.5.1 | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo |
| 0.0.1 | gpt-4o, gpt-4o-mini (configured as "gpt-5") |

### Anthropic

| Promptiply Version | Supported Models |
|-------------------|------------------|
| 0.5.1 | claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022, claude-3-opus |
| 0.0.1 | claude-3-5-sonnet, claude-3-5-haiku (configured incorrectly) |

### VSCode LM

No changes - uses Copilot's model selection automatically.

### Ollama

No changes - supports any locally available model.

---

## Data Migration

### Profile Data

**Location:** VSCode global state storage
**Format:** JSON

Profiles are automatically migrated between versions. No manual migration needed.

### History Data

**Location:** VSCode global state storage
**Retention:** Last 100 entries (configurable via `promptiply.history.maxEntries`)

History is preserved during upgrades.

### Settings

**Location:** VSCode settings.json
**Migration:** Manual (see Step 3 above)

Settings with incorrect model names will continue to work but should be updated to the new names.

---

## FAQ

**Q: Do I need to update my API keys?**
A: No, API keys remain the same.

**Q: Will my custom profiles be lost?**
A: No, profiles are preserved. Export them as a backup if concerned.

**Q: Can I use old model names?**
A: For now, yes, but they may be removed in a future version. Update to the new names.

**Q: What if I use a custom model name?**
A: Custom model names will continue to work as long as your provider supports them.

**Q: How do I revert to the old version?**
A: See "Rollback to v0.0.1" section above.

---

## Need Help?

- **Documentation:** [README.md](README.md)
- **Runbook:** [RUNBOOK.md](RUNBOOK.md)
- **Issues:** [GitHub Issues](https://github.com/Promptiply/promptiply-vscode/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Promptiply/promptiply-vscode/discussions)
