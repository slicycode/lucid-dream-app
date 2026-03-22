import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react-native';
import { useDreamsStore } from '@/store/dreamsStore';
import { colors, fonts, typography, spacing, radii, sizes } from '@/constants/theme';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dreams = useDreamsStore((s) => s.dreams);

  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const todayKey = useMemo(() => {
    const n = new Date();
    return formatDateKey(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  const dreamsByDate = useMemo(() => {
    const map: Record<string, typeof dreams> = {};
    dreams.forEach((d) => {
      if (!map[d.date]) map[d.date] = [];
      map[d.date].push(d);
    });
    return map;
  }, [dreams]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const monthLabel = new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }, [currentMonth]);

  const nextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }, [currentMonth]);

  const selectedDreams = useMemo(() => {
    if (!selectedDate) return [];
    return dreamsByDate[selectedDate] || [];
  }, [selectedDate, dreamsByDate]);

  const streak = useMemo(() => {
    let current = 0;
    let longest = 0;
    const today = new Date();
    const d = new Date(today);

    while (true) {
      const key = formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
      if (dreamsByDate[key]) {
        current++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }

    let tempStreak = 0;
    const allDates = Object.keys(dreamsByDate).sort();
    for (let i = 0; i < allDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(allDates[i - 1]);
        const curr = new Date(allDates[i]);
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        tempStreak = diff <= 1 ? tempStreak + 1 : 1;
      }
      longest = Math.max(longest, tempStreak);
    }

    return { current, longest };
  }, [dreamsByDate]);

  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [firstDay, daysInMonth]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={prevMonth} hitSlop={12}>
            <ChevronLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity onPress={nextMonth} hitSlop={12}>
            <ChevronRight size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.daysHeader}>
          {DAYS_OF_WEEK.map((day) => (
            <View key={day} style={styles.dayHeaderCell}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarCells.map((day, i) => {
            if (day === null) {
              return <View key={`empty-${i}`} style={styles.dayCell} />;
            }
            const dateKey = formatDateKey(currentYear, currentMonth, day);
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDate;
            const dayDreams = dreamsByDate[dateKey];
            const primaryEmotion = dayDreams?.[0]?.emotion;

            return (
              <TouchableOpacity
                key={dateKey}
                style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                onPress={() => setSelectedDate(dateKey)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                  {day}
                </Text>
                {dayDreams ? (
                  <View
                    style={[
                      styles.dreamDot,
                      { backgroundColor: colors.emotions[primaryEmotion] || colors.emotions.Neutral },
                    ]}
                  />
                ) : (
                  <View style={styles.emptyDot} />
                )}
                {isToday && <View style={styles.todayRing} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedDreams.length > 0 ? (
          <View style={styles.selectedSection}>
            {selectedDreams.map((dream) => (
              <TouchableOpacity
                key={dream.id}
                style={styles.dreamCard}
                onPress={() => router.push(`/dream/${dream.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.dreamCardHeader}>
                  <View style={styles.dreamCardLeft}>
                    <View
                      style={[
                        styles.emotionDot,
                        { backgroundColor: colors.emotions[dream.emotion] || colors.emotions.Neutral },
                      ]}
                    />
                    <View style={styles.dreamCardInfo}>
                      <Text style={styles.dreamTitle}>{dream.title}</Text>
                      <Text style={styles.dreamMeta}>{formatTime(dream.loggedAt)}</Text>
                    </View>
                  </View>
                  {dream.interpretation && <Sparkles size={16} color={colors.accent} />}
                </View>
                <Text style={styles.dreamPreview} numberOfLines={2}>{dream.content}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.streakSection}>
            <View style={styles.streakRow}>
              <Text style={styles.streakLabel}>Current streak</Text>
              <Text style={styles.streakValue}>{streak.current} days</Text>
            </View>
            <View style={styles.streakRow}>
              <Text style={styles.streakLabel}>Longest streak</Text>
              <Text style={styles.streakValueMuted}>{streak.longest} days</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  monthLabel: {
    fontFamily: fonts.serif,
    fontSize: typography.heading.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    fontWeight: '500' as const,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: colors.accentMuted,
    borderRadius: radii.sm,
  },
  dayNumber: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  dayNumberToday: {
    color: colors.accent,
    fontWeight: '700' as const,
  },
  dreamDot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: 'transparent',
  },
  todayRing: {
    position: 'absolute',
    top: 4,
    width: 30,
    height: 30,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  selectedSection: {
    marginTop: spacing.lg,
  },
  dreamCard: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.cardPadding,
    marginBottom: spacing.sm,
  },
  dreamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  dreamCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  emotionDot: {
    width: sizes.emotionDot,
    height: sizes.emotionDot,
    borderRadius: sizes.emotionDot / 2,
    marginTop: 6,
    marginRight: spacing.sm,
  },
  dreamCardInfo: {
    flex: 1,
  },
  dreamTitle: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  dreamMeta: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  dreamPreview: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: sizes.emotionDot + spacing.sm,
  },
  streakSection: {
    marginTop: spacing.xl,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.cardPadding,
    gap: spacing.md,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  streakValue: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    fontWeight: '700' as const,
    color: colors.accent,
  },
  streakValueMuted: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
});
