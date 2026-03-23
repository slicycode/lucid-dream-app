import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv';
import { DEFAULT_EMOTION_TAGS } from '@/types/dream';

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff)).toISOString().split('T')[0];
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// Free: 3 interpretation per week. Premium: 5 per day (cost guardrail).
const FREE_WEEKLY_LIMIT = 3;
const PREMIUM_DAILY_LIMIT = 5;

interface SettingsState {
  morningReminderEnabled: boolean;
  morningReminderTime: string;
  realityCheckEnabled: boolean;
  realityCheckFrequency: string;
  wbtbEnabled: boolean;
  wbtbTime: string;
  isPremium: boolean;
  freeInterpretationsUsedThisWeek: number;
  lastFreeInterpretationWeekStart: string;
  premiumInterpretationsUsedToday: number;
  lastPremiumInterpretationDate: string;
  customEmotionTags: string[];

  setMorningReminder: (enabled: boolean) => void;
  setMorningReminderTime: (time: string) => void;
  setRealityCheck: (enabled: boolean) => void;
  setRealityCheckFrequency: (freq: string) => void;
  setWbtb: (enabled: boolean) => void;
  setWbtbTime: (time: string) => void;
  setIsPremium: (val: boolean) => void;
  setCustomEmotionTags: (tags: string[]) => void;
  useInterpretation: () => boolean;
  refundInterpretation: () => void;
  canInterpret: () => boolean;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      morningReminderEnabled: false,
      morningReminderTime: '07:00',
      realityCheckEnabled: false,
      realityCheckFrequency: '2h',
      wbtbEnabled: false,
      wbtbTime: '06:00',
      isPremium: false,
      freeInterpretationsUsedThisWeek: 0,
      lastFreeInterpretationWeekStart: '',
      premiumInterpretationsUsedToday: 0,
      lastPremiumInterpretationDate: '',
      customEmotionTags: DEFAULT_EMOTION_TAGS,

      setMorningReminder: (morningReminderEnabled) => set({ morningReminderEnabled }),
      setMorningReminderTime: (morningReminderTime) => set({ morningReminderTime }),
      setRealityCheck: (realityCheckEnabled) => set({ realityCheckEnabled }),
      setRealityCheckFrequency: (realityCheckFrequency) => set({ realityCheckFrequency }),
      setWbtb: (wbtbEnabled) => set({ wbtbEnabled }),
      setWbtbTime: (wbtbTime) => set({ wbtbTime }),
      setIsPremium: (isPremium) => set({ isPremium }),
      setCustomEmotionTags: (customEmotionTags) => set({ customEmotionTags }),

      canInterpret: () => {
        const state = get();
        if (state.isPremium) {
          const today = getToday();
          if (state.lastPremiumInterpretationDate !== today) return true;
          return state.premiumInterpretationsUsedToday < PREMIUM_DAILY_LIMIT;
        }
        const currentWeek = getWeekStart();
        if (state.lastFreeInterpretationWeekStart !== currentWeek) return true;
        return state.freeInterpretationsUsedThisWeek < FREE_WEEKLY_LIMIT;
      },

      refundInterpretation: () => {
        const state = get();
        if (state.isPremium) {
          set({ premiumInterpretationsUsedToday: Math.max(0, state.premiumInterpretationsUsedToday - 1) });
        } else {
          set({ freeInterpretationsUsedThisWeek: Math.max(0, state.freeInterpretationsUsedThisWeek - 1) });
        }
      },

      useInterpretation: () => {
        const state = get();
        if (state.isPremium) {
          const today = getToday();
          if (state.lastPremiumInterpretationDate !== today) {
            set({ premiumInterpretationsUsedToday: 1, lastPremiumInterpretationDate: today });
            return true;
          }
          if (state.premiumInterpretationsUsedToday < PREMIUM_DAILY_LIMIT) {
            set({ premiumInterpretationsUsedToday: state.premiumInterpretationsUsedToday + 1 });
            return true;
          }
          return false;
        }
        const currentWeek = getWeekStart();
        if (state.lastFreeInterpretationWeekStart !== currentWeek) {
          set({ freeInterpretationsUsedThisWeek: 1, lastFreeInterpretationWeekStart: currentWeek });
          return true;
        }
        if (state.freeInterpretationsUsedThisWeek < FREE_WEEKLY_LIMIT) {
          set({ freeInterpretationsUsedThisWeek: state.freeInterpretationsUsedThisWeek + 1 });
          return true;
        }
        return false;
      },
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => mmkvStorage),
      version: 1,
      migrate: (persisted: any, version: number) => {
        if (version < 1) {
          return { ...persisted, customEmotionTags: persisted.customEmotionTags ?? DEFAULT_EMOTION_TAGS };
        }
        return persisted;
      },
    }
  )
);
