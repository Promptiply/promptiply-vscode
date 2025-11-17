# Promptiply VSCode Extension - Production Runbook

This runbook provides guidance for deploying, monitoring, and maintaining the Promptiply VSCode extension in production.

## Table of Contents

- [Overview](#overview)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Deployment Process](#deployment-process)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Incident Response](#incident-response)
- [Maintenance](#maintenance)

---

## Overview

**Extension Name**: Promptiply
**Platform**: Visual Studio Code Marketplace & Open VSX Registry
**Repository**: https://github.com/Promptiply/promptiply-vscode
**Tech Stack**: TypeScript, Webpack, Node.js
**Deployment Method**: Automated via GitHub Actions

### Architecture Summary

- **Single-bundle extension** (`dist/extension.js`) compiled from TypeScript source
- **Zero production dependencies** - fully self-contained
- **Data storage**: VSCode GlobalState (profiles, history) + Secrets API (API keys)
- **External integrations**: OpenAI API, Anthropic API, Ollama (optional), GitHub Copilot

---

## Pre-Deployment Checklist

### Before Every Release

- [ ] All tests pass locally (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] No security vulnerabilities (`npm audit`)
- [ ] Version number updated in `package.json`
- [ ] `CHANGELOG.md` updated with release notes
- [ ] Breaking changes documented in `MIGRATION.md`
- [ ] Code reviewed and approved
- [ ] Manual testing completed (see `TESTING.md`)
- [ ] Extension packaged successfully (`npm run package`)
- [ ] VSIX artifact generated and tested locally

### Security Checklist

- [ ] No API keys or secrets in source code
- [ ] API keys stored via VSCode Secrets API only
- [ ] Dependencies up to date (no high/critical vulnerabilities)
- [ ] CodeQL security scan passed
- [ ] No sensitive data in logs or error messages

### Compatibility Checklist

- [ ] Works on VSCode 1.85.0+ (minimum version)
- [ ] Tested on Windows, macOS, and Linux
- [ ] Tested with Node 18.x, 20.x, 22.x
- [ ] Copilot integration tested (if available)
- [ ] All AI providers tested (VSCode LM, Ollama, OpenAI, Anthropic)

---

## Deployment Process

### Automated Deployment (Recommended)

Promptiply uses GitHub Actions for automated releases:

#### 1. Trigger Release

```bash
# Create and push a version tag
git tag v0.6.0
git push origin v0.6.0
```

#### 2. GitHub Actions Workflow

The `release.yml` workflow automatically:

1. **Validates** the release
   - Checks version matches tag
   - Runs full test suite
   - Runs linter and security audit
   - Compiles TypeScript

2. **Packages** the extension
   - Creates VSIX bundle
   - Verifies artifact integrity

3. **Publishes** to marketplaces
   - VSCode Marketplace (https://marketplace.visualstudio.com/)
   - Open VSX Registry (https://open-vsx.org/)

4. **Creates GitHub Release**
   - Extracts changelog from `CHANGELOG.md`
   - Uploads VSIX artifact
   - Publishes release notes

#### 3. Monitor Deployment

- Check GitHub Actions status: https://github.com/Promptiply/promptiply-vscode/actions
- Verify marketplace listing: https://marketplace.visualstudio.com/items?itemName=promptiply.promptiply
- Confirm version number matches release

### Manual Deployment (Emergency Only)

If automated deployment fails:

```bash
# 1. Package extension
npm run package

# 2. Verify VSIX created
ls -lh *.vsix

# 3. Test VSIX locally
code --install-extension promptiply-*.vsix

# 4. Publish to VSCode Marketplace
npx @vscode/vsce publish

# 5. Publish to Open VSX
npx ovsx publish promptiply-*.vsix -p $OPEN_VSX_TOKEN
```

---

## Rollback Procedures

### Immediate Rollback

If a critical bug is discovered in production:

#### Option 1: Unpublish Version (VSCode Marketplace)

```bash
npx @vscode/vsce unpublish promptiply.promptiply@0.6.0
```

**Warning**: This removes the version entirely. Users won't be able to install it.

#### Option 2: Publish Hotfix

```bash
# 1. Revert to previous version
git revert <commit-hash>

# 2. Create hotfix version
npm version patch  # e.g., 0.6.0 -> 0.6.1

# 3. Tag and push
git push && git push --tags

# 4. Wait for automated deployment
```

#### Option 3: Manual Rollback Instructions

If unpublishing isn't possible, provide users with rollback instructions:

1. Uninstall current version
2. Download previous VSIX from [GitHub Releases](https://github.com/Promptiply/promptiply-vscode/releases)
3. Install manually: `code --install-extension promptiply-<version>.vsix`

### Data Rollback

API keys and user data are stored locally:

- **API Keys**: Stored in VSCode Secrets API (secure, encrypted)
- **Profiles**: Stored in VSCode GlobalState (`~/.config/Code/User/globalStorage/promptiply.promptiply/`)
- **History**: Stored in VSCode GlobalState

**No server-side rollback required** - all data is client-side.

---

## Monitoring

### Extension Health Metrics

Monitor the following:

#### 1. Marketplace Metrics
- **Install count**: Track growth and anomalies
- **Rating**: Monitor for sudden drops (indicates issues)
- **Reviews**: Read user feedback daily
- **Active installs**: Check retention rate

**Where**: https://marketplace.visualstudio.com/items?itemName=promptiply.promptiply

#### 2. GitHub Metrics
- **Issues**: Monitor new issue rate
- **Stars**: Track community interest
- **Forks**: Measure adoption by developers
- **Pull requests**: Review community contributions

**Where**: https://github.com/Promptiply/promptiply-vscode

#### 3. CI/CD Metrics
- **Build success rate**: Should be >95%
- **Test coverage**: Aim for >70%
- **Security scan results**: Zero high/critical vulnerabilities

**Where**: https://github.com/Promptiply/promptiply-vscode/actions

### Logs and Debugging

Users can view extension logs:

1. Open VSCode Output panel: **View** > **Output**
2. Select **Promptiply** from dropdown
3. Logs show INFO, WARN, ERROR, DEBUG levels

Common log patterns to watch for:
- `ERROR` - Critical failures
- `API key migration` - Security-related operations
- `Refinement failed` - AI provider issues

---

## Troubleshooting

### Common Issues

#### Issue: Extension Fails to Activate

**Symptoms**: Extension icon not visible, commands not available

**Diagnosis**:
```bash
# Check activation events
code --list-extensions --show-versions
code --verbose
```

**Solutions**:
1. Check VSCode version (must be ≥1.85.0)
2. Reinstall extension
3. Check for conflicting extensions
4. Review extension logs for errors

#### Issue: API Key Not Working

**Symptoms**: "API key not configured" errors

**Diagnosis**:
1. Check Secrets API: API keys stored securely?
2. Check settings: Old `promptiply.*.apiKey` settings cleared?
3. Check API provider: Key valid and not rate-limited?

**Solutions**:
1. Re-enter API key via Command Palette: `Promptiply: Set OpenAI API Key`
2. Verify key validity with provider's API documentation
3. Check API usage limits and quotas

#### Issue: Refinement Slow or Times Out

**Symptoms**: Refinement takes >30 seconds or fails

**Diagnosis**:
1. Check AI provider status (OpenAI Status, Anthropic Status)
2. Check network connectivity
3. Check model selection (economy vs premium)

**Solutions**:
1. Switch to different AI provider (VSCode LM → Ollama)
2. Toggle economy mode (faster models)
3. Check firewall settings for API access

#### Issue: Profile Sync Not Working

**Symptoms**: Profiles not syncing across devices

**Diagnosis**:
1. Check sync file path: `promptiply.sync.filePath`
2. Check sync enabled: `promptiply.sync.enabled`
3. Check file permissions on sync file

**Solutions**:
1. Verify sync file location (Dropbox, Google Drive, etc.)
2. Re-enable sync: `Promptiply: Enable Profile Sync`
3. Manually trigger sync: `Promptiply: Sync Profiles Now`

### Debug Mode

Enable verbose logging:

1. Set `VSCODE_DEBUG_MODE=true` environment variable
2. Restart VSCode
3. Check Promptiply output channel for DEBUG messages

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Action |
|-------|-------------|---------------|--------|
| P0 | Extension completely broken | < 1 hour | Hotfix or rollback immediately |
| P1 | Core feature broken (refinement fails) | < 4 hours | Hotfix within 24 hours |
| P2 | Minor feature broken (UI issue) | < 1 day | Fix in next patch release |
| P3 | Enhancement request | < 1 week | Schedule for future release |

### Incident Workflow

1. **Detect**: Monitor GitHub issues, marketplace reviews, user reports
2. **Triage**: Determine severity level
3. **Investigate**: Reproduce issue, check logs, review code
4. **Fix**: Create hotfix branch, implement fix, add tests
5. **Test**: Run full test suite, manual testing
6. **Deploy**: Use hotfix deployment process
7. **Communicate**: Update users via GitHub release notes
8. **Post-Mortem**: Document root cause and preventive measures

### Emergency Contacts

- **Maintainer**: [See CONTRIBUTING.md]
- **Security Issues**: [See SECURITY.md]
- **GitHub Issues**: https://github.com/Promptiply/promptiply-vscode/issues

---

## Maintenance

### Regular Maintenance Tasks

#### Weekly
- [ ] Review new GitHub issues
- [ ] Respond to user questions
- [ ] Monitor marketplace ratings/reviews
- [ ] Check CI/CD pipeline health

#### Monthly
- [ ] Update dependencies (`npm update`)
- [ ] Run security audit (`npm audit`)
- [ ] Review and merge dependabot PRs
- [ ] Check for VSCode API updates
- [ ] Update documentation if needed

#### Quarterly
- [ ] Major dependency updates
- [ ] Review and refactor technical debt
- [ ] Performance profiling and optimization
- [ ] User survey for feature requests
- [ ] Update roadmap

### Dependency Updates

```bash
# Check for outdated dependencies
npm outdated

# Update all dependencies
npm update

# Update specific dependency
npm update <package-name>

# Audit for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Test after updates
npm test
```

### Performance Optimization

Monitor extension performance:

1. **Startup time**: < 100ms activation time
2. **Memory usage**: < 50MB for core extension
3. **CPU usage**: Minimal when idle
4. **Bundle size**: < 500KB for VSIX

Optimization techniques:
- Lazy load features (templates, sync, chat)
- Debounce user inputs
- Cache API responses when appropriate
- Minimize dependencies

### Security Updates

Follow secure development practices:

1. **API Keys**: Always use Secrets API, never settings
2. **Dependencies**: Keep updated, audit regularly
3. **Code Review**: All PRs reviewed before merge
4. **Input Validation**: Sanitize all user inputs
5. **Error Handling**: Never expose sensitive data in errors

---

## Resources

- **Documentation**: See `docs/` folder
- **Architecture**: `docs/ARCHITECTURE.md`
- **Testing Guide**: `TESTING.md`
- **Contributing**: `CONTRIBUTING.md`
- **Security**: `SECURITY.md`
- **Migration Guide**: `MIGRATION.md`
- **VSCode Extension Guidelines**: https://code.visualstudio.com/api/references/extension-guidelines

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.6.0 | 2025-11-17 | Security improvements, API key migration to Secrets API |
| 0.5.0 | 2025-XX-XX | Previous release |

---

**Last Updated**: 2025-11-17
**Maintained By**: Promptiply Team
**License**: GPL-3.0
