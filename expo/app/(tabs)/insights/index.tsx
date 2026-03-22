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
import { Lock, TrendingUp, TrendingDown, Sparkles } from 'lucide-react-native';
import { useDreamsStore } from '@/store/dreamsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { colors, fonts, typography, spacing, radii, sizes } from '@/constants/theme';

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const _router = useRouter();
  const allDreams = useDreamsStore((s) => s.dreams);
  const dreams = useMemo(() => allDreams.filter((d) => !d.isForgotten), [allDreams]);
  const isPremium = useSettingsStore((s) => s.isPremium);
  const { monthlyPackage, isLoading: rcLoading, purchasePackage } = useRevenueCat();

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
  const stats = useDreamsStore((s) => s.stats);

  const recallRate = useMemo(() => {
    const total = stats.totalDreamsLogged + stats.totalForgotten;
    if (total === 0) return null;
    return Math.round((stats.totalDreamsLogged / total) * 100);
  }, [stats.totalDreamsLogged, stats.totalForgotten]);

  // Recall trend: compare last 2 weeks
  const recallTrend = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const forgottenDates = new Set(allDreams.filter((d) => d.isForgotten).map((d) => d.date));

    let thisWeekDreams = 0, thisWeekForgotten = 0;
    let lastWeekDreams = 0, lastWeekForgotten = 0;

    allDreams.forEach((d) => {
      const date = new Date(d.date);
      if (date >= oneWeekAgo) {
        if (d.isForgotten) thisWeekForgotten++;
        else thisWeekDreams++;
      } else if (date >= twoWeeksAgo) {
        if (d.isForgotten) lastWeekForgotten++;
        else lastWeekDreams++;
      }
    });

    const thisTotal = thisWeekDreams + thisWeekForgotten;
    const lastTotal = lastWeekDreams + lastWeekForgotten;
    if (thisTotal === 0 || lastTotal === 0) return 0;
    const thisRate = thisWeekDreams / thisTotal;
    const lastRate = lastWeekDreams / lastTotal;
    return thisRate - lastRate; // positive = improving
  }, [allDreams]);

  const symbolCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    dreams.forEach((d) => {
      d.symbols.forEach((s) => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [dreams]);

  const emotionTrends = useMemo(() => {
    const weeks: Record<string, Record<string, number>> = {};
    const now = new Date();
    dreams.forEach((d) => {
      const dreamDate = new Date(d.date);
      const diffDays = Math.floor((now.getTime() - dreamDate.getTime()) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(diffDays / 7);
      if (weekIndex >= 0 && weekIndex < 4) {
        const weekKey = `W${4 - weekIndex}`;
        if (!weeks[weekKey]) weeks[weekKey] = {};
        weeks[weekKey][d.emotion] = (weeks[weekKey][d.emotion] || 0) + 1;
      }
    });

    // Collect all emotions that appear
    const allEmotions = new Set<string>();
    Object.values(weeks).forEach((w) => Object.keys(w).forEach((e) => allEmotions.add(e)));

    // Build per-emotion series: [W1, W2, W3, W4]
    const series: { emotion: string; data: number[] }[] = [];
    allEmotions.forEach((emotion) => {
      const data = ['W1', 'W2', 'W3', 'W4'].map((wk) => weeks[wk]?.[emotion] || 0);
      if (data.some((v) => v > 0)) series.push({ emotion, data });
    });
    return series;
  }, [dreams]);

  const maxEmotionTrend = useMemo(() => {
    let max = 1;
    emotionTrends.forEach((s) => s.data.forEach((v) => { if (v > max) max = v; }));
    return max;
  }, [emotionTrends]);

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
      {recallRate !== null && (
        <>
          <Text style={styles.sectionTitle}>Dream Recall Rate</Text>
          <View style={styles.recallCard}>
            <View style={styles.recallMain}>
              <Text style={styles.recallPercent}>{recallRate}%</Text>
              <View style={styles.recallTrend}>
                {recallTrend > 0 ? (
                  <TrendingUp size={16} color={colors.success} />
                ) : recallTrend < 0 ? (
                  <TrendingDown size={16} color={colors.danger} />
                ) : null}
                {recallTrend !== 0 && (
                  <Text style={[styles.recallTrendText, { color: recallTrend > 0 ? colors.success : colors.danger }]}>
                    {recallTrend > 0 ? 'Improving' : 'Declining'}
                  </Text>
                )}
              </View>
            </View>
            <Text style={styles.recallSub}>
              {stats.totalDreamsLogged} remembered · {stats.totalForgotten} forgotten
            </Text>
          </View>
        </>
      )}

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

      {emotionTrends.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Emotion Trends</Text>
          <View style={styles.chartCard}>
            <View style={styles.trendChart}>
              {['W1', 'W2', 'W3', 'W4'].map((wk, wi) => (
                <View key={wk} style={styles.trendColumn}>
                  <View style={styles.trendBarStack}>
                    {emotionTrends.map((series) => {
                      const val = series.data[wi];
                      if (val === 0) return null;
                      return (
                        <View
                          key={series.emotion}
                          style={[
                            styles.trendSegment,
                            {
                              height: `${(val / maxEmotionTrend) * 100}%`,
                              backgroundColor: colors.emotions[series.emotion] || colors.emotions.Neutral,
                            },
                          ]}
                        />
                      );
                    })}
                  </View>
                  <Text style={styles.barLabel}>{wk}</Text>
                </View>
              ))}
            </View>
            <View style={styles.trendLegend}>
              {emotionTrends.map((series) => (
                <View key={series.emotion} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.emotions[series.emotion] || colors.emotions.Neutral }]} />
                  <Text style={styles.legendText}>{series.emotion}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

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

      {symbolCounts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recurring Symbols</Text>
          <View style={styles.tagsContainer}>
            {symbolCounts.map(([symbol, count]) => (
              <View
                key={symbol}
                style={[styles.symbolTag, count >= 2 && styles.symbolTagAccent]}
              >
                <Sparkles size={10} color={count >= 2 ? colors.accent : colors.textMuted} />
                <Text style={[styles.symbolTagText, count >= 2 && styles.symbolTagTextAccent]}>
                  {symbol} ({count})
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Dream Stats</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalDreams}</Text>
          <Text style={styles.statLabel}>DREAMS</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{streak}</Text>
          <Text style={styles.statLabel}>STREAK</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{interpretedCount}</Text>
          <Text style={styles.statLabel}>INTERPRETED</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{recallRate ?? 0}%</Text>
          <Text style={styles.statLabel}>RECALL</Text>
        </View>
      </View>
    </>
  );

  if (!isPremium) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.lockedPage}>
          <Text style={styles.pageTitle}>Insights</Text>
          <View style={styles.lockCenter}>
            <Lock size={36} color={colors.accent} />
            <Text style={styles.lockTitle}>Unlock Your Dream Insights</Text>
            <Text style={styles.lockSubtext}>
              See your dream patterns, emotion trends, recurring symbols, and recall rate with Premium.
            </Text>
            <TouchableOpacity
              style={styles.lockCta}
              onPress={async () => {
                if (!monthlyPackage) return;
                await purchasePackage(monthlyPackage);
              }}
              activeOpacity={0.8}
              disabled={rcLoading}
            >
              <Text style={styles.lockCtaText}>{rcLoading ? 'Processing...' : 'Start Free Trial'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Insights</Text>
        {renderContent()}
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
  recallCard: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.cardPadding,
  },
  recallMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  recallPercent: {
    fontFamily: fonts.sans,
    fontSize: 36,
    fontWeight: '700' as const,
    color: colors.accent,
  },
  recallTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recallTrendText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    fontWeight: '500' as const,
  },
  recallSub: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  trendChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: spacing.md,
  },
  trendColumn: {
    alignItems: 'center',
    flex: 1,
  },
  trendBarStack: {
    height: 100,
    width: 24,
    justifyContent: 'flex-end',
    borderRadius: radii.xs,
    overflow: 'hidden',
    backgroundColor: colors.surfaceCardBorder,
  },
  trendSegment: {
    width: '100%',
    minHeight: 2,
  },
  trendLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    color: colors.textMuted,
  },
  symbolTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  symbolTagAccent: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentMuted,
  },
  symbolTagText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  symbolTagTextAccent: {
    color: colors.accent,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    flexGrow: 1,
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
  lockedPage: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
  },
  lockCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  lockTitle: {
    fontFamily: fonts.serif,
    fontSize: typography.heading.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  lockSubtext: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 22,
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
