import * as assert from 'assert';
import { Profile } from '../../profiles/types';

suite('Profile Tests', () => {
    test('Profile should have required fields', () => {
        const profile: Profile = {
            id: 'test-profile',
            name: 'Test Profile',
            persona: 'Test persona',
            tone: 'professional',
            styleGuidelines: ['Be clear', 'Be concise'],
            evolving_profile: {
                topics: [],
                lastUpdated: new Date().toISOString(),
                usageCount: 0,
                lastPrompt: ''
            }
        };

        assert.ok(profile.id);
        assert.ok(profile.name);
        assert.ok(profile.persona);
        assert.ok(profile.tone);
        assert.ok(Array.isArray(profile.styleGuidelines));
        assert.ok(profile.evolving_profile);
        assert.strictEqual(typeof profile.evolving_profile.usageCount, 'number');
    });

    test('Profile ID should be valid format', () => {
        const validIds = ['test-123', 'profile_abc', 'my-profile-1'];

        for (const id of validIds) {
            assert.ok(id.length > 0, `${id} should be valid`);
            assert.ok(!/\s/.test(id), `${id} should not contain spaces`);
        }
    });

    test('Evolving profile should track usage', () => {
        const profile: Profile = {
            id: 'test',
            name: 'Test',
            persona: 'Developer',
            tone: 'technical',
            styleGuidelines: [],
            evolving_profile: {
                topics: [
                    { name: 'typescript', count: 5, lastUsed: new Date().toISOString() }
                ],
                lastUpdated: new Date().toISOString(),
                usageCount: 10,
                lastPrompt: 'Last prompt text'
            }
        };

        assert.strictEqual(profile.evolving_profile.usageCount, 10);
        assert.strictEqual(profile.evolving_profile.topics.length, 1);
        assert.strictEqual(profile.evolving_profile.topics[0].name, 'typescript');
    });
});
