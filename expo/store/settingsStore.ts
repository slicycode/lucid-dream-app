import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv';

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff)).toISOString().split('T')[0];
}

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

  setMorningReminder: (enabled: boolean) => void;
  setMorningReminderTime: (time: string) => void;
  setRealityCheck: (enabled: boolean) => void;
  setRealityCheckFrequency: (freq: string) => void;
  setWbtb: (enabled: boolean) => void;
  setWbtbTime: (time: string) => void;
  setIsPremium: (val: boolean) => void;
  useInterpretation: () => boolean;
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
      wbtbTime: '04:00',
      isPremium: false,
      freeInterpretationsUsedThisWeek: 0,
      lastFreeInterpretationWeekStart: '',

      setMorningReminder: (morningReminderEnabled) => set({ morningReminderEnabled }),
      setMorningReminderTime: (morningReminderTime) => set({ morningReminderTime }),
      setRealityCheck: (realityCheckEnabled) => set({ realityCheckEnabled }),
      setRealityCheckFrequency: (realityCheckFrequency) => set({ realityCheckFrequency }),
      setWbtb: (wbtbEnabled) => set({ wbtbEnabled }),
      setWbtbTime: (wbtbTime) => set({ wbtbTime }),
      setIsPremium: (isPremium) => set({ isPremium }),

      canInterpret: () => {
        const state = get();
        if (state.isPremium) return true;
        const currentWeek = getWeekStart();
        if (state.lastFreeInterpretationWeekStart !== currentWeek) return true;
        return state.freeInterpretationsUsedThisWeek < 1;
      },

      useInterpretation: () => {
        const state = get();
        if (state.isPremium) return true;
        const currentWeek = getWeekStart();
        if (state.lastFreeInterpretationWeekStart !== currentWeek) {
          set({ freeInterpretationsUsedThisWeek: 1, lastFreeInterpretationWeekStart: currentWeek });
          return true;
        }
        if (state.freeInterpretationsUsedThisWeek < 1) {
          set({ freeInterpretationsUsedThisWeek: state.freeInterpretationsUsedThisWeek + 1 });
          return true;
        }
        return false;
      },
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
