# Change Log

All notable changes to the "Promptiply" extension will be documented in this file.

## [Unreleased]

### 🔧 Quality Improvements (v0.5.1 Upcoming)

- **Security**: Fixed 5 HIGH severity vulnerabilities in glob dependency
  - Updated glob to 11.1.0 via npm overrides
  - All dependencies now vulnerability-free
- **Testing**: Added comprehensive test suite for API resilience utilities
  - Full coverage of fetchWithResilience (timeout, retry, exponential backoff)
  - Complete RateLimiter tests (throttling, edge cases)
  - 400+ lines of new test coverage
- **Compatibility**: Fixed RefinementEngine constructor for Secrets API integration

## [0.5.0] - 2025-01-17

### 🎉 Major Release - Production Readiness & Smart Recommendations

This is a major feature and stability release focused on production readiness, API resilience, and smart recommendations.

### 🔒 Production Readiness Improvements

- **API Resilience**: Automatic retry with exponential backoff for failed requests
  - 60-second timeout for cloud APIs (OpenAI, Anthropic)
  - 120-second timeout for local models (Ollama)
  - Automatic retry (2x for cloud, 1x for local) with exponential backoff
  - Rate limiting (1 req/sec) to prevent quota exhaustion
- **Code Coverage Tracking**: CI/CD now tracks and reports test coverage
  - c8 coverage tool integration
  - HTML and LCOV reports generated
  - Codecov integration for coverage tracking
- **Correct AI Model Names**: Fixed incorrect model configurations
  - ⚠️ **BREAKING**: OpenAI models corrected (gpt-4o, gpt-4o-mini)
  - ⚠️ **BREAKING**: Anthropic models corrected (claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022)
  - See [MIGRATION.md](MIGRATION.md) for upgrade instructions
- **Enhanced Security**:
  - Better API key security recommendations
  - Improved error messages for authentication issues
  - Rate limiting to prevent accidental quota exhaustion
- **Production Documentation**:
  - [RUNBOOK.md](RUNBOOK.md) - Complete operational guide
  - [MIGRATION.md](MIGRATION.md) - Upgrade and migration instructions
  - Updated README with correct model information

### 🎉 Smart Recommendations & Learning System

This is a major feature release that transforms how you interact with profiles through AI-powered recommendations and learning.

### 🧠 Recommendation Learning System

- **Learns from your choices** - Tracks which profiles you accept or reject
- **Improves over time** - Adjusts confidence scores based on your preferences
- **Keyword tracking** - Remembers which keywords work best for each profile
- **Acceptance rate analytics** - Shows which profiles you use most
- **Automatic feedback collection** - No manual input needed
- **Persistent storage** - Learns across sessions (stores up to 1000 recommendations)

### 🎯 Multi-Profile Recommendations

- **Show top 3 profiles** instead of just one
- **Ranked with medals** - 🥇 Best match, 🥈 Second best, 🥉 Third best
- **Confidence scores** - See how confident the system is (35%+ threshold)
- **Learning-adjusted** - Scores improve based on your history
- **Smart reasons** - Each recommendation explains why it was suggested
- **Better UI** - Clean, organized display with all options visible

### 🔄 Enhanced Browser Extension Integration

- **Compatible sync file format** - Unified format between VSCode and Chrome extensions
- **VSCode sync format support in Chrome** - Chrome extension now imports/exports VSCode sync format
- **Export for VSCode option** - New checkbox in Chrome extension export modal
- **Comprehensive validation** - Both extensions validate sync file integrity
- **Smart merge logic** - Conflict resolution based on profile usage count
- **Detailed sync notifications** - Clear feedback with profile counts and active profile info

### 📊 Sync Status Bar Indicator

- **Visual sync status** - See sync state at a glance in status bar
- **Real-time updates** - Shows "Syncing...", "Synced", or "Error"
- **Click to sync** - Quick access to manual sync
- **Auto-hide when disabled** - Only shows when sync is active
- **Color-coded states** - Error states highlighted in red
- **Spinning icon** - Animated sync indicator during operation
- **Integrated with sync operations** - Automatically updates during export/import/merge

### ⭐ 9 Professional Profiles Pre-Installed

