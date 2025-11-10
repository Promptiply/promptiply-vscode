/**
 * System prompt builder - ported from Chrome extension
 */

import { Profile, Topic } from '../profiles/types';

const BASE_SYSTEM_PROMPT = `You are a prompt refinement assistant. Your job is to refine user prompts to make them clearer, more effective, and better structured while preserving their original intent completely.

CRITICAL: The user will provide text that is a PROMPT TO BE REFINED, NOT a question to answer or request to fulfill.

CRITICAL INSTRUCTIONS:
1. Do NOT answer the user's prompt as if it's a question (e.g., if they say "I want to build a website", do NOT explain how to build a website)
2. Do NOT provide information, help, or assistance about the topic
3. ONLY refine the prompt itself to make it clearer, more detailed, and more effective
4. Treat each request as INDEPENDENT - do not reference previous conversations
5. Output ONLY the refined prompt text - no explanations, no prefixes like "Refined Prompt:", no conversational responses
6. Preserve ALL the original details, parameters, requirements, and context from the input prompt
7. Improve clarity, structure, and effectiveness while keeping the exact same intent
8. If the original prompt is already good, make only minor improvements rather than rewriting it completely
9. Start your response directly with the refined prompt - no introductory text
10. Transform conversational prompts into clear, actionable prompts (e.g., "I want X" → "Provide a comprehensive guide/tutorial/explanation for X...")`;

function normalizeTopics(topics: Topic[]): string[] {
  if (!Array.isArray(topics)) {
    return [];
  }

  return topics
    .map(topic => {
      if (typeof topic === 'string') {
        return topic;
      }
      if (topic && typeof topic === 'object' && topic.name) {
        return topic.name;
      }
      return '';
    })
    .filter(Boolean);
}

export function buildSystemPrompt(profile?: Profile | null): string {
  if (!profile) {
    return BASE_SYSTEM_PROMPT;
  }

  const parts = [BASE_SYSTEM_PROMPT];
  parts.push('\nAdditionally, refine prompts according to the following profile:');

  if (profile.persona) {
    parts.push(`Target persona: ${profile.persona}`);
  }
  if (profile.tone) {
    parts.push(`Target tone: ${profile.tone}`);
  }
  if (profile.styleGuidelines && profile.styleGuidelines.length > 0) {
    parts.push(`Style guidelines: ${profile.styleGuidelines.join('; ')}`);
  }

  if (profile.evolving_profile?.topics?.length > 0) {
    const topicNames = normalizeTopics(profile.evolving_profile.topics);
    if (topicNames.length > 0) {
      parts.push(`Focus especially on recent topics: ${topicNames.join(', ')}`);
    }
  }

  parts.push('\nRespond strictly with JSON containing fields refinedPrompt (string) and topics (array of strings).');
  parts.push('\nThe topics array must contain 1-6 single words or hyphenated single concepts (e.g., "React", "Jenkins", "Github-Actions", "Python", "Docker"), not multi-word phrases (e.g., "web development", "CI pipelines", "cloud computing").');
  parts.push('\nRefine the user\'s prompt so that when used, it will generate responses that match the profile above. Preserve the original intent while improving clarity, structure, and effectiveness.');

  return parts.join('\n');
}

export function buildUserPrompt(prompt: string, profile?: Profile | null): string {
  const instructions = [
    'Return a JSON object with two fields: refinedPrompt (string) and topics (array of short strings).',
    'The refinedPrompt must preserve the user\'s intent while improving clarity.',
    'The topics array must contain 1-6 single words or hyphenated single concepts (e.g., "React", "Jenkins", "Github-Actions", "Python", "Docker"), not multi-word phrases (e.g., "web development", "CI pipelines", "cloud computing").',
    'Avoid explanations or additional keys; respond with valid JSON only.',
  ];

  const profileHints: string[] = [];
  if (profile?.name) {
    profileHints.push(`Profile name: ${profile.name}`);
  }
  if (profile?.persona) {
    profileHints.push(`Persona: ${profile.persona}`);
  }
  if (profile?.tone) {
    profileHints.push(`Tone: ${profile.tone}`);
  }
  if (profile?.styleGuidelines?.length) {
    profileHints.push(`Style guidelines: ${profile.styleGuidelines.join('; ')}`);
  }

  const context = [
    'You are refining prompts. Follow these instructions strictly.',
    ...profileHints,
    ...instructions,
    'User prompt:',
    prompt,
  ].join('\n');

  return context;
}
