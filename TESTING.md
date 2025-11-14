# Promptiply Testing Guide

This document describes the automated testing setup for the Promptiply VSCode extension.

## Overview

The test suite provides comprehensive coverage of the core functionality:

- **Profile Manager**: Profile CRUD, evolution tracking, import/export
- **History Manager**: Entry management, search, statistics, grouping
- **Template Manager**: Template CRUD, variable substitution, search
- **Profile Sync**: Validation, Chrome extension compatibility
- **Refinement Engine**: Configuration, mode selection, input validation

## Running Tests

### Prerequisites

```bash
npm install
```

### Run All Tests

```bash
npm test
```

This will:
1. Compile TypeScript code
2. Run ESLint
3. Execute all test suites in a VSCode test environment

### Run Tests in Watch Mode

```bash
npm run watch-tests
```

### Run Tests Manually

```bash
# Compile tests
npm run compile-tests

# Run test suite
npm test
```

## Test Structure

```
src/test/
├── helpers/              # Test utilities
│   ├── mockContext.ts   # Mock VSCode extension context
│   └── fixtures.ts      # Test data factories
├── suite/               # Test suites
│   ├── extension.test.ts        # Extension lifecycle tests
│   ├── profiles.test.ts         # Basic profile tests
│   ├── profileManager.test.ts   # Comprehensive profile manager tests
│   ├── historyManager.test.ts   # History manager tests
│   ├── templateManager.test.ts  # Template manager tests
│   ├── profileSync.test.ts      # Profile sync tests
│   └── refinementEngine.test.ts # Refinement engine tests
└── runTest.ts          # Test runner configuration
```

## Test Coverage

### Profile Manager (profileManager.test.ts)
- ✅ Profile CRUD operations (create, read, update, delete)
- ✅ Active profile management
- ✅ Profile evolution (topic tracking, usage count)
- ✅ Import/export functionality
- ✅ Reset to defaults
- ✅ Edge cases and error handling

**Total: 30+ test cases**

### History Manager (historyManager.test.ts)
- ✅ Entry CRUD operations
- ✅ Entry ordering (newest first)
- ✅ Maximum entries limit (100)
- ✅ Grouping by date
- ✅ Search functionality
- ✅ Statistics calculation
- ✅ Token usage tracking

**Total: 25+ test cases**

### Template Manager (templateManager.test.ts)
- ✅ Template CRUD operations
- ✅ Category management
- ✅ Variable substitution
- ✅ Default values
- ✅ Search functionality
- ✅ Import/export
- ✅ ID generation

**Total: 30+ test cases**

### Profile Sync (profileSync.test.ts)
- ✅ Sync file path management
- ✅ Data format validation
- ✅ Chrome extension compatibility
- ✅ Profile evolution in sync
- ✅ Edge cases (special characters, long prompts, many topics)

**Total: 25+ test cases**

### Refinement Engine (refinementEngine.test.ts)
- ✅ Configuration management
- ✅ Input validation
- ✅ Profile integration
- ✅ Mode selection (VSCode LM, Ollama, OpenAI, Anthropic)
- ✅ Economy vs Premium model selection
- ✅ Prompt processing

**Total: 25+ test cases**

## Writing New Tests

### Test File Template

```typescript
import * as assert from 'assert';
import { YourClass } from '../../path/to/class';
import { createMockContext } from '../helpers/mockContext';

suite('Your Test Suite', () => {
    let instance: YourClass;
    let context: any;

    beforeEach(() => {
        context = createMockContext();
        instance = new YourClass(context);
    });

    test('should do something', async () => {
        // Arrange
        const input = 'test';

        // Act
        const result = await instance.method(input);

        // Assert
        assert.strictEqual(result, expected);
    });
});
```

### Using Test Helpers

#### Mock Context
```typescript
import { createMockContext } from '../helpers/mockContext';

const context = createMockContext();
// Now you have a fully functional mock extension context
```

#### Fixtures
```typescript
import { createMockProfile, createMockHistoryEntry } from '../helpers/fixtures';

const profile = createMockProfile({ name: 'Custom Name' });
const entry = createMockHistoryEntry({ mode: 'ollama' });
```

## Continuous Integration

Tests run automatically on:
- Every push to `main`, `develop`, or `claude/**` branches
- Every pull request to `main` or `develop`
- Manual workflow dispatch

### CI Configuration

See `.github/workflows/test.yml` for the GitHub Actions configuration.

The CI pipeline:
1. Runs on Ubuntu, Windows, and macOS
2. Installs dependencies
3. Runs linter
4. Compiles TypeScript
5. Executes all tests
6. Uploads test artifacts

## Test Best Practices

### DO:
- ✅ Write descriptive test names
- ✅ Use `beforeEach` for test setup
- ✅ Test both success and error cases
- ✅ Test edge cases (empty strings, null, undefined)
- ✅ Use assertions that provide clear error messages
- ✅ Keep tests independent and isolated
- ✅ Use mock data from fixtures

### DON'T:
- ❌ Make tests depend on each other
- ❌ Use real API calls or external services
- ❌ Hardcode absolute paths
- ❌ Skip error case testing
- ❌ Write tests that depend on timing (use mocks instead)

## Debugging Tests

### VSCode Debugging

1. Open the test file in VSCode
2. Set breakpoints
3. Press F5 to launch the Extension Development Host
4. The debugger will stop at your breakpoints

### Console Output

Add debug statements:
```typescript
console.log('Debug value:', value);
```

Output will appear in the test runner console.

## Test Timeouts

Default timeout: 20 seconds (configured in `src/test/suite/index.ts`)

To extend timeout for a specific test:
```typescript
test('long running test', async function() {
    this.timeout(60000); // 60 seconds
    // test code
});
```

## Coverage Goals

- **Overall coverage**: 70%+
- **Critical paths** (ProfileManager, RefinementEngine): 95%+
- **Core managers**: 85%+
- **UI components**: 60%+

## Future Improvements

- [ ] Add code coverage reporting
- [ ] Add integration tests for provider modes
- [ ] Add UI/webview tests
- [ ] Add performance benchmarks
- [ ] Add snapshot testing for generated prompts
- [ ] Add mutation testing

## Troubleshooting

### Tests fail to run
```bash
# Clean and rebuild
rm -rf out/
npm run compile-tests
npm test
```

### Extension activation timeout
Increase timeout in test:
```typescript
this.timeout(60000);
```

### Mock context issues
Ensure you're creating a fresh context in `beforeEach`:
```typescript
beforeEach(() => {
    context = createMockContext();
});
```

## Resources

- [VSCode Extension Testing Guide](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [Mocha Documentation](https://mochajs.org/)
- [Node.js Assert API](https://nodejs.org/api/assert.html)

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Add test documentation
4. Update this guide if needed

---

**Total Test Count**: 135+ automated tests covering core functionality
