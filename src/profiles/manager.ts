/**
 * Profile manager - handles loading, saving, and evolving profiles
 */

import * as vscode from 'vscode';
import { Profile, ProfilesConfig, Topic } from './types';
import { getDefaultProfiles, generateProfileId } from './defaults';

const EVOLUTION_TOPIC_LIMIT = 10;
const TOPIC_FREQUENCY_WEIGHT = 0.4;
const TOPIC_RECENCY_WEIGHT = 0.6;

export class ProfileManager {
  private context: vscode.ExtensionContext;
  private cache: ProfilesConfig | null = null;
  private onProfilesChangedEmitter = new vscode.EventEmitter<ProfilesConfig>();

  /**
   * Event that fires when profiles are changed (saved)
   */
  readonly onProfilesChanged = this.onProfilesChangedEmitter.event;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Get all profiles (with caching)
   */
  async getProfiles(): Promise<ProfilesConfig> {
    // Return cached profiles if available
    if (this.cache) {
      return this.cache;
    }

    const stored = this.context.globalState.get<ProfilesConfig>('profiles');

    if (!stored || !stored.list || stored.list.length === 0) {
      // Initialize with default profiles
      const defaults = getDefaultProfiles();
      const config: ProfilesConfig = {
        list: defaults,
        activeProfileId: null,
      };
      await this.saveProfiles(config);
      return config;
    }

    // Cache the loaded profiles
    this.cache = stored;
    return stored;
  }

  /**
   * Invalidate the cache (called when profiles are modified)
   */
  private invalidateCache(): void {
    this.cache = null;
  }

  /**
   * Get active profile
   */
  async getActiveProfile(): Promise<Profile | null> {
    const config = await this.getProfiles();
    if (!config.activeProfileId) {
      return null;
    }
    return config.list.find(p => p.id === config.activeProfileId) || null;
  }

  /**
   * Set active profile
   */
  async setActiveProfile(profileId: string | null): Promise<void> {
    const config = await this.getProfiles();
    config.activeProfileId = profileId;
    await this.saveProfiles(config);
  }

  /**
   * Add a new profile
   */
  async addProfile(profile: Omit<Profile, 'id' | 'evolving_profile'>): Promise<Profile> {
    const config = await this.getProfiles();

    const newProfile: Profile = {
      ...profile,
      id: generateProfileId(),
      evolving_profile: {
        topics: [],
        lastUpdated: new Date().toISOString(),
        usageCount: 0,
        lastPrompt: '',
      },
    };

    config.list.push(newProfile);
    await this.saveProfiles(config);

    return newProfile;
  }

  /**
   * Update an existing profile
   */
  async updateProfile(id: string, updates: Partial<Profile>): Promise<void> {
    const config = await this.getProfiles();
    const index = config.list.findIndex(p => p.id === id);

    if (index === -1) {
      throw new Error(`Profile not found: ${id}`);
    }

    config.list[index] = {
      ...config.list[index],
      ...updates,
    };

    await this.saveProfiles(config);
  }

  /**
   * Delete a profile
   */
  async deleteProfile(id: string): Promise<void> {
    const config = await this.getProfiles();
    config.list = config.list.filter(p => p.id !== id);

    if (config.activeProfileId === id) {
      config.activeProfileId = null;
    }

    await this.saveProfiles(config);
  }

