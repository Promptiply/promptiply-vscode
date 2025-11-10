/**
 * Recommendation Learning System
 * Tracks user feedback on recommendations to improve future suggestions
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface RecommendationFeedback {
  profileId: string;
  profileName: string;
  promptPreview: string; // First 100 chars
  confidence: number;
  accepted: boolean;
  timestamp: number;
  keywords: string[]; // Keywords extracted from prompt
}

interface ProfileStats {
  profileId: string;
  profileName: string;
  totalRecommendations: number;
  accepted: number;
  rejected: number;
  acceptanceRate: number;
  commonKeywords: Map<string, number>; // keyword -> count
}

export class RecommendationLearning {
  private static feedbackFile: string;
  private static feedback: RecommendationFeedback[] = [];
  private static maxFeedbackEntries = 1000;

  /**
   * Initialize the learning system
   */
  static async initialize(context: vscode.ExtensionContext): Promise<void> {
    this.feedbackFile = path.join(
      context.globalStorageUri.fsPath,
      'recommendation-feedback.json'
    );

    // Ensure directory exists
    const dir = path.dirname(this.feedbackFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Load existing feedback
    await this.loadFeedback();
  }

  /**
   * Record user feedback on a recommendation
   */
  static async recordFeedback(
    profileId: string,
    profileName: string,
    prompt: string,
    confidence: number,
    accepted: boolean
  ): Promise<void> {
    const keywords = this.extractKeywords(prompt);

    const feedback: RecommendationFeedback = {
      profileId,
      profileName,
      promptPreview: prompt.substring(0, 100),
      confidence,
      accepted,
      timestamp: Date.now(),
      keywords,
    };

    this.feedback.push(feedback);

    // Keep only recent entries
    if (this.feedback.length > this.maxFeedbackEntries) {
      this.feedback = this.feedback.slice(-this.maxFeedbackEntries);
    }

    await this.saveFeedback();
  }

  /**
   * Get statistics for all profiles
   */
  static getProfileStats(): ProfileStats[] {
    const statsMap = new Map<string, ProfileStats>();

    for (const entry of this.feedback) {
      if (!statsMap.has(entry.profileId)) {
        statsMap.set(entry.profileId, {
          profileId: entry.profileId,
          profileName: entry.profileName,
          totalRecommendations: 0,
          accepted: 0,
          rejected: 0,
          acceptanceRate: 0,
          commonKeywords: new Map(),
        });
      }

      const stats = statsMap.get(entry.profileId)!;
      stats.totalRecommendations++;

      if (entry.accepted) {
        stats.accepted++;

        // Track keywords for accepted recommendations
        for (const keyword of entry.keywords) {
          const count = stats.commonKeywords.get(keyword) || 0;
          stats.commonKeywords.set(keyword, count + 1);
        }
      } else {
        stats.rejected++;
      }
    }

    // Calculate acceptance rates
    const result: ProfileStats[] = [];
    for (const stats of statsMap.values()) {
      stats.acceptanceRate = stats.totalRecommendations > 0
        ? stats.accepted / stats.totalRecommendations
        : 0;
      result.push(stats);
    }

    return result.sort((a, b) => b.acceptanceRate - a.acceptanceRate);
  }

  /**
   * Adjust confidence based on historical performance
   */
  static adjustConfidence(
    profileId: string,
    baseConfidence: number,
    promptKeywords: string[]
  ): number {
    const stats = this.getProfileStats().find(s => s.profileId === profileId);
    if (!stats || stats.totalRecommendations < 3) {
      return baseConfidence; // Not enough data
    }

    // Factor 1: Overall acceptance rate (weight: 0.3)
    const acceptanceBonus = (stats.acceptanceRate - 0.5) * 0.3;

    // Factor 2: Keyword match (weight: 0.2)
    let keywordBonus = 0;
    if (stats.commonKeywords.size > 0) {
      const matchingKeywords = promptKeywords.filter(k =>
        stats.commonKeywords.has(k)
      );
      if (matchingKeywords.length > 0) {
        keywordBonus = 0.2 * (matchingKeywords.length / promptKeywords.length);
      }
    }

    // Apply adjustments (max ±30%)
    const adjustment = Math.max(-0.3, Math.min(0.3, acceptanceBonus + keywordBonus));
    const adjustedConfidence = baseConfidence + adjustment;

    return Math.max(0, Math.min(1, adjustedConfidence));
  }

  /**
   * Get recommendation insights
   */
  static getInsights(): string[] {
    const stats = this.getProfileStats();
    const insights: string[] = [];

    if (stats.length === 0) {
      insights.push('No recommendation history yet');
      return insights;
    }

    // Top accepted profile
    const topProfile = stats[0];
    if (topProfile.accepted > 0) {
      insights.push(
        `You accept "${topProfile.profileName}" recommendations ${Math.round(topProfile.acceptanceRate * 100)}% of the time`
      );
    }

    // Most common keywords
    const allKeywords = new Map<string, number>();
    for (const stat of stats) {
      for (const [keyword, count] of stat.commonKeywords) {
        allKeywords.set(keyword, (allKeywords.get(keyword) || 0) + count);
      }
    }

    const topKeywords = Array.from(allKeywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword]) => keyword);

    if (topKeywords.length > 0) {
      insights.push(`Common keywords in accepted prompts: ${topKeywords.join(', ')}`);
    }

    // Total feedback
    const totalFeedback = this.feedback.length;
    const totalAccepted = this.feedback.filter(f => f.accepted).length;
    insights.push(
      `Overall: ${totalAccepted} accepted out of ${totalFeedback} recommendations (${Math.round((totalAccepted / totalFeedback) * 100)}%)`
    );

    return insights;
  }

  /**
   * Extract keywords from prompt
   */
  private static extractKeywords(prompt: string): string[] {
    return prompt
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 20); // Max 20 keywords
  }

  /**
   * Load feedback from disk
   */
  private static async loadFeedback(): Promise<void> {
    try {
      if (fs.existsSync(this.feedbackFile)) {
        const data = fs.readFileSync(this.feedbackFile, 'utf8');
        const parsed = JSON.parse(data);
        this.feedback = parsed.feedback || [];
      }
    } catch (error) {
      console.error('Failed to load recommendation feedback:', error);
      this.feedback = [];
    }
  }

  /**
   * Save feedback to disk
   */
  private static async saveFeedback(): Promise<void> {
    try {
      const data = {
        feedback: this.feedback,
        version: 1,
      };
      fs.writeFileSync(this.feedbackFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save recommendation feedback:', error);
    }
  }

  /**
   * Clear all feedback (for testing)
   */
  static async clearFeedback(): Promise<void> {
    this.feedback = [];
    await this.saveFeedback();
  }
}
