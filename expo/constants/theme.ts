import { Platform } from 'react-native';

export const colors = {
  background: '#000000',
  surfaceCard: '#0A0A0A',
  surfaceCardBorder: '#1A1A1A',
  surfaceElevated: '#111111',
  surfaceInput: '#141414',
  surfacePulse: 'rgba(255, 255, 255, 0.08)',

  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',
  textDisabled: '#333333',

  accent: '#C9A84C',
  accentMuted: 'rgba(201, 168, 76, 0.12)',
  accentBorder: 'rgba(201, 168, 76, 0.30)',
  accentText: '#C9A84C',

  ctaPrimaryBg: '#FFFFFF',
  ctaPrimaryText: '#000000',
  ctaAccentBg: '#C9A84C',
  ctaAccentText: '#000000',

  success: '#4ADE80',
  danger: '#EF4444',
  warning: '#F59E0B',

  emotions: {
    Peaceful: '#6B8A7A',
    Anxious: '#8B6B6B',
    Exciting: '#8B7A5E',
    Confusing: '#6B6B8B',
    Scary: '#7A5E5E',
    Joyful: '#7A8B5E',
    Sad: '#5E6B7A',
    Neutral: '#555555',
  } as Record<string, string>,
} as const;

const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, serif',
}) as string;

const sansFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}) as string;

export const fonts = {
  serif: serifFont,
  sans: sansFont,
} as const;

export const typography = {
  display: {
    fontFamily: serifFont,
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 34 * 1.4,
  },
  heading: {
    fontFamily: serifFont,
    fontSize: 26,
    fontWeight: '600' as const,
    lineHeight: 26 * 1.4,
  },
  subheading: {
    fontFamily: serifFont,
    fontSize: 19,
    fontWeight: '500' as const,
    lineHeight: 19 * 1.4,
  },
  body: {
    fontFamily: sansFont,
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 16 * 1.6,
  },
  caption: {
    fontFamily: sansFont,
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 13 * 1.6,
  },
  tiny: {
    fontFamily: sansFont,
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 11 * 1.4,
    letterSpacing: 0.3,
  },
  dreamText: {
    fontFamily: serifFont,
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 17 * 1.7,
  },
  aiInterpretation: {
    fontFamily: serifFont,
    fontSize: 16,
    fontWeight: '400' as const,
    fontStyle: 'italic' as const,
    lineHeight: 16 * 1.7,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screenPadding: 24,
  sectionGap: 32,
  cardPadding: 20,
} as const;

export const radii = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 28,
  full: 9999,
} as const;

export const sizes = {
  buttonHeight: 56,
  inputHeight: 56,
  fabSize: 56,
  tagHeight: 36,
  emotionDot: 10,
} as const;
