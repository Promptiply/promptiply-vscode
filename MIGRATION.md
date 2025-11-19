# Migration Guide

This document describes breaking changes and migration steps between major versions of Promptiply.

## Table of Contents

- [v0.5.x to v0.6.0](#v05x-to-v060)
- [v0.4.x to v0.5.0](#v04x-to-v050)
- [v0.3.x to v0.4.0](#v03x-to-v040)

---

## v0.5.x to v0.6.0

### Breaking Changes

#### 1. API Key Storage Migration (Security Enhancement)

**What Changed:**
API keys are now stored using VSCode's Secrets API instead of settings.json.

**Why:**
- Encrypted, machine-local storage
- Keys never synced across devices (security risk)
- Follows VSCode security best practices

**Migration Steps:**

1. **Automatic Migration**: If you have existing API keys in settings, they will be automatically migrated to secure storage on first use.

2. **Manual Setup** (if automatic migration fails):
   ```
   1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
   2. Run: "Promptiply: Set OpenAI API Key (Secure)"
   3. Enter your API key
   4. Repeat for Anthropic if needed
   ```

3. **Clean Up Old Settings** (recommended):
   ```jsonc
   // Remove these deprecated settings from settings.json:
   "promptiply.openai.apiKey": "...",    // DELETE THIS
   "promptiply.anthropic.apiKey": "..."  // DELETE THIS
   ```

**Note:** The deprecated settings fields still exist for backward compatibility but will show deprecation warnings.

#### 2. Sync Server Port Configuration

**What Changed:**
The HTTP sync server port is now configurable via settings.

**Default Port:** 3456

**Migration Steps:**
If you were using a custom port (not documented in previous versions), add to settings:
```jsonc
{
  "promptiply.sync.serverPort": 3456  // or your custom port
}
```

### New Features in v0.6.0

- Mode selector menu in status bar
- Improved sync status bar with real-time updates
- Better settings UX with quick actions
- HTTP sync server for browser extension

### Deprecations

The following settings are deprecated and will be removed in v1.0.0:

| Setting | Replacement |
|---------|-------------|
| `promptiply.openai.apiKey` | Command Palette: "Set OpenAI API Key (Secure)" |
| `promptiply.anthropic.apiKey` | Command Palette: "Set Anthropic API Key (Secure)" |

---

## v0.4.x to v0.5.0

### Breaking Changes

None - fully backward compatible.

### New Features

- Smart profile recommendations with learning system
- Multi-profile recommendations (top 3)
- 9 professional profiles pre-installed
- Sync status bar indicator
- Built-in profile templates

### Migration Steps

No migration required. New features are additive.

---

## v0.3.x to v0.4.0

### Breaking Changes

None - fully backward compatible.

### New Features

- Refinement history with tree view
- Rich webview panel for viewing refinements
- Prompt templates system
- Enhanced profile management (create, delete, view)
- Chat participant integration (@promptiply)

### Migration Steps

No migration required. New features are additive.

---

## General Migration Tips

### Before Upgrading

1. **Backup your profiles**: Export profiles before upgrading
   ```
   Command Palette > "Promptiply: Export Profiles"
   ```

2. **Check release notes**: Review CHANGELOG.md for full details

3. **Test in isolated environment**: If possible, test the new version before production use

### After Upgrading

1. **Verify profiles loaded**: Check that all your profiles appear
2. **Test refinement**: Do a quick refinement to ensure AI providers work
3. **Check API keys**: Verify secure storage migration completed

### Rolling Back

If you need to roll back to a previous version:

1. Uninstall current version
2. Download previous VSIX from [GitHub Releases](https://github.com/Promptiply/promptiply-vscode/releases)
3. Install manually: `code --install-extension promptiply-<version>.vsix`

---

## Getting Help

- **Issues**: https://github.com/Promptiply/promptiply-vscode/issues
- **Documentation**: See `docs/` folder
- **Security concerns**: See SECURITY.md

---

**Last Updated**: 2025-11-19
