export interface Dream {
  id: string;
  title: string;
  content: string;
  date: string;
  loggedAt: string;
  emotion: string;
  themes: string[];
  isLucid: boolean;
  interpretation: string | null;
  symbols: string[];
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
