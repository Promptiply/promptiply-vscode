/**
 * Comprehensive tests for Profile Manager
 */

import * as assert from 'assert';
import { ProfileManager } from '../../profiles/manager';
import { Profile } from '../../profiles/types';
import { createMockContext } from '../helpers/mockContext';
import { createMockProfile } from '../helpers/fixtures';

suite('Profile Manager Tests', () => {
    let manager: ProfileManager;
    let context: any;

    beforeEach(() => {
        context = createMockContext();
        manager = new ProfileManager(context);
    });

    suite('Profile CRUD Operations', () => {
        test('should initialize with default profiles when empty', async () => {
            const profiles = await manager.getProfiles();
            assert.ok(profiles.list.length > 0, 'Should have default profiles');
            assert.strictEqual(profiles.activeProfileId, null, 'Should have no active profile initially');
        });

        test('should add a new profile', async () => {
            const newProfile = await manager.addProfile({
                name: 'Custom Profile',
                persona: 'Custom persona',
                tone: 'friendly',
                styleGuidelines: ['Be helpful'],
            });

            assert.ok(newProfile.id, 'Should generate an ID');
            assert.strictEqual(newProfile.name, 'Custom Profile');
            assert.ok(newProfile.evolving_profile, 'Should have evolving profile');
            assert.strictEqual(newProfile.evolving_profile.usageCount, 0);
        });

        test('should retrieve profiles', async () => {
            await manager.addProfile({
                name: 'Profile 1',
                persona: 'Persona 1',
                tone: 'professional',
                styleGuidelines: [],
            });

            const profiles = await manager.getProfiles();
            const found = profiles.list.find(p => p.name === 'Profile 1');
            assert.ok(found, 'Should find added profile');
        });

        test('should update an existing profile', async () => {
            const profile = await manager.addProfile({
                name: 'Original Name',
                persona: 'Original Persona',
                tone: 'formal',
                styleGuidelines: [],
            });

            await manager.updateProfile(profile.id, {
                name: 'Updated Name',
                tone: 'casual',
            });

            const updated = (await manager.getProfiles()).list.find(p => p.id === profile.id);
            assert.strictEqual(updated?.name, 'Updated Name');
            assert.strictEqual(updated?.tone, 'casual');
            assert.strictEqual(updated?.persona, 'Original Persona', 'Should preserve unchanged fields');
        });

        test('should throw error when updating non-existent profile', async () => {
            await assert.rejects(
                async () => await manager.updateProfile('non-existent-id', { name: 'Test' }),
                /Profile not found/
            );
        });

        test('should delete a profile', async () => {
            const profile = await manager.addProfile({
                name: 'To Delete',
                persona: 'Test',
                tone: 'formal',
                styleGuidelines: [],
            });

            const beforeDelete = await manager.getProfiles();
            const countBefore = beforeDelete.list.length;

            await manager.deleteProfile(profile.id);

            const afterDelete = await manager.getProfiles();
            assert.strictEqual(afterDelete.list.length, countBefore - 1);
            assert.ok(!afterDelete.list.find(p => p.id === profile.id), 'Profile should be deleted');
        });

        test('should clear active profile when deleting it', async () => {
            const profile = await manager.addProfile({
                name: 'Active Profile',
                persona: 'Test',
                tone: 'formal',
                styleGuidelines: [],
            });

            await manager.setActiveProfile(profile.id);
            assert.strictEqual((await manager.getProfiles()).activeProfileId, profile.id);

            await manager.deleteProfile(profile.id);
            assert.strictEqual((await manager.getProfiles()).activeProfileId, null);
        });
    });

    suite('Active Profile Management', () => {
        test('should set active profile', async () => {
            const profile = await manager.addProfile({
                name: 'Active Test',
                persona: 'Test',
                tone: 'formal',
                styleGuidelines: [],
            });

            await manager.setActiveProfile(profile.id);

            const active = await manager.getActiveProfile();
            assert.ok(active, 'Should have active profile');
            assert.strictEqual(active?.id, profile.id);
        });

        test('should return null when no active profile', async () => {
            const active = await manager.getActiveProfile();
            assert.strictEqual(active, null);
        });

        test('should handle setting null as active profile', async () => {
            const profile = await manager.addProfile({
                name: 'Test',
                persona: 'Test',
                tone: 'formal',
                styleGuidelines: [],
            });

            await manager.setActiveProfile(profile.id);
            await manager.setActiveProfile(null);

            const active = await manager.getActiveProfile();
            assert.strictEqual(active, null);
        });
    });

    suite('Profile Evolution', () => {
        test('should increment usage count', async () => {
            const profile = await manager.addProfile({
                name: 'Evolution Test',
                persona: 'Test',
                tone: 'formal',
                styleGuidelines: [],
            });

            await manager.evolveProfile(profile.id, 'Test prompt');

            const updated = (await manager.getProfiles()).list.find(p => p.id === profile.id);
            assert.strictEqual(updated?.evolving_profile.usageCount, 1);
        });

        test('should track topics', async () => {
            const profile = await manager.addProfile({
                name: 'Topic Test',
                persona: 'Test',
                tone: 'formal',
                styleGuidelines: [],
            });

            await manager.evolveProfile(profile.id, 'Test prompt about TypeScript', ['typescript', 'testing']);

            const updated = (await manager.getProfiles()).list.find(p => p.id === profile.id);
            assert.ok(updated?.evolving_profile.topics.length === 2);
            assert.ok(updated?.evolving_profile.topics.some(t => t.name === 'typescript'));
            assert.ok(updated?.evolving_profile.topics.some(t => t.name === 'testing'));
        });

        test('should increment existing topic count', async () => {
            const profile = await manager.addProfile({
                name: 'Topic Count Test',
                persona: 'Test',
                tone: 'formal',
                styleGuidelines: [],
            });

            await manager.evolveProfile(profile.id, 'First prompt', ['typescript']);
            await manager.evolveProfile(profile.id, 'Second prompt', ['typescript']);

            const updated = (await manager.getProfiles()).list.find(p => p.id === profile.id);
            const typescriptTopic = updated?.evolving_profile.topics.find(t => t.name === 'typescript');
            assert.strictEqual(typescriptTopic?.count, 2);
        });

        test('should limit topics to maximum', async () => {
            const profile = await manager.addProfile({
                name: 'Topic Limit Test',
                persona: 'Test',
                tone: 'formal',
                styleGuidelines: [],
            });

            // Add 15 different topics (limit is 10)
            const topics = Array.from({ length: 15 }, (_, i) => `topic-${i}`);
            await manager.evolveProfile(profile.id, 'Test prompt', topics);

            const updated = (await manager.getProfiles()).list.find(p => p.id === profile.id);
            assert.ok(updated && updated.evolving_profile.topics.length <= 10, 'Should respect topic limit');
        });

        test('should update lastPrompt and lastUpdated', async () => {
            const profile = await manager.addProfile({
                name: 'Timestamp Test',
                persona: 'Test',
                tone: 'formal',
                styleGuidelines: [],
            });

            const prompt = 'This is a test prompt for tracking';
            await manager.evolveProfile(profile.id, prompt);

            const updated = (await manager.getProfiles()).list.find(p => p.id === profile.id);
            assert.ok(updated?.evolving_profile.lastPrompt.includes('This is a test prompt'));
            assert.ok(updated?.evolving_profile.lastUpdated);
        });

        test('should handle evolving non-existent profile gracefully', async () => {
            // Should not throw error
            await manager.evolveProfile('non-existent-id', 'Test prompt');
        });

        test('should normalize topic names (case-insensitive)', async () => {
            const profile = await manager.addProfile({
                name: 'Case Test',
                persona: 'Test',
                tone: 'formal',
                styleGuidelines: [],
            });

            await manager.evolveProfile(profile.id, 'First', ['TypeScript']);
            await manager.evolveProfile(profile.id, 'Second', ['typescript']);

            const updated = (await manager.getProfiles()).list.find(p => p.id === profile.id);
            // Should have only one topic (case-insensitive merge)
            const typescriptTopics = updated?.evolving_profile.topics.filter(
                t => t.name.toLowerCase() === 'typescript'
            );
            assert.strictEqual(typescriptTopics?.length, 1, 'Should merge case-insensitive topics');
        });
    });

    suite('Import/Export', () => {
        test('should export profiles to JSON', async () => {
            await manager.addProfile({
                name: 'Export Test',
                persona: 'Test Persona',
                tone: 'professional',
                styleGuidelines: ['Guide 1'],
            });

            const json = await manager.exportProfiles();
            const data = JSON.parse(json);

            assert.ok(data.schemaVersion, 'Should have schema version');
            assert.ok(data.exportedAt, 'Should have export timestamp');
            assert.ok(Array.isArray(data.profiles), 'Should have profiles array');
            assert.ok(data.profiles.length > 0, 'Should have at least one profile');
        });

        test('should import profiles from JSON', async () => {
            const importData = {
                schemaVersion: 1,
                exportedAt: new Date().toISOString(),
                profiles: [
                    {
                        name: 'Imported Profile',
                        persona: 'Imported Persona',
                        tone: 'casual',
                        styleGuidelines: ['Imported Guide'],
                    },
                ],
            };

            const json = JSON.stringify(importData);
            const count = await manager.importProfiles(json);

            assert.strictEqual(count, 1, 'Should import one profile');

            const profiles = await manager.getProfiles();
            const imported = profiles.list.find(p => p.name === 'Imported Profile');
            assert.ok(imported, 'Should find imported profile');
            assert.strictEqual(imported?.persona, 'Imported Persona');
        });

        test('should throw error on invalid import format', async () => {
            await assert.rejects(
                async () => await manager.importProfiles('{}'),
                /Invalid profile export format/
            );
        });

        test('should skip invalid profiles during import', async () => {
            const importData = {
                profiles: [
                    { name: 'Valid', persona: 'Test', tone: 'formal' },
                    { name: 'Invalid' }, // Missing required fields
                ],
            };

            const count = await manager.importProfiles(JSON.stringify(importData));
            assert.strictEqual(count, 1, 'Should import only valid profile');
        });

        test('should preserve evolving_profile during import if provided', async () => {
            const importData = {
                profiles: [
                    {
                        name: 'Profile with Evolution',
                        persona: 'Test',
                        tone: 'formal',
                        styleGuidelines: [],
                        evolving_profile: {
                            topics: [{ name: 'existing', count: 5, lastUsed: new Date().toISOString() }],
                            lastUpdated: new Date().toISOString(),
                            usageCount: 10,
                            lastPrompt: 'Previous prompt',
                        },
                    },
                ],
            };

            await manager.importProfiles(JSON.stringify(importData));

            const profiles = await manager.getProfiles();
            const imported = profiles.list.find(p => p.name === 'Profile with Evolution');
            assert.strictEqual(imported?.evolving_profile.usageCount, 10);
            assert.strictEqual(imported?.evolving_profile.topics.length, 1);
        });
    });

    suite('Reset to Defaults', () => {
        test('should reset to default profiles', async () => {
            // Add some custom profiles
            await manager.addProfile({
                name: 'Custom',
                persona: 'Test',
                tone: 'formal',
                styleGuidelines: [],
            });

            const beforeReset = await manager.getProfiles();
            const countBefore = beforeReset.list.length;

            await manager.resetToDefaults();

            const afterReset = await manager.getProfiles();
            // Should have only default profiles now
            assert.ok(afterReset.list.length > 0, 'Should have default profiles');
            assert.ok(!afterReset.list.find(p => p.name === 'Custom'), 'Custom profile should be removed');
        });

        test('should clear active profile when resetting', async () => {
            const profile = await manager.addProfile({
                name: 'Custom',
                persona: 'Test',
                tone: 'formal',
                styleGuidelines: [],
            });

            await manager.setActiveProfile(profile.id);

            await manager.resetToDefaults();

            const config = await manager.getProfiles();
            assert.strictEqual(config.activeProfileId, null);
        });
    });
});
