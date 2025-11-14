/**
 * Comprehensive tests for Template Manager
 */

import * as assert from 'assert';
import { TemplateManager } from '../../templates/manager';
import { Template } from '../../templates/types';
import { createMockContext } from '../helpers/mockContext';
import { wait } from '../helpers/fixtures';

suite('Template Manager Tests', () => {
    let manager: TemplateManager;
    let context: any;

    setup(() => {
        context = createMockContext();
        manager = new TemplateManager(context);
    });

    suite('Basic Operations', () => {
        test('should get all templates including built-in ones', async () => {
            const all = await manager.getAll();
            assert.ok(all.length > 0, 'Should have at least built-in templates');
        });

        test('should get custom templates separately', async () => {
            const custom = await manager.getCustom();
            assert.strictEqual(custom.length, 0, 'Should start with no custom templates');
        });

        test('should create a custom template', async () => {
            const template = await manager.create({
                name: 'Custom Test',
                description: 'A test template',
                category: 'general',
                content: 'Test content with {{variable}}',
                variables: [{ name: 'variable', description: 'Test var', defaultValue: 'default' }],
            });

            assert.ok(template.id, 'Should have an ID');
            assert.strictEqual(template.name, 'Custom Test');
            assert.strictEqual(template.isBuiltIn, false);
        });

        test('should retrieve template by ID', async () => {
            const created = await manager.create({
                name: 'Find Me',
                description: 'Test',
                category: 'general',
                content: 'Content',
            });

            const found = await manager.getById(created.id);
            assert.ok(found, 'Should find template');
            assert.strictEqual(found?.id, created.id);
        });

        test('should return undefined for non-existent ID', async () => {
            const found = await manager.getById('non-existent');
            assert.strictEqual(found, undefined);
        });
    });

    suite('Category Operations', () => {
        test('should get templates by category', async () => {
            await manager.create({
                name: 'Code Template',
                description: 'Test',
                category: 'code',
                content: 'Code content',
            });

            await manager.create({
                name: 'General Template',
                description: 'Test',
                category: 'general',
                content: 'General content',
            });

            const codeTemplates = await manager.getByCategory('code');
            assert.ok(codeTemplates.length > 0);
            assert.ok(codeTemplates.every(t => t.category === 'code'));
        });

        test('should get category counts', async () => {
            await manager.create({
                name: 'Code 1',
                description: 'Test',
                category: 'code',
                content: 'Content',
            });

            await manager.create({
                name: 'Code 2',
                description: 'Test',
                category: 'code',
                content: 'Content',
            });

            const categories = await manager.getCategories();
            const codeCategory = categories.find(c => c.category === 'code');
            assert.ok(codeCategory, 'Should have code category');
            assert.ok(codeCategory!.count >= 2, 'Should count custom templates');
        });
    });

    suite('Update and Delete', () => {
        test('should update a custom template', async () => {
            const template = await manager.create({
                name: 'Original',
                description: 'Original desc',
                category: 'general',
                content: 'Original content',
            });

            const updated = await manager.update(template.id, {
                name: 'Updated',
                description: 'Updated desc',
            });

            assert.strictEqual(updated, true, 'Should return true on successful update');

            const found = await manager.getById(template.id);
            assert.strictEqual(found?.name, 'Updated');
            assert.strictEqual(found?.description, 'Updated desc');
            assert.strictEqual(found?.content, 'Original content', 'Should preserve unchanged fields');
        });

        test('should return false when updating non-existent template', async () => {
            const updated = await manager.update('non-existent', { name: 'Test' });
            assert.strictEqual(updated, false);
        });

        test('should delete a custom template', async () => {
            const template = await manager.create({
                name: 'To Delete',
                description: 'Test',
                category: 'general',
                content: 'Content',
            });

            const deleted = await manager.delete(template.id);
            assert.strictEqual(deleted, true, 'Should return true on successful delete');

            const found = await manager.getById(template.id);
            assert.strictEqual(found, undefined, 'Template should be deleted');
        });

        test('should return false when deleting non-existent template', async () => {
            const deleted = await manager.delete('non-existent');
            assert.strictEqual(deleted, false);
        });

        test('should preserve isBuiltIn flag during update', async () => {
            const template = await manager.create({
                name: 'Test',
                description: 'Test',
                category: 'general',
                content: 'Content',
            });

            await manager.update(template.id, { name: 'Updated' });

            const found = await manager.getById(template.id);
            assert.strictEqual(found?.isBuiltIn, false, 'Should remain custom');
        });
    });

    suite('Template Application', () => {
        test('should apply template with variables', () => {
            const template: Template = {
                id: 'test',
                name: 'Test',
                description: 'Test',
                category: 'general',
                content: 'Hello {{name}}, welcome to {{place}}!',
                isBuiltIn: false,
            };

            const result = manager.applyTemplate(template, {
                name: 'Alice',
                place: 'Wonderland',
            });

            assert.strictEqual(result, 'Hello Alice, welcome to Wonderland!');
        });

        test('should replace multiple occurrences of same variable', () => {
            const template: Template = {
                id: 'test',
                name: 'Test',
                description: 'Test',
                category: 'general',
                content: '{{word}} is a {{word}}',
                isBuiltIn: false,
            };

            const result = manager.applyTemplate(template, { word: 'test' });
            assert.strictEqual(result, 'test is a test');
        });

        test('should use default values for missing variables', () => {
            const template: Template = {
                id: 'test',
                name: 'Test',
                description: 'Test',
                category: 'general',
                content: 'Hello {{name}}!',
                variables: [
                    { name: 'name', description: 'User name', defaultValue: 'World' },
                ],
                isBuiltIn: false,
            };

            const result = manager.applyTemplate(template, {});
            assert.strictEqual(result, 'Hello World!');
        });

        test('should use empty string for variables without defaults', () => {
            const template: Template = {
                id: 'test',
                name: 'Test',
                description: 'Test',
                category: 'general',
                content: 'Hello {{name}}!',
                variables: [
                    { name: 'name', description: 'User name' },
                ],
                isBuiltIn: false,
            };

            const result = manager.applyTemplate(template, {});
            assert.strictEqual(result, 'Hello !');
        });

        test('should handle templates without variables', () => {
            const template: Template = {
                id: 'test',
                name: 'Test',
                description: 'Test',
                category: 'general',
                content: 'Static content',
                isBuiltIn: false,
            };

            const result = manager.applyTemplate(template, {});
            assert.strictEqual(result, 'Static content');
        });
    });

    suite('Search Functionality', () => {
        test('should search by name', async () => {
            await manager.create({
                name: 'TypeScript Helper',
                description: 'Test',
                category: 'code',
                content: 'Content',
            });

            const results = await manager.search('TypeScript');
            assert.ok(results.length > 0);
            assert.ok(results.some(t => t.name.includes('TypeScript')));
        });

        test('should search by description', async () => {
            await manager.create({
                name: 'Helper',
                description: 'Helps with React components',
                category: 'code',
                content: 'Content',
            });

            const results = await manager.search('React');
            assert.ok(results.length > 0);
        });

        test('should search by category', async () => {
            await manager.create({
                name: 'Documentation',
                description: 'Test',
                category: 'documentation',
                content: 'Content',
            });

            const results = await manager.search('documentation');
            assert.ok(results.length > 0);
        });

        test('should search by content', async () => {
            await manager.create({
                name: 'Test',
                description: 'Test',
                category: 'general',
                content: 'This template uses GraphQL queries',
            });

            const results = await manager.search('GraphQL');
            assert.ok(results.length > 0);
        });

        test('should be case-insensitive', async () => {
            await manager.create({
                name: 'Python Script',
                description: 'Test',
                category: 'code',
                content: 'Content',
            });

            const results = await manager.search('python');
            assert.ok(results.length > 0);
        });

        test('should return empty array when no matches', async () => {
            const results = await manager.search('nonexistentxyzabc');
            assert.strictEqual(results.length, 0);
        });
    });

    suite('Import/Export', () => {
        test('should export custom templates', async () => {
            await manager.create({
                name: 'Export Test',
                description: 'Test export',
                category: 'general',
                content: 'Export content',
            });

            const json = await manager.export();
            const data = JSON.parse(json);

            assert.ok(Array.isArray(data), 'Should export array');
            assert.ok(data.length > 0, 'Should have templates');
            assert.ok(data[0].name === 'Export Test');
        });

        test('should export empty array when no custom templates', async () => {
            const json = await manager.export();
            const data = JSON.parse(json);

            assert.ok(Array.isArray(data));
            assert.strictEqual(data.length, 0);
        });

        test('should import templates', async () => {
            const templates = [
                {
                    id: 'import-1',
                    name: 'Imported 1',
                    description: 'Test',
                    category: 'general',
                    content: 'Content 1',
                    isBuiltIn: false,
                },
                {
                    id: 'import-2',
                    name: 'Imported 2',
                    description: 'Test',
                    category: 'code',
                    content: 'Content 2',
                    isBuiltIn: false,
                },
            ];

            const count = await manager.import(JSON.stringify(templates));
            assert.strictEqual(count, 2, 'Should import both templates');

            const found1 = await manager.getById('import-1');
            const found2 = await manager.getById('import-2');

            assert.ok(found1, 'Should find first template');
            assert.ok(found2, 'Should find second template');
        });

        test('should skip duplicate templates on import', async () => {
            const template = {
                id: 'duplicate-test',
                name: 'Duplicate',
                description: 'Test',
                category: 'general',
                content: 'Content',
                isBuiltIn: false,
            };

            // Import once
            await manager.import(JSON.stringify([template]));

            // Import again
            const count = await manager.import(JSON.stringify([template]));
            assert.strictEqual(count, 0, 'Should skip duplicate');

            const all = await manager.getCustom();
            const duplicates = all.filter(t => t.id === 'duplicate-test');
            assert.strictEqual(duplicates.length, 1, 'Should have only one copy');
        });

        test('should throw error on invalid JSON', async () => {
            await assert.rejects(
                async () => await manager.import('invalid json'),
                /Failed to import templates/
            );
        });

        test('should mark imported templates as not built-in', async () => {
            const templates = [
                {
                    id: 'test',
                    name: 'Test',
                    description: 'Test',
                    category: 'general',
                    content: 'Content',
                    isBuiltIn: true, // Even if marked as built-in in export
                },
            ];

            await manager.import(JSON.stringify(templates));

            const found = await manager.getById('test');
            assert.strictEqual(found?.isBuiltIn, false, 'Should be marked as custom');
        });
    });

    suite('ID Generation', () => {
        test('should generate unique IDs', async () => {
            const t1 = await manager.create({
                name: 'Template 1',
                description: 'Test',
                category: 'general',
                content: 'Content',
            });

            // Wait 2ms to ensure different timestamp
            await wait(2);

            const t2 = await manager.create({
                name: 'Template 1', // Same name
                description: 'Test',
                category: 'general',
                content: 'Content',
            });

            assert.notStrictEqual(t1.id, t2.id, 'IDs should be unique even with same name');
        });

        test('should generate slug-based IDs', async () => {
            const template = await manager.create({
                name: 'My Test Template',
                description: 'Test',
                category: 'general',
                content: 'Content',
            });

            assert.ok(template.id.includes('my-test-template'), 'Should create slug from name');
        });

        test('should handle special characters in names', async () => {
            const template = await manager.create({
                name: 'Test @ Special #Characters!',
                description: 'Test',
                category: 'general',
                content: 'Content',
            });

            assert.ok(template.id, 'Should generate valid ID');
            assert.ok(/^custom-[a-z0-9-]+$/.test(template.id), 'Should only contain valid characters');
        });
    });
});
