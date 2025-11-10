# Test Suite

This directory contains the test suite for the Promptiply VSCode extension.

## Structure

```
src/test/
├── runTest.ts           # Test runner entry point
├── suite/
│   ├── index.ts         # Mocha test suite loader
│   ├── extension.test.ts # Extension activation tests
│   └── profiles.test.ts  # Profile type tests
└── README.md            # This file
```

## Running Tests

### Run all tests
```bash
npm test
```

This will:
1. Compile TypeScript tests (`npm run compile-tests`)
2. Compile the extension (`npm run compile`)
3. Run linter (`npm run lint`)
4. Launch VSCode test instance and run tests

### Watch mode (for development)
```bash
npm run watch-tests
```

### Run sync tests separately
```bash
node test-sync.js
```

## Writing Tests

Tests use Mocha with the TDD interface and run inside a VSCode instance.

### Example Test

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('My Test Suite', () => {
    test('My test case', () => {
        assert.strictEqual(1 + 1, 2);
    });

    test('Extension test', async () => {
        const ext = vscode.extensions.getExtension('promptiply.promptiply');
        assert.ok(ext);
        await ext?.activate();
        assert.strictEqual(ext?.isActive, true);
    });
});
```

## Test Categories

### Extension Tests (`extension.test.ts`)
- Extension presence and activation
- Command registration
- Basic functionality

### Profile Tests (`profiles.test.ts`)
- Profile data structure validation
- Profile ID format validation
- Profile field requirements

### Sync Tests (`../../test-sync.js`)
- Profile synchronization
- Import/export functionality
- File format validation

## CI/CD

Tests run automatically on:
- Every push to `main` or `develop` branches
- Every pull request
- Release workflow

The CI runs tests on:
- Ubuntu, Windows, macOS
- Node 18.x and 20.x

## Adding New Tests

1. Create a new file in `src/test/suite/` with `.test.ts` extension
2. Import necessary modules
3. Use `suite()` and `test()` functions
4. Tests will be automatically discovered and run

## Debugging Tests

1. Open the test file in VSCode
2. Set breakpoints
3. Press F5 to launch Extension Development Host
4. Or use "Debug: Start Debugging" from Command Palette

## Notes

- Tests run in an isolated VSCode instance
- Extension is loaded before tests run
- Tests timeout after 20 seconds (configurable)
- Use `--disable-extensions` to test without other extensions
