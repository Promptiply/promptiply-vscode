# Promptiply Architecture

This document describes the technical architecture, design decisions, and implementation details of the Promptiply VSCode extension.

## Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Project Structure](#project-structure)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [Storage Strategy](#storage-strategy)
7. [Extension Lifecycle](#extension-lifecycle)
8. [AI Provider Abstraction](#ai-provider-abstraction)
9. [Profile Evolution System](#profile-evolution-system)
10. [UI Architecture](#ui-architecture)
11. [Testing Strategy](#testing-strategy)
12. [Performance Considerations](#performance-considerations)
13. [Security Considerations](#security-considerations)
14. [Future Enhancements](#future-enhancements)

---

## Overview

Promptiply is a VSCode extension that refines user prompts using AI to improve clarity and effectiveness. The architecture is designed for:

- **Modularity**: Easy to extend and maintain
- **Type Safety**: Full TypeScript with strict mode
- **Performance**: Minimal impact on VSCode performance
- **Reliability**: Graceful error handling and fallbacks
- **Extensibility**: Easy to add new AI providers and features

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        VSCode Extension                       │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    Extension Host                       │  │
│  │                   (extension.ts)                        │  │
│  │                                                          │  │
│  │  • Lifecycle Management                                 │  │
│  │  • Dependency Injection                                 │  │
│  │  • Command Registration                                 │  │
│  │  • Event Coordination                                   │  │
│  └──────────────┬──────────────────┬──────────────────────┘  │
│                 │                  │                          │
│   ┌─────────────▼──────┐   ┌──────▼────────────┐            │
│   │   Command Layer    │   │    UI Layer        │            │
│   │  • RefineCommands  │   │  • StatusBar       │            │
│   │  • ProfileCommands │   │  • WebviewPanel    │            │
│   │  • TemplateCommands│   │  • TreeView        │            │
│   └─────────────┬──────┘   └──────┬────────────┘            │
│                 │                  │                          │
│   ┌─────────────▼──────────────────▼────────────┐            │
│   │            Business Logic Layer               │            │
│   │  ┌────────────────┐  ┌────────────────────┐ │            │
│   │  │ RefinementEngine│  │  ProfileManager    │ │            │
│   │  │                 │  │                    │ │            │
│   │  │ • Orchestrates  │  │ • CRUD Operations  │ │            │
│   │  │ • AI Providers  │  │ • Active Profile   │ │            │
│   │  │ • System Prompt │  │ • Topic Tracking   │ │            │
│   │  │ • Result Parse  │  │ • Import/Export    │ │            │
│   │  └────────┬────────┘  └─────────┬──────────┘ │            │
│   │           │                     │            │            │
│   │  ┌────────▼─────────────────────▼──────────┐ │            │
│   │  │        HistoryManager                    │ │            │
│   │  │        TemplateManager                   │ │            │
│   │  │        ProfileSyncManager                │ │            │
│   │  └───────────────────────────────────────────┘ │            │
│   └───────────────────────┬──────────────────────┘            │
│                           │                                    │
│   ┌───────────────────────▼──────────────────────┐            │
│   │           AI Provider Layer                   │            │
│   │                                                │            │
│   │  ┌──────────┐ ┌──────────┐ ┌────────────┐   │            │
│   │  │ VSCode LM│ │  Ollama  │ │   OpenAI   │   │            │
│   │  │          │ │          │ │            │   │            │
│   │  │ • Copilot│ │ • Local  │ │ • Cloud    │   │            │
│   │  │ • Free*  │ │ • Free   │ │ • Paid     │   │            │
│   │  └──────────┘ └──────────┘ └────────────┘   │            │
│   │                                                │            │
│   │  ┌──────────┐                                 │            │
│   │  │Anthropic │                                 │            │
│   │  │          │                                 │            │
│   │  │ • Claude │                                 │            │
│   │  │ • Paid   │                                 │            │
│   │  └──────────┘                                 │            │
│   └───────────────────────────────────────────────┘            │
│                                                                │
│   ┌────────────────────────────────────────────────────────┐  │
│   │                  Storage Layer                         │  │
│   │                                                          │  │
│   │  • VSCode GlobalState (JSON serialization)             │  │
│   │  • File System (for sync, import/export)               │  │
│   └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Design Principles

### 1. Separation of Concerns

Each module has a single, well-defined responsibility:

- **Commands**: User interaction entry points
- **Managers**: Business logic and state management
- **UI**: Presentation and user feedback
- **Providers**: External service integration

### 2. Dependency Injection

Components receive dependencies through constructor injection:

```typescript
class RefineCommands {
  constructor(
    private engine: RefinementEngine,
    private profileManager: ProfileManager,
    private historyManager: HistoryManager
  ) {}
}
```

**Benefits:**
- Testability (easy to mock dependencies)
- Flexibility (swap implementations)
- Clear dependencies (explicit in constructor)

### 3. Immutability Where Possible

- Profile data is treated as immutable
- Updates create new copies
- Reduces bugs from unexpected mutations

### 4. Error Handling

Every operation that can fail has error handling:

```typescript
try {
  const result = await this.engine.refine(prompt);
  return result;
} catch (error) {
  vscode.window.showErrorMessage(`Refinement failed: ${error.message}`);
  return undefined;
}
```

**Strategy:**
- Catch errors at boundaries
- Log for debugging
- Show user-friendly messages
- Provide fallbacks when possible

### 5. TypeScript Strictness

- `strict: true` in tsconfig.json
- No `any` types without explicit annotation
- Full type coverage for public APIs

---

## Project Structure

```
promptiply-vscode/
├── .github/                      # GitHub Actions workflows
│   ├── workflows/
│   │   ├── ci.yml                # CI tests
│   │   ├── release.yml           # Release automation
│   │   ├── codeql.yml            # Security scanning
│   │   └── ...
│   ├── ISSUE_TEMPLATE/           # Issue templates
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml
│
├── docs/                         # Documentation
│   ├── USER_GUIDE.md
│   ├── API.md
│   └── ARCHITECTURE.md           # This file
│
├── src/                          # Source code
│   ├── extension.ts              # Entry point
│   │
│   ├── commands/                 # Command implementations
│   │   ├── refine.ts             # Refinement commands
│   │   ├── profiles.ts           # Profile management
│   │   └── templates.ts          # Template commands
│   │
│   ├── profiles/                 # Profile system
│   │   ├── manager.ts            # CRUD operations
│   │   ├── types.ts              # Type definitions
│   │   ├── builtinProfiles.ts    # Default profiles
│   │   ├── defaults.ts           # Defaults config
│   │   ├── sync.ts               # Cross-device sync
│   │   ├── recommender.ts        # Topic recommendations
│   │   └── recommendationLearning.ts
│   │
│   ├── refinement/               # Refinement engine
│   │   ├── engine.ts             # Core orchestration
│   │   ├── systemPrompt.ts       # Prompt building
│   │   └── modes/                # AI provider integrations
│   │       ├── vscodeLM.ts       # VSCode LM (Copilot)
│   │       ├── ollama.ts         # Ollama (local)
│   │       ├── openai.ts         # OpenAI API
│   │       └── anthropic.ts      # Anthropic API
│   │
│   ├── history/                  # History tracking
│   │   ├── manager.ts            # CRUD for history
│   │   ├── types.ts              # History types
│   │   └── treeViewProvider.ts   # TreeView UI
│   │
│   ├── templates/                # Template system
│   │   ├── manager.ts            # Template CRUD
│   │   ├── types.ts              # Template types
│   │   └── defaults.ts           # Built-in templates
│   │
│   ├── ui/                       # UI components
│   │   ├── statusBar.ts          # Status bar item
│   │   ├── syncStatusBar.ts      # Sync status
│   │   └── webviewPanel.ts       # Webview manager
│   │
│   ├── chat/                     # Chat integration
│   │   └── participant.ts        # @promptiply participant
│   │
│   └── test/                     # Tests
│       ├── runTest.ts            # Test runner
│       └── suite/
│           ├── index.ts          # Suite loader
│           ├── extension.test.ts # Extension tests
│           └── profiles.test.ts  # Profile tests
│
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript config
├── webpack.config.js             # Build config
├── .eslintrc.json                # Linting rules
├── CHANGELOG.md                  # Version history
├── CONTRIBUTING.md               # Contribution guide
├── CODE_OF_CONDUCT.md
├── SECURITY.md
└── README.md
```

### File Naming Conventions

- **Managers**: `*Manager.ts` (e.g., `profileManager.ts`)
- **Commands**: `*.ts` in `commands/` (e.g., `refine.ts`)
- **Types**: `types.ts` in each module
- **Tests**: `*.test.ts` in `test/suite/`

---

## Core Components

### Extension Host (`extension.ts`)

The main entry point that coordinates all components.

**Responsibilities:**
- Initialize all managers
- Register commands
- Set up UI components
- Handle lifecycle events
- Coordinate between modules

**Key Design Decisions:**

1. **Eager Initialization**: All components initialized at activation for predictable behavior
2. **Single Extension Context**: Passed to all components needing persistence
3. **Centralized Command Registration**: All commands registered in one place

### Profile Manager (`profiles/manager.ts`)

Manages user profiles and their evolution.

**State Management:**
```typescript
private profiles: Profile[] = [];
private activeProfileId: string | undefined;
```

**Persistence:**
- Stored in VSCode GlobalState
- JSON serialization
- Atomic updates (read-modify-write)

**Topic Tracking Algorithm:**

```
Score = (Frequency * 0.4) + (Recency * 0.6)

Where:
- Frequency: Normalized count (0-1)
- Recency: Decay function based on days since last use
  Recency = 1 / (1 + days * 0.1)
```

This favors recent topics over old frequent ones.

### Refinement Engine (`refinement/engine.ts`)

Orchestrates the refinement process.

**Process Flow:**

```
1. Load Configuration
   ├─ Mode (vscode-lm, ollama, openai-api, anthropic-api)
   ├─ Economy/Premium setting
   └─ Provider-specific config

2. Get Active Profile
   ├─ Use provided profile, or
   └─ Fetch from ProfileManager

3. Build System Prompt
   ├─ Include profile persona and tone
   ├─ Add style guidelines
   └─ Inject top 5 recent topics

4. Call AI Provider
   ├─ Send system prompt + user prompt
   └─ Handle errors and retries

5. Parse Response
   ├─ Extract refinedPrompt
   ├─ Extract topics array
   └─ Validate JSON structure

6. Update Profile
   ├─ Merge new topics with existing
   └─ Persist updated profile

7. Return Result
   ├─ Original and refined prompts
   ├─ Profile used
   ├─ Topics extracted
   └─ Metadata (timestamp, provider)
```

**Error Handling:**
- Provider connection failures → User-friendly message
- Invalid JSON responses → Retry with explicit format instructions
- Rate limiting → Suggest economy mode or alternative provider

### History Manager (`history/manager.ts`)

Tracks refinement history for user reference.

**Storage:**
- Array of `HistoryEntry` objects
- Limited to 100 most recent entries
- FIFO (First In, First Out) when limit exceeded

**Structure:**
```typescript
interface HistoryEntry {
  id: string;
  originalPrompt: string;
  refinedPrompt: string;
  profile: Profile;
  topics: string[];
  timestamp: string;
  provider: string;
}
```

---

## Data Flow

### Refinement Flow (User Selects Text)

```
User Action: Select text + Ctrl+Shift+R
                    │
                    ▼
         ┌──────────────────────┐
         │  RefineCommands      │
         │  .refineSelection()  │
         └──────────┬───────────┘
                    │
         1. Get selected text from editor
         2. Validate non-empty
                    │
                    ▼
         ┌──────────────────────┐
         │  RefinementEngine    │
         │  .refine(prompt)     │
         └──────────┬───────────┘
                    │
         3. Get active profile
         4. Build system prompt
         5. Call AI provider
         6. Parse response
         7. Update profile topics
                    │
                    ▼
         ┌──────────────────────┐
         │  HistoryManager      │
         │  .addEntry(result)   │
         └──────────┬───────────┘
                    │
         8. Store in history
                    │
                    ▼
         ┌──────────────────────┐
         │  UI Layer            │
         │  Show result         │
         └──────────────────────┘

         9. User chooses output method:
            • Inline replacement
            • Diff view
            • Webview panel
            • Copy to clipboard
```

### Profile Switch Flow

```
User Action: Click status bar or Ctrl+Shift+Alt+P
                    │
                    ▼
         ┌──────────────────────┐
         │  ProfileCommands     │
         │  .switchProfile()    │
         └──────────┬───────────┘
                    │
         1. Get all profiles
         2. Show QuickPick
                    │
                    ▼
         User selects profile
                    │
                    ▼
         ┌──────────────────────┐
         │  ProfileManager      │
         │  .setActiveProfile() │
         └──────────┬───────────┘
                    │
         3. Update activeProfileId
         4. Persist to storage
                    │
                    ▼
         ┌──────────────────────┐
         │  StatusBarManager    │
         │  .update()           │
         └──────────────────────┘

         5. Update status bar display
```

---

## Storage Strategy

### VSCode GlobalState

**Why GlobalState:**
- Persistent across sessions
- Synced with Settings Sync (if enabled)
- Simple API
- No file system dependencies

**What We Store:**

```typescript
{
  "promptiply.profiles": Profile[],
  "promptiply.activeProfileId": string,
  "promptiply.history": HistoryEntry[],
  "promptiply.templates": Template[]
}
```

**Atomic Updates:**

```typescript
async updateProfiles(updater: (profiles: Profile[]) => Profile[]): Promise<void> {
  const profiles = await this.getProfiles();
  const updated = updater(profiles);
  await this.context.globalState.update('promptiply.profiles', updated);
}
```

This prevents race conditions from concurrent updates.

### File System (Sync)

**Why Files for Sync:**
- Cross-machine sync (Dropbox, Google Drive, etc.)
- Version control friendly (Git)
- Human-readable (JSON)
- Backup capability

**Sync Strategy:**
- User specifies sync file path
- Periodic sync (every 5 minutes if enabled)
- Manual sync on demand
- Merge strategy: Last write wins per profile

---

## Extension Lifecycle

### Activation

```typescript
export async function activate(context: vscode.ExtensionContext) {
  // 1. Initialize core managers
  const profileManager = new ProfileManager(context);
  const historyManager = new HistoryManager(context);
  const templateManager = new TemplateManager(context);
  const engine = new RefinementEngine(profileManager);

  // 2. Initialize command handlers
  const refineCommands = new RefineCommands(engine, profileManager, historyManager);
  const profileCommands = new ProfileCommands(profileManager);
  const templateCommands = new TemplateCommands(templateManager, refineCommands);

  // 3. Initialize UI
  const statusBarManager = new StatusBarManager(profileManager);
  await statusBarManager.initialize();

  // 4. Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('promptiply.refineSelection',
      () => refineCommands.refineSelection()
    ),
    // ... more commands
  );

  // 5. Set up sync if enabled
  const syncConfig = vscode.workspace.getConfiguration('promptiply');
  if (syncConfig.get<boolean>('sync.enabled')) {
    await syncManager.enableSync();
  }

  // 6. Show welcome message (first time only)
  const hasShownWelcome = context.globalState.get('hasShownWelcome', false);
  if (!hasShownWelcome) {
    // ... show welcome
  }
}
```

**Activation Events:**

```json
{
  "activationEvents": [
    "onStartupFinished"
  ]
}
```

- **onStartupFinished**: Activates after VSCode fully loads
- Minimal impact on startup time
- All features available immediately after activation

### Deactivation

```typescript
export function deactivate() {
  // Cleanup handled automatically by VSCode
  // subscriptions in context.subscriptions are disposed
}
```

**Note:** Most cleanup is automatic. Complex cleanup (e.g., closing connections) would go here.

---

## AI Provider Abstraction

### Common Interface

While not formally defined as an interface, all providers follow the same pattern:

```typescript
async function refineWith[Provider](
  prompt: string,
  systemPrompt: string,
  config: ProviderConfig
): Promise<{ refinedPrompt: string; topics: string[] }>
```

### Provider Selection Logic

```typescript
const mode = config.get<string>('mode');
const useEconomy = config.get<boolean>('useEconomyModel');

switch (mode) {
  case 'vscode-lm':
    const family = useEconomy ? 'gpt-3.5-turbo' : 'gpt-4o';
    return await refineWithVSCodeLM(prompt, systemPrompt, { family });

  case 'ollama':
    const model = useEconomy ? 'llama3.2:3b' : 'llama3.1:8b';
    return await refineWithOllama(prompt, systemPrompt, { model, endpoint });

  // ... other providers
}
```

### Response Parsing

All providers must return JSON in this format:

```json
{
  "refinedPrompt": "The refined prompt text...",
  "topics": ["React", "TypeScript", "Testing"]
}
```

**Validation:**

```typescript
try {
  const parsed = JSON.parse(response);
  if (!parsed.refinedPrompt || !Array.isArray(parsed.topics)) {
    throw new Error('Invalid response format');
  }
  return parsed;
} catch (error) {
  // Fallback: treat entire response as refined prompt
  return {
    refinedPrompt: response,
    topics: []
  };
}
```

---

## Profile Evolution System

### Topic Extraction

Topics are extracted from the refined prompt (not the original) because:
- Refined prompts are more specific
- Topics are more clearly defined
- Better signal for learning

### Scoring Algorithm

```typescript
function scoreTopics(topics: TopicEntry[]): TopicEntry[] {
  const now = Date.now();

  return topics.map(topic => {
    const daysSinceUse = (now - new Date(topic.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = 1 / (1 + daysSinceUse * 0.1);

    const maxCount = Math.max(...topics.map(t => t.count));
    const frequencyScore = topic.count / maxCount;

    const combinedScore = (frequencyScore * 0.4) + (recencyScore * 0.6);

    return { ...topic, score: combinedScore };
  });
}
```

### Topic Inclusion in Prompts

Top 5 topics by score are included in system prompts:

```
Recent topics you've worked with:
- React (used 15 times, last used 2 days ago)
- TypeScript (used 10 times, last used 1 day ago)
- Testing (used 8 times, last used 3 days ago)
- Authentication (used 5 times, last used 1 week ago)
- API Design (used 3 times, last used 2 weeks ago)
```

This provides context without overwhelming the prompt.

---

## UI Architecture

### Status Bar

Shows active profile and mode.

**Design:**
- Always visible (unless hidden by user)
- Click to switch profiles
- Tooltip shows mode (Economy/Premium)
- Updates on profile change or mode toggle

### Webview Panels

Used for rich content display.

**Security:**
- Local resource only
- CSP (Content Security Policy) enabled
- No external scripts

**Features:**
- Dark/light theme support (matches VSCode)
- Syntax highlighting (using `vscode-highlight` class)
- Copy buttons with JavaScript
- Responsive layout

**Communication:**

```typescript
// Extension → Webview
webview.postMessage({ command: 'update', data: result });

// Webview → Extension
webview.onDidReceiveMessage(message => {
  if (message.command === 'copy') {
    vscode.env.clipboard.writeText(message.text);
  }
});
```

### Tree View (History)

Displays refinement history.

**Virtual Rendering:**
- Only visible items are rendered
- Efficient for large histories
- Built-in scrolling

**Actions:**
- Click to view details
- Context menu to delete

---

## Testing Strategy

### Unit Tests

**Coverage:**
- Profile validation
- Topic scoring algorithm
- Data structure integrity

**Framework:** Mocha with TDD interface

### Integration Tests

**Coverage:**
- Extension activation
- Command registration
- End-to-end refinement flow (mocked AI)

**Environment:** VSCode Test instance

### Manual Testing

**Checklist:**
- All commands work
- UI updates correctly
- Error messages are helpful
- Performance is acceptable

### CI/CD Testing

**Platforms:** Ubuntu, Windows, macOS
**Node Versions:** 18.x, 20.x
**Total Combinations:** 6 (3 OS × 2 Node)

---

## Performance Considerations

### Startup Time

- **Target**: < 50ms activation time
- **Achieved**: ~30ms (measured on average hardware)

**Optimizations:**
- Lazy loading where possible
- Minimal work in activate()
- Async initialization

### Memory Usage

**Baseline:** ~10MB
**Per Profile:** ~10KB
**Per History Entry:** ~2KB

**Limits:**
- Profiles: Unlimited (typically < 20)
- History: 100 entries max
- Templates: Unlimited (typically < 50)

### Network Efficiency

**VSCode LM / Ollama:**
- Streaming not currently used
- Future: Implement streaming for faster perceived performance

**API Providers:**
- Single request per refinement
- No polling or webhooks
- Timeout: 30 seconds

---

## Security Considerations

### API Keys

**Current Storage:** VSCode settings (plain text)

**Risks:**
- Visible in settings file
- Synced with Settings Sync

**Mitigation:**
- Warn users in documentation
- Future: Use VSCode secrets API (requires VSCode 1.63+)

### Webview Security

**CSP Policy:**
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none';
               script-src 'nonce-${nonce}';
               style-src 'unsafe-inline';">
```

**Benefits:**
- No external resources
- No inline scripts (except with nonce)
- XSS protection

### AI Provider Trust

**Risks:**
- Prompts sent to external services
- Potential data leakage

**Mitigation:**
- Ollama mode for complete privacy
- Clear documentation of data flow
- User choice in provider

---

## Future Enhancements

### Short Term (Next 3 months)

1. **Secrets API Integration**
   - Secure storage for API keys
   - Better user experience

2. **Streaming Responses**
   - Show refinement in progress
   - Faster perceived performance

3. **Profile Sharing**
   - Public profile marketplace
   - Import from URL

4. **Enhanced Topic Visualization**
   - View topic graph
   - Topic trend analysis

### Medium Term (3-6 months)

1. **Multi-Language Support**
   - Internationalization (i18n)
   - Start with Spanish, French, German

2. **Custom AI Provider Support**
   - User-defined API endpoints
   - Custom response parsing

3. **Team Sync**
   - Real-time profile sync across team
   - Conflict resolution UI

4. **Performance Analytics**
   - Track refinement quality
   - A/B test profiles

### Long Term (6-12 months)

1. **AI-Powered Profile Suggestions**
   - Auto-create profiles based on usage
   - Suggest profile improvements

2. **Integration with Other Extensions**
   - Public API for other extensions
   - Webhook support

3. **Advanced History Features**
   - Search and filter history
   - Export to different formats
   - History analytics

4. **Enterprise Features**
   - SSO integration
   - Audit logs
   - Custom deployment options

---

## Contributing to Architecture

When making architectural changes:

1. **Document First**
   - Update this file
   - Update API.md if needed

2. **Maintain Principles**
   - Follow existing patterns
   - Keep separation of concerns

3. **Consider Impact**
   - Performance implications
   - Breaking changes
   - Migration path for users

4. **Get Feedback**
   - Open GitHub issue for discussion
   - Tag with `architecture` label

---

*Last updated: November 2025*
