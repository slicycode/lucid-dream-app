export type InsightCategory = 'symbol' | 'fact' | 'technique' | 'culture';

export interface DailyInsightMeta {
  id: string;
  category: InsightCategory;
  icon: string; // key from glassAssets
}

/**
 * 120 daily dream insights — metadata only.
 * Content (title + body) lives in locales/dailyInsights/<locale>.json
 * Indexed by day-of-year, deterministic for all users.
 */
export const dailyInsights: DailyInsightMeta[] = [
  // ── Symbol Meanings (30) ─────────────────────────────────────────
  { id: 'water', category: 'symbol', icon: 'droplet' },
  { id: 'flying', category: 'symbol', icon: 'cloud' },
  { id: 'falling', category: 'symbol', icon: 'spiral' },
  { id: 'teeth', category: 'symbol', icon: 'spiral' },
  { id: 'chased', category: 'symbol', icon: 'eye' },
  { id: 'houses', category: 'symbol', icon: 'key' },
  { id: 'doors', category: 'symbol', icon: 'key' },
  { id: 'animals', category: 'symbol', icon: 'eye' },
  { id: 'death', category: 'symbol', icon: 'crescentMoon' },
  { id: 'roads', category: 'symbol', icon: 'spiral' },
  { id: 'bridges', category: 'symbol', icon: 'hand' },
  { id: 'mirrors', category: 'symbol', icon: 'eye' },
  { id: 'fire', category: 'symbol', icon: 'spiral' },
  { id: 'clocks', category: 'symbol', icon: 'clock' },
  { id: 'stairs', category: 'symbol', icon: 'key' },
  { id: 'rain', category: 'symbol', icon: 'droplet' },
  { id: 'trees', category: 'symbol', icon: 'feather' },
  { id: 'books', category: 'symbol', icon: 'book' },
  { id: 'stars', category: 'symbol', icon: 'constellations' },
  { id: 'snakes', category: 'symbol', icon: 'spiral' },
  { id: 'children', category: 'symbol', icon: 'hand' },
  { id: 'lostBuilding', category: 'symbol', icon: 'key' },
  { id: 'oceans', category: 'symbol', icon: 'droplet' },
  { id: 'mountains', category: 'symbol', icon: 'cloud' },
  { id: 'hands', category: 'symbol', icon: 'hand' },
  { id: 'keys', category: 'symbol', icon: 'key' },
  { id: 'light', category: 'symbol', icon: 'diamond' },
  { id: 'darkness', category: 'symbol', icon: 'crescentMoon' },
  { id: 'flowers', category: 'symbol', icon: 'feather' },
  { id: 'birds', category: 'symbol', icon: 'cloud' },

  // ── Dream Psychology Facts (20) ──────────────────────────────────
  { id: 'forget95', category: 'fact', icon: 'brain' },
  { id: 'everyoneDreams', category: 'fact', icon: 'brain' },
  { id: 'blindDreams', category: 'fact', icon: 'eye' },
  { id: 'processEmotions', category: 'fact', icon: 'brain' },
  { id: 'journalingBoost', category: 'fact', icon: 'book' },
  { id: 'sleepPosition', category: 'fact', icon: 'crescentMoon' },
  { id: 'cantRead', category: 'fact', icon: 'book' },
  { id: 'recurringMessage', category: 'fact', icon: 'spiral' },
  { id: 'animalsDream', category: 'fact', icon: 'brain' },
  { id: 'problemSolving', category: 'fact', icon: 'diamond' },
  { id: 'nightmarePurpose', category: 'fact', icon: 'brain' },
  { id: 'facesYouveSeen', category: 'fact', icon: 'eye' },
  { id: 'stressRecall', category: 'fact', icon: 'brain' },
  { id: 'mostlyNegative', category: 'fact', icon: 'brain' },
  { id: 'remAtonia', category: 'fact', icon: 'hand' },
  { id: 'dreamLength', category: 'fact', icon: 'clock' },
  { id: 'externalStimuli', category: 'fact', icon: 'bell' },
  { id: 'preschoolers', category: 'fact', icon: 'brain' },
  { id: 'vitaminB6', category: 'fact', icon: 'diamond' },
  { id: 'emotionalReset', category: 'fact', icon: 'brain' },

  // ── Lucid Dreaming Techniques (10) ───────────────────────────────
  { id: 'realityChecks', category: 'technique', icon: 'hand' },
  { id: 'wbtb', category: 'technique', icon: 'clock' },
  { id: 'mild', category: 'technique', icon: 'brain' },
  { id: 'dreamSigns', category: 'technique', icon: 'eye' },
  { id: 'nosePinch', category: 'technique', icon: 'hand' },
  { id: 'sleepSchedule', category: 'technique', icon: 'clock' },
  { id: 'writeBeforeSleep', category: 'technique', icon: 'book' },
  { id: 'stayCalmLucid', category: 'technique', icon: 'hand' },
  { id: 'lookAtHands', category: 'technique', icon: 'hand' },
  { id: 'meditateBefore', category: 'technique', icon: 'brain' },

  // ── Dream Culture & History (15) ─────────────────────────────────
  { id: 'ancientEgypt', category: 'culture', icon: 'constellations' },
  { id: 'aboriginalDreamtime', category: 'culture', icon: 'constellations' },
  { id: 'freud', category: 'culture', icon: 'brain' },
  { id: 'jung', category: 'culture', icon: 'constellations' },
  { id: 'tibetanYoga', category: 'culture', icon: 'crescentMoon' },
  { id: 'senoi', category: 'culture', icon: 'hand' },
  { id: 'greekIncubation', category: 'culture', icon: 'constellations' },
  { id: 'sewingMachine', category: 'culture', icon: 'diamond' },
  { id: 'dali', category: 'culture', icon: 'eye' },
  { id: 'iroquois', category: 'culture', icon: 'constellations' },
  { id: 'frankenstein', category: 'culture', icon: 'book' },
  { id: 'periodicTable', category: 'culture', icon: 'diamond' },
  { id: 'japaneseBaku', category: 'culture', icon: 'crescentMoon' },
  { id: 'lincoln', category: 'culture', icon: 'constellations' },
  { id: 'hinduism', category: 'culture', icon: 'constellations' },

  // ── More Symbols (15) ────────────────────────────────────────────
  { id: 'exams', category: 'symbol', icon: 'book' },
  { id: 'nakedPublic', category: 'symbol', icon: 'eye' },
  { id: 'missingFlight', category: 'symbol', icon: 'clock' },
  { id: 'pregnancy', category: 'symbol', icon: 'hand' },
  { id: 'money', category: 'symbol', icon: 'diamond' },
  { id: 'cars', category: 'symbol', icon: 'spiral' },
  { id: 'fog', category: 'symbol', icon: 'cloud' },
  { id: 'eating', category: 'symbol', icon: 'hand' },
  { id: 'music', category: 'symbol', icon: 'bell' },
  { id: 'windows', category: 'symbol', icon: 'eye' },

  // ── More Facts (5) ───────────────────────────────────────────────
  { id: 'lucidPrefrontal', category: 'fact', icon: 'brain' },
  { id: 'cheeseDreams', category: 'fact', icon: 'brain' },
  { id: 'colorVsBW', category: 'fact', icon: 'eye' },
  { id: 'physicalResponse', category: 'fact', icon: 'brain' },
  { id: 'dejaVu', category: 'fact', icon: 'spiral' },
];

/**
 * Get today's insight metadata based on day-of-year.
 */
export function getTodayInsight(): DailyInsightMeta {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dailyInsights[dayOfYear % dailyInsights.length];
}