  /**
   * Evolve a profile based on usage
   */
  async evolveProfile(
    profileId: string,
    userPrompt: string,
    newTopics?: string[]
  ): Promise<void> {
    const config = await this.getProfiles();
    const profile = config.list.find(p => p.id === profileId);

    if (!profile) {
      return; // Profile not found, skip evolution
    }

    const now = new Date().toISOString();

    // Update usage count
    profile.evolving_profile.usageCount++;
    profile.evolving_profile.lastUpdated = now;
    profile.evolving_profile.lastPrompt = userPrompt.slice(0, 200);

    // Update topics if provided
    if (newTopics && newTopics.length > 0) {
      const existingTopicsMap = new Map<string, Topic>();

      for (const topic of profile.evolving_profile.topics) {
        existingTopicsMap.set(topic.name.toLowerCase(), topic);
      }

      // Process new topics
      for (const topicName of newTopics) {
        const normalized = topicName.trim().toLowerCase();
        if (!normalized) {
          continue;
        }

        const existing = existingTopicsMap.get(normalized);
        if (existing) {
          // Increment count and update lastUsed
          existing.count++;
          existing.lastUsed = now;
        } else {
          // Add new topic
          existingTopicsMap.set(normalized, {
            name: topicName.trim(),
            count: 1,
            lastUsed: now,
          });
        }
      }

      // Convert back to array and calculate scores
      const topics = Array.from(existingTopicsMap.values());
      const scoredTopics = this.calculateTopicScores(topics);

      // Keep only top N topics
      profile.evolving_profile.topics = scoredTopics
        .slice(0, EVOLUTION_TOPIC_LIMIT);
    }

    await this.saveProfiles(config);
  }

  /**
   * Calculate topic scores based on frequency and recency
   */
  private calculateTopicScores(topics: Topic[]): Topic[] {
    if (topics.length === 0) {
      return [];
    }

    const now = Date.now();

    // Find max count for normalization
    const maxCount = Math.max(...topics.map(t => t.count));

    // Calculate scores
    const scored = topics.map(topic => {
      const frequencyScore = topic.count / maxCount;

      const lastUsedDate = new Date(topic.lastUsed).getTime();
      const daysSinceLastUsed = (now - lastUsedDate) / (1000 * 60 * 60 * 24);
      const recencyScore = 1 / (1 + daysSinceLastUsed);

      const finalScore =
        TOPIC_FREQUENCY_WEIGHT * frequencyScore +
        TOPIC_RECENCY_WEIGHT * recencyScore;

      return {
        topic,
        score: finalScore,
      };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    return scored.map(s => s.topic);
  }

  /**
   * Import profiles from JSON (compatible with Chrome extension)
   */
  async importProfiles(json: string): Promise<number> {
    const data = JSON.parse(json);

    if (!data.profiles || !Array.isArray(data.profiles)) {
      throw new Error('Invalid profile export format');
    }

    const config = await this.getProfiles();
    let imported = 0;

    for (const profile of data.profiles) {
      // Validate profile structure
      if (!profile.name || !profile.persona || !profile.tone) {
        continue;
      }

      // Add profile
      const newProfile: Profile = {
        id: generateProfileId(),
        name: profile.name,
        persona: profile.persona,
        tone: profile.tone,
        styleGuidelines: Array.isArray(profile.styleGuidelines)
          ? profile.styleGuidelines
          : [],
        evolving_profile: profile.evolving_profile || {
          topics: [],
          lastUpdated: new Date().toISOString(),
          usageCount: 0,
          lastPrompt: '',
        },
      };

      config.list.push(newProfile);
      imported++;
    }

    await this.saveProfiles(config);
    return imported;
  }

  /**
   * Export profiles to JSON (compatible with Chrome extension)
   */
  async exportProfiles(): Promise<string> {
    const config = await this.getProfiles();

    const exportData = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      profiles: config.list,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Save profiles to storage
   */
  async saveProfiles(config: ProfilesConfig): Promise<void> {
    this.cache = config; // Update cache immediately
    await this.context.globalState.update('profiles', config);

    // Emit event to notify listeners (e.g., sync manager)
    this.onProfilesChangedEmitter.fire(config);
  }

  /**
   * Reset to default profiles
   */
  async resetToDefaults(): Promise<void> {
    const defaults = getDefaultProfiles();
    const config: ProfilesConfig = {
      list: defaults,
      activeProfileId: null,
    };
    await this.saveProfiles(config);
  }
}
