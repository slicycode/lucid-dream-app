export type DreamType = 'dream' | 'nightmare';

export interface Dream {
  id: string;
  title: string;
  content: string;
  date: string;
  loggedAt: string;
  emotion: string;
  themes: string[];
  isLucid: boolean;
  dreamType: DreamType;
  rating: number | null;
  vividness: number | null;
  isFirstPerson: boolean;
  interpretation: string | null;
  symbols: string[];
  isForgotten: boolean;
}

export const EMOTIONS = [
  'Peaceful',
  'Anxious',
  'Exciting',
  'Confusing',
  'Scary',
  'Joyful',
  'Sad',
] as const;

export const ALL_EMOTION_TAGS = [
  'Peaceful',
  'Anxious',
  'Exciting',
  'Confusing',
  'Scary',
  'Joyful',
  'Sad',
  'Nostalgic',
  'Angry',
  'Lonely',
  'Euphoric',
  'Eerie',
  'Hopeful',
  'Guilty',
] as const;

export const DEFAULT_EMOTION_TAGS: string[] = [
  'Peaceful',
  'Anxious',
  'Exciting',
  'Confusing',
  'Scary',
  'Joyful',
  'Sad',
];

export const THEMES = [
  'Flying',
  'Falling',
  'Water',
  'Chased',
  'School',
  'Work',
  'Family',
  'Death',
  'Animals',
  'Travel',
  'Lost',
  'Teeth',
  'Naked',
  'Late',
] as const;
