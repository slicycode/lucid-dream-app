import { COMMON_WORDS } from './commonWords';

export const MIN_DREAM_CONTENT_LENGTH = 20;

export const SHORT_DREAM_MESSAGE =
  'Your dream entry is too short to interpret. Try adding more detail — what you saw, felt, or who was there — and try again.';

export const GIBBERISH_DREAM_MESSAGE =
  'Your dream entry doesn\'t appear to contain real words. Try describing what you remember — even a few simple sentences will do.';

/** Returns true if the string contains CJK characters (Japanese/Korean/Chinese). */
function containsCJK(text: string): boolean {
  return /[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/.test(text);
}

export function isLikelyGibberish(text: string): boolean {
  // CJK text bypasses Latin-based heuristics
  if (containsCJK(text)) return false;

  const words = text
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  // Need at least 3 words for a meaningful entry
  if (words.length < 3) return true;

  // Must contain at least one common word from any supported language
  const hasCommonWord = words.some((w) => COMMON_WORDS.has(w));
  if (!hasCommonWord) return true;

  // Check individual word quality
  let plausible = 0;
  let alphaWords = 0;

  for (const word of words) {
    const alpha = word.replace(/[^a-zà-öø-ÿ]/g, '');
    if (alpha.length === 0) continue;
    alphaWords++;

    const hasVowel = /[aeiouyàâäéèêëïîôùûüÿæœ]/.test(alpha);
    const vowelCount = (alpha.match(/[aeiouyàâäéèêëïîôùûüÿæœ]/g) || []).length;
    const vowelRatio = vowelCount / alpha.length;
    const goodVowelRatio = vowelRatio >= 0.15 && vowelRatio <= 0.85;
    const maxConsonantRun = alpha
      .split(/[aeiouyàâäéèêëïîôùûüÿæœ]/)
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
  locale?: string;
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
      locale: params.locale,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    const message = response.status === 429
      ? 'RATE_LIMITED'
      : (error.error ?? `Interpretation failed (${response.status})`);
    throw new Error(message);
  }

  return response.json();
}
