#!/usr/bin/env node

/**
 * Pre-release validation script
 * Checks for common issues before publishing to marketplace
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const checks = [];
let hasErrors = false;
let hasWarnings = false;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function check(name, fn) {
  checks.push({ name, fn });
}

function error(message) {
  log(`  ✗ ${message}`, colors.red);
  hasErrors = true;
}

function warning(message) {
  log(`  ⚠ ${message}`, colors.yellow);
  hasWarnings = true;
}

function success(message) {
  log(`  ✓ ${message}`, colors.green);
}

function info(message) {
  log(`  ℹ ${message}`, colors.blue);
}

// Check 1: package.json exists and is valid
check('package.json validation', () => {
  const pkgPath = path.join(__dirname, '..', 'package.json');

  if (!fs.existsSync(pkgPath)) {
    error('package.json not found');
    return;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    success('package.json exists and is valid JSON');

    // Check required fields
    const requiredFields = ['name', 'displayName', 'description', 'version', 'publisher', 'engines', 'main'];
    const missingFields = requiredFields.filter(field => !pkg[field]);

    if (missingFields.length > 0) {
      error(`Missing required fields: ${missingFields.join(', ')}`);
    } else {
      success('All required fields present');
    }

    // Check version format
    const versionRegex = /^\d+\.\d+\.\d+(-[a-z]+\.\d+)?$/;
    if (!versionRegex.test(pkg.version)) {
      error(`Invalid version format: ${pkg.version}`);
    } else {
      success(`Version format valid: ${pkg.version}`);
    }

    // Check icon
    if (pkg.icon) {
      const iconPath = path.join(__dirname, '..', pkg.icon);
      if (fs.existsSync(iconPath)) {
        success(`Icon found: ${pkg.icon}`);
      } else {
        error(`Icon not found: ${pkg.icon}`);
      }
    } else {
      warning('No icon specified');
    }

    // Check license
    if (pkg.license) {
      success(`License: ${pkg.license}`);
      const licensePath = path.join(__dirname, '..', 'LICENSE');
      if (!fs.existsSync(licensePath)) {
        warning('LICENSE file not found');
      }
    } else {
      warning('No license specified');
    }

    // Check repository
    if (pkg.repository && pkg.repository.url) {
      success(`Repository: ${pkg.repository.url}`);
    } else {
      warning('No repository URL specified');
    }

    // Check keywords
    if (pkg.keywords && pkg.keywords.length > 0) {
      success(`Keywords: ${pkg.keywords.length} keywords`);
      if (pkg.keywords.length > 20) {
        warning('More than 20 keywords (may be excessive)');
      }
    } else {
      warning('No keywords specified (reduces discoverability)');
    }

  } catch (err) {
    error(`Failed to parse package.json: ${err.message}`);
  }
});

// Check 2: README.md exists and has content
check('README.md validation', () => {
  const readmePath = path.join(__dirname, '..', 'README.md');

  if (!fs.existsSync(readmePath)) {
    error('README.md not found');
    return;
  }

  const content = fs.readFileSync(readmePath, 'utf8');
  success('README.md exists');

  if (content.length < 500) {
    warning('README.md seems very short');
  } else {
    success(`README.md has ${content.length} characters`);
  }

  // Check for common sections
  const sections = ['Features', 'Installation', 'Usage', 'Configuration'];
  sections.forEach(section => {
    if (content.toLowerCase().includes(section.toLowerCase())) {
      success(`Has ${section} section`);
    } else {
      info(`Consider adding ${section} section`);
    }
  });
});

// Check 3: CHANGELOG.md exists and is up to date
check('CHANGELOG.md validation', () => {
  const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');

  if (!fs.existsSync(changelogPath)) {
    warning('CHANGELOG.md not found');
    return;
  }

  success('CHANGELOG.md exists');

  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const changelog = fs.readFileSync(changelogPath, 'utf8');

    if (changelog.includes(`[${pkg.version}]`)) {
      success(`CHANGELOG has entry for version ${pkg.version}`);
    } else {
      warning(`CHANGELOG missing entry for version ${pkg.version}`);
    }
  } catch (err) {
    warning('Could not verify CHANGELOG version');
  }
});

// Check 4: Build files exist
check('Build artifacts', () => {
  const distPath = path.join(__dirname, '..', 'dist');

  if (fs.existsSync(distPath)) {
    success('dist/ directory exists');

    const extensionJs = path.join(distPath, 'extension.js');
    if (fs.existsSync(extensionJs)) {
      const stats = fs.statSync(extensionJs);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      success(`extension.js built (${sizeMB} MB)`);

      if (stats.size > 10 * 1024 * 1024) {
        warning('extension.js is larger than 10MB');
      }
    } else {
      error('extension.js not found in dist/');
    }
  } else {
    error('dist/ directory not found - run npm run compile first');
  }
});

// Check 5: .vscodeignore exists
check('.vscodeignore validation', () => {
  const ignorePath = path.join(__dirname, '..', '.vscodeignore');

  if (!fs.existsSync(ignorePath)) {
    warning('.vscodeignore not found');
    return;
  }

  success('.vscodeignore exists');

  const content = fs.readFileSync(ignorePath, 'utf8');
  const shouldIgnore = ['node_modules', 'src', '.vscode', '.github', 'test'];

  shouldIgnore.forEach(pattern => {
    if (content.includes(pattern)) {
      success(`Ignores ${pattern}`);
    } else {
      warning(`Should ignore ${pattern} to reduce package size`);
    }
  });
});

// Check 6: Dependencies audit
check('Dependency security', () => {
  info('Run "npm audit" separately to check for vulnerabilities');
});

// Run all checks
async function runChecks() {
  log('\n=== Promptiply Release Validation ===\n', colors.blue);

  for (const { name, fn } of checks) {
    log(`\n${name}:`, colors.blue);
    try {
      await fn();
    } catch (err) {
      error(`Check failed: ${err.message}`);
    }
  }

  // Summary
  log('\n=== Summary ===\n', colors.blue);

  if (hasErrors) {
    log('✗ Validation FAILED - Fix errors before releasing', colors.red);
    process.exit(1);
  } else if (hasWarnings) {
    log('⚠ Validation passed with warnings - Review before releasing', colors.yellow);
    process.exit(0);
  } else {
    log('✓ Validation PASSED - Ready to release!', colors.green);
    process.exit(0);
  }
}

runChecks();
