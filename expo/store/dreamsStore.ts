import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv';
import { Dream } from '@/types/dream';

interface DreamStats {
  currentStreak: number;
  longestStreak: number;
  lastDreamDate: string;
  totalDreamsLogged: number;
  totalInterpretations: number;
  totalForgotten: number;
  firstDreamDate: string;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function calculateStreak(dreams: Dream[], currentStreak: number, longestStreak: number, lastDreamDate: string) {
  const today = getToday();
  const dreamDate = dreams.length > 0 ? dreams[0].date : '';

  if (!dreamDate) return { currentStreak: 0, longestStreak, lastDreamDate: '' };

  if (dreamDate === lastDreamDate) {
    return { currentStreak, longestStreak, lastDreamDate };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak: number;
  if (dreamDate === today || dreamDate === yesterdayStr) {
    newStreak = lastDreamDate === yesterdayStr || lastDreamDate === today ? currentStreak + 1 : 1;
  } else {
    newStreak = 1;
  }

  return {
    currentStreak: newStreak,
    longestStreak: Math.max(longestStreak, newStreak),
    lastDreamDate: dreamDate,
  };
}

interface WeeklyDigest {
  summary: string;
  weekOf: string;
  dreamCount: number;
  generatedAt: string;
}

interface DreamsState {
  dreams: Dream[];
  stats: DreamStats;
  weeklyDigest: WeeklyDigest | null;
  addDream: (dream: Dream) => void;
  addForgotten: (date: string) => void;
  updateDream: (id: string, updates: Partial<Dream>) => void;
  deleteDream: (id: string) => void;
  getDreamsByDate: (date: string) => Dream[];
  refreshStreak: () => void;
  setWeeklyDigest: (digest: WeeklyDigest) => void;
}

export const useDreamsStore = create<DreamsState>()(
  persist(
    (set, get) => ({
      dreams: [],
      weeklyDigest: null,
      stats: {
        currentStreak: 0,
        longestStreak: 0,
        lastDreamDate: '',
        totalDreamsLogged: 0,
        totalInterpretations: 0,
        totalForgotten: 0,
        firstDreamDate: '',
      },

      addDream: (dream) =>
        set((state) => {
          const dreams = [dream, ...state.dreams];
          const streakUpdate = calculateStreak(dreams, state.stats.currentStreak, state.stats.longestStreak, state.stats.lastDreamDate);
          return {
            dreams,
            stats: {
              ...state.stats,
              ...streakUpdate,
              totalDreamsLogged: state.stats.totalDreamsLogged + 1,
            },
          };
        }),

      addForgotten: (date) =>
        set((state) => {
          const already = state.dreams.some((d) => d.date === date && d.isForgotten);
          if (already) return {};

          const forgotten: Dream = {
            id: `forgotten-${date}`,
            title: '',
            content: '',
            date,
            loggedAt: new Date().toISOString(),
            emotion: 'Neutral',
            themes: [],
            isLucid: false,
            dreamType: 'dream',
            rating: null,
            vividness: null,
            interpretation: null,
            symbols: [],
        
            isFirstPerson: true,
            isForgotten: true,
          };

          return {
            dreams: [...state.dreams, forgotten],
            stats: {
              ...state.stats,
              totalForgotten: state.stats.totalForgotten + 1,
            },
          };
        }),

      updateDream: (id, updates) =>
        set((state) => {
          const prev = state.dreams.find((d) => d.id === id);
          const hadInterpretation = !!prev?.interpretation;
          const hasInterpretation = updates.interpretation !== undefined ? !!updates.interpretation : hadInterpretation;
          const interpretationAdded = !hadInterpretation && hasInterpretation;

          return {
            dreams: state.dreams.map((d) => (d.id === id ? { ...d, ...updates } : d)),
            stats: interpretationAdded
              ? { ...state.stats, totalInterpretations: state.stats.totalInterpretations + 1 }
              : state.stats,
          };
        }),

      deleteDream: (id) =>
        set((state) => {
          const remaining = state.dreams.filter((d) => d.id !== id);

          // If no dreams left from this week, clear the weekly digest
          let weeklyDigest = state.weeklyDigest;
          if (weeklyDigest) {
            const now = Date.now();
            const weekDreams = remaining.filter((d) => {
              const diff = (now - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24);
              return diff <= 7 && !d.isForgotten;
            });
            if (weekDreams.length === 0) {
              weeklyDigest = null;
            }
          }

          return {
            dreams: remaining,
            weeklyDigest,
            stats: {
              ...state.stats,
              totalDreamsLogged: Math.max(0, state.stats.totalDreamsLogged - 1),
            },
          };
        }),

      getDreamsByDate: (date) => get().dreams.filter((d) => d.date === date),

      refreshStreak: () =>
        set((state) => {
          const today = getToday();
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (state.stats.lastDreamDate !== today && state.stats.lastDreamDate !== yesterdayStr) {
            return { stats: { ...state.stats, currentStreak: 0 } };
          }
          return {};
        }),

      setWeeklyDigest: (digest) => set({ weeklyDigest: digest }),
    }),
    {
      name: 'dreams-store',
      version: 4,
      storage: createJSONStorage(() => mmkvStorage),
      migrate: (persisted: any, version: number) => {
        let data = persisted;
        if (version < 1) {
          const dreams = (data.dreams ?? []).map((d: any) => ({
            ...d,
            dreamType: d.dreamType ?? 'dream',
            rating: d.rating ?? null,
            vividness: d.vividness ?? null,
            isForgotten: d.isForgotten ?? false,
          }));
          const stats = {
            ...data.stats,
            totalForgotten: data.stats?.totalForgotten ?? 0,
            firstDreamDate: data.stats?.firstDreamDate ?? (dreams.length > 0 ? dreams[dreams.length - 1].date : ''),
          };
          data = { ...data, dreams, stats };
        }
        if (version < 2) {
          data.dreams = (data.dreams ?? []).map((d: any) => ({
            ...d,
            isFirstPerson: d.isFirstPerson ?? true,
          }));
        }
        if (version < 3) {
          data.dreams = (data.dreams ?? []).map((d: any) => ({
            ...d,

          }));
          data.weeklyDigest = data.weeklyDigest ?? null;
        }
        if (version < 4 && data.weeklyDigest) {
          data.weeklyDigest = {
            ...data.weeklyDigest,
            dreamCount: data.weeklyDigest.dreamCount ?? 0,
            generatedAt: data.weeklyDigest.generatedAt ?? '',
          };
        }
        return data;
      },
    }
  )
);
