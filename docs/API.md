# Promptiply API Documentation

This document provides technical documentation for developers who want to understand, extend, or contribute to Promptiply.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Modules](#core-modules)
3. [Extension API](#extension-api)
4. [Profile System](#profile-system)
5. [Refinement Engine](#refinement-engine)
6. [AI Provider Integration](#ai-provider-integration)
7. [Commands](#commands)
8. [UI Components](#ui-components)
9. [Storage & Sync](#storage--sync)
10. [Testing](#testing)
11. [Contributing](#contributing)

---

## Architecture Overview

Promptiply follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│                   Extension Host                     │
│                  (extension.ts)                      │
└───────────────────┬─────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼────────┐
│   Commands     │    │   UI Components │
│  (refine,      │    │  (statusBar,    │
│   profiles,    │    │   webview,      │
│   templates)   │    │   treeView)     │
└───────┬────────┘    └────────┬────────┘
        │                      │
        └──────────┬───────────┘
                   │
        ┌──────────▼──────────┐
        │   Refinement Engine  │
        │     (engine.ts)      │
        └──────────┬───────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐  ┌────────▼────────┐
│ Profile System │  │  AI Providers   │
│  (manager,     │  │  (vscodeLM,     │
│   types,       │  │   ollama,       │
│   sync)        │  │   openai,       │
└────────────────┘  │   anthropic)    │
                    └─────────────────┘
```

### Key Principles

1. **Modularity**: Each component has a single, well-defined responsibility
2. **Dependency Injection**: Components receive dependencies rather than creating them
3. **Type Safety**: Full TypeScript with strict mode enabled
4. **Extensibility**: Easy to add new AI providers, profiles, or commands

---

## Core Modules

### Extension Entry Point (`src/extension.ts`)

The main extension file that coordinates all components.

**Key Functions:**

```typescript
export async function activate(context: vscode.ExtensionContext): Promise<void>
```
- Called when extension activates
- Initializes all managers and UI components
- Registers commands and event listeners
- Sets up profile sync if enabled

```typescript
export function deactivate(): void
```
- Called when extension deactivates
- Cleanup resources

**Dependencies Initialized:**
- `ProfileManager`: Manages user profiles
- `RefinementEngine`: Handles prompt refinement
- `HistoryManager`: Tracks refinement history
- `TemplateManager`: Manages prompt templates
- `StatusBarManager`: Shows active profile in status bar
- `ProfileSyncManager`: Syncs profiles across devices

---

## Extension API

### Exported API

While Promptiply doesn't currently export a public API for other extensions, the architecture supports this. Future versions may expose:

```typescript
interface PromptiplyAPI {
  // Refine a prompt programmatically
  refinePrompt(prompt: string, profileId?: string): Promise<string>;

  // Get available profiles
  getProfiles(): Promise<Profile[]>;

  // Create a new profile
  createProfile(profile: Omit<Profile, 'id'>): Promise<Profile>;

  // Get refinement history
  getHistory(limit?: number): Promise<HistoryEntry[]>;
}
```

To use Promptiply from another extension (future):

```typescript
const promptiply = vscode.extensions.getExtension('promptiply.promptiply');
if (promptiply) {
  const api = await promptiply.activate() as PromptiplyAPI;
  const refined = await api.refinePrompt('make a function that sorts arrays');
}
```

---

## Profile System

Profiles customize how prompts are refined.

### Profile Types (`src/profiles/types.ts`)

```typescript
interface Profile {
  id: string;
  name: string;
  persona: string;           // Who is making the request
  tone: string;              // Communication style
  styleGuidelines: string[]; // Specific preferences
  evolving_profile: EvolvingProfile;
}

interface EvolvingProfile {
  topics: TopicEntry[];      // Tracked topics
  lastUpdated: string;
  usageCount: number;
  lastPrompt: string;
}

interface TopicEntry {
  name: string;
  count: number;             // Frequency
  lastUsed: string;          // Recency
}
```

### ProfileManager (`src/profiles/manager.ts`)

Manages profile CRUD operations and persistence.

**Constructor:**
```typescript
constructor(context: vscode.ExtensionContext)
```

**Key Methods:**

```typescript
async initialize(): Promise<void>
```
- Loads profiles from storage
- Creates default profiles if none exist

```typescript
async getProfiles(): Promise<Profile[]>
```
- Returns all profiles

```typescript
async getActiveProfile(): Promise<Profile>
```
- Returns currently active profile
- Falls back to first profile if none selected

```typescript
async setActiveProfile(profileId: string): Promise<void>
```
- Sets active profile
- Persists selection

```typescript
async createProfile(profile: Omit<Profile, 'id'>): Promise<Profile>
```
- Creates new profile with generated ID
- Saves to storage

```typescript
async updateProfile(profileId: string, updates: Partial<Profile>): Promise<void>
```
- Updates existing profile
- Merges changes

```typescript
async deleteProfile(profileId: string): Promise<void>
```
- Deletes profile
- Cannot delete last profile

```typescript
async importProfiles(profiles: Profile[]): Promise<void>
```
- Imports profiles from JSON
- Merges with existing (no duplicates by ID)

```typescript
async exportProfiles(): Promise<Profile[]>
```
- Exports all profiles to JSON format

```typescript
async updateTopics(profileId: string, topics: string[]): Promise<void>
```
- Updates topic tracking for profile
- Called after each refinement

### Built-in Profiles (`src/profiles/builtinProfiles.ts`)

Default profiles included with the extension:

1. **Technical Writer**
   - Persona: Technical documentation specialist
   - Tone: Clear, educational, step-by-step
   - Guidelines: Plain language, examples, structured

2. **Dev Helper**
   - Persona: Senior software engineer
   - Tone: Professional, detailed, practical
   - Guidelines: Include tests, handle edge cases, TypeScript

3. **Marketing Copy**
   - Persona: Marketing strategist
   - Tone: Engaging, persuasive, benefit-focused
   - Guidelines: Clear value proposition, conversion-oriented

### Profile Sync (`src/profiles/sync.ts`)

Syncs profiles across VSCode instances using a shared JSON file.

**ProfileSyncManager:**

```typescript
async enableSync(): Promise<void>
```
- Enables profile synchronization
- Loads from sync file if exists

```typescript
async disableSync(): Promise<void>
```
- Disables synchronization

```typescript
async syncNow(): Promise<void>
```
- Manually triggers sync
- Merges local and remote profiles

```typescript
getSyncFilePath(): string
```
- Returns current sync file path

```typescript
async setSyncFilePath(path: string): Promise<void>
```
- Changes sync file location
- Re-syncs with new path

**Sync Strategy:**
- **Last write wins** for profile content
- **Merge by ID**: Profiles with same ID are considered the same
- **Conflict resolution**: Most recently updated profile wins

---

## Refinement Engine

The core logic that transforms prompts.

### RefinementEngine (`src/refinement/engine.ts`)

**Constructor:**
```typescript
constructor(profileManager: ProfileManager)
```

**Key Methods:**

```typescript
async refine(
  prompt: string,
  profile?: Profile
): Promise<RefinementResult>
```
- Refines a prompt using specified profile (or active profile)
- Returns refined prompt and extracted topics
- Handles errors gracefully

```typescript
interface RefinementResult {
  originalPrompt: string;
  refinedPrompt: string;
  profile: Profile;
  topics: string[];
  timestamp: string;
  provider: string;
}
```

**Refinement Process:**

1. **Load configuration** (mode, models, API keys)
2. **Get active profile** or use provided profile
3. **Build system prompt** with profile context
4. **Get top topics** from profile evolution
5. **Call AI provider** with prompt and context
6. **Parse response** (expects JSON with refinedPrompt and topics)
7. **Update profile** with new topics
8. **Return result**

### System Prompt (`src/refinement/systemPrompt.ts`)

Generates the system prompt sent to AI providers.

```typescript
export function buildSystemPrompt(
  profile: Profile,
  topTopics: TopicEntry[]
): string
```

**Includes:**
- Profile persona and tone
- Style guidelines
- Top relevant topics (if any)
- Output format instructions (JSON)
- Quality standards

**Example Output:**
```
You are a Technical Documentation Specialist.

Your tone is: Clear, educational, step-by-step

Follow these guidelines:
- Use plain language
- Include practical examples
- Structure information logically
...

Recent topics you've worked with:
- React (used 15 times, last used 2 days ago)
- TypeScript (used 10 times, last used 1 day ago)
...

Output format: JSON with "refinedPrompt" and "topics"
```

---

## AI Provider Integration

Promptiply supports multiple AI providers through a common interface.

### Provider Interface

Each provider implements:

```typescript
interface AIProvider {
  refine(prompt: string, systemPrompt: string): Promise<AIResponse>;
}

interface AIResponse {
  refinedPrompt: string;
  topics: string[];
}
```

### VSCode LM Provider (`src/refinement/modes/vscodeLM.ts`)

Uses VSCode's Language Model API (GitHub Copilot).

**Configuration:**
```json
{
  "promptiply.mode": "vscode-lm",
  "promptiply.vscodeLM.economyFamily": "gpt-3.5-turbo",
  "promptiply.vscodeLM.premiumFamily": "gpt-4o"
}
```

**Implementation:**
```typescript
const models = await vscode.lm.selectChatModels({ family: modelFamily });
const model = models[0];

const messages = [
  vscode.LanguageModelChatMessage.User(systemPrompt),
  vscode.LanguageModelChatMessage.User(prompt)
];

const response = await model.sendRequest(messages, {}, token);
```

### Ollama Provider (`src/refinement/modes/ollama.ts`)

Uses locally-running Ollama for privacy and cost savings.

**Configuration:**
```json
{
  "promptiply.mode": "ollama",
  "promptiply.ollama.endpoint": "http://localhost:11434",
  "promptiply.ollama.economyModel": "llama3.2:3b",
  "promptiply.ollama.premiumModel": "llama3.1:8b"
}
```

**Implementation:**
```typescript
const response = await fetch(`${endpoint}/api/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: modelName,
    prompt: `${systemPrompt}\n\nUser: ${prompt}`,
    stream: false,
    format: 'json'
  })
});
```

### OpenAI Provider (`src/refinement/modes/openai.ts`)

Direct integration with OpenAI API.

**Configuration:**
```json
{
  "promptiply.mode": "openai-api",
  "promptiply.openai.apiKey": "sk-...",
  "promptiply.openai.economyModel": "gpt-5-mini",
  "promptiply.openai.premiumModel": "gpt-5-2025-08-07"
}
```

**Implementation:**
```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' }
  })
});
```

### Anthropic Provider (`src/refinement/modes/anthropic.ts`)

Direct integration with Anthropic (Claude) API.

**Configuration:**
```json
{
  "promptiply.mode": "anthropic-api",
  "promptiply.anthropic.apiKey": "sk-ant-...",
  "promptiply.anthropic.economyModel": "claude-3-5-haiku-20241022",
  "promptiply.anthropic.premiumModel": "claude-3-5-sonnet-20241022"
}
```

**Implementation:**
```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: modelName,
    max_tokens: 4096,
    messages: [
      { role: 'user', content: `${systemPrompt}\n\n${prompt}` }
    ]
  })
});
```

### Adding a New Provider

To add a new AI provider:

1. Create file in `src/refinement/modes/`:
   ```typescript
   // src/refinement/modes/myprovider.ts
   export async function refineWithMyProvider(
     prompt: string,
     systemPrompt: string,
     config: MyProviderConfig
   ): Promise<{ refinedPrompt: string; topics: string[] }> {
     // Implementation
   }
   ```

2. Add configuration interface:
   ```typescript
   interface MyProviderConfig {
     apiKey: string;
     model: string;
     endpoint?: string;
   }
   ```

3. Update `engine.ts` to support new mode:
   ```typescript
   case 'myprovider':
     result = await refineWithMyProvider(prompt, systemPrompt, config);
     break;
   ```

4. Add settings in `package.json`:
   ```json
   "promptiply.myprovider.apiKey": {
     "type": "string",
     "description": "API key for MyProvider"
   }
   ```

---

## Commands

Commands are entry points triggered by user actions.

### RefineCommands (`src/commands/refine.ts`)

Handles all refinement-related commands.

**Constructor:**
```typescript
constructor(
  engine: RefinementEngine,
  profileManager: ProfileManager,
  historyManager: HistoryManager
)
```

**Methods:**

```typescript
async refineSelection(): Promise<void>
```
- Refines selected text in active editor
- Shows output options (inline, webview, diff, copy)

```typescript
async refineFile(): Promise<void>
```
- Refines entire active file content
- Shows output in webview

```typescript
async refineFromClipboard(): Promise<void>
```
- Refines clipboard content
- Shows result in webview with copy button
- Perfect for AI chat integration

```typescript
async refineFromInput(): Promise<void>
```
- Shows input box for prompt
- Refines and shows in webview

### ProfileCommands (`src/commands/profiles.ts`)

Handles profile management commands.

**Methods:**

```typescript
async switchProfile(): Promise<void>
```
- Shows QuickPick with all profiles
- Sets selected profile as active

```typescript
async createProfile(): Promise<void>
```
- Shows multi-step input for profile creation
- Validates inputs
- Creates and activates new profile

```typescript
async deleteProfile(): Promise<void>
```
- Shows QuickPick to select profile
- Confirms deletion
- Prevents deleting last profile

```typescript
async viewProfile(): Promise<void>
```
- Shows profile details in webview
- Displays persona, tone, guidelines, topics

```typescript
async importProfiles(): Promise<void>
```
- Shows file picker
- Loads and merges profiles from JSON

```typescript
async exportProfiles(): Promise<void>
```
- Shows save dialog
- Exports all profiles to JSON

```typescript
async installBuiltInProfile(): Promise<void>
```
- Shows list of built-in profiles
- Installs selected profile

```typescript
async resetToDefaults(): Promise<void>
```
- Confirms action
- Removes all profiles
- Reinstalls built-in profiles

### TemplateCommands (`src/commands/templates.ts`)

Handles prompt template commands.

**Methods:**

```typescript
async useTemplate(): Promise<void>
```
- Shows QuickPick with templates
- Inserts template into active editor

```typescript
async createTemplate(): Promise<void>
```
- Creates template from selection or input
- Saves to template manager

```typescript
async manageTemplates(): Promise<void>
```
- Shows template management UI
- Edit, delete, reorder templates

```typescript
async importTemplates(): Promise<void>
```
- Imports templates from JSON file

```typescript
async exportTemplates(): Promise<void>
```
- Exports templates to JSON file

---

## UI Components

### StatusBarManager (`src/ui/statusBar.ts`)

Displays active profile and mode in status bar.

**Methods:**

```typescript
async initialize(): Promise<void>
```
- Creates status bar items
- Sets initial state

```typescript
async update(): Promise<void>
```
- Updates display with current profile and mode

```typescript
show(): void
hide(): void
```
- Control visibility

### WebviewPanelManager (`src/ui/webviewPanel.ts`)

Creates and manages webview panels for displaying results.

**Methods:**

```typescript
static initialize(context: vscode.ExtensionContext): void
```
- Initializes static instance

```typescript
static showRefinedPrompt(result: RefinementResult): void
```
- Shows refined prompt in webview
- Includes copy button and history link

```typescript
static showHistoryEntry(entry: HistoryEntry): void
```
- Shows history entry in webview
- Displays original, refined, and metadata

```typescript
static showProfileDetails(profile: Profile): void
```
- Shows profile information
- Displays topics and usage stats

**Webview Features:**
- Copy to clipboard buttons
- Syntax highlighting for code
- Responsive layout
- Dark/light theme support

### HistoryTreeViewProvider (`src/history/treeViewProvider.ts`)

Provides tree view for refinement history.

**Methods:**

```typescript
getTreeItem(element: HistoryItem): vscode.TreeItem
```
- Converts history entry to tree item

```typescript
getChildren(element?: HistoryItem): vscode.ProviderResult<HistoryItem[]>
```
- Returns history entries (most recent first)

```typescript
refresh(): void
```
- Refreshes tree view

---

## Storage & Sync

### History Manager (`src/history/manager.ts`)

Tracks refinement history.

**Methods:**

```typescript
async addEntry(result: RefinementResult): Promise<void>
```
- Adds refinement to history
- Limits to 100 most recent entries

```typescript
async getHistory(limit?: number): Promise<HistoryEntry[]>
```
- Returns history entries (most recent first)
- Optional limit parameter

```typescript
async deleteById(id: string): Promise<void>
```
- Removes specific history entry

```typescript
async clear(): Promise<void>
```
- Clears all history

### Storage Keys

Promptiply uses VSCode's `ExtensionContext.globalState` for persistence:

- `promptiply.profiles`: All user profiles
- `promptiply.activeProfileId`: Currently active profile ID
- `promptiply.history`: Refinement history
- `promptiply.templates`: User-created templates

---

## Testing

### Test Infrastructure

**Framework:** Mocha with TDD interface
**Runner:** `@vscode/test-electron`
**Location:** `src/test/`

### Running Tests

```bash
npm test
```

This will:
1. Compile TypeScript (`npm run compile-tests`)
2. Compile extension code (`npm run compile`)
3. Run linter (`npm run lint`)
4. Execute tests in VSCode instance

### Test Suites

**Extension Tests** (`src/test/suite/extension.test.ts`):
- Extension activation
- Command registration
- Basic functionality

**Profile Tests** (`src/test/suite/profiles.test.ts`):
- Profile structure validation
- Topic tracking
- Data integrity

### Writing Tests

Example test:

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('My Test Suite', () => {
  test('Should do something', async () => {
    const result = await myFunction();
    assert.strictEqual(result, expected);
  });
});
```

### CI/CD

Tests run automatically on:
- Every push
- Every pull request
- Across: Ubuntu, Windows, macOS
- With: Node 18.x, 20.x

See `.github/workflows/ci.yml` for configuration.

---

## Contributing

### Development Setup

1. **Clone repository:**
   ```bash
   git clone https://github.com/Promptiply/promptiply-vscode.git
   cd promptiply-vscode
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Open in VSCode:**
   ```bash
   code .
   ```

4. **Start development:**
   - Press `F5` to run extension in debug mode
   - Make changes
   - Reload extension (`Ctrl+R` in Extension Development Host)

### Code Style

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with recommended rules
- **Formatting**: 2 spaces, single quotes, no semicolons (configure your editor)

### Commit Messages

Follow conventional commits:
```
feat: add new AI provider
fix: resolve profile sync issue
docs: update API documentation
test: add profile manager tests
chore: update dependencies
```

### Pull Request Process

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes
4. Run tests (`npm test`)
5. Commit (`git commit -m 'feat: add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open Pull Request

### Areas for Contribution

- **New AI Providers**: Add support for more AI services
- **UI Improvements**: Better webviews, visualizations
- **Profile Features**: Enhanced topic tracking, recommendations
- **Performance**: Optimization opportunities
- **Documentation**: Always room for improvement
- **Tests**: Increase coverage

---

## Useful Resources

- **VSCode Extension API**: https://code.visualstudio.com/api
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **VSCode LM API**: https://code.visualstudio.com/api/extension-guides/language-model

---

*Last updated: November 2025*
