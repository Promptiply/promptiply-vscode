# Contributing to Promptiply VSCode Extension

First off, thank you for considering contributing to Promptiply! It's people like you that make Promptiply such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How Can I Contribute?](#how-can-i-contribute)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- VSCode 1.85.0 or later
- Git

### Development Setup

1. **Fork the repository**
   ```bash
   # Click the 'Fork' button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/promptiply-vscode.git
   cd promptiply-vscode
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/Promptiply/promptiply-vscode.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Build the extension**
   ```bash
   npm run compile
   ```

6. **Run tests**
   ```bash
   npm test
   node test-sync.js
   ```

7. **Open in VSCode and start debugging**
   ```bash
   code .
   ```
   Press `F5` to launch the Extension Development Host

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- A clear and descriptive title
- Detailed steps to reproduce the issue
- Expected vs actual behavior
- VSCode version and OS
- Extension version
- Relevant logs (View > Output > Promptiply)
- Screenshots if applicable

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.yml).

### Suggesting Features

Feature suggestions are welcome! Please use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.yml) and include:

- Clear use case and benefits
- Detailed description of the proposed feature
- Any potential implementation ideas
- Consider sync compatibility if applicable

### Pull Requests

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**
   - Write clear, commented code
   - Follow the style guidelines
   - Add/update tests as needed
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm run compile
   npm test
   node test-sync.js
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Use the PR template
   - Link related issues
   - Provide detailed description
   - Include screenshots/GIFs if applicable

## Style Guidelines

### TypeScript Code Style

- Use TypeScript for all code
- Follow existing code style (ESLint configuration)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and small
- Use async/await over promises where possible

```typescript
/**
 * Example of good function documentation
 * @param profileId The unique identifier of the profile
 * @returns The profile object or undefined if not found
 */
async function getProfile(profileId: string): Promise<Profile | undefined> {
    // Implementation
}
```

### File Organization

```
src/
├── profiles/          # Profile management
├── recommendations/   # Recommendation system
├── sync/             # Sync functionality
├── chat/             # Chat participant
├── ui/               # UI components
├── utils/            # Utilities
└── extension.ts      # Entry point
```

### Naming Conventions

- **Files**: kebab-case (`profile-manager.ts`)
- **Classes**: PascalCase (`ProfileManager`)
- **Functions**: camelCase (`getProfile`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_PROFILE_ID`)
- **Interfaces**: PascalCase with 'I' prefix optional (`Profile` or `IProfile`)

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples
```bash
feat(recommendations): add machine learning model
fix(sync): resolve file watch race condition
docs(readme): update installation instructions
test(profiles): add tests for profile evolution
```

### Scope Guidelines
- `profiles`: Profile management
- `recommendations`: Recommendation system
- `sync`: Synchronization
- `chat`: Chat integration
- `ui`: User interface
- `config`: Configuration

## Pull Request Process

1. **Before submitting**
   - Ensure all tests pass
   - Update documentation
   - Follow style guidelines
   - Squash commits if needed
   - Rebase on latest main

2. **PR Requirements**
   - Fill out the PR template completely
   - Link related issues
   - Add screenshots for UI changes
   - Ensure CI checks pass
   - Get at least one approval

3. **Review Process**
   - Maintainers will review your PR
   - Address feedback promptly
   - Keep the PR scope focused
   - Be patient and respectful

4. **After Merge**
   - Delete your feature branch
   - Update your fork
   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run sync tests
node test-sync.js

# Run with coverage (if configured)
npm run test:coverage

# Watch mode during development
npm run test:watch
```

### Writing Tests

- Write tests for new features
- Update tests for bug fixes
- Aim for high coverage
- Use descriptive test names
- Test edge cases

```typescript
describe('ProfileManager', () => {
    it('should create a new profile with default values', async () => {
        const profile = await profileManager.createProfile('Test Profile');
        expect(profile.name).toBe('Test Profile');
        expect(profile.usageCount).toBe(0);
    });
});
```

### Manual Testing

See [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) for detailed testing scenarios, especially for sync functionality.

## Sync Compatibility

If your changes affect the sync functionality:

1. **Test with Chrome Extension**
   - Install the Chrome extension
   - Test bidirectional sync
   - Verify merge conflict resolution

2. **Maintain Format Compatibility**
   - Don't break the sync file format: `{list: Profile[], activeProfileId: string | null}`
   - Update sync documentation if format changes
   - Consider migration paths for breaking changes

3. **Update Documentation**
   - Update [docs/sync-integration.md](docs/sync-integration.md)
   - Add migration notes if needed
   - Update CHANGELOG.md

## Documentation

- Update README.md for user-facing changes
- Update inline code comments
- Update docs/ for technical changes
- Update CHANGELOG.md
- Keep documentation clear and concise

## Need Help?

- 💬 [GitHub Discussions](https://github.com/Promptiply/promptiply-vscode/discussions)
- 🐛 [Report an Issue](https://github.com/Promptiply/promptiply-vscode/issues)
- 📧 Contact maintainers

## Recognition

Contributors will be recognized in:
- CHANGELOG.md (for significant contributions)
- GitHub contributors page
- Release notes

Thank you for contributing to Promptiply! 🚀
