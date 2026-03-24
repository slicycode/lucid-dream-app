import { GlassAsset } from '@/components/GlassAsset';
import { glassAssets } from '@/constants/glassAssets';
import { colors, fonts, radii, spacing, typography } from '@/constants/theme';
import { useDreamsStore } from '@/store/dreamsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useRouter, useFocusEffect } from 'expo-router';
import { trackScreen } from '@/services/analytics';
import { useTranslation } from 'react-i18next';
import { Sparkles, TrendingDown, TrendingUp } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const allDreams = useDreamsStore((s) => s.dreams);
  const dreams = useMemo(() => allDreams.filter((d) => !d.isForgotten), [allDreams]);
  const isPremium = useSettingsStore((s) => s.isPremium);
  const router = useRouter();

  useFocusEffect(useCallback(() => { trackScreen('Insights'); }, []));

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

  const patternCounts = useMemo(() => {
    const merged: { name: string; count: number; type: 'theme' | 'symbol' }[] = [
      ...themeCounts.map(([name, count]) => ({ name, count, type: 'theme' as const })),
      ...symbolCounts.map(([name, count]) => ({ name, count, type: 'symbol' as const })),
    ];
    return merged.sort((a, b) => b.count - a.count);
  }, [themeCounts, symbolCounts]);

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

  const { t } = useTranslation();
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  // Entrance animations
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(16)).current;
  const statAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 450, delay: 50, useNativeDriver: true }),
      Animated.spring(contentSlide, { toValue: 0, damping: 20, stiffness: 200, delay: 50, useNativeDriver: true }),
    ]).start();

    // Stagger stat cards
    Animated.stagger(80, statAnims.map((anim) =>
      Animated.spring(anim, { toValue: 1, damping: 16, stiffness: 180, useNativeDriver: true })
    )).start();
  }, []);

  const renderContent = () => (
    <>
      {recallRate !== null && (
        <>
          <Text style={styles.sectionTitle}>{t('insights.dreamRecallRate')}</Text>
          <View style={[styles.recallCard, styles.recallCardHero]}>
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
                    {recallTrend > 0 ? t('insights.improving') : t('insights.declining')}
                  </Text>
                )}
              </View>
            </View>
            <Text style={styles.recallSub}>
              {stats.totalDreamsLogged} {t('insights.remembered')} · {stats.totalForgotten} {t('insights.forgotten')}
            </Text>
            <View style={styles.recallGlassAccent} pointerEvents="none">
              <GlassAsset source={glassAssets.brain} size={64} />
            </View>
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>{t('insights.dreamFrequency')}</Text>
      {totalDreams < 3 ? (
        <View style={[styles.chartCard, { overflow: 'hidden' }]}>
          <Text style={styles.lowDataCount}>
            {t('insights.dreamsLogged', { count: totalDreams })}
          </Text>
          <Text style={styles.lowDataMessage}>{t('insights.logMoreForTrends')}</Text>
          <View style={styles.freqLowDataAccent} pointerEvents="none">
            <GlassAsset source={glassAssets.cloud} size={64} />
          </View>
        </View>
      ) : (
        <View style={[styles.chartCard, { overflow: 'hidden' }]}>
          <View style={styles.freqChartAccent} pointerEvents="none">
            <GlassAsset source={glassAssets.cloud} size={64} />
          </View>
          <View style={styles.barChart}>
            {weeklyData.map((count, i) => (
              <Pressable
                key={i}
                style={styles.barColumn}
                onPress={() => setSelectedBar(selectedBar === i ? null : i)}
              >
                <Text style={[
                  styles.barCount,
                  selectedBar !== i && { opacity: 0 },
                ]}>{count}</Text>
                <View style={[
                  styles.barContainer,
                  selectedBar !== null && selectedBar !== i && { opacity: 0.35 },
                ]}>
                  <View style={[styles.bar, { height: `${(count / maxWeekly) * 100}%` }]} />
                </View>
                <Text style={[
                  styles.barLabel,
                  selectedBar === i && styles.barLabelActive,
                ]}>W{i + 1}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>{t('insights.dreamStats')}</Text>
      <View style={styles.statsGrid}>
        {[
          { value: totalDreams, label: t('insights.statDreams') },
          { value: streak, label: t('insights.statStreak') },
          { value: interpretedCount, label: t('insights.statInterpreted') },
          { value: `${recallRate ?? 0}%`, label: t('insights.statRecall') },
        ].map((stat, i) => (
          <Animated.View
            key={stat.label}
            style={[styles.statCard, {
              opacity: statAnims[i],
              transform: [{ translateY: statAnims[i].interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
            }]}
          >
            <Text style={styles.statNumber}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Animated.View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>{t('insights.mostCommonEmotions')}</Text>
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
          <Text style={styles.noDataText}>{t('insights.noDataYet')}</Text>
        )}
      </View>

      {emotionTrends.length > 0 && totalDreams >= 5 && (
        <>
          <Text style={styles.sectionTitle}>{t('insights.emotionTrends')}</Text>
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

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitleInRow}>{t('insights.recurringPatterns')}</Text>
      </View>
      <View style={styles.tagsContainer}>
        {patternCounts.length >= 2 ? (
          patternCounts.map(({ name, count, type }) =>
            type === 'symbol' ? (
              <View key={`symbol-${name}`} style={[styles.symbolTag, count >= 2 && styles.symbolTagAccent]}>
                <Sparkles size={10} color={count >= 2 ? colors.accent : colors.textMuted} />
                <Text style={[styles.symbolTagText, count >= 2 && styles.symbolTagTextAccent]}>
                  {name} ({count})
                </Text>
              </View>
            ) : (
              <View key={`theme-${name}`} style={[styles.themeTag, count >= 2 && styles.themeTagAccent]}>
                <Text style={[styles.themeTagText, count >= 2 && styles.themeTagTextAccent]}>
                  {name} ({count})
                </Text>
              </View>
            )
          )
        ) : (
          <Text style={styles.noDataText}>{t('insights.patternsWillAppear')}</Text>
        )}
      </View>
    </>
  );

  if (!isPremium) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Background skeleton preview */}
        <View style={styles.scrollContent} pointerEvents="none">
          <Text style={[styles.pageTitle, { marginBottom: spacing.lg }]}>{t('insights.title')}</Text>
          <View style={{ opacity: 0.2 }}>
            <Text style={styles.sectionTitle}>{t('insights.dreamRecallRate')}</Text>
            <View style={styles.recallCard}>
              <View style={styles.recallMain}>
                <View style={styles.skeletonNumber} />
                <View style={{ gap: 6 }}>
                  <View style={styles.skeletonLine} />
                  <View style={[styles.skeletonLine, { width: 60 }]} />
                </View>
              </View>
              <View style={[styles.skeletonLine, { width: 160, marginTop: spacing.xs }]} />
            </View>

            <Text style={styles.sectionTitle}>{t('insights.dreamFrequency')}</Text>
            <View style={styles.chartCard}>
              <View style={styles.barChart}>
                {[40, 65, 30, 85, 50, 20, 70].map((h, i) => (
                  <View key={i} style={styles.barColumn}>
                    <View style={styles.barContainer}>
                      <View style={[styles.bar, { height: h }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.sectionTitle}>{t('insights.dreamStats')}</Text>
            <View style={styles.statsGrid}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.statCard}>
                  <View style={styles.skeletonNumber} />
                  <View style={[styles.skeletonLine, { width: 56 }]} />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Dark overlay */}
        <View style={styles.lockOverlay} pointerEvents="none" />

        {/* Lock message — centered absolutely on top */}
        <View style={styles.lockCenter}>
          <GlassAsset source={glassAssets.key} size={120} />
          <Text style={styles.lockTitle}>{t('insights.lockTitle')}</Text>
          <Text style={styles.lockSubtext}>{t('insights.lockSubtext')}</Text>
          <TouchableOpacity
            style={styles.lockCta}
            onPress={() => router.push('/paywall?source=insights' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.lockCtaText}>{t('paywall.startFreeTrial')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (totalDreams === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.zeroStateContainer}>
          <GlassAsset source={glassAssets.hand} size={140} />
          <Text style={styles.zeroStateTitle}>{t('insights.insightsWaiting')}</Text>
          <Text style={styles.zeroStateSub}>{t('insights.logFirstDream')}</Text>
          <TouchableOpacity
            style={styles.zeroStateCta}
            onPress={() => router.push('/new-dream' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.zeroStateCtaText}>{t('insights.logADream')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: contentFade, transform: [{ translateY: contentSlide }] }}>
          <View style={styles.pageTitleRow}>
            <Text style={styles.pageTitle}>{t('insights.title')}</Text>
            <TouchableOpacity
              onPress={() => router.push('/dream-dictionary' as any)}
              activeOpacity={0.7}
              style={styles.dictionaryLink}
            >
              <Text style={styles.dictionaryLinkText}>{t('insights.dictionary')}</Text>
            </TouchableOpacity>
          </View>
          {renderContent()}
        </Animated.View>
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
    height: 140,
    zIndex: 1,
    paddingRight: 64,
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
    fontFamily: fonts.serif,
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
    overflow: 'hidden',
  },
  statNumber: {
    fontFamily: fonts.serif,
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
  lockOverlay: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  lockCenter: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  previewSection: {
    marginTop: spacing.sm,
  },
  skeletonNumber: {
    width: 48,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.textMuted,
    marginBottom: spacing.xs,
  },
  skeletonLine: {
    width: 100,
    height: 10,
    borderRadius: radii.xs,
    backgroundColor: colors.textMuted,
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
  lowDataCount: {
    fontFamily: fonts.serif,
    fontSize: typography.heading.fontSize,
    fontWeight: '700' as const,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  lowDataMessage: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  zeroStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  zeroStateTitle: {
    fontFamily: fonts.serif,
    fontSize: typography.heading.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  zeroStateSub: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  zeroStateCta: {
    backgroundColor: colors.ctaAccentBg,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
  },
  zeroStateCtaText: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.ctaAccentText,
  },
  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  recallCardHero: {
    borderColor: 'rgba(201, 168, 76, 0.25)',
    backgroundColor: 'rgba(201, 168, 76, 0.04)',
    overflow: 'hidden',
  },
  recallGlassAccent: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  freqLowDataAccent: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  freqChartAccent: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
  },
  barCount: {
    fontFamily: fonts.serif,
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.accent,
    marginBottom: 4,
  },
  barLabelActive: {
    color: colors.accent,
    fontWeight: '600' as const,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitleInRow: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '500' as const,
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  dictionaryLink: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  dictionaryLinkText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    fontWeight: '500' as const,
    color: colors.accent,
  },
});
