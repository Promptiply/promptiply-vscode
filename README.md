# Promptiply for VSCode

Refine your AI prompts for better results with Copilot, Claude Code, Cursor, and more. Transform vague ideas into clear, actionable prompts using customizable profiles with smart topic tracking.

[![CI](https://github.com/Promptiply/promptiply-vscode/actions/workflows/ci.yml/badge.svg)](https://github.com/Promptiply/promptiply-vscode/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Promptiply/promptiply-vscode/actions/workflows/codeql.yml/badge.svg)](https://github.com/Promptiply/promptiply-vscode/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## ✨ Features

- **💬 AI Chat Integration**: Type `@promptiply` in any VSCode chat to refine prompts instantly!
- **🔮 Prompt Refinement**: Transform casual prompts into clear, structured requests
- **👤 Customizable Profiles**: Tailor refinements to match your workflow (Technical Writer, Developer, etc.)
- **📊 Smart Topic Tracking**: Profiles evolve based on your usage patterns
- **💰 Economy/Premium Modes**: Choose speed & cost vs. quality
- **🆓 Multiple AI Providers**:
  - **VSCode LM API** - Uses your Copilot subscription (FREE!)
  - **Ollama** - Local models (FREE & Private)
  - **OpenAI API** - Direct access to GPT-5, GPT-5 Mini (pay-per-use)
  - **Anthropic API** - Direct access to Claude 4.5 Sonnet/Haiku (pay-per-use)
- **🎯 Flexible UI**: Inline replacement, diff view, or side panel
- **⌨️ Keyboard Shortcuts**: Fast refinement with `Ctrl+Shift+R`
- **🔄 Import/Export**: Share profiles across devices or with your team

## 🚀 Quick Start

### For File/Editor Work
1. **Install the extension**
2. **Select a profile** (click status bar or `Ctrl+Shift+Alt+P`)
3. **Write a prompt** in any file
4. **Select the text** and press `Ctrl+Shift+R` (or right-click → "Refine with Promptiply")
5. **Choose how to apply**: Inline, Webview, Diff, or Copy

### 💬 For AI Chat Integration (NEW!)
**Perfect for Copilot Chat, Cursor, Claude Code, and any AI chat interface!**

**Method 1: Direct Chat Participant (⚡ EASIEST!)**
1. In any VSCode chat (Copilot Chat, etc.), type `@promptiply` followed by your prompt
2. Example: `@promptiply make a function that sorts arrays`
3. Promptiply refines your prompt **instantly** in the chat
4. Copy the refined version and use it!

**Method 2: Clipboard**
1. Type/paste your prompt in the AI chat
2. **Select and copy** your prompt (`Cmd+C`)
3. Press `Cmd+Shift+Alt+R` (or Command Palette → "Refine from Clipboard")
4. Review refined prompt and click "Copy to Clipboard"
5. **Paste** into AI chat (`Cmd+V`)

**Method 3: Input Box**
1. Press `Cmd+Alt+R` (or Command Palette → "Refine from Input Box")
2. Type or paste your prompt in the input box
3. Press Enter
4. Review refined prompt and click "Copy to Clipboard"
5. Paste into AI chat

**Why this is awesome:**
- ✨ Refine prompts **without leaving your AI chat**
- 🚀 Works with **any AI tool** (Copilot, Cursor, Claude, Continue, etc.)
- ⚡ Super fast workflow with chat participant: Just type `@promptiply`!
- 🎯 Same powerful profile system and topic tracking
- 📋 One-click copy buttons in chat responses

## 📋 Requirements

**For VSCode LM mode (recommended):**
- GitHub Copilot subscription
- VSCode 1.85.0 or higher

**For Ollama mode:**
- [Ollama](https://ollama.ai) installed and running
- A model pulled (e.g., `ollama pull llama3.1:8b`)

**For OpenAI API mode:**
- OpenAI API key from https://platform.openai.com/api-keys
- Active OpenAI account with credits

**For Anthropic API mode:**
- Anthropic API key from https://console.anthropic.com/
- Active Anthropic account with credits

## ⚙️ Configuration

Open Settings (`Cmd/Ctrl+,`) and search for "Promptiply":

```jsonc
{
  // Refinement mode
  "promptiply.mode": "vscode-lm", // or "ollama", "openai-api", "anthropic-api"

  // Use economy models (faster, cheaper)
  "promptiply.useEconomyModel": true,

  // VSCode LM settings (uses your Copilot subscription)
  "promptiply.vscodeLM.economyFamily": "gpt-3.5-turbo",
  "promptiply.vscodeLM.premiumFamily": "gpt-4o",

  // Ollama settings (local, free)
  "promptiply.ollama.endpoint": "http://localhost:11434",
  "promptiply.ollama.economyModel": "llama3.2:3b",
  "promptiply.ollama.premiumModel": "llama3.1:8b",

  // OpenAI API settings (pay-per-use)
  "promptiply.openai.apiKey": "sk-...",  // Get from https://platform.openai.com/api-keys
  "promptiply.openai.economyModel": "gpt-5-mini",         // GPT-5 Mini (fast and cost-effective)
  "promptiply.openai.premiumModel": "gpt-5-2025-08-07",   // GPT-5 (flagship model)

  // Anthropic API settings (pay-per-use)
  "promptiply.anthropic.apiKey": "sk-ant-...",  // Get from https://console.anthropic.com/
  "promptiply.anthropic.economyModel": "claude-3-5-haiku-20241022",  // ~$1/1M tokens
  "promptiply.anthropic.premiumModel": "claude-3-5-sonnet-20241022", // ~$3/1M tokens

  // UI preferences
  "promptiply.ui.defaultMode": "ask", // "inline", "webview", "diff", or "ask"

  // CodeLens (shows "Refine" buttons above prompts)
  "promptiply.codeLens.enabled": true
}
```

### 🔑 Adding API Keys

**OpenAI:**
1. Visit https://platform.openai.com/api-keys
2. Create a new API key
3. Add to settings: `"promptiply.openai.apiKey": "sk-..."`
4. Set mode: `"promptiply.mode": "openai-api"`

**Anthropic:**
1. Visit https://console.anthropic.com/
2. Create a new API key
3. Add to settings: `"promptiply.anthropic.apiKey": "sk-ant-..."`
4. Set mode: `"promptiply.mode": "anthropic-api"`

**Note:** API keys are stored in VSCode settings. For better security, consider using environment variables or VSCode secrets API in future versions.

## 🎮 Commands

| Command | Keyboard Shortcut | Description |
|---------|------------------|-------------|
| `Promptiply: Refine Selection` | `Ctrl+Shift+R` | Refine selected text in editor |
| **`Promptiply: Refine from Clipboard`** | **`Ctrl+Shift+Alt+R`** | **Refine clipboard content (for AI chats!)** |
| **`Promptiply: Refine from Input Box`** | **`Ctrl+Alt+R`** | **Type/paste prompt to refine** |
| `Promptiply: Switch Profile` | `Ctrl+Shift+Alt+P` | Change active profile |
| `Promptiply: Toggle Economy/Premium` | - | Switch between economy and premium models |
| `Promptiply: Import Profiles` | - | Import profiles from Chrome extension or backup |
| `Promptiply: Export Profiles` | - | Export profiles to JSON |

## 👤 Profiles

Profiles customize how prompts are refined:

### Built-in Profiles

1. **Technical Writer**: Clear, concise documentation-style prompts
2. **Dev Helper**: Code-focused with examples and step-by-step guidance
3. **Marketing Copy**: Persuasive, conversion-focused messaging

### Creating Custom Profiles

1. Run `Promptiply: Create Profile`
2. Enter name, persona, tone, and style guidelines
3. The profile will evolve based on your usage

### Profile Evolution

Profiles automatically track topics you work on frequently:
- **Frequency**: How often you use certain topics
- **Recency**: How recently you've used them
- **Smart Weighting**: 40% frequency + 60% recency

Example: If you frequently refine React prompts, future refinements will be optimized for React context.

## 📊 Usage Examples

### Example 1: Vague to Specific

**Before:**
```
make a function that sorts arrays
```

**After (Dev Helper profile):**
```
Create a TypeScript function that:
• Accepts an array of any type
• Implements a stable sorting algorithm
• Handles edge cases (empty array, single element)
• Returns a new sorted array (immutable)
• Includes unit tests with Jest
• Add JSDoc comments
```

### Example 2: Casual to Professional

**Before:**
```
I need help understanding how JWT works
```

**After (Technical Writer profile):**
```
Provide a comprehensive explanation of JSON Web Tokens (JWT) including:
1. What JWT is and its purpose in authentication
2. The structure of a JWT (header, payload, signature)
3. How JWT signing and verification works
4. Common use cases and security considerations
5. Step-by-step example of JWT implementation
Use clear language with diagrams where helpful.
```

### Example 3: AI Chat Integration (NEW!)

**Scenario:** You're in Copilot Chat and want to refine your prompt before sending

**Original prompt (typed in chat):**
```
how do i make my react app faster
```

**Workflow:**
1. Select your prompt in chat and copy (`Cmd+C`)
2. Press `Cmd+Shift+Alt+R`
3. Promptiply refines it in the background
4. Click "Copy to Clipboard"
5. Paste refined prompt back into chat (`Cmd+V`)

**Refined prompt (with Dev Helper profile):**
```
Analyze and optimize React application performance by:

1. Identifying current performance bottlenecks:
   • Excessive re-renders
   • Large bundle sizes
   • Unoptimized images/assets
   • Memory leaks

2. Recommending specific optimizations:
   • React.memo() for expensive components
   • useMemo()/useCallback() for computed values
   • Code splitting with React.lazy()
   • Image optimization strategies

3. Providing before/after code examples
4. Suggesting performance monitoring tools (React DevTools Profiler, Lighthouse)

Include measurable improvements (load time, FCP, TTI) for each optimization.
```

**Result:** You get much better, more specific answers from your AI assistant! 🎯

## 🔄 Import from Chrome Extension

If you're using the Promptiply Chrome extension:

1. In Chrome: Export your profiles (Options → Export Profiles)
2. In VSCode: Run `Promptiply: Import Profiles`
3. Select the exported JSON file
4. Your profiles (with evolution data) are now in VSCode!

## 🐛 Troubleshooting

### Copilot Not Available

**Error:** "GitHub Copilot is not available"

**Solution:**
- Ensure you're signed in to GitHub Copilot
- Check that Copilot extension is installed and active
- Try switching to Ollama or API mode

### Ollama Connection Failed

**Error:** "Cannot connect to Ollama"

**Solution:**
- Start Ollama: `ollama serve`
- Verify endpoint in settings (default: `http://localhost:11434`)
- Pull a model: `ollama pull llama3.1:8b`

### Empty or Malformed Response

**Issue:** Refinement returns strange output

**Solution:**
- Try premium mode (better quality)
- Check if the model supports JSON output
- For Ollama: use a larger model (8b instead of 3b)

## 🤝 Contributing

This is an open-source project! Contributions are welcome.

**Repository:** https://github.com/tomronen/promptiply

**Issues:** Report bugs or request features on GitHub

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Credits

Built with ❤️ by the Promptiply team.

Chrome extension: [Promptiply for Chrome](https://github.com/tomronen/promptiply)

---

**Tip:** Press `Ctrl+Shift+R` to refine any selected text! 🚀
