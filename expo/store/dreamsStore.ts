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

const DUMMY_DREAMS: Dream[] = [
  {
    id: '1',
    title: 'The Flooding House',
    content:
      "I was in a house I didn't recognize but it felt like home. Water started seeping through the floorboards, slowly at first, then faster. I kept moving upstairs but the water followed. I wasn't scared exactly — more like resigned.",
    date: '2026-03-21',
    loggedAt: '2026-03-21T07:15:00.000Z',
    emotion: 'Anxious',
    themes: ['Water', 'Lost'],
    isLucid: false,
    dreamType: 'dream',
    rating: 3,
    vividness: 4,
    interpretation:
      "The unfamiliar house that felt familiar often represents aspects of yourself you haven't fully explored yet — rooms you haven't entered, potential you sense but haven't accessed.\n\nWater rising gradually is one of the most common dream symbols. It typically reflects emotions building up slowly — things you've been setting aside that are starting to demand attention.\n\nThe combination suggests you may be on the edge of an emotional or personal transition. Your subconscious is inviting you to explore these rising feelings rather than wait for them to overflow.",
    symbols: ['Unfamiliar house', 'Rising water', 'Familiarity'],
    interpretationRating: null,
    isFirstPerson: true,
    isForgotten: false,
  },
  {
    id: '2',
    title: 'Flying Over the City',
    content:
      "I was standing on the edge of a rooftop and I just stepped off. Instead of falling I started flying over the whole city. Everything looked tiny below me. I could feel the wind. Then I noticed I was being followed by a bird made of light.",
    date: '2026-03-19',
    loggedAt: '2026-03-19T06:48:00.000Z',
    emotion: 'Exciting',
    themes: ['Flying'],
    isLucid: false,
    dreamType: 'dream',
    rating: 5,
    vividness: 5,
    interpretation: null,
    symbols: [],
    interpretationRating: null,
    isFirstPerson: true,
    isForgotten: false,
  },
  {
    id: '3',
    title: 'The Exam I Forgot',
    content:
      "I was back in school sitting down for an exam but I had no idea what subject it was. Everyone else was writing. I looked at the paper and the questions were in a language I couldn't read but somehow understood. I woke up before finishing.",
    date: '2026-03-16',
    loggedAt: '2026-03-16T08:02:00.000Z',
    emotion: 'Confusing',
    themes: ['School'],
    isLucid: false,
    dreamType: 'nightmare',
    rating: 2,
    vividness: 3,
    interpretation:
      "The exam dream is among the most universal dream archetypes. It often surfaces during periods when you feel tested or evaluated in waking life — not necessarily academically, but in any area where you feel unprepared.\n\nThe unreadable language you somehow understood points to intuitive knowledge — you know more than you think you do, even when the situation feels foreign.\n\nWaking before finishing suggests an unresolved situation in your life that you're processing subconsciously.",
    symbols: ['Exam', 'Unknown language', 'School'],
    interpretationRating: null,
    isFirstPerson: true,
    isForgotten: false,
  },
];

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
      dreams: DUMMY_DREAMS,
      weeklyDigest: null,
      stats: {
        currentStreak: 0,
        longestStreak: 0,
        lastDreamDate: '',
        totalDreamsLogged: DUMMY_DREAMS.length,
        totalInterpretations: DUMMY_DREAMS.filter((d) => d.interpretation).length,
        totalForgotten: 0,
        firstDreamDate: DUMMY_DREAMS.length > 0 ? DUMMY_DREAMS[DUMMY_DREAMS.length - 1].date : '',
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
            interpretationRating: null,
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
            interpretationRating: d.interpretationRating ?? null,
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
