import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight, Sparkles, Plus, X } from 'lucide-react-native';
import { GlassAsset } from '@/components/GlassAsset';
import { glassAssets } from '@/constants/glassAssets';
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
  const addForgotten = useDreamsStore((s) => s.addForgotten);

  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const openSheet = useCallback((date: string) => {
    setSheetDate(date);
    sheetAnim.setValue(0);
    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 24,
    }).start();
  }, [sheetAnim]);

  const closeSheet = useCallback(() => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSheetDate(null));
  }, [sheetAnim]);

  const handleDayPress = useCallback((dateKey: string, hasDreams: boolean) => {
    setSelectedDate(dateKey);
    if (!hasDreams) {
      openSheet(dateKey);
    }
  }, [openSheet]);

  const handleAddDream = useCallback(() => {
    const date = sheetDate!;
    setSheetDate(null);
    router.push(`/new-dream?date=${date}`);
  }, [router, sheetDate]);

  const handleForgot = useCallback(() => {
    if (!sheetDate) return;
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addForgotten(sheetDate);
    closeSheet();
  }, [sheetDate, addForgotten, closeSheet]);

  const todayKey = useMemo(() => {
    const n = new Date();
    return formatDateKey(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  const { dreamsByDate, forgottenDates } = useMemo(() => {
    const map: Record<string, typeof dreams> = {};
    const forgotten = new Set<string>();
    dreams.forEach((d) => {
      if (d.isForgotten) {
        forgotten.add(d.date);
        return;
      }
      if (!map[d.date]) map[d.date] = [];
      map[d.date].push(d);
    });
    return { dreamsByDate: map, forgottenDates: forgotten };
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

  // Emotions actually logged by the user (for legend)
  const usedEmotions = useMemo(() => {
    const seen = new Set<string>();
    dreams.forEach((d) => {
      if (!d.isForgotten && d.emotion && colors.emotions[d.emotion]) seen.add(d.emotion);
    });
    return Array.from(seen);
  }, [dreams]);

  // Whether the currently viewed month has any logged dreams
  const currentMonthHasDreams = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return Object.keys(dreamsByDate).some((k) => k.startsWith(prefix));
  }, [dreamsByDate, currentYear, currentMonth]);

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
            const isFuture = dateKey > todayKey;
            const isSelected = dateKey === selectedDate;
            const dayDreams = dreamsByDate[dateKey];
            const isForgotten = forgottenDates.has(dateKey);
            const primaryEmotion = dayDreams?.[0]?.emotion;

            return (
              <TouchableOpacity
                key={dateKey}
                style={[styles.dayCell, isSelected && !isFuture && styles.dayCellSelected]}
                onPress={() => !isFuture && handleDayPress(dateKey, !!dayDreams)}
                activeOpacity={isFuture ? 1 : 0.7}
                disabled={isFuture}
              >
                <Text style={[styles.dayNumber, isToday && styles.dayNumberToday, isFuture && styles.dayNumberFuture]}>
                  {day}
                </Text>
                {dayDreams ? (
                  <View
                    style={[
                      styles.dreamDot,
                      { backgroundColor: colors.emotions[primaryEmotion] || colors.emotions.Neutral },
                    ]}
                  />
                ) : isForgotten ? (
                  <X size={8} color={colors.textDisabled} />
                ) : (
                  <View style={styles.emptyDot} />
                )}
                {isToday && <View style={styles.todayRing} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {usedEmotions.length > 0 && (
          <View style={styles.emotionLegend}>
            {usedEmotions.map((emotion) => (
              <View key={emotion} style={styles.legendEntry}>
                <View style={[styles.legendCircle, { backgroundColor: colors.emotions[emotion] }]} />
                <Text style={styles.legendLabel}>{emotion}</Text>
              </View>
            ))}
          </View>
        )}

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
        ) : selectedDate && forgottenDates.has(selectedDate) ? (
          <View style={styles.selectedSection}>
            <View style={styles.forgottenCard}>
              <X size={16} color={colors.textDisabled} />
              <Text style={styles.forgottenText}>You marked this night as forgotten</Text>
            </View>
          </View>
        ) : (
          <>
            {!currentMonthHasDreams && (
              <Text style={styles.emptyMonthText}>No dreams logged this month</Text>
            )}
          <View style={styles.streakSection}>
            <View style={styles.streakRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <GlassAsset source={glassAssets.hourglass} size={60} />
                <Text style={styles.streakLabel}>Current streak</Text>
              </View>
              <Text style={styles.streakValue}>{streak.current} day{streak.current === 1 ? '' : 's'}</Text>
            </View>
            <View style={styles.streakRow}>
              <Text style={styles.streakLabel}>Longest streak</Text>
              <Text style={styles.streakValueMuted}>{streak.longest} day{streak.longest === 1 ? '' : 's'}</Text>
            </View>
          </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={sheetDate !== null}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
      >
        <Pressable style={styles.sheetOverlay} onPress={closeSheet}>
          <Animated.View
            style={[
              styles.sheetContainer,
              { paddingBottom: insets.bottom || spacing.md },
              { transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }] },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>No dream logged</Text>
            <Text style={styles.sheetSubtitle}>What happened that night?</Text>

            <TouchableOpacity style={styles.sheetOption} onPress={handleAddDream} activeOpacity={0.7}>
              <Plus size={18} color={colors.accent} />
              <View>
                <Text style={styles.sheetOptionLabel}>Add a dream</Text>
                <Text style={styles.sheetOptionSub}>Log a dream for this night</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetOption} onPress={handleForgot} activeOpacity={0.7}>
              <X size={18} color={colors.textMuted} />
              <View>
                <Text style={styles.sheetOptionLabel}>I forgot</Text>
                <Text style={styles.sheetOptionSub}>Mark this night — helps track recall rate</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
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
  dayNumberFuture: {
    color: colors.textDisabled,
    opacity: 0.4,
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
  forgottenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.cardPadding,
  },
  forgottenText: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    color: colors.textMuted,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceCardBorder,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sheetSubtitle: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sheetOptionLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    fontWeight: '500' as const,
    color: colors.textPrimary,
  },
  sheetOptionSub: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    color: colors.textMuted,
    marginTop: 2,
  },
  emotionLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  legendEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendCircle: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMuted,
  },
  emptyMonthText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
});
