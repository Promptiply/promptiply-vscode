# Testing GitHub Workflows

This guide explains how to test all the workflows we created for Day 2.

## ✅ Validation Results

All workflow files passed YAML syntax validation:

- ✅ `ci.yml` - Valid
- ✅ `codeql.yml` - Valid
- ✅ `dependency-review.yml` - Valid
- ✅ `labeler.yml` - Valid
- ✅ `release.yml` - Valid
- ✅ `stale.yml` - Valid

All configuration files are valid:

- ✅ `dependabot.yml` - Valid
- ✅ `labeler.yml` - Valid
- ✅ `CODEOWNERS` - 41 lines

## 📋 Workflow Testing Guide

### 1. CI Workflow (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**How to Test:**
```bash
# Option 1: Merge this feature branch to develop (will trigger CI)
git checkout develop
git merge claude/day-two-github-actions-011CUzVdpyDeormsHQpLz8dW
git push origin develop

# Option 2: Create a pull request to main/develop
# Go to GitHub and create a PR from your feature branch
```

**What it tests:**
- Linting (separate job)
- Build on Ubuntu, Windows, macOS
- Test on Node 18.x, 20.x, 22.x, 24.x (12 combinations)
- Compile TypeScript
- Run unit tests
- Run sync tests
- Package extension (only on ubuntu + Node 20)
- Upload VSIX artifact

**Expected duration:** ~10-15 minutes (parallel execution)

---

### 2. Release Workflow (`release.yml`)

**Triggers:**
- Push tag matching `v*` pattern
- Manual trigger via workflow_dispatch

**How to Test (Manual Trigger):**
1. Go to GitHub: **Actions** → **Release** workflow
2. Click **Run workflow**
3. Fill in inputs:
   - Tag: `v0.5.0-test` (use -test to avoid real release)
   - Pre-release: `true`
   - Publish to Marketplace: `false` (for testing)
   - Publish to Open VSX: `false` (for testing)
4. Click **Run workflow**

**How to Test (Tag Push):**
```bash
# Create a test tag (use -test suffix)
git tag v0.5.0-test
git push origin v0.5.0-test

# Later, delete the test tag
git tag -d v0.5.0-test
git push origin :refs/tags/v0.5.0-test
```

**What it tests:**
- Version validation
- Linting
- TypeScript compilation
- Unit tests + sync tests
- VSIX packaging with HaaLeo action
- GitHub release creation
- Git tag creation (manual trigger only)
- Marketplace publishing (if enabled)

**Expected duration:** ~5-10 minutes

---

### 3. CodeQL Security Analysis (`codeql.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Weekly schedule (Monday at midnight)
- Manual trigger via workflow_dispatch

**How to Test (Manual):**
1. Go to GitHub: **Actions** → **CodeQL** workflow
2. Click **Run workflow**
3. Select branch
4. Click **Run workflow**

**What it tests:**
- JavaScript/TypeScript security scanning
- Common vulnerabilities (injection, XSS, etc.)
- Code quality issues

**Expected duration:** ~3-5 minutes

---

### 4. Dependency Review (`dependency-review.yml`)

**Triggers:**
- Pull requests to `main` or `develop` branches only

**How to Test:**
1. Create a pull request from your feature branch to `main` or `develop`
2. Workflow will automatically run
3. Check PR for comments about dependency security

**What it tests:**
- Vulnerable dependencies in changes
- License compliance
- Security advisories

**Expected duration:** ~1-2 minutes

**Note:** Only runs on PRs, not on direct pushes

---

### 5. PR Labeler (`labeler.yml`)

**Triggers:**
- Pull request opened, synchronized, or reopened

**How to Test:**
1. Create a pull request with some file changes
2. Workflow will automatically add labels based on changed files
3. Check PR labels

**Example labels:**
- Changes in `src/profiles/` → adds `profiles` label
- Changes in `*.md` files → adds `documentation` label
- Changes in `.github/workflows/` → adds `ci` label

**Expected duration:** ~30 seconds

---

### 6. Stale Issues and PRs (`stale.yml`)

**Triggers:**
- Daily schedule (midnight UTC)
- Manual trigger via workflow_dispatch

**How to Test (Manual):**
1. Go to GitHub: **Actions** → **Stale Issues and PRs** workflow
2. Click **Run workflow**
3. Select branch
4. Click **Run workflow**

**What it tests:**
- Marks issues stale after 60 days
- Marks PRs stale after 30 days
- Respects exempt labels (pinned, security, bug, etc.)

**Expected duration:** ~1-2 minutes

**Note:** Won't close anything immediately on first run (needs stale period)

---

### 7. Dependabot (Configuration Only)

**Triggers:**
- Weekly schedule (Monday at 9 AM)
- Automatically by GitHub

