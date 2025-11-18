# Promptiply Production Runbook

This document provides operational guidance for deploying, monitoring, and maintaining Promptiply VSCode Extension in production.

## Table of Contents

- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)
- [Performance Optimization](#performance-optimization)
- [Security Considerations](#security-considerations)
- [Emergency Contacts](#emergency-contacts)

---

## Deployment

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- VSCode 1.85.0 or higher
- Access to VSCode Marketplace (for publishing)

### Publishing to VSCode Marketplace

```bash
# 1. Ensure you're on the main branch with latest changes
git checkout main
git pull origin main

# 2. Install dependencies
npm ci

# 3. Run all checks
npm run lint
npm run compile
npm test

# 4. Package the extension
npm run package

# 5. Publish to marketplace (requires vsce)
npx vsce publish

# 6. Tag the release
git tag v$(node -p "require('./package.json').version")
git push origin --tags
```

### Manual Installation (VSIX)

```bash
# Build VSIX file
npx vsce package

# Users can install via:
# - VSCode UI: Extensions → Install from VSIX
# - Command line: code --install-extension promptiply-X.X.X.vsix
```

### CI/CD Pipeline

The GitHub Actions workflow automatically:
1. Runs tests on 3 OSes × 3 Node versions (9 matrix builds)
2. Performs security scanning (CodeQL)
3. Generates code coverage reports
4. Builds and uploads VSIX artifacts
5. Publishes to marketplace on release tags

**Trigger a Release:**
```bash
git tag v0.5.1
git push origin v0.5.1
```

---

## Monitoring

### Key Metrics to Track

1. **Extension Activation Time**
   - Target: < 500ms
   - Monitor via VSCode telemetry

2. **API Response Times**
   - VSCode LM: < 5s
   - OpenAI/Anthropic: < 10s
   - Ollama: < 30s (local)

3. **Error Rates**
   - Target: < 1% of refinement requests
   - Monitor via extension logs

4. **User Engagement**
   - Daily Active Users (DAU)
   - Refinement requests per day
   - Profile switches per session

### Logs and Diagnostics

**User Logs Location:**
- **Windows**: `%APPDATA%\Code\logs`
- **macOS**: `~/Library/Application Support/Code/logs`
- **Linux**: `~/.config/Code/logs`

**Extension Logs:**
```typescript
// Enable debug logging in extension
Logger.setLevel('debug');
```

**VSCode Output Channel:**
```
View → Output → Select "Promptiply" from dropdown
```

### Health Checks

```bash
# Check extension is installed and active
code --list-extensions | grep promptiply

# Check for errors in extension host
code --verbose
```

---

## Troubleshooting

### Common Issues

#### 1. High API Latency

**Symptoms:**
- Refinement requests taking > 30 seconds
- Timeout errors

**Resolution:**
1. Check network connectivity
2. Verify API provider status (status.openai.com, status.anthropic.com)
3. Switch to economy model or different provider
4. Increase timeout in settings (default: 60s)

```typescript
// src/utils/apiResilience.ts
timeout: 120000 // Increase to 120s if needed
```

#### 2. Rate Limiting Errors

**Symptoms:**
- "Rate limit exceeded" errors
- 429 HTTP responses

**Resolution:**
1. Verify rate limiter settings in code
2. Implement exponential backoff (already included)
3. Switch to premium tier for higher limits
4. Use VSCode LM or Ollama instead

```typescript
// Current rate limit: 1 req/sec
const rateLimiter = new RateLimiter(1);

// Adjust if needed:
const rateLimiter = new RateLimiter(0.5); // 1 req every 2 seconds
```

#### 3. Extension Not Activating

**Symptoms:**
- Commands not available
- Status bar not showing

**Resolution:**
1. Check VSCode version (must be >= 1.85.0)
2. Reload window: `Cmd/Ctrl + Shift + P` → "Reload Window"
3. Check for conflicting extensions
4. Review extension logs for errors

#### 4. Invalid API Keys

**Symptoms:**
- 401 Unauthorized errors
- "Invalid API key" messages

**Resolution:**
1. Verify API key format:
   - OpenAI: `sk-...` (51 chars)
   - Anthropic: `sk-ant-...`
2. Check key permissions on provider dashboard
3. Regenerate key if compromised
4. Clear VSCode settings and re-enter key

#### 5. Empty or Malformed Responses

**Symptoms:**
- Refinement returns gibberish
- JSON parsing errors

**Resolution:**
1. Switch to premium model
2. Update system prompt in `src/refinement/systemPrompt.ts`
3. Check model supports JSON output
4. For Ollama: use 8b+ parameter models

---

## Rollback Procedures

### Emergency Rollback

If a critical issue is discovered in production:

```bash
# 1. Identify last known good version
git tag

# 2. Checkout that version
git checkout v0.4.0

# 3. Rebuild and republish
npm ci
npm run package
npx vsce publish

# 4. Notify users via GitHub release notes
```

### Partial Rollback (Feature Flags)

For feature-specific issues, use configuration to disable problematic features:

```jsonc
// User can disable features via settings
"promptiply.recommendations.enabled": false,
"promptiply.codeLens.enabled": false,
"promptiply.sync.enabled": false
```

---

## Performance Optimization

### Extension Startup

1. **Lazy Loading** (already implemented)
   - Templates loaded on first use
   - Chat participant registered lazily
   - Sync manager initialized on demand

2. **Reduce Bundle Size**
   ```bash
   # Analyze bundle
   npm run package
   ls -lh *.vsix

   # Target: < 1MB
   ```

3. **Profile Webpack**
   ```bash
   webpack --profile --json > stats.json
   # Upload to webpack.github.io/analyse
   ```

### API Performance

1. **Caching**
   - Profile data cached in memory
   - History limited to 100 entries (configurable)

2. **Request Optimization**
   - Rate limiting prevents API overload
   - Exponential backoff on retries
   - 60s timeout with 2 retries

3. **Model Selection**
   - Economy mode uses faster/cheaper models
   - Auto-fallback to economy on timeout

---

## Security Considerations

### API Key Management

**Current State:**
- API keys stored in VSCode settings (plaintext)
- Settings synced across devices if enabled

**Best Practices:**
1. **Never commit API keys** to version control
2. Use environment variables for local development:
   ```bash
   export PROMPTIPLY_OPENAI_KEY="sk-..."
   export PROMPTIPLY_ANTHROPIC_KEY="sk-ant-..."
   ```

3. Rotate keys regularly (quarterly)
4. Use separate keys for dev/staging/prod

### Vulnerability Management

1. **Dependency Scanning**
   ```bash
   npm audit
   npm audit fix
   ```

2. **CodeQL Analysis**
   - Runs automatically on every PR
   - Weekly scheduled scans

3. **Update Dependencies**
   ```bash
   # Check for updates
   npm outdated

   # Update safely
   npm update
   ```

### Data Privacy

- **No telemetry** collected by default
- User prompts never logged to external services
- Profile data stored locally only (unless sync enabled)

---

## Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| Maintainer | GitHub Issues | 24/7 (community) |
| Security | security@promptiply.com | Critical issues only |
| VSCode Marketplace | marketplace@microsoft.com | Marketplace issues |

### Incident Response

1. **Critical Bug Discovered**
   - Open GitHub issue with `[CRITICAL]` prefix
   - Tag maintainers
   - Prepare hotfix branch

2. **Security Vulnerability**
   - Email security@promptiply.com
   - Do NOT create public issue
   - Follow responsible disclosure

3. **Marketplace Outage**
   - Check https://status.dev.azure.com
   - Contact marketplace@microsoft.com
   - Notify users via GitHub

---

## Backup and Recovery

### Configuration Backup

```bash
# Export all profiles
Promptiply: Export Profiles → save to cloud storage

# Backup VSCode settings
cp ~/.vscode/settings.json ~/backups/
```

### Data Recovery

```bash
# Profile data location
~/.vscode/globalState/storage.json

# Restore from backup
cp ~/backups/storage.json ~/.vscode/globalState/
```

---

## Maintenance Schedule

| Task | Frequency | Owner |
|------|-----------|-------|
| Dependency updates | Monthly | Maintainers |
| Security audit | Quarterly | Security team |
| Performance review | Quarterly | Maintainers |
| User feedback review | Weekly | Community |
| Documentation updates | As needed | Contributors |

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 0.5.1 | TBD | Added resilience, coverage, security improvements |
| 0.0.1 | Initial | Initial release |

---

## Additional Resources

- [Architecture Documentation](docs/ARCHITECTURE.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [User Guide](docs/USER_GUIDE.md)
- [API Documentation](docs/API.md)
