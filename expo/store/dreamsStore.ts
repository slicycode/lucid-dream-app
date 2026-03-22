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

interface DreamsState {
  dreams: Dream[];
  stats: DreamStats;
  addDream: (dream: Dream) => void;
  updateDream: (id: string, updates: Partial<Dream>) => void;
  deleteDream: (id: string) => void;
  getDreamsByDate: (date: string) => Dream[];
  refreshStreak: () => void;
}

export const useDreamsStore = create<DreamsState>()(
  persist(
    (set, get) => ({
      dreams: DUMMY_DREAMS,
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
        set((state) => ({
          dreams: state.dreams.filter((d) => d.id !== id),
          stats: {
            ...state.stats,
            totalDreamsLogged: Math.max(0, state.stats.totalDreamsLogged - 1),
          },
        })),

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
    }),
    {
      name: 'dreams-store',
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
      migrate: (persisted: any, version: number) => {
        if (version === 0) {
          // Migrate dreams to include new fields
          const dreams = (persisted.dreams ?? []).map((d: any) => ({
            ...d,
            dreamType: d.dreamType ?? 'dream',
            rating: d.rating ?? null,
            vividness: d.vividness ?? null,
            isForgotten: d.isForgotten ?? false,
          }));
          const stats = {
            ...persisted.stats,
            totalForgotten: persisted.stats?.totalForgotten ?? 0,
            firstDreamDate: persisted.stats?.firstDreamDate ?? (dreams.length > 0 ? dreams[dreams.length - 1].date : ''),
          };
          return { ...persisted, dreams, stats };
        }
        return persisted;
      },
    }
  )
);
