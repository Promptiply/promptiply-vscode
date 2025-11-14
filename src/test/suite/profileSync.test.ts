/**
 * Comprehensive tests for Profile Sync
 */

import * as assert from 'assert';
import { ProfileSyncManager } from '../../profiles/sync';
import { ProfileManager } from '../../profiles/manager';
import { createMockContext } from '../helpers/mockContext';
import { createMockProfile } from '../helpers/fixtures';

suite('Profile Sync Tests', () => {
    let syncManager: ProfileSyncManager;
    let profileManager: ProfileManager;
    let context: any;

    beforeEach(() => {
        context = createMockContext();
        profileManager = new ProfileManager(context);
        syncManager = new ProfileSyncManager(context, profileManager);
    });

    suite('Sync File Path Management', () => {
        test('should get default sync file path', () => {
            const path = syncManager.getSyncFilePath();
            assert.ok(path, 'Should have a sync file path');
            assert.ok(path.includes('.promptiply-profiles.json'), 'Should use default filename');
        });

        test('should update sync file path', async () => {
            const newPath = '/custom/path/sync.json';
            await syncManager.setSyncFilePath(newPath);
            const path = syncManager.getSyncFilePath();
            assert.strictEqual(path, newPath);
        });
    });

    suite('Sync Data Validation', () => {
        test('should validate correct sync data format', () => {
            const validData = {
                list: [
                    {
                        id: 'profile-1',
                        name: 'Test Profile',
                        persona: 'Test persona',
                        tone: 'professional',
                        styleGuidelines: ['Guide 1'],
                        evolving_profile: {
                            topics: [],
                            lastUpdated: new Date().toISOString(),
                            usageCount: 0,
                            lastPrompt: '',
                        },
                    },
                ],
                activeProfileId: 'profile-1',
            };

            // Access private method via type assertion for testing
            const isValid = (syncManager as any).validateSyncData(validData);
            assert.strictEqual(isValid, true, 'Should validate correct format');
        });

        test('should reject data without list array', () => {
            const invalidData = {
                activeProfileId: null,
            };

            const isValid = (syncManager as any).validateSyncData(invalidData);
            assert.strictEqual(isValid, false, 'Should reject missing list');
        });

        test('should reject data with non-array list', () => {
            const invalidData = {
                list: 'not an array',
                activeProfileId: null,
            };

            const isValid = (syncManager as any).validateSyncData(invalidData);
            assert.strictEqual(isValid, false, 'Should reject non-array list');
        });

        test('should reject invalid activeProfileId type', () => {
            const invalidData = {
                list: [],
                activeProfileId: 123, // Should be string or null
            };

            const isValid = (syncManager as any).validateSyncData(invalidData);
            assert.strictEqual(isValid, false, 'Should reject invalid activeProfileId type');
        });

        test('should accept null activeProfileId', () => {
            const validData = {
                list: [
                    {
                        id: 'profile-1',
                        name: 'Test',
                        persona: 'Test',
                        tone: 'formal',
                        styleGuidelines: [],
                        evolving_profile: {
                            topics: [],
                            lastUpdated: new Date().toISOString(),
                            usageCount: 0,
                            lastPrompt: '',
                        },
                    },
                ],
                activeProfileId: null,
            };

            const isValid = (syncManager as any).validateSyncData(validData);
            assert.strictEqual(isValid, true, 'Should accept null activeProfileId');
        });

        test('should reject profiles missing required fields', () => {
            const invalidData = {
                list: [
                    {
                        id: 'profile-1',
                        name: 'Test',
                        // Missing persona, tone, etc.
                    },
                ],
                activeProfileId: null,
            };

            const isValid = (syncManager as any).validateSyncData(invalidData);
            assert.strictEqual(isValid, false, 'Should reject incomplete profiles');
        });

        test('should reject profiles with invalid styleGuidelines', () => {
            const invalidData = {
                list: [
                    {
                        id: 'profile-1',
                        name: 'Test',
                        persona: 'Test',
                        tone: 'formal',
                        styleGuidelines: 'not an array', // Should be array
                        evolving_profile: {
                            topics: [],
                            lastUpdated: new Date().toISOString(),
                            usageCount: 0,
                            lastPrompt: '',
                        },
                    },
                ],
                activeProfileId: null,
            };

            const isValid = (syncManager as any).validateSyncData(invalidData);
            assert.strictEqual(isValid, false, 'Should reject invalid styleGuidelines');
        });

        test('should reject profiles with missing evolving_profile', () => {
            const invalidData = {
                list: [
                    {
                        id: 'profile-1',
                        name: 'Test',
                        persona: 'Test',
                        tone: 'formal',
                        styleGuidelines: [],
                        // Missing evolving_profile
                    },
                ],
                activeProfileId: null,
            };

            const isValid = (syncManager as any).validateSyncData(invalidData);
            assert.strictEqual(isValid, false, 'Should reject missing evolving_profile');
        });

        test('should reject profiles with invalid evolving_profile.topics', () => {
            const invalidData = {
                list: [
                    {
                        id: 'profile-1',
                        name: 'Test',
                        persona: 'Test',
                        tone: 'formal',
                        styleGuidelines: [],
                        evolving_profile: {
                            topics: 'not an array', // Should be array
                            lastUpdated: new Date().toISOString(),
                            usageCount: 0,
                            lastPrompt: '',
                        },
                    },
                ],
                activeProfileId: null,
            };

            const isValid = (syncManager as any).validateSyncData(invalidData);
            assert.strictEqual(isValid, false, 'Should reject invalid topics');
        });

        test('should validate empty profile list', () => {
            const validData = {
                list: [],
                activeProfileId: null,
            };

            const isValid = (syncManager as any).validateSyncData(validData);
            assert.strictEqual(isValid, true, 'Should accept empty list');
        });

        test('should validate multiple profiles', () => {
            const validData = {
                list: [
                    createMockProfile({ id: 'profile-1' }),
                    createMockProfile({ id: 'profile-2' }),
                    createMockProfile({ id: 'profile-3' }),
                ],
                activeProfileId: 'profile-2',
            };

            const isValid = (syncManager as any).validateSyncData(validData);
            assert.strictEqual(isValid, true, 'Should validate multiple profiles');
        });

        test('should reject null or undefined data', () => {
            assert.strictEqual((syncManager as any).validateSyncData(null), false);
            assert.strictEqual((syncManager as any).validateSyncData(undefined), false);
        });

        test('should reject non-object data', () => {
            assert.strictEqual((syncManager as any).validateSyncData('string'), false);
            assert.strictEqual((syncManager as any).validateSyncData(123), false);
            assert.strictEqual((syncManager as any).validateSyncData([]), false);
        });
    });

    suite('Sync Configuration', () => {
        test('should check if sync is enabled from config', () => {
            const enabled = syncManager.isSyncEnabled();
            // Should return boolean based on config
            assert.strictEqual(typeof enabled, 'boolean');
        });
    });

    suite('Profile Evolution in Sync', () => {
        test('should preserve evolving profile data in sync format', () => {
            const profile = createMockProfile({
                id: 'test-1',
                evolving_profile: {
                    topics: [
                        { name: 'typescript', count: 5, lastUsed: new Date().toISOString() },
                        { name: 'testing', count: 3, lastUsed: new Date().toISOString() },
                    ],
                    lastUpdated: new Date().toISOString(),
                    usageCount: 10,
                    lastPrompt: 'Last prompt text',
                },
            });

            const syncData = {
                list: [profile],
                activeProfileId: 'test-1',
            };

            const isValid = (syncManager as any).validateSyncData(syncData);
            assert.strictEqual(isValid, true, 'Should validate with evolution data');
        });

        test('should validate complex topic structures', () => {
            const profile = createMockProfile({
                id: 'test-1',
                evolving_profile: {
                    topics: [
                        { name: 'react', count: 15, lastUsed: new Date().toISOString() },
                        { name: 'vue', count: 8, lastUsed: new Date().toISOString() },
                        { name: 'angular', count: 3, lastUsed: new Date().toISOString() },
                    ],
                    lastUpdated: new Date().toISOString(),
                    usageCount: 50,
                    lastPrompt: 'Complex prompt about frameworks',
                },
            });

            const syncData = {
                list: [profile],
                activeProfileId: 'test-1',
            };

            const isValid = (syncManager as any).validateSyncData(syncData);
            assert.strictEqual(isValid, true);
        });
    });

    suite('Chrome Extension Compatibility', () => {
        test('should use Chrome extension storage format', () => {
            // Chrome extension format: {list, activeProfileId}
            const chromeFormat = {
                list: [createMockProfile()],
                activeProfileId: 'test-profile-id',
            };

            const isValid = (syncManager as any).validateSyncData(chromeFormat);
            assert.strictEqual(isValid, true, 'Should be compatible with Chrome format');
        });

        test('should handle Chrome extension profile structure', () => {
            const chromeProfile = {
                id: 'chrome-profile-1',
                name: 'Chrome Profile',
                persona: 'Chrome Persona',
                tone: 'professional',
                styleGuidelines: ['Chrome Guide 1', 'Chrome Guide 2'],
                evolving_profile: {
                    topics: [{ name: 'chrome', count: 1, lastUsed: new Date().toISOString() }],
                    lastUpdated: new Date().toISOString(),
                    usageCount: 5,
                    lastPrompt: 'Chrome prompt',
                },
            };

            const chromeData = {
                list: [chromeProfile],
                activeProfileId: 'chrome-profile-1',
            };

            const isValid = (syncManager as any).validateSyncData(chromeData);
            assert.strictEqual(isValid, true, 'Should accept Chrome extension profiles');
        });
    });

    suite('Edge Cases', () => {
        test('should handle profile with empty topics', () => {
            const profile = createMockProfile({
                evolving_profile: {
                    topics: [],
                    lastUpdated: new Date().toISOString(),
                    usageCount: 0,
                    lastPrompt: '',
                },
            });

            const syncData = {
                list: [profile],
                activeProfileId: null,
            };

            const isValid = (syncManager as any).validateSyncData(syncData);
            assert.strictEqual(isValid, true);
        });

        test('should handle profile with many topics', () => {
            const topics = Array.from({ length: 50 }, (_, i) => ({
                name: `topic-${i}`,
                count: i + 1,
                lastUsed: new Date().toISOString(),
            }));

            const profile = createMockProfile({
                evolving_profile: {
                    topics,
                    lastUpdated: new Date().toISOString(),
                    usageCount: 100,
                    lastPrompt: 'Test',
                },
            });

            const syncData = {
                list: [profile],
                activeProfileId: null,
            };

            const isValid = (syncManager as any).validateSyncData(syncData);
            assert.strictEqual(isValid, true);
        });

        test('should handle profile with empty styleGuidelines', () => {
            const profile = createMockProfile({
                styleGuidelines: [],
            });

            const syncData = {
                list: [profile],
                activeProfileId: null,
            };

            const isValid = (syncManager as any).validateSyncData(syncData);
            assert.strictEqual(isValid, true);
        });

        test('should handle profile with many styleGuidelines', () => {
            const profile = createMockProfile({
                styleGuidelines: Array.from({ length: 20 }, (_, i) => `Guideline ${i + 1}`),
            });

            const syncData = {
                list: [profile],
                activeProfileId: null,
            };

            const isValid = (syncManager as any).validateSyncData(syncData);
            assert.strictEqual(isValid, true);
        });

        test('should handle very long prompt text', () => {
            const longPrompt = 'A'.repeat(10000);
            const profile = createMockProfile({
                evolving_profile: {
                    topics: [],
                    lastUpdated: new Date().toISOString(),
                    usageCount: 1,
                    lastPrompt: longPrompt,
                },
            });

            const syncData = {
                list: [profile],
                activeProfileId: null,
            };

            const isValid = (syncManager as any).validateSyncData(syncData);
            assert.strictEqual(isValid, true);
        });

        test('should handle special characters in profile fields', () => {
            const profile = createMockProfile({
                name: 'Profile™ with 特殊字符 & émojis 🚀',
                persona: 'Persona <with> "quotes" & \'apostrophes\'',
                tone: 'casual™',
            });

            const syncData = {
                list: [profile],
                activeProfileId: null,
            };

            const isValid = (syncManager as any).validateSyncData(syncData);
            assert.strictEqual(isValid, true);
        });
    });
});
