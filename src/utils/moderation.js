// src/utils/moderation.js
import { badwords } from './badwords';

export function containsBadWords(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return badwords.some(word => lowerText.includes(word));
} 