**All users now get 9 professional profiles by default on first install:**

1. **Backend Developer** - Server-side, APIs, databases, microservices
2. **Frontend Developer** - UI/UX, React, Vue, responsive design
3. **DevOps Engineer** - CI/CD, Docker, Kubernetes, cloud infrastructure
4. **Full Stack Developer** - Balanced frontend and backend
5. **Technical Writer** - Documentation, tutorials, explanations
6. **Data Scientist** - ML, data analysis, statistical modeling
7. **Mobile Developer** - iOS, Android, React Native, Flutter
8. **QA Engineer** - Testing, test automation, quality assurance
9. **Security Engineer** - Security, pentesting, secure coding

**Features:**
- **Automatically installed** on first use - no manual setup required!
- Professionally crafted personas and guidelines
- Pre-loaded with relevant topics for each specialty
- Ready to use immediately after install
- Can still manually install/reinstall via Command Palette

### 🎨 UI/UX Improvements

- More informative recommendation displays
- Better feedback when accepting/rejecting profiles
- Clearer sync status messaging
- Professional profile templates interface
- Improved logging for debugging

### 📝 New Commands

- `Promptiply: Install Built-in Profile Template` - Browse and install professional profiles
- `Promptiply: Reset Profiles to Defaults` - Reset to the 9 professional profiles

### 📚 Documentation

- **SYNC_INTEGRATION.md** - Comprehensive guide for profile sync between VSCode and Chrome
  - Step-by-step setup instructions
  - Workflow examples for all sync scenarios
  - Troubleshooting guide
  - Best practices and tips

### 🔧 Technical Improvements

- New `RecommendationLearning` class for tracking feedback
- Enhanced `ProfileRecommender` with learning integration
- New `SyncStatusBarManager` for visual sync indication
- Built-in profiles system with extensible architecture
- Better error handling throughout
- Performance optimizations for recommendation calculations

### 🐛 Bug Fixes

- Fixed sync commands to properly update status bar
- Improved profile selection feedback
- Better handling of recommendation edge cases

## [0.4.3] - 2025-01-09

### AI-Powered Recommendations 🤖

- **💡 Smart Profile Recommendations**: Get intelligent profile suggestions in chat
  - Analyzes your prompt content and suggests the best profile
  - **Waits for your decision** - Shows recommendation and pauses refinement
  - Two options: "Use Profile" or "Skip - Refine without profile"
  - Pattern matching for code, documentation, testing, and marketing prompts
  - Extensive keyword library: Docker, .NET, Python, React, APIs, databases, and more
  - Keyword analysis based on profile personas and style guidelines
  - Historical topic weighting for improved accuracy
  - Shows confidence score and human-readable reason
  - Only shows when confidence is above 35% and no active profile
  - Enable/disable in settings: `promptiply.recommendations.enabled`
  - Debug logging in Output panel (View → Output → "Promptiply")

### Cross-Platform Profile Sync 🔄

- **📁 Browser Extension Sync**: Keep profiles in sync between VSCode and Chrome
  - File-based synchronization using `~/.promptiply-profiles.json`
  - Auto-sync: Watches for changes and updates automatically
  - Manual sync: Three modes (Export, Import, Merge)
  - Smart merge: Uses usage count to determine most recent version
  - Customizable sync path in settings
  - Commands:
    - `Promptiply: Enable Profile Sync` - Turn on auto-sync
    - `Promptiply: Disable Profile Sync` - Turn off auto-sync
    - `Promptiply: Sync Profiles Now` - Manual sync with mode selection
    - `Promptiply: Set Sync File Path` - Change sync file location
  - Settings:
    - `promptiply.sync.enabled` - Auto-sync on/off
    - `promptiply.sync.filePath` - Custom sync file path

### New Files

- `src/profiles/recommender.ts` - AI recommendation engine
- `src/profiles/sync.ts` - Profile synchronization manager

### Improvements

- Better chat integration with smart profile suggestions
- Seamless workflow between VSCode and browser extension
- No manual copying needed for profile sharing
- Profiles stay in sync across platforms automatically

## [0.4.2] - 2025-01-08

### Enhanced Chat Experience 🎨

**Major Improvements to @promptiply chat participant:**

