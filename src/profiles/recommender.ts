/**
 * Profile recommendation system
 * Analyzes prompts and suggests the best profile to use
 */

import { Profile } from './types';

interface RecommendationResult {
  profile: Profile | null;
  confidence: number;
  reason: string;
}

export class ProfileRecommender {
  /**
   * Recommend a profile based on prompt content
   */
  static recommend(prompt: string, profiles: Profile[]): RecommendationResult {
    if (profiles.length === 0) {
      return {
        profile: null,
        confidence: 0,
        reason: 'No profiles available'
      };
    }

    const scores = profiles.map(profile => ({
      profile,
      score: this.calculateScore(prompt, profile),
      reason: this.getReasonForProfile(prompt, profile)
    }));

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    const best = scores[0];

    // Only recommend if confidence is high enough (> 0.3)
    if (best.score > 0.3) {
      return {
        profile: best.profile,
        confidence: Math.min(best.score, 1.0),
        reason: best.reason
      };
    }

    return {
      profile: null,
      confidence: 0,
      reason: 'No clear profile match'
    };
  }

  /**
   * Calculate score for how well a profile matches the prompt
   */
  private static calculateScore(prompt: string, profile: Profile): number {
    const lowerPrompt = prompt.toLowerCase();
    let score = 0;

    // Check persona keywords
    const personaKeywords = this.extractKeywords(profile.persona);
    for (const keyword of personaKeywords) {
      if (lowerPrompt.includes(keyword.toLowerCase())) {
        score += 0.3;
      }
    }

    // Check style guidelines
    for (const guideline of profile.styleGuidelines) {
      const guidelineKeywords = this.extractKeywords(guideline);
      for (const keyword of guidelineKeywords) {
        if (lowerPrompt.includes(keyword.toLowerCase())) {
          score += 0.2;
        }
      }
    }

    // Check evolving topics
    if (profile.evolving_profile && profile.evolving_profile.topics) {
      for (const topic of profile.evolving_profile.topics) {
        if (lowerPrompt.includes(topic.name.toLowerCase())) {
          // Weight by topic count (more used = more relevant)
          score += 0.15 * Math.min(topic.count / 10, 1);
        }
      }
    }

    // Pattern matching for common use cases
    score += this.matchPatterns(lowerPrompt, profile);

    return score;
  }

  /**
   * Match common patterns to profiles
   */
  private static matchPatterns(prompt: string, profile: Profile): number {
    let score = 0;

    // Code-related patterns
    const codePatterns = [
      'function', 'class', 'method', 'code', 'implement', 'algorithm',
      'refactor', 'optimize', 'debug', 'fix', 'error', 'bug',
      'create', 'build', 'develop', 'program', 'script', 'app', 'application',
      'docker', 'dockerfile', 'container', 'deploy', 'api', 'endpoint',
      'component', 'module', 'package', 'library', 'framework',
      '.net', 'python', 'java', 'javascript', 'typescript', 'react', 'vue',
      'node', 'express', 'django', 'flask', 'spring', 'laravel',
      'database', 'sql', 'mongodb', 'postgres', 'mysql',
      'service', 'microservice', 'architecture', 'design pattern',
      'variable', 'loop', 'conditional', 'async', 'await', 'promise'
    ];

    const docPatterns = [
      'document', 'explain', 'describe', 'write', 'readme', 'guide',
      'tutorial', 'help', 'how to', 'what is', 'documentation',
      'comment', 'comments', 'instruction', 'instructions'
    ];

    const testPatterns = [
      'test', 'spec', 'unit test', 'integration', 'coverage', 'assert',
      'testing', 'jest', 'mocha', 'pytest', 'junit'
    ];

    const marketingPatterns = [
      'marketing', 'sell', 'persuade', 'convert', 'campaign', 'audience',
      'engagement', 'brand', 'message', 'copy', 'advertisement',
      'promotion', 'customer', 'user acquisition'
    ];

    // Check if profile is code-focused
    if (profile.persona.toLowerCase().includes('developer') ||
        profile.persona.toLowerCase().includes('engineer') ||
        profile.name.toLowerCase().includes('dev')) {
      if (codePatterns.some(p => prompt.includes(p))) {
        score += 0.4;
      }
      if (testPatterns.some(p => prompt.includes(p))) {
        score += 0.3;
      }
    }

    // Check if profile is documentation-focused
    if (profile.persona.toLowerCase().includes('writer') ||
        profile.persona.toLowerCase().includes('technical writer') ||
        profile.name.toLowerCase().includes('doc')) {
      if (docPatterns.some(p => prompt.includes(p))) {
        score += 0.4;
      }
    }

    // Check if profile is marketing-focused
    if (profile.persona.toLowerCase().includes('marketing') ||
        profile.persona.toLowerCase().includes('copywriter') ||
        profile.name.toLowerCase().includes('marketing')) {
      if (marketingPatterns.some(p => prompt.includes(p))) {
        score += 0.4;
      }
    }

    return score;
  }

