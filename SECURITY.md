# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.5.x   | :white_check_mark: |
| < 0.5   | :x:                |

## Reporting a Vulnerability

The Promptiply team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them through one of the following methods:

1. **GitHub Security Advisories** (Preferred)
   - Go to the [Security tab](https://github.com/Promptiply/promptiply-vscode/security/advisories/new)
   - Click "Report a vulnerability"
   - Provide details about the vulnerability

2. **Email**
   - Contact the maintainers through GitHub
   - Use the subject line: "[SECURITY] Vulnerability Report"
   - Include detailed information about the vulnerability

### What to Include in Your Report

Please include as much of the following information as possible:

- Type of vulnerability (e.g., XSS, SQL injection, command injection)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it
- Any potential mitigations you've identified

### What to Expect

- **Initial Response**: Within 48 hours, we'll acknowledge receipt of your report
- **Status Updates**: We'll keep you informed about our progress at least every 5 business days
- **Validation**: We'll work to validate the issue and determine its severity
- **Fix Development**: Once confirmed, we'll develop a fix as quickly as possible
- **Disclosure**: We'll coordinate the disclosure timeline with you

### Our Commitment

- We will respond to your report promptly
- We will keep you informed throughout the process
- We will credit you (if desired) when we disclose the vulnerability
- We will not take legal action against researchers who:
  - Follow this policy
  - Act in good faith
  - Don't access or modify user data without permission
  - Don't perform attacks that could harm our users

## Security Best Practices

### For Users

1. **Keep Updated**
   - Always use the latest version of the extension
   - Enable auto-updates in VSCode

2. **Sync File Security**
   - The sync file (`~/.promptiply-profiles.json`) contains your profiles
   - This file is stored locally on your machine
   - Ensure appropriate file permissions: `chmod 600 ~/.promptiply-profiles.json`
   - Be cautious when sharing sync files

3. **Profile Data**
   - Profiles may contain prompt templates and instructions
   - Review profile content before importing from unknown sources
   - Don't include sensitive information in profile descriptions

4. **Configuration**
   - Review extension settings regularly
   - Only enable features you need
   - Be cautious with custom profile recommendations

### For Developers

1. **Code Review**
   - All code changes undergo review
   - Security-sensitive changes require extra scrutiny
   - Follow secure coding guidelines

2. **Dependencies**
   - Regularly update dependencies
   - Use `npm audit` to check for vulnerabilities
   - Review dependency security advisories

3. **Testing**
   - Include security tests in test suites
   - Test input validation and sanitization
   - Verify file operation security

4. **Data Handling**
   - Minimize data collection
   - Validate all user inputs
   - Use secure file operations
   - Implement proper error handling

## Known Security Considerations

### File System Access

The extension requires file system access for:
- Reading/writing the sync file at `~/.promptiply-profiles.json`
- Storing state in VSCode's global storage

**Mitigations:**
- File paths are validated
- File operations use VSCode's secure APIs
- Sync file location is fixed (not user-configurable)

### Profile Import/Export

Users can import profiles from external sources.

**Mitigations:**
- Profile data is validated against a strict schema
- No code execution from profile data
- Profile content is treated as data, not code

### Cross-Extension Communication

The extension syncs with the Chrome extension via a shared file.

**Mitigations:**
- Sync file format is strictly validated
- Malformed data is rejected
- File watching uses debouncing to prevent DoS

## Security Update Process

When a security vulnerability is identified:

1. **Assessment**: Evaluate severity using CVSS
2. **Fix Development**: Develop and test the fix
3. **Notification**: Notify users if action is required
4. **Release**: Release patch as quickly as possible
5. **Disclosure**: Publish security advisory after fix is available

### Severity Levels

- **Critical**: Immediate fix required (remote code execution, data breach)
- **High**: Fix within 7 days (privilege escalation, authentication bypass)
- **Medium**: Fix within 30 days (XSS, CSRF)
- **Low**: Fix in next release (information disclosure, minor issues)

## Third-Party Dependencies

We monitor our dependencies for security vulnerabilities:

- Regular `npm audit` runs
- Automated dependency updates (Dependabot)
- Review of dependency security advisories

Current dependencies are listed in `package.json`.

## Security Tools

We use the following tools to maintain security:

- **CodeQL**: Automated security scanning
- **npm audit**: Dependency vulnerability scanning
- **ESLint**: Static code analysis with security rules
- **Manual Review**: All code changes are reviewed

## Compliance

This project follows:

- OWASP Top 10 security best practices
- VSCode Extension Security Guidelines
- Secure coding standards
- Regular security assessments

## Recognition

We appreciate security researchers who help keep Promptiply secure. With your permission, we will:

- Credit you in the security advisory
- Thank you in the CHANGELOG
- List you in our security acknowledgments

## Questions?

If you have questions about this security policy, please:

- Open a [GitHub Discussion](https://github.com/Promptiply/promptiply-vscode/discussions)
- Contact the maintainers through GitHub

Thank you for helping keep Promptiply and our users safe!
