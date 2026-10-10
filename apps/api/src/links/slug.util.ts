import { randomInt } from 'node:crypto';
import { GENERATED_SLUG_LENGTH } from './links.constants.js';

// Lowercase only: MySQL's default collation is case-insensitive
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function generateSlug(length: number = GENERATED_SLUG_LENGTH): string {
  let slug = '';
  for (let i = 0; i < length; i++) {
    slug += ALPHABET.charAt(randomInt(ALPHABET.length));
  }
  return slug;
}