  /**
   * Get human-readable reason for profile recommendation
   */
  private static getReasonForProfile(prompt: string, profile: Profile): string {
    const lowerPrompt = prompt.toLowerCase();

    // Check what matched - be more specific
    if (lowerPrompt.includes('docker') || lowerPrompt.includes('container')) {
      if (profile.persona.toLowerCase().includes('developer') ||
          profile.name.toLowerCase().includes('dev')) {
        return `Best for DevOps and containerization tasks`;
      }
    }

    if (lowerPrompt.includes('function') || lowerPrompt.includes('code') ||
        lowerPrompt.includes('implement') || lowerPrompt.includes('create') ||
        lowerPrompt.includes('build') || lowerPrompt.includes('develop')) {
      if (profile.persona.toLowerCase().includes('developer') ||
          profile.name.toLowerCase().includes('dev')) {
        return `Best for code development and implementation`;
      }
    }

    if (lowerPrompt.includes('api') || lowerPrompt.includes('endpoint') ||
        lowerPrompt.includes('service')) {
      if (profile.persona.toLowerCase().includes('developer')) {
        return `Optimized for API and service development`;
      }
    }

    if (lowerPrompt.includes('document') || lowerPrompt.includes('explain') ||
        lowerPrompt.includes('describe')) {
      if (profile.persona.toLowerCase().includes('writer')) {
        return `Best for documentation and explanations`;
      }
    }

    if (lowerPrompt.includes('debug') || lowerPrompt.includes('error') ||
        lowerPrompt.includes('fix')) {
      if (profile.persona.toLowerCase().includes('developer')) {
        return `Optimized for debugging and problem-solving`;
      }
    }

    if (lowerPrompt.includes('test')) {
      return `Good for testing-related tasks`;
    }

    // Check topic overlap
    if (profile.evolving_profile && profile.evolving_profile.topics) {
      const matchedTopics = profile.evolving_profile.topics
        .filter(t => lowerPrompt.includes(t.name.toLowerCase()))
        .map(t => t.name);

      if (matchedTopics.length > 0) {
        return `You've used this profile for: ${matchedTopics.slice(0, 3).join(', ')}`;
      }
    }

    return `Matches your typical ${profile.persona.toLowerCase()} workflow`;
  }

  /**
   * Extract keywords from text
   */
  private static extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
  }

  /**
   * Get all recommendations ranked
   */
  static getAllRecommendations(prompt: string, profiles: Profile[]): Array<RecommendationResult & { profile: Profile }> {
    if (profiles.length === 0) {
      return [];
    }

    const scores = profiles.map(profile => {
      const score = this.calculateScore(prompt, profile);
      return {
        profile,
        confidence: Math.min(score, 1.0),
        reason: this.getReasonForProfile(prompt, profile)
      };
    });

    // Sort by confidence descending
    return scores
      .filter(s => s.confidence > 0.1)
      .sort((a, b) => b.confidence - a.confidence);
  }
}
