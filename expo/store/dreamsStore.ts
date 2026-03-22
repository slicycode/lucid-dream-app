import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dream } from '@/types/dream';

const DUMMY_DREAMS: Dream[] = [
  {
    id: '1',
    title: 'The Flooding House',
    content: "I was in a house I didn't recognize but it felt like home. Water started seeping through the floorboards, slowly at first, then faster. I kept moving upstairs but the water followed. I wasn't scared exactly — more like resigned.",
    date: '2026-03-21',
    loggedAt: '2026-03-21T07:15:00.000Z',
    emotion: 'Anxious',
    themes: ['Water', 'Lost'],
    isLucid: false,
    interpretation: "The unfamiliar house that felt familiar often represents aspects of yourself you haven't fully explored yet — rooms you haven't entered, potential you sense but haven't accessed.\n\nWater rising gradually is one of the most common dream symbols. It typically reflects emotions building up slowly — things you've been setting aside that are starting to demand attention.\n\nThe combination suggests you may be on the edge of an emotional or personal transition. Your subconscious is inviting you to explore these rising feelings rather than wait for them to overflow.",
    symbols: ['Unfamiliar house', 'Rising water', 'Familiarity'],
  },
  {
    id: '2',
    title: 'Flying Over the City',
    content: "I was standing on the edge of a rooftop and I just stepped off. Instead of falling I started flying over the whole city. Everything looked tiny below me. I could feel the wind. Then I noticed I was being followed by a bird made of light.",
    date: '2026-03-19',
    loggedAt: '2026-03-19T06:48:00.000Z',
    emotion: 'Exciting',
    themes: ['Flying'],
    isLucid: false,
    interpretation: null,
    symbols: [],
  },
  {
    id: '3',
    title: 'The Exam I Forgot',
    content: "I was back in school sitting down for an exam but I had no idea what subject it was. Everyone else was writing. I looked at the paper and the questions were in a language I couldn't read but somehow understood. I woke up before finishing.",
    date: '2026-03-16',
    loggedAt: '2026-03-16T08:02:00.000Z',
    emotion: 'Confusing',
    themes: ['School'],
    isLucid: false,
    interpretation: "The exam dream is among the most universal dream archetypes. It often surfaces during periods when you feel tested or evaluated in waking life — not necessarily academically, but in any area where you feel unprepared.\n\nThe unreadable language you somehow understood points to intuitive knowledge — you know more than you think you do, even when the situation feels foreign.\n\nWaking before finishing suggests an unresolved situation in your life that you're processing subconsciously.",
    symbols: ['Exam', 'Unknown language', 'School'],
  },
];

interface DreamsState {
  dreams: Dream[];
  addDream: (dream: Dream) => void;
  updateDream: (id: string, updates: Partial<Dream>) => void;
  deleteDream: (id: string) => void;
  getDreamsByDate: (date: string) => Dream[];
}

export const useDreamsStore = create<DreamsState>()(
  persist(
    (set, get) => ({
      dreams: DUMMY_DREAMS,
      addDream: (dream) => set((state) => ({ dreams: [dream, ...state.dreams] })),
      updateDream: (id, updates) =>
        set((state) => ({
          dreams: state.dreams.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        })),
      deleteDream: (id) =>
        set((state) => ({
          dreams: state.dreams.filter((d) => d.id !== id),
        })),
      getDreamsByDate: (date) => get().dreams.filter((d) => d.date === date),
    }),
    {
      name: 'dreams-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
