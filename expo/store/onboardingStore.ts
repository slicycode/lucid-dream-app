import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  name: string;
  dreamFrequency: string;
  dreamDetail: string;
  mainGoals: string[];
  journalExperience: string;
  recurringDreams: string;
  firstDreamText: string;
  hasCompletedOnboarding: boolean;
  currentStep: number;

  setName: (name: string) => void;
  setDreamFrequency: (val: string) => void;
  setDreamDetail: (val: string) => void;
  setMainGoals: (val: string[]) => void;
  setJournalExperience: (val: string) => void;
  setRecurringDreams: (val: string) => void;
  setFirstDreamText: (val: string) => void;
  setCurrentStep: (step: number) => void;
  completeOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      name: '',
      dreamFrequency: '',
      dreamDetail: '',
      mainGoals: [],
      journalExperience: '',
      recurringDreams: '',
      firstDreamText: '',
      hasCompletedOnboarding: false,
      currentStep: 0,

      setName: (name) => set({ name }),
      setDreamFrequency: (dreamFrequency) => set({ dreamFrequency }),
      setDreamDetail: (dreamDetail) => set({ dreamDetail }),
      setMainGoals: (mainGoals) => set({ mainGoals }),
      setJournalExperience: (journalExperience) => set({ journalExperience }),
      setRecurringDreams: (recurringDreams) => set({ recurringDreams }),
      setFirstDreamText: (firstDreamText) => set({ firstDreamText }),
      setCurrentStep: (currentStep) => set({ currentStep }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
    }),
    {
      name: 'onboarding-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
