/**
 * Manages prompt templates
 */

import * as vscode from 'vscode';
import { Template, TemplateCategory } from './types';
import { DEFAULT_TEMPLATES } from './defaults';

export class TemplateManager {
  private context: vscode.ExtensionContext;
  private readonly CUSTOM_TEMPLATES_KEY = 'promptiply.customTemplates';

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Get all templates (built-in + custom)
   */
  async getAll(): Promise<Template[]> {
    const custom = await this.getCustom();
    return [...DEFAULT_TEMPLATES, ...custom];
  }

  /**
   * Get templates by category
   */
  async getByCategory(category: TemplateCategory): Promise<Template[]> {
    const all = await this.getAll();
    return all.filter((t) => t.category === category);
  }

  /**
   * Get template by ID
   */
  async getById(id: string): Promise<Template | undefined> {
    const all = await this.getAll();
    return all.find((t) => t.id === id);
  }

  /**
   * Get custom templates
   */
  async getCustom(): Promise<Template[]> {
    return this.context.globalState.get<Template[]>(this.CUSTOM_TEMPLATES_KEY, []);
  }

  /**
   * Create a custom template
   */
  async create(template: Omit<Template, 'id' | 'isBuiltIn'>): Promise<Template> {
    const custom = await this.getCustom();

    const newTemplate: Template = {
      ...template,
      id: this.generateId(template.name),
      isBuiltIn: false,
    };

    custom.push(newTemplate);
    await this.context.globalState.update(this.CUSTOM_TEMPLATES_KEY, custom);

    return newTemplate;
  }

  /**
   * Update a custom template
   */
  async update(id: string, updates: Partial<Template>): Promise<boolean> {
    const custom = await this.getCustom();
    const index = custom.findIndex((t) => t.id === id);

    if (index === -1) {
      return false;
    }

    custom[index] = { ...custom[index], ...updates, id, isBuiltIn: false };
    await this.context.globalState.update(this.CUSTOM_TEMPLATES_KEY, custom);

    return true;
  }

  /**
   * Delete a custom template
   */
  async delete(id: string): Promise<boolean> {
    const custom = await this.getCustom();
    const filtered = custom.filter((t) => t.id !== id);

    if (filtered.length === custom.length) {
      return false;
    }

    await this.context.globalState.update(this.CUSTOM_TEMPLATES_KEY, filtered);
    return true;
  }

  /**
   * Apply template by replacing variables
   */
  applyTemplate(template: Template, values: Record<string, string>): string {
    let result = template.content;

    // Replace all {{variable}} placeholders
    for (const [key, value] of Object.entries(values)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }

    // Replace any remaining variables with their defaults or empty string
    if (template.variables) {
      for (const variable of template.variables) {
        const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
        result = result.replace(regex, variable.defaultValue || '');
      }
    }

    return result;
  }

  /**
   * Get template categories with counts
   */
  async getCategories(): Promise<Array<{ category: TemplateCategory; count: number }>> {
    const all = await this.getAll();
    const counts = new Map<TemplateCategory, number>();

    for (const template of all) {
      counts.set(template.category, (counts.get(template.category) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Search templates
   */
  async search(query: string): Promise<Template[]> {
    const all = await this.getAll();
    const lowerQuery = query.toLowerCase();

    return all.filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.category.toLowerCase().includes(lowerQuery) ||
        t.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Export templates to JSON
   */
  async export(): Promise<string> {
    const custom = await this.getCustom();
    return JSON.stringify(custom, null, 2);
  }

  /**
   * Import templates from JSON
   */
  async import(json: string): Promise<number> {
    try {
      const templates = JSON.parse(json) as Template[];
      const custom = await this.getCustom();

      let imported = 0;
      for (const template of templates) {
        // Skip if already exists
        if (custom.some((t) => t.id === template.id)) {
          continue;
        }

        custom.push({ ...template, isBuiltIn: false });
        imported++;
      }

      await this.context.globalState.update(this.CUSTOM_TEMPLATES_KEY, custom);
      return imported;
    } catch (error) {
      throw new Error(`Failed to import templates: ${error}`);
    }
  }

  private generateId(name: string): string {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `custom-${slug}-${Date.now().toString(36)}`;
  }
}
