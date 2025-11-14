/**
 * Comprehensive tests for History Manager
 */

import * as assert from 'assert';
import { HistoryManager } from '../../history/manager';
import { HistoryEntry } from '../../history/types';
import { createMockContext } from '../helpers/mockContext';
import { createMockHistoryEntry, wait } from '../helpers/fixtures';

suite('History Manager Tests', () => {
    let manager: HistoryManager;
    let context: any;

    setup(() => {
        context = createMockContext();
        manager = new HistoryManager(context);
    });

    suite('Basic CRUD Operations', () => {
        test('should start with empty history', async () => {
            const history = await manager.getAll();
            assert.strictEqual(history.length, 0, 'Should have no entries initially');
        });

        test('should add a new entry', async () => {
            const entry = await manager.addEntry({
                originalPrompt: 'Test prompt',
                refinedPrompt: 'Refined prompt',
                profile: 'Test Profile',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            assert.ok(entry.id, 'Should generate an ID');
            assert.ok(entry.timestamp, 'Should have a timestamp');
            assert.strictEqual(entry.originalPrompt, 'Test prompt');
            assert.strictEqual(entry.refinedPrompt, 'Refined prompt');
        });

        test('should retrieve all entries', async () => {
            await manager.addEntry({
                originalPrompt: 'First',
                refinedPrompt: 'First refined',
                profile: 'Profile 1',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            await manager.addEntry({
                originalPrompt: 'Second',
                refinedPrompt: 'Second refined',
                profile: 'Profile 2',
                mode: 'ollama',
                isEconomy: true,
            });

            const history = await manager.getAll();
            assert.strictEqual(history.length, 2);
        });

        test('should retrieve entry by ID', async () => {
            const added = await manager.addEntry({
                originalPrompt: 'Find me',
                refinedPrompt: 'Found',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            const found = await manager.getById(added.id);
            assert.ok(found, 'Should find entry');
            assert.strictEqual(found?.id, added.id);
            assert.strictEqual(found?.originalPrompt, 'Find me');
        });

        test('should return undefined for non-existent ID', async () => {
            const found = await manager.getById('non-existent-id');
            assert.strictEqual(found, undefined);
        });

        test('should delete entry by ID', async () => {
            const entry = await manager.addEntry({
                originalPrompt: 'Delete me',
                refinedPrompt: 'Deleted',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            await manager.deleteById(entry.id);

            const history = await manager.getAll();
            assert.strictEqual(history.length, 0);
        });

        test('should clear all history', async () => {
            await manager.addEntry({
                originalPrompt: 'Entry 1',
                refinedPrompt: 'Refined 1',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            await manager.addEntry({
                originalPrompt: 'Entry 2',
                refinedPrompt: 'Refined 2',
                profile: 'Test',
                mode: 'ollama',
                isEconomy: true,
            });

            await manager.clear();

            const history = await manager.getAll();
            assert.strictEqual(history.length, 0);
        });
    });

    suite('Entry Ordering', () => {
        test('should add new entries at the beginning', async () => {
            const first = await manager.addEntry({
                originalPrompt: 'First',
                refinedPrompt: 'First refined',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            await wait(10); // Ensure different timestamps

            const second = await manager.addEntry({
                originalPrompt: 'Second',
                refinedPrompt: 'Second refined',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            const history = await manager.getAll();
            assert.strictEqual(history[0].id, second.id, 'Newest should be first');
            assert.strictEqual(history[1].id, first.id, 'Oldest should be last');
        });
    });

    suite('Maximum Entries Limit', () => {
        test('should respect maximum entries limit', async () => {
            // Add 105 entries (max is 100)
            for (let i = 0; i < 105; i++) {
                await manager.addEntry({
                    originalPrompt: `Prompt ${i}`,
                    refinedPrompt: `Refined ${i}`,
                    profile: 'Test',
                    mode: 'vscode-lm',
                isEconomy: true,
                });
            }

            const history = await manager.getAll();
            assert.strictEqual(history.length, 100, 'Should keep only 100 entries');
        });

        test('should keep most recent entries when limit exceeded', async () => {
            for (let i = 0; i < 105; i++) {
                await manager.addEntry({
                    originalPrompt: `Prompt ${i}`,
                    refinedPrompt: `Refined ${i}`,
                    profile: 'Test',
                    mode: 'vscode-lm',
                isEconomy: true,
                });
            }

            const history = await manager.getAll();
            // Should have entries 5-104 (most recent 100)
            assert.ok(history[0].originalPrompt.includes('104'), 'Should have newest entry');
            assert.ok(history[99].originalPrompt.includes('5'), 'Should have 100th newest entry');
        });
    });

    suite('Grouped by Date', () => {
        test('should group entries by date', async () => {
            await manager.addEntry({
                originalPrompt: 'Today entry',
                refinedPrompt: 'Refined',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            const groups = await manager.getGroupedByDate();
            assert.ok(groups.length > 0, 'Should have at least one group');
            assert.strictEqual(groups[0].date, 'Today');
            assert.ok(groups[0].entries.length > 0);
        });

        test('should separate entries by date', async () => {
            // Add entry with today's timestamp
            await manager.addEntry({
                originalPrompt: 'Today',
                refinedPrompt: 'Refined',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            const groups = await manager.getGroupedByDate();
            assert.ok(groups.length >= 1);
        });
    });

    suite('Search Functionality', () => {
        test('should search by original prompt', async () => {
            await manager.addEntry({
                originalPrompt: 'Find this TypeScript code',
                refinedPrompt: 'Refined',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            await manager.addEntry({
                originalPrompt: 'Different entry',
                refinedPrompt: 'Refined',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            const results = await manager.search('TypeScript');
            assert.strictEqual(results.length, 1);
            assert.ok(results[0].originalPrompt.includes('TypeScript'));
        });

        test('should search by refined prompt', async () => {
            await manager.addEntry({
                originalPrompt: 'Original',
                refinedPrompt: 'Refined with React hooks',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            const results = await manager.search('React');
            assert.strictEqual(results.length, 1);
        });

        test('should search by profile name', async () => {
            await manager.addEntry({
                originalPrompt: 'Test',
                refinedPrompt: 'Test',
                profile: 'Developer Profile',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            await manager.addEntry({
                originalPrompt: 'Test',
                refinedPrompt: 'Test',
                profile: 'Writer Profile',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            const results = await manager.search('Developer');
            assert.strictEqual(results.length, 1);
            assert.strictEqual(results[0].profile, 'Developer Profile');
        });

        test('should be case-insensitive', async () => {
            await manager.addEntry({
                originalPrompt: 'TypeScript Testing',
                refinedPrompt: 'Refined',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            const results = await manager.search('typescript');
            assert.strictEqual(results.length, 1);
        });

        test('should return empty array when no matches', async () => {
            await manager.addEntry({
                originalPrompt: 'Test',
                refinedPrompt: 'Test',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            const results = await manager.search('nonexistent');
            assert.strictEqual(results.length, 0);
        });
    });

    suite('Statistics', () => {
        test('should calculate total entries', async () => {
            await manager.addEntry({
                originalPrompt: 'Test 1',
                refinedPrompt: 'Refined 1',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            await manager.addEntry({
                originalPrompt: 'Test 2',
                refinedPrompt: 'Refined 2',
                profile: 'Test',
                mode: 'ollama',
                isEconomy: true,
            });

            const stats = await manager.getStats();
            assert.strictEqual(stats.total, 2);
        });

        test('should group by mode', async () => {
            await manager.addEntry({
                originalPrompt: 'Test',
                refinedPrompt: 'Refined',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            await manager.addEntry({
                originalPrompt: 'Test',
                refinedPrompt: 'Refined',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            await manager.addEntry({
                originalPrompt: 'Test',
                refinedPrompt: 'Refined',
                profile: 'Test',
                mode: 'ollama',
                isEconomy: true,
            });

            const stats = await manager.getStats();
            assert.strictEqual(stats.byMode['vscode-lm'], 2);
            assert.strictEqual(stats.byMode['ollama'], 1);
        });

        test('should group by profile', async () => {
            await manager.addEntry({
                originalPrompt: 'Test',
                refinedPrompt: 'Refined',
                profile: 'Developer',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            await manager.addEntry({
                originalPrompt: 'Test',
                refinedPrompt: 'Refined',
                profile: 'Writer',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            await manager.addEntry({
                originalPrompt: 'Test',
                refinedPrompt: 'Refined',
                profile: 'Developer',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            const stats = await manager.getStats();
            assert.strictEqual(stats.byProfile['Developer'], 2);
            assert.strictEqual(stats.byProfile['Writer'], 1);
        });

        test('should calculate total token usage', async () => {
            await manager.addEntry({
                originalPrompt: 'Test',
                refinedPrompt: 'Refined',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
                tokenUsage: { input: 100, output: 200 },
            });

            await manager.addEntry({
                originalPrompt: 'Test',
                refinedPrompt: 'Refined',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
                tokenUsage: { input: 50, output: 150 },
            });

            const stats = await manager.getStats();
            assert.strictEqual(stats.totalTokensUsed, 500); // 100+200+50+150
        });

        test('should handle entries without token usage', async () => {
            await manager.addEntry({
                originalPrompt: 'Test',
                refinedPrompt: 'Refined',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            const stats = await manager.getStats();
            assert.strictEqual(stats.totalTokensUsed, 0);
        });
    });

    suite('Token Usage Tracking', () => {
        test('should store token usage when provided', async () => {
            const entry = await manager.addEntry({
                originalPrompt: 'Test',
                refinedPrompt: 'Refined',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
                tokenUsage: {
                    input: 123,
                    output: 456,
                },
            });

            const found = await manager.getById(entry.id);
            assert.ok(found?.tokenUsage);
            assert.strictEqual(found?.tokenUsage?.input, 123);
            assert.strictEqual(found?.tokenUsage?.output, 456);
        });

        test('should work without token usage', async () => {
            const entry = await manager.addEntry({
                originalPrompt: 'Test',
                refinedPrompt: 'Refined',
                profile: 'Test',
                mode: 'vscode-lm',
                isEconomy: true,
            });

            assert.ok(entry);
            assert.strictEqual(entry.tokenUsage, undefined);
        });
    });
});
