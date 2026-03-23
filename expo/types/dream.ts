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
  interpretationRating: 'up' | 'down' | null;
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
