import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  morningReminderEnabled: boolean;
  morningReminderTime: string;
  realityCheckEnabled: boolean;
  realityCheckFrequency: string;
  wbtbEnabled: boolean;
  wbtbTime: string;
  isPremium: boolean;

  setMorningReminder: (enabled: boolean) => void;
  setMorningReminderTime: (time: string) => void;
  setRealityCheck: (enabled: boolean) => void;
  setRealityCheckFrequency: (freq: string) => void;
  setWbtb: (enabled: boolean) => void;
  setWbtbTime: (time: string) => void;
  setIsPremium: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      morningReminderEnabled: false,
      morningReminderTime: '07:00',
      realityCheckEnabled: false,
      realityCheckFrequency: '2h',
      wbtbEnabled: false,
      wbtbTime: '04:00',
      isPremium: false,

      setMorningReminder: (morningReminderEnabled) => set({ morningReminderEnabled }),
      setMorningReminderTime: (morningReminderTime) => set({ morningReminderTime }),
      setRealityCheck: (realityCheckEnabled) => set({ realityCheckEnabled }),
      setRealityCheckFrequency: (realityCheckFrequency) => set({ realityCheckFrequency }),
      setWbtb: (wbtbEnabled) => set({ wbtbEnabled }),
      setWbtbTime: (wbtbTime) => set({ wbtbTime }),
      setIsPremium: (isPremium) => set({ isPremium }),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
