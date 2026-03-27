import i18n from '@/i18n';

interface OnboardingInterpretationMeta {
  id: string;
  keywords: string[]; // English keywords — matched against translated keywords at runtime
}

const INTERPRETATION_META: OnboardingInterpretationMeta[] = [
  { id: 'water', keywords: ['water', 'ocean', 'sea', 'swim', 'drown', 'flood', 'rain', 'river', 'lake', 'wave'] },
  { id: 'falling', keywords: ['fall', 'falling', 'cliff', 'drop', 'height', 'ledge', 'jump'] },
  { id: 'flying', keywords: ['fly', 'flying', 'float', 'air', 'soar', 'wing', 'sky', 'above'] },
  { id: 'house', keywords: ['house', 'room', 'door', 'building', 'home', 'apartment', 'hallway', 'stair', 'window'] },
  { id: 'chase', keywords: ['chase', 'chasing', 'run', 'running', 'escape', 'hide', 'follow', 'pursue', 'caught'] },
  { id: 'teeth', keywords: ['teeth', 'tooth', 'mouth', 'bite', 'jaw', 'smile'] },
  { id: 'school', keywords: ['school', 'exam', 'test', 'class', 'teacher', 'late', 'unprepared', 'homework', 'study'] },
  { id: 'animals', keywords: ['animal', 'dog', 'cat', 'snake', 'bird', 'spider', 'wolf', 'bear', 'fish', 'insect'] },
  { id: 'death', keywords: ['death', 'die', 'dead', 'funeral', 'grave', 'kill', 'ghost', 'spirit'] },
  { id: 'people', keywords: ['person', 'people', 'friend', 'stranger', 'family', 'mother', 'father', 'ex', 'child', 'baby', 'someone', 'face'] },
];

/**
 * Match the user's dream text to the best pre-written interpretation.
 * Uses locale-aware keywords for matching, locale-aware content for display.
 */
export function matchOnboardingInterpretation(dreamText: string): {
  interpretation: string;
  symbols: string[];
} {
  const t = i18n.getFixedT(null, 'onboardingInterpretations');
  const lower = dreamText.toLowerCase();

  let bestId = 'fallback';
  let bestScore = 0;

  for (const entry of INTERPRETATION_META) {
    // Get translated keywords for the current locale
    const translatedKeywords = t(`${entry.id}.keywords`, { returnObjects: true }) as unknown as string[];
    const keywords = Array.isArray(translatedKeywords) ? translatedKeywords : entry.keywords;

    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = entry.id;
    }
  }

  return {
    interpretation: t(`${bestId}.interpretation`),
    symbols: t(`${bestId}.symbols`, { returnObjects: true }) as string[],
  };
}
