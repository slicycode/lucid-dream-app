import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock } from 'lucide-react-native';
import { useDreamsStore } from '@/store/dreamsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, fonts, typography, spacing, radii, sizes } from '@/constants/theme';

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const _router = useRouter();
  const dreams = useDreamsStore((s) => s.dreams);
  const isPremium = useSettingsStore((s) => s.isPremium);

  const emotionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    dreams.forEach((d) => {
      counts[d.emotion] = (counts[d.emotion] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [dreams]);

  const maxEmotionCount = emotionCounts.length > 0 ? emotionCounts[0][1] : 1;

  const themeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    dreams.forEach((d) => {
      d.themes.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [dreams]);

  const totalDreams = dreams.length;
  const interpretedCount = dreams.filter((d) => d.interpretation).length;

  const streak = useMemo(() => {
    let current = 0;
    const today = new Date();
    const d = new Date(today);
    const dreamDates = new Set(dreams.map((dr) => dr.date));

    while (true) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (dreamDates.has(key)) {
        current++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return current;
  }, [dreams]);

  const weeklyData = useMemo(() => {
    const weeks: number[] = [0, 0, 0, 0];
    const now = new Date();
    dreams.forEach((d) => {
      const dreamDate = new Date(d.date);
      const diffDays = Math.floor((now.getTime() - dreamDate.getTime()) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(diffDays / 7);
      if (weekIndex >= 0 && weekIndex < 4) {
        weeks[3 - weekIndex]++;
      }
    });
    return weeks;
  }, [dreams]);

  const maxWeekly = Math.max(...weeklyData, 1);

  const renderContent = () => (
    <>
      <Text style={styles.sectionTitle}>Dream Frequency</Text>
      <View style={styles.chartCard}>
        <View style={styles.barChart}>
          {weeklyData.map((count, i) => (
            <View key={i} style={styles.barColumn}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${(count / maxWeekly) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>W{i + 1}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Most Common Emotions</Text>
      <View style={styles.chartCard}>
        {emotionCounts.map(([emotion, count]) => (
          <View key={emotion} style={styles.emotionRow}>
            <Text style={styles.emotionLabel}>{emotion}</Text>
            <View style={styles.emotionBarBg}>
              <View
                style={[
                  styles.emotionBarFill,
                  {
                    width: `${(count / maxEmotionCount) * 100}%`,
                    backgroundColor: colors.emotions[emotion] || colors.emotions.Neutral,
                  },
                ]}
              />
            </View>
            <Text style={styles.emotionCount}>{count}</Text>
          </View>
        ))}
        {emotionCounts.length === 0 && (
          <Text style={styles.noDataText}>No dreams logged yet</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Recurring Themes</Text>
      <View style={styles.tagsContainer}>
        {themeCounts.map(([theme, count]) => (
          <View
            key={theme}
            style={[
              styles.themeTag,
              count >= 2 && styles.themeTagAccent,
            ]}
          >
            <Text style={[styles.themeTagText, count >= 2 && styles.themeTagTextAccent]}>
              {theme} ({count})
            </Text>
          </View>
        ))}
        {themeCounts.length === 0 && (
          <Text style={styles.noDataText}>No themes recorded yet</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Dream Stats</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalDreams}</Text>
          <Text style={styles.statLabel}>DREAMS</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{streak}</Text>
          <Text style={styles.statLabel}>DAY STREAK</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{interpretedCount}</Text>
          <Text style={styles.statLabel}>INTERPRETED</Text>
        </View>
      </View>
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Insights</Text>

        {isPremium ? (
          renderContent()
        ) : (
          <View>
            <View style={styles.blurredContent}>
              {renderContent()}
            </View>
            <View style={styles.lockOverlay}>
              <Lock size={32} color={colors.textPrimary} />
              <Text style={styles.lockTitle}>Unlock Your Dream Insights</Text>
              <Text style={styles.lockSubtext}>Upgrade to Premium to see your patterns</Text>
              <TouchableOpacity
                style={styles.lockCta}
                onPress={() => {}}
                activeOpacity={0.8}
              >
                <Text style={styles.lockCtaText}>Start Free Trial</Text>
              </TouchableOpacity>
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
  pageTitle: {
    fontFamily: fonts.serif,
    fontSize: typography.heading.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '500' as const,
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  chartCard: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.cardPadding,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 100,
    width: 24,
    justifyContent: 'flex-end',
    borderRadius: radii.xs,
    overflow: 'hidden',
    backgroundColor: colors.surfaceCardBorder,
  },
  bar: {
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: radii.xs,
    minHeight: 2,
  },
  barLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emotionLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    width: 80,
  },
  emotionBarBg: {
    flex: 1,
    height: 8,
    borderRadius: radii.xs,
    backgroundColor: colors.surfaceCardBorder,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  emotionBarFill: {
    height: '100%',
    borderRadius: radii.xs,
  },
  emotionCount: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    width: 24,
    textAlign: 'right',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  themeTag: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  themeTagAccent: {
    borderColor: colors.accentBorder,
  },
  themeTagText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  themeTagTextAccent: {
    color: colors.accent,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: fonts.sans,
    fontSize: typography.heading.fontSize,
    fontWeight: '700' as const,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '500' as const,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  noDataText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  blurredContent: {
    opacity: 0.15,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  lockTitle: {
    fontFamily: fonts.serif,
    fontSize: typography.heading.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  lockSubtext: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  lockCta: {
    backgroundColor: colors.ctaAccentBg,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
  },
  lockCtaText: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.ctaAccentText,
  },
});