**How to Test:**
1. Wait for Monday at 9 AM UTC, or
2. Check GitHub **Insights** → **Dependency graph** → **Dependabot**
3. Dependabot will create PRs for outdated dependencies

**What it does:**
- Checks npm dependencies weekly
- Checks GitHub Actions versions weekly
- Creates grouped PRs (dev vs production dependencies)
- Auto-labels PRs with `dependencies` and `automated`

**Note:** First run happens on next scheduled time

---

## 🧪 Quick Test Checklist

### Option 1: Create a Test PR (Recommended)

This will test multiple workflows at once:

```bash
# 1. Make a small change (e.g., add a comment to README)
echo "" >> README.md
echo "<!-- Test comment -->" >> README.md

# 2. Commit and push to a test branch
git checkout -b test-workflows
git add README.md
git commit -m "test: trigger workflows"
git push origin test-workflows

# 3. Create a PR from test-workflows to main or develop
# This will trigger:
# - CI workflow ✅
# - CodeQL workflow ✅
# - Dependency Review ✅
# - PR Labeler ✅
```

### Option 2: Manual Workflow Triggers

For workflows with `workflow_dispatch`:

1. **CodeQL**: Actions → CodeQL → Run workflow
2. **Release**: Actions → Release → Run workflow (use test tag)
3. **Stale**: Actions → Stale Issues and PRs → Run workflow

### Option 3: Tag-Based Release Test

```bash
# Create a test release
git tag v0.5.0-test
git push origin v0.5.0-test

# Watch the Release workflow run
# Visit: https://github.com/Promptiply/promptiply-vscode/actions

# Clean up
git tag -d v0.5.0-test
git push origin :refs/tags/v0.5.0-test
```

---

## 📊 Monitoring Workflows

### View Workflow Runs
```
https://github.com/Promptiply/promptiply-vscode/actions
```

### View Specific Workflow
- CI: https://github.com/Promptiply/promptiply-vscode/actions/workflows/ci.yml
- Release: https://github.com/Promptiply/promptiply-vscode/actions/workflows/release.yml
- CodeQL: https://github.com/Promptiply/promptiply-vscode/actions/workflows/codeql.yml

### Workflow Status Badges

These are now in the README:

```markdown
[![CI](https://github.com/Promptiply/promptiply-vscode/actions/workflows/ci.yml/badge.svg)](https://github.com/Promptiply/promptiply-vscode/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Promptiply/promptiply-vscode/actions/workflows/codeql.yml/badge.svg)](https://github.com/Promptiply/promptiply-vscode/actions/workflows/codeql.yml)
```

---

## 🔍 Debugging Failed Workflows

If a workflow fails:

1. **Check the logs:**
   - Go to Actions → Click on the failed run
   - Expand failed steps to see error messages

2. **Common issues:**
   - Missing secrets (VSCE_TOKEN, OVSX_TOKEN)
   - Node version compatibility
   - Test failures
   - Build errors

3. **Re-run failed jobs:**
   - Click "Re-run failed jobs" in the workflow run

4. **Test locally first:**
   ```bash
   npm ci
   npm run lint
   npm run compile
   npm test
   node test-sync.js
   ```

---

## ✅ Success Criteria

All workflows are working correctly when:

- ✅ CI passes on PRs and pushes to main/develop
- ✅ CodeQL completes without security issues
- ✅ Dependency Review approves PRs
- ✅ PR Labeler adds correct labels
- ✅ Release workflow can create releases
- ✅ Stale workflow runs without errors
- ✅ Dependabot creates update PRs (after first scheduled run)

---

## 🎯 Recommended First Test

**Create a test PR to trigger multiple workflows:**

```bash
# From your feature branch
git checkout claude/day-two-github-actions-011CUzVdpyDeormsHQpLz8dW

# Make sure you're up to date
git pull origin claude/day-two-github-actions-011CUzVdpyDeormsHQpLz8dW

# Push to remote if not already
git push origin claude/day-two-github-actions-011CUzVdpyDeormsHQpLz8dW

# Create PR on GitHub from this branch to main or develop
```

This will trigger:
1. ✅ CI workflow (lint, build, test on all platforms)
2. ✅ CodeQL security scan
3. ✅ Dependency review
4. ✅ PR auto-labeling

Watch the Actions tab to see them run!

---

## 📝 Notes

- **Secrets Required for Full Testing:**
  - `VSCE_TOKEN` - For VSCode Marketplace publishing
  - `OVSX_TOKEN` - For Open VSX publishing
  - `GPG_PRIVATE_KEY` (optional) - For signed tags
  - `GPG_PASSPHRASE` (optional) - For signed tags

- **First-Time Setup:**
  - Dependabot needs to be enabled in repository settings
  - CodeQL needs to be enabled in Security settings
  - Workflow permissions need to be set to read/write

- **Concurrency:**
  - CI: Cancels old runs on new pushes (saves resources)
  - Release: Never cancels (ensures releases complete)
