/**
 * Commands for working with templates
 */

import * as vscode from 'vscode';
import { TemplateManager } from '../templates/manager';
import { Template, TemplateCategory } from '../templates/types';
import { RefineCommands } from './refine';

export class TemplateCommands {
  constructor(
    private templateManager: TemplateManager,
    private refinementCommands: RefineCommands
  ) {}

  /**
   * Use a template to create a prompt
   */
  async useTemplate(): Promise<void> {
    try {
      // Step 1: Select template
      const template = await this.selectTemplate();
      if (!template) {
        return;
      }

      // Step 2: Fill in variables if any
      const values: Record<string, string> = {};
      if (template.variables && template.variables.length > 0) {
        for (const variable of template.variables) {
          const value = await vscode.window.showInputBox({
            prompt: variable.description,
            placeHolder: variable.defaultValue,
            value: variable.defaultValue,
          });

          if (value === undefined) {
            return; // User cancelled
          }

          values[variable.name] = value;
        }
      }

      // Step 3: Apply template
      const prompt = this.templateManager.applyTemplate(template, values);

      // Step 4: Choose what to do with it
      const action = await vscode.window.showQuickPick(
        [
          { label: '✨ Refine and Use', value: 'refine' },
          { label: '📝 Insert into Editor', value: 'insert' },
          { label: '📋 Copy to Clipboard', value: 'copy' },
          { label: '👁️ Preview', value: 'preview' },
        ],
        { placeHolder: 'What do you want to do with this prompt?' }
      );

      if (!action) {
        return;
      }

      switch (action.value) {
        case 'refine':
          await this.refinementCommands.refineAndCopy(prompt, 'Template');
          break;
        case 'insert':
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            await editor.edit((editBuilder) => {
              editBuilder.insert(editor.selection.active, prompt);
            });
            vscode.window.showInformationMessage('Template inserted into editor');
          } else {
            vscode.window.showErrorMessage('No active editor');
          }
          break;
        case 'copy':
          await vscode.env.clipboard.writeText(prompt);
          vscode.window.showInformationMessage('Template copied to clipboard');
          break;
        case 'preview':
          const doc = await vscode.workspace.openTextDocument({
            content: prompt,
            language: 'markdown',
          });
          await vscode.window.showTextDocument(doc);
          break;
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Template error: ${error}`);
    }
  }

  /**
   * Create a new custom template
   */
  async createTemplate(): Promise<void> {
    try {
      // Get template name
      const name = await vscode.window.showInputBox({
        prompt: 'Template name',
        placeHolder: 'e.g., "My Custom Template"',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Template name is required';
          }
          return null;
        },
      });

      if (!name) {
        return;
      }

      // Get description
      const description = await vscode.window.showInputBox({
        prompt: 'Template description',
        placeHolder: 'e.g., "A template for..."',
      });

      if (description === undefined) {
        return;
      }

      // Select category
      const categories: TemplateCategory[] = [
        'code',
        'documentation',
        'debugging',
        'testing',
        'refactoring',
        'explanation',
        'review',
        'general',
      ];

      const categoryPick = await vscode.window.showQuickPick(
        categories.map((cat) => ({ label: cat, value: cat })),
        { placeHolder: 'Select template category' }
      );

      if (!categoryPick) {
        return;
      }

      // Get template content
      const content = await vscode.window.showInputBox({
        prompt: 'Template content (use {{variableName}} for variables)',
        placeHolder: 'e.g., "Create a {{language}} function that {{purpose}}"',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Template content is required';
          }
          return null;
        },
      });

      if (!content) {
        return;
      }

      // Extract variables from content
      const variableMatches = content.matchAll(/\{\{(\w+)\}\}/g);
      const variableNames = Array.from(new Set(Array.from(variableMatches).map((m) => m[1])));

      const variables = [];
      for (const varName of variableNames) {
        const varDesc = await vscode.window.showInputBox({
          prompt: `Description for variable "${varName}"`,
          placeHolder: 'e.g., "The programming language to use"',
        });

        if (varDesc === undefined) {
          return;
        }

        const varDefault = await vscode.window.showInputBox({
          prompt: `Default value for "${varName}" (optional)`,
          placeHolder: 'Leave empty for no default',
        });

        if (varDefault === undefined) {
          return;
        }

        variables.push({
          name: varName,
          description: varDesc,
          defaultValue: varDefault || undefined,
        });
      }

      // Create template
      const template = await this.templateManager.create({
        name,
        description,
        category: categoryPick.value,
        content,
        variables: variables.length > 0 ? variables : undefined,
      });

      vscode.window.showInformationMessage(`Template "${template.name}" created!`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create template: ${error}`);
    }
  }

  /**
   * Manage templates (view, edit, delete)
   */
  async manageTemplates(): Promise<void> {
    const templates = await this.templateManager.getAll();

    const picks = templates.map((t) => ({
      label: t.name,
      description: t.category,
      detail: t.description,
      template: t,
    }));

    const selected = await vscode.window.showQuickPick(picks, {
      placeHolder: 'Select a template to manage',
    });

    if (!selected) {
      return;
    }

    const action = await vscode.window.showQuickPick(
      [
        { label: '👁️ View', value: 'view' },
        { label: '✏️ Edit', value: 'edit', disabled: selected.template.isBuiltIn },
        { label: '🗑️ Delete', value: 'delete', disabled: selected.template.isBuiltIn },
        { label: '📋 Duplicate', value: 'duplicate' },
      ].filter((item) => !item.disabled),
      { placeHolder: `Manage "${selected.template.name}"` }
    );

    if (!action) {
      return;
    }

    switch (action.value) {
      case 'view':
        const doc = await vscode.workspace.openTextDocument({
          content: `# ${selected.template.name}\n\n${selected.template.description}\n\n## Category\n${selected.template.category}\n\n## Content\n\n${selected.template.content}`,
          language: 'markdown',
        });
        await vscode.window.showTextDocument(doc);
        break;
      case 'edit':
        // For simplicity, just allow editing the content
        const newContent = await vscode.window.showInputBox({
          prompt: 'Edit template content',
          value: selected.template.content,
        });
        if (newContent !== undefined) {
          await this.templateManager.update(selected.template.id, { content: newContent });
          vscode.window.showInformationMessage('Template updated');
        }
        break;
      case 'delete':
        const confirm = await vscode.window.showWarningMessage(
          `Delete template "${selected.template.name}"?`,
          'Delete',
          'Cancel'
        );
        if (confirm === 'Delete') {
          await this.templateManager.delete(selected.template.id);
          vscode.window.showInformationMessage('Template deleted');
        }
        break;
      case 'duplicate':
        await this.templateManager.create({
          name: `${selected.template.name} (Copy)`,
          description: selected.template.description,
          category: selected.template.category,
          content: selected.template.content,
          variables: selected.template.variables,
        });
        vscode.window.showInformationMessage('Template duplicated');
        break;
    }
  }

  /**
   * Import templates from JSON
   */
  async importTemplates(): Promise<void> {
    try {
      const uris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectMany: false,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        filters: { JSON: ['json'] },
        title: 'Import Templates',
      });

      if (!uris || uris.length === 0) {
        return;
      }

      const content = await vscode.workspace.fs.readFile(uris[0]);
      const json = Buffer.from(content).toString('utf8');

      const count = await this.templateManager.import(json);
      vscode.window.showInformationMessage(`Imported ${count} template(s)`);
    } catch (error) {
      vscode.window.showErrorMessage(`Import failed: ${error}`);
    }
  }

  /**
   * Export templates to JSON
   */
  async exportTemplates(): Promise<void> {
    try {
      const json = await this.templateManager.export();

      const uri = await vscode.window.showSaveDialog({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        filters: { JSON: ['json'] },
        defaultUri: vscode.Uri.file('promptiply-templates.json'),
        title: 'Export Templates',
      });

      if (!uri) {
        return;
      }

      await vscode.workspace.fs.writeFile(uri, Buffer.from(json, 'utf8'));
      vscode.window.showInformationMessage('Templates exported successfully');
    } catch (error) {
      vscode.window.showErrorMessage(`Export failed: ${error}`);
    }
  }

  private async selectTemplate(): Promise<Template | undefined> {
    const categories = await this.templateManager.getCategories();

    // First, select category
    const categoryPick = await vscode.window.showQuickPick(
      [
        { label: '📚 All Templates', value: null },
        ...categories.map((c) => ({
          label: `${this.getCategoryIcon(c.category)} ${c.category}`,
          description: `${c.count} template${c.count !== 1 ? 's' : ''}`,
          value: c.category,
        })),
      ],
      { placeHolder: 'Select category' }
    );

    if (!categoryPick) {
      return undefined;
    }

    // Then, select template
    const templates =
      categoryPick.value === null
        ? await this.templateManager.getAll()
        : await this.templateManager.getByCategory(categoryPick.value);

    const templatePick = await vscode.window.showQuickPick(
      templates.map((t) => ({
        label: t.name,
        description: t.isBuiltIn ? '(built-in)' : '(custom)',
        detail: t.description,
        template: t,
      })),
      { placeHolder: 'Select template' }
    );

    return templatePick?.template;
  }

  private getCategoryIcon(category: TemplateCategory): string {
    const icons: Record<TemplateCategory, string> = {
      code: '💻',
      documentation: '📝',
      debugging: '🐛',
      testing: '🧪',
      refactoring: '♻️',
      explanation: '💡',
      review: '👀',
      general: '⚙️',
    };
    return icons[category] || '📄';
  }
}
