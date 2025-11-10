/**
 * Default profiles - Professional built-in profiles
 */

import { Profile } from './types';
import { BUILTIN_PROFILES } from './builtinProfiles';

export function getDefaultProfiles(): Profile[] {
  // Convert built-in profile templates to actual profiles with IDs
  return BUILTIN_PROFILES.map((template, index) => ({
    id: `builtin_${template.name.toLowerCase().replace(/\s+/g, '_')}`,
    ...template.profile,
  }));
}

export function generateProfileId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `p_${timestamp}_${random}`;
}

