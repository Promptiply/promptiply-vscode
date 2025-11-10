import * as assert from 'assert';
import { Profile } from '../../profiles/types';

suite('Profile Tests', () => {
    test('Profile should have required fields', () => {
        const profile: Profile = {
            id: 'test-profile',
            name: 'Test Profile',
            systemPrompt: 'Test system prompt',
            userPromptTemplate: 'Test template',
            usageCount: 0,
            createdAt: Date.now(),
            evolving_profile: {
                topics: []
            }
        };

        assert.ok(profile.id);
        assert.ok(profile.name);
        assert.ok(profile.systemPrompt);
        assert.ok(profile.userPromptTemplate);
        assert.strictEqual(typeof profile.usageCount, 'number');
        assert.strictEqual(typeof profile.createdAt, 'number');
    });

    test('Profile ID should be valid format', () => {
        const validIds = ['test-123', 'profile_abc', 'my-profile-1'];
        const invalidIds = ['', ' ', 'test profile', 'test@profile'];

        for (const id of validIds) {
            assert.ok(id.length > 0, `${id} should be valid`);
            assert.ok(!/\s/.test(id), `${id} should not contain spaces`);
        }
    });
});
