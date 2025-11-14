# Promptiply User Guide

Welcome to the comprehensive user guide for Promptiply for VSCode! This guide will help you get the most out of the extension.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding Prompt Refinement](#understanding-prompt-refinement)
3. [Working with Profiles](#working-with-profiles)
4. [Using Different Modes](#using-different-modes)
5. [AI Provider Configuration](#ai-provider-configuration)
6. [Advanced Features](#advanced-features)
7. [Tips and Best Practices](#tips-and-best-practices)
8. [Frequently Asked Questions](#frequently-asked-questions)

---

## Getting Started

### First-Time Setup

1. **Install the Extension**
   - Open VSCode Extensions view (`Ctrl+Shift+X`)
   - Search for "Promptiply"
   - Click Install

2. **Choose Your AI Provider**
   - Open Settings (`Ctrl+,`)
   - Search for "Promptiply"
   - Select your preferred mode:
     - `vscode-lm` (uses Copilot, recommended)
     - `ollama` (local, free, private)
     - `openai-api` (pay-per-use)
     - `anthropic-api` (pay-per-use)

3. **Select a Profile**
   - Click the profile name in the status bar (bottom right)
   - Or press `Ctrl+Shift+Alt+P`
   - Choose from built-in profiles or create your own

### Your First Refinement

1. Open any file in VSCode
2. Type a casual prompt:
   ```
   make a function that validates email
   ```
3. Select the text
4. Press `Ctrl+Shift+R`
5. See your refined prompt!

---

## Understanding Prompt Refinement

### What is Prompt Refinement?

Prompt refinement transforms vague, casual requests into clear, structured prompts that AI assistants understand better. This leads to:

- More accurate responses
- Better code quality
- Faster development
- Fewer iterations

### The Refinement Process

When you refine a prompt, Promptiply:

1. **Analyzes** your input for intent and context
2. **Applies** the active profile's persona and guidelines
3. **Structures** the request with clear requirements
4. **Adds** relevant context from your usage history
5. **Formats** the output for maximum clarity

### Example Transformation

**Before Refinement:**
```
make a login form
```

**After Refinement (Dev Helper profile):**
```
Create a React login form component that:

Requirements:
• Email and password input fields
• Form validation (email format, password strength)
• Submit button with loading state
• Error message display
• Remember me checkbox
• Forgot password link

Technical Specifications:
• Use React hooks (useState, useEffect)
• Implement controlled components
• Add TypeScript types for all props and state
• Include ARIA labels for accessibility
• Handle form submission with async/await
• Display success/error feedback

Include:
• Unit tests with React Testing Library
• CSS modules for styling
• JSDoc comments for all functions
```

---

## Working with Profiles

### What are Profiles?

Profiles customize how prompts are refined. Each profile has:

- **Persona**: Who is making the request (e.g., "Senior Developer")
- **Tone**: Communication style (e.g., "Professional", "Casual")
- **Style Guidelines**: Specific preferences (e.g., "Use TypeScript", "Include tests")
- **Evolving Topics**: Automatically tracked based on your usage

### Built-in Profiles

#### 1. Technical Writer
- **Best for:** Documentation, explanations, tutorials
- **Style:** Clear, concise, step-by-step
- **Example use:** "explain how JWT works"

#### 2. Dev Helper
- **Best for:** Code requests, technical implementations
- **Style:** Detailed, includes tests, considers edge cases
- **Example use:** "create a sorting function"

#### 3. Marketing Copy
- **Best for:** User-facing content, persuasive writing
- **Style:** Engaging, benefit-focused, conversion-oriented
- **Example use:** "write feature announcement"

### Creating Custom Profiles

1. **Open Command Palette** (`Ctrl+Shift+P`)
2. Type **"Promptiply: Create Profile"**
3. Fill in the details:

   **Name:** Your profile name
   ```
   React Developer
   ```

   **Persona:** Who you are in this context
   ```
   Senior React Developer with 5 years of experience, focusing on performance and best practices
   ```

   **Tone:** Your communication style
   ```
   Professional but friendly, direct and practical
   ```

   **Style Guidelines:** Specific preferences (one per line)
   ```
   - Always use TypeScript
   - Include unit tests with React Testing Library
   - Follow React hooks best practices
   - Consider accessibility (ARIA labels)
   - Optimize for performance (useMemo, useCallback)
   - Use functional components only
   ```

4. **Save** and start using your profile!

### Profile Evolution

Profiles automatically learn from your usage:

- **Topic Tracking**: Remembers topics you frequently work with
- **Smart Weighting**: Recent topics (60%) + Frequent topics (40%)
- **Automatic Updates**: No manual configuration needed

**Example:**
If you frequently refine prompts about React hooks, future refinements will automatically include React hooks context.

### Managing Profiles

**Switch Profiles:**
- Click status bar (bottom right)
- Or press `Ctrl+Shift+Alt+P`

**Edit Profiles:**
- Currently requires manual editing of settings file
- Future update will add UI for editing

**Delete Profiles:**
- Run "Promptiply: Delete Profile"
- Select profile to remove

**Export/Import Profiles:**
- Export: Saves all profiles to JSON
- Import: Loads profiles from JSON (merges with existing)
- Useful for sharing with team or backing up

---

## Using Different Modes

Promptiply offers multiple ways to refine prompts based on your workflow.

### 1. Selection Mode (Most Common)

**How to use:**
1. Write prompt in any file
2. Select the text
3. Press `Ctrl+Shift+R`
4. Choose output method

**Best for:** Working with code files, drafting prompts

### 2. Clipboard Mode (For AI Chats)

**How to use:**
1. Copy prompt to clipboard (`Ctrl+C`)
2. Press `Ctrl+Shift+Alt+R`
3. Review refined prompt
4. Click "Copy to Clipboard"
5. Paste in AI chat

**Best for:** Copilot Chat, Cursor, Claude Code, any AI chat interface

### 3. Input Box Mode

**How to use:**
1. Press `Ctrl+Alt+R`
2. Type or paste prompt
3. Press Enter
4. Review and copy

**Best for:** Quick refinements without opening files

### 4. Chat Participant Mode (Fastest!)

**How to use:**
1. In any VSCode chat, type `@promptiply` followed by your prompt
2. Example: `@promptiply create a sorting function`
3. Get instant refinement in the chat
4. Copy and use!

**Best for:** Seamless integration with AI assistants

---

## AI Provider Configuration

### VSCode LM (Recommended)

**Advantages:**
- Uses your existing Copilot subscription
- No additional setup required
- Reliable and fast

**Configuration:**
```json
{
  "promptiply.mode": "vscode-lm",
  "promptiply.vscodeLM.economyFamily": "gpt-3.5-turbo",
  "promptiply.vscodeLM.premiumFamily": "gpt-4o"
}
```

**Requirements:**
- GitHub Copilot subscription
- Signed in to GitHub in VSCode

### Ollama (Local & Private)

**Advantages:**
- Completely free
- Runs locally (private)
- No API keys needed
- No usage limits

**Configuration:**
```json
{
  "promptiply.mode": "ollama",
  "promptiply.ollama.endpoint": "http://localhost:11434",
  "promptiply.ollama.economyModel": "llama3.2:3b",
  "promptiply.ollama.premiumModel": "llama3.1:8b"
}
```

**Setup:**
1. Install Ollama from https://ollama.ai
2. Pull a model: `ollama pull llama3.1:8b`
3. Start Ollama: `ollama serve`
4. Configure Promptiply (as above)

**Recommended Models:**
- Economy: `llama3.2:3b` (fast, good quality)
- Premium: `llama3.1:8b` or `llama3.1:70b` (best quality)

### OpenAI API

**Advantages:**
- Access to latest GPT models
- High quality
- Pay only for what you use

**Configuration:**
```json
{
  "promptiply.mode": "openai-api",
  "promptiply.openai.apiKey": "sk-...",
  "promptiply.openai.economyModel": "gpt-5-mini",
  "promptiply.openai.premiumModel": "gpt-5-2025-08-07"
}
```

**Setup:**
1. Visit https://platform.openai.com/api-keys
2. Create API key
3. Add to settings (as above)

**Cost Estimates (approximate):**
- gpt-5-mini: ~$0.15 per 1M input tokens
- gpt-5: ~$2.50 per 1M input tokens

### Anthropic API

**Advantages:**
- Access to Claude models
- Excellent reasoning
- Pay only for what you use

**Configuration:**
```json
{
  "promptiply.mode": "anthropic-api",
  "promptiply.anthropic.apiKey": "sk-ant-...",
  "promptiply.anthropic.economyModel": "claude-haiku-4-5",
  "promptiply.anthropic.premiumModel": "claude-sonnet-4-5"
}
```

**Setup:**
1. Visit https://console.anthropic.com/
2. Create API key
3. Add to settings (as above)

**Cost Estimates (approximate):**
- Claude Haiku 4.5: ~$1 per 1M input tokens
- Claude Sonnet 4.5: ~$3 per 1M input tokens

---

## Advanced Features

### Economy vs Premium Mode

**Toggle:** Click "💰 Economy" or "💎 Premium" in status bar

**Economy Mode:**
- Faster responses
- Lower cost (if using paid APIs)
- Good for most refinements
- Uses smaller/faster models

**Premium Mode:**
- Higher quality refinements
- Better reasoning
- More detailed output
- Uses larger/smarter models

**When to use Premium:**
- Complex technical requests
- Critical production code
- Detailed documentation
- When accuracy is paramount

### Automatic Topic Tracking

Promptiply tracks topics you work with frequently:

**How it works:**
1. Analyzes refined prompts for topics (e.g., "React", "TypeScript", "authentication")
2. Tracks frequency and recency
3. Includes relevant topics in future refinements automatically

**Example:**
After refining several React prompts, when you ask "create a form", Promptiply automatically includes React context in the refinement.

**View your topics:**
- Currently internal only
- Future update will add UI to view/manage topics

### Import/Export

**Export Profiles:**
1. Run "Promptiply: Export Profiles"
2. Choose save location
3. JSON file contains all profiles + evolution data

**Import Profiles:**
1. Run "Promptiply: Import Profiles"
2. Select JSON file
3. Profiles are merged with existing (no duplicates)

**Use cases:**
- Share profiles with team
- Backup before resetting
- Sync across machines
- Migrate from Chrome extension

### Sync with Chrome Extension

If you use Promptiply for Chrome:

1. **Export from Chrome:**
   - Open extension options
   - Click "Export Profiles"
   - Save JSON file

2. **Import to VSCode:**
   - Run "Promptiply: Import Profiles"
   - Select the JSON file
   - Your Chrome profiles now work in VSCode!

**Note:** Sync is one-way. Changes in VSCode don't sync back to Chrome automatically.

---

## Tips and Best Practices

### Writing Good Initial Prompts

Even with refinement, better input = better output:

**DO:**
- Be specific about what you want
- Mention relevant technologies
- Include constraints or requirements
- Specify the context

**DON'T:**
- Be too vague ("make something")
- Assume context without stating it
- Mix multiple unrelated requests

**Examples:**

**Good Input:**
```
create a React form with email and password validation
```

**Better Input:**
```
create a React login form with:
- email validation (format check)
- password strength indicator
- submit button
- error messages
```

### Choosing the Right Profile

- **Technical Writer**: Explanations, documentation, tutorials
- **Dev Helper**: Code, implementations, technical details
- **Marketing Copy**: User-facing content, announcements
- **Custom**: Create for specialized needs (e.g., "Python Data Scientist", "DevOps Engineer")

### Optimizing for AI Chats

When using clipboard or chat participant mode:

1. **Keep prompts focused**: One task per refinement
2. **Use specific terms**: AI understands technical jargon
3. **Review before pasting**: Make sure refinement makes sense
4. **Iterate if needed**: Refine the refinement if first pass isn't perfect

### Managing Costs (API Users)

If using OpenAI or Anthropic APIs:

1. **Start with Economy mode**: Use Premium only when needed
2. **Batch refinements**: Refine multiple prompts at once before submitting
3. **Monitor usage**: Check API dashboard regularly
4. **Consider Ollama**: Free alternative for unlimited usage

---

## Frequently Asked Questions

### General Questions

**Q: Is Promptiply free?**
A: The extension is free and open-source. AI provider costs depend on your choice:
- VSCode LM: Included with Copilot subscription
- Ollama: Completely free (runs locally)
- OpenAI/Anthropic: Pay-per-use (typically very low cost)

**Q: Do I need an API key?**
A: Only if using OpenAI or Anthropic modes. VSCode LM and Ollama don't require API keys.

**Q: Can I use Promptiply offline?**
A: Yes, with Ollama mode (local AI models). Other modes require internet.

**Q: Is my data private?**
A: Depends on mode:
- Ollama: Completely private (runs on your machine)
- VSCode LM: Subject to GitHub Copilot privacy policy
- OpenAI/Anthropic: Subject to their respective privacy policies

### Technical Questions

**Q: Why is the extension not refining my prompts?**
A: Check these:
1. Selected text is not empty
2. AI provider is configured correctly
3. API keys are valid (if using API modes)
4. Ollama is running (if using Ollama mode)
5. Check VSCode Output panel for errors

**Q: Can I customize the refinement process?**
A: Yes! Create custom profiles with specific persona, tone, and guidelines. The refinement will follow your instructions.

**Q: How do I reset to default profiles?**
A: Run "Promptiply: Reset Profiles to Defaults". This removes custom profiles and restores built-in ones.

**Q: Can I use my own prompts for refinement?**
A: Currently, the refinement logic is built-in. Custom refinement prompts may be added in a future update.

### Profile Questions

**Q: How many profiles can I create?**
A: Unlimited. However, for best performance, we recommend keeping it to 10-15 active profiles.

**Q: Can I share profiles with my team?**
A: Yes! Export profiles to JSON and share the file. Team members can import and use the same profiles.

**Q: Do profiles learn automatically?**
A: Yes! Topic tracking is automatic. Profiles remember topics you work with frequently.

**Q: Can I disable topic tracking?**
A: Currently no, but it's opt-out by design. Topics are only tracked locally and don't affect refinement negatively.

### Integration Questions

**Q: Does Promptiply work with Copilot Chat?**
A: Yes! Use clipboard mode or chat participant (`@promptiply`) for seamless integration.

**Q: Can I use Promptiply with Cursor?**
A: Yes! Same as Copilot Chat - use clipboard mode or chat participant.

**Q: Does it work with Continue or other AI extensions?**
A: Yes! Promptiply is provider-agnostic. It refines prompts that you then send to any AI tool.

### Troubleshooting

**Q: "GitHub Copilot is not available" error**
A:
1. Ensure Copilot extension is installed
2. Sign in to GitHub
3. Verify Copilot subscription is active
4. Try switching to Ollama or API mode as alternative

**Q: Ollama connection failed**
A:
1. Start Ollama: `ollama serve`
2. Verify endpoint in settings (default: http://localhost:11434)
3. Pull a model: `ollama pull llama3.1:8b`
4. Test: `curl http://localhost:11434/api/tags`

**Q: API rate limit errors**
A:
- OpenAI: Check your plan's rate limits
- Anthropic: Check your tier limits
- Consider using Economy mode or Ollama

**Q: Empty or malformed refinements**
A:
1. Try Premium mode (better quality)
2. Check if model supports JSON output
3. For Ollama: use larger model (8b instead of 3b)
4. Simplify your input prompt

---

## Getting Help

- **Documentation**: https://github.com/Promptiply/promptiply-vscode/tree/main/docs
- **Issues**: https://github.com/Promptiply/promptiply-vscode/issues
- **Discussions**: https://github.com/Promptiply/promptiply-vscode/discussions

---

*Last updated: November 2025*