- **📊 Before/After Comparison**: Now shows original and refined prompts side-by-side
  - Word and character counts for both
  - Visual enhancement stats ("+X words, +Y characters")
  - Makes it easy to see the improvement

- **🔄 Quick Actions**: Powerful new buttons after refinement
  - 🚀 **Send Refined to Chat** - Instantly send refined prompt to chat (NO COPYING!)
  - 📋 Copy Refined - Copy the refined prompt
  - 📄 Copy Original - Copy your original prompt
  - 🔄 Refine with Different Profile - Quick profile switching
  - 💎/💰 Try Premium/Economy - Toggle and re-refine instantly
  - ⚙️ Settings - Quick access to configuration

- **⚡ Slash Commands**: New quick commands
  - `@promptiply /help` - Show usage guide
  - `@promptiply /profile` - Choose profile interactively

- **🎯 Better Formatting**: Cleaner, more readable output
  - Clear section separators
  - Better emoji usage for quick scanning
  - Improved metadata display
  - Enhanced error messages with troubleshooting steps

- **🔁 Interactive Workflow**: Click buttons to refine again
  - Switch profiles without leaving chat
  - Toggle economy/premium on the fly
  - No need to retype your prompt

### Example Output

```
@promptiply help me debug this error
```

**Returns:**
- 📝 Original Prompt (with stats)
- ✨ Refined Prompt (with stats)
- 📊 Enhancement stats
- 👤 Profile • ⚙️ Mode • 💰 Economy • 🎯 Tokens
- 🏷️ Detected topics
- Quick action buttons

## [0.4.1] - 2025-01-08

### Chat Participant Integration ⚡

- **🤖 @promptiply Chat Participant**: Refine prompts directly in any VSCode chat!
  - Type `@promptiply <your prompt>` in Copilot Chat or any VSCode chat
  - Get refined prompts instantly without copying/pasting
  - Shows metadata (profile, mode, tokens used, topics)
  - One-click copy button for refined result
  - Automatic history tracking
  - Works seamlessly with existing profile system

## [0.4.0] - 2025-01-08

### Major Features 🎉

- **📜 Refinement History**: Track all your prompt refinements
  - Tree view in sidebar showing history grouped by date
  - Click any entry to view full details in rich webview
  - Delete individual entries or clear all history
  - History persists across VSCode sessions
  - Stores original, refined prompts, profile used, and token usage

- **🎨 Rich Webview Panel**: Beautiful UI for viewing refinements
  - Syntax-highlighted prompt display
  - Shows original vs refined side-by-side
  - Displays reasoning, detected topics, and token usage
  - One-click copy to clipboard
  - Responsive design matching VSCode theme

- **📚 Prompt Templates**: Pre-built templates for common tasks
  - 12 built-in templates across 8 categories
  - Code generation (functions, classes, API endpoints)
  - Documentation (README, API docs)
  - Debugging, testing, refactoring
  - Code review and explanations
  - Create custom templates with variables
  - Import/export template collections
  - Fill template variables interactively

- **👤 Enhanced Profile Management**:
  - Create custom profiles with guided UI
  - View profile stats and evolution
  - Delete unwanted profiles
  - Better profile visualization

### Commands Added

- `Promptiply: Use Template` - Browse and use templates
- `Promptiply: Create Custom Template` - Build your own templates
- `Promptiply: Manage Templates` - View, edit, delete templates
- `Promptiply: Import/Export Templates` - Share templates
- `Promptiply: Create Profile` - Add new refinement profiles
- `Promptiply: Delete Profile` - Remove profiles
- `Promptiply: View Active Profile` - See profile details and stats
- `Promptiply: Show Refinement History` - Open history sidebar
- `Promptiply: Clear History` - Remove all history

### UI Improvements

- New sidebar view for refinement history
- Activity bar icon for quick access to history
- Context menu actions in history tree
- Refresh and clear buttons in history view
- Webview panel for rich refinement display

### Technical

- Automatic history tracking for all refinements
- History storage with 100 entry limit
- Template variable substitution system
- Improved type definitions for RefinementResult
- Better error handling throughout

## [0.3.1] - 2025-01-08

### GPT-5 Support 🚀

