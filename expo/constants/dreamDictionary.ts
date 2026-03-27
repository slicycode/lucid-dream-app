import i18n from '@/i18n';

export interface DictionaryEntry {
  id: string;
  symbol: string;
  meaning: string;
}

/** All dictionary entry IDs — content loaded from dreamDictionary namespace */
const ENTRY_IDS = [
  'abyss', 'animals', 'attic',
  'baby', 'bridge', 'buildingCollapsing',
  'car', 'cave', 'chased', 'children', 'clock', 'crowds',
  'darkForest', 'death', 'door',
  'earthquake', 'elevator', 'exam', 'eyes',
  'falling', 'family', 'fire', 'flying', 'flood', 'forest', 'frozen',
  'ghost',
  'hospital', 'house',
  'island',
  'keys', 'knife',
  'lateBeing', 'light', 'lost',
  'mirror', 'money', 'moon', 'mountain',
  'nakedPublic', 'night',
  'ocean', 'oldHouse',
  'phoneBroken', 'prison',
  'rain', 'river', 'road', 'running',
  'school', 'shadow', 'snake', 'spider', 'stairs', 'storm', 'sun',
  'teethFallingOut', 'timeRunningOut', 'train', 'travel', 'trees',
  'underground', 'unfamiliarHouse', 'unknownLanguage',
  'void',
  'water', 'wind', 'work',
  'bird', 'cat', 'dog', 'horse', 'wolf',
];

/**
 * Build the sorted dictionary from the current locale's translations.
 * Falls back to English for any missing entries.
 */
export function getDreamDictionary(): DictionaryEntry[] {
  const t = i18n.getFixedT(null, 'dreamDictionary');
  return ENTRY_IDS
    .map((id) => ({
      id,
      symbol: t(`${id}.symbol`),
      meaning: t(`${id}.meaning`),
    }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol, i18n.language));
}
