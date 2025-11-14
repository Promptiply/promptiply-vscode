/**
 * Test fixtures and helpers
 */

import { Profile, RefinementResult } from '../../profiles/types';
import { HistoryEntry } from '../../history/types';

export function createMockProfile(overrides?: Partial<Profile>): Profile {
    return {
        id: 'test-profile-id',
        name: 'Test Profile',
        persona: 'A helpful test assistant',
        tone: 'professional',
        styleGuidelines: ['Be clear', 'Be concise'],
        evolving_profile: {
            topics: [],
            lastUpdated: new Date().toISOString(),
            usageCount: 0,
            lastPrompt: '',
        },
        ...overrides,
    };
}

export function createMockHistoryEntry(overrides?: Partial<HistoryEntry>): HistoryEntry {
    return {
        id: 'test-entry-id',
        timestamp: Date.now(),
        originalPrompt: 'Original test prompt',
        refinedPrompt: 'Refined test prompt',
        profile: 'Test Profile',
        mode: 'vscode-lm',
        isEconomy: true,
        tokenUsage: {
            input: 100,
            output: 200,
        },
        ...overrides,
    };
}

export function createMockRefinementResult(overrides?: Partial<RefinementResult>): RefinementResult {
    return {
        refinedPrompt: 'This is a refined test prompt',
        topics: ['testing', 'typescript'],
        tokenUsage: {
            input: 50,
            output: 100,
        },
        ...overrides,
    };
}

export function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockProfiles(count: number = 3): Profile[] {
    return Array.from({ length: count }, (_, i) => createMockProfile({
        id: `profile-${i}`,
        name: `Profile ${i}`,
        persona: `Persona ${i}`,
    }));
}