- 🤖 **Updated to GPT-5 Models**: Defaults now use the latest GPT-5 family
  - Economy: `gpt-5-mini` (fast and cost-effective)
  - Premium: `gpt-5-2025-08-07` (flagship model)
- ✨ Full compatibility with GPT-5 API requirements
- 🔄 Users can still configure older models if preferred

## [0.3.0] - 2025-01-08

### OpenAI & Anthropic API Support 🎉

- 🤖 **OpenAI API Mode**: Direct access to GPT models
  - Economy: `gpt-4o-mini` (~$0.15/1M tokens)
  - Premium: `gpt-4o` (~$2.50/1M tokens)
  - Full API integration with error handling
  - Automatic token usage logging
  - JSON response parsing with fallbacks
- 🧠 **Anthropic API Mode**: Direct access to Claude models
  - Economy: `claude-haiku-4-5` (~$1/1M tokens)
  - Premium: `claude-sonnet-4-5` (~$3/1M tokens)
  - Native Anthropic API integration
  - Supports system prompts properly
  - Smart response parsing
- ⚙️ **Easy Configuration**: Just add API keys in settings
- 🔒 **Secure**: API keys stored in VSCode settings
- 💰 **Cost Tracking**: Token usage logged to console
- 🚀 **Feature Complete**: All 4 modes now fully functional!

### Improvements

- Better error messages for API authentication issues
- Rate limit handling for both APIs
- Improved response parsing with multiple fallback strategies
- Comprehensive documentation for API setup

### Breaking Changes

None - fully backward compatible with v0.2.0

## [0.2.0] - 2025-01-08

### AI Chat Integration (Major Feature!)

- 💬 **Refine from Clipboard** (`Ctrl+Shift+Alt+R`): Perfect for AI chat interfaces!
  - Copy your prompt from Copilot Chat, Cursor, Claude Code, or any AI chat
  - Press the hotkey to refine it
  - Paste the refined version back
  - Works with ANY AI tool!
- ✍️ **Refine from Input Box** (`Ctrl+Alt+R`): Type or paste prompts directly
  - Quick input box for on-the-fly refinement
  - No need to have a file open
  - Great for quick iterations
- 🎯 **Smart Copy Options**: After refinement, choose to:
  - Copy to clipboard immediately
  - Edit before copying
  - View original vs refined comparison
- 📋 **Seamless Workflow**: Copy → Refine → Paste in under 5 seconds

### Improvements

- Enhanced notification messages with clear next steps
- Better user guidance for AI chat workflows
- Updated documentation with AI chat integration examples

## [0.1.0] - 2025-01-08

### Initial Release

- ✨ **Prompt Refinement**: Transform casual prompts into clear, structured requests
- 👤 **Customizable Profiles**: Three built-in profiles (Technical Writer, Dev Helper, Marketing Copy)
- 📊 **Smart Topic Tracking**: Profiles evolve based on usage patterns
- 💰 **Economy/Premium Modes**: Choose between speed/cost and quality
- 🔄 **Multiple Refinement Modes**:
  - VSCode LM API (Copilot) - FREE for Copilot subscribers
  - Ollama (Local) - FREE and private
  - OpenAI API (Coming soon)
  - Anthropic API (Coming soon)
- 🎯 **Flexible UI Options**:
  - Inline replacement
  - Diff view
  - Webview panel (basic)
  - Copy to clipboard
- ⌨️ **Keyboard Shortcuts**:
  - `Ctrl+Shift+R` - Refine selection
  - `Ctrl+Shift+Alt+P` - Switch profile
- 📋 **Import/Export**: Compatible with Chrome extension profile format
- 📊 **Status Bar**: Shows active profile and current mode
- 🎨 **Context Menu**: Right-click to refine selected text

### Known Limitations

- OpenAI and Anthropic API modes not yet implemented
- Webview panel shows basic input box (full panel coming in next version)
- CodeLens provider not yet implemented

### Coming Soon

- 📝 Full-featured webview panel with syntax highlighting
- 🔍 CodeLens "Refine" buttons above prompts
- 📜 Prompt history
- 📝 Prompt templates
- 🌐 OpenAI and Anthropic API support
- 📊 Statistics dashboard
