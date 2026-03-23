export const MIN_DREAM_CONTENT_LENGTH = 20;

export const SHORT_DREAM_MESSAGE =
  'Your dream entry is too short to interpret. Try adding more detail — what you saw, felt, or who was there — and try again.';

export const GIBBERISH_DREAM_MESSAGE =
  'Your dream entry doesn\'t appear to contain real words. Try describing what you remember — even a few simple sentences will do.';

/**
 * Lightweight gibberish detector. Two-layer check:
 * 1. The text must contain at least 3 words and at least one common English word.
 * 2. At least 40% of words must look like plausible natural-language words
 *    (reasonable vowel ratio, no extreme consonant clusters).
 * Lenient enough for typos, slang, and non-native grammar.
 */
const COMMON_WORDS = new Set([
  'i', 'a', 'the', 'my', 'me', 'we', 'he', 'she', 'it', 'is', 'was',
  'am', 'are', 'were', 'be', 'been', 'had', 'has', 'have', 'do', 'did',
  'will', 'would', 'could', 'can', 'should', 'may', 'might',
  'in', 'on', 'at', 'to', 'of', 'and', 'or', 'but', 'not', 'no', 'so',
  'an', 'if', 'up', 'out', 'off', 'by', 'as', 'into', 'all', 'very',
  'then', 'when', 'where', 'there', 'here', 'this', 'that', 'what',
  'who', 'how', 'why', 'which', 'with', 'from', 'for', 'about', 'like',
  'just', 'some', 'any', 'also', 'too', 'own', 'other', 'more', 'much',
  'see', 'saw', 'go', 'went', 'come', 'came', 'get', 'got', 'know',
  'knew', 'think', 'felt', 'feel', 'look', 'looked', 'run', 'ran',
  'dream', 'dreamed', 'dreamt', 'sleep', 'slept', 'woke', 'wake',
  'night', 'fly', 'flying', 'fell', 'fall', 'dark', 'light', 'room',
  'house', 'door', 'water', 'sky', 'people', 'person', 'friend',
]);

export function isLikelyGibberish(text: string): boolean {
  const words = text
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  // Need at least 3 words for a meaningful entry
  if (words.length < 3) return true;

  // Must contain at least one common English word
  const hasCommonWord = words.some((w) => COMMON_WORDS.has(w));
  if (!hasCommonWord) return true;

  // Check individual word quality
  let plausible = 0;
  let alphaWords = 0;

  for (const word of words) {
    const alpha = word.replace(/[^a-z]/g, '');
    if (alpha.length === 0) continue;
    alphaWords++;

    const hasVowel = /[aeiouy]/.test(alpha);
    const vowelCount = (alpha.match(/[aeiouy]/g) || []).length;
    const vowelRatio = vowelCount / alpha.length;
    // Real words typically have 15-80% vowels
    const goodVowelRatio = vowelRatio >= 0.15 && vowelRatio <= 0.85;
    // Longest run of consecutive consonants
    const maxConsonantRun = alpha
      .split(/[aeiouy]/)
      .reduce((max, seg) => Math.max(max, seg.length), 0);
    const allSameChar = /^(.)\1*$/.test(alpha);

    if (hasVowel && goodVowelRatio && maxConsonantRun <= 4 && !allSameChar) {
      plausible++;
    }
  }

  if (alphaWords === 0) return true;
  return plausible / alphaWords < 0.4;
}

interface InterpretParams {
  dreamText: string;
  emotion: string;
  themes: string[];
  isLucid: boolean;
  dreamType?: string;
  vividness?: number | null;
  isFirstPerson?: boolean;
}

interface InterpretResult {
  interpretation: string;
  symbols: string[];
}

export async function interpretDream(params: InterpretParams): Promise<InterpretResult> {
  const response = await fetch('/api/interpret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dreamText: params.dreamText,
      emotion: params.emotion,
      themes: params.themes,
      isLucid: params.isLucid,
      dreamType: params.dreamType,
      vividness: params.vividness,
      isFirstPerson: params.isFirstPerson,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error ?? `Interpretation failed (${response.status})`);
  }

  return response.json();
}
