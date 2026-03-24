import { colors, fonts, radii, sizes, spacing, typography } from '@/constants/theme';
import { trackScreen } from '@/services/analytics';
import { useDreamsStore } from '@/store/dreamsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { generateWeeklyDigest } from '@/services/weeklyDigest';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronDown, Eye, Moon, Plus, Skull, Sparkles, Trash2 } from 'lucide-react-native';
import { GlassAsset } from '@/components/GlassAsset';
import { glassAssets } from '@/constants/glassAssets';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function getWeekDreamCount(dreams: { date: string }[]): number {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return dreams.filter((d) => new Date(d.date) >= weekAgo).length;
}

function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export default function JournalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const allDreams = useDreamsStore((s) => s.dreams);
  const dreams = useMemo(() => allDreams.filter((d) => !d.isForgotten), [allDreams]);
  const deleteDream = useDreamsStore((s) => s.deleteDream);
  const weeklyDigest = useDreamsStore((s) => s.weeklyDigest);
  const setWeeklyDigest = useDreamsStore((s) => s.setWeeklyDigest);
  const isPremium = useSettingsStore((s) => s.isPremium);
  const name = useOnboardingStore((s) => s.name);
  const [refreshing, setRefreshing] = React.useState(false);
  const [digestLoading, setDigestLoading] = React.useState(false);
  const [digestCollapsed, setDigestCollapsed] = useState(false);
  const [digestContentHeight, setDigestContentHeight] = useState(0);
  const digestHeight = useRef(new Animated.Value(1)).current;

  useFocusEffect(useCallback(() => { trackScreen('Journal'); }, []));
  const chevronRotation = useRef(new Animated.Value(0)).current;

  const toggleDigest = useCallback(() => {
    const toCollapsed = !digestCollapsed;
    setDigestCollapsed(toCollapsed);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(digestHeight, { toValue: toCollapsed ? 0 : 1, damping: 18, stiffness: 200, useNativeDriver: false }),
      Animated.spring(chevronRotation, { toValue: toCollapsed ? 1 : 0, damping: 18, stiffness: 200, useNativeDriver: true }),
    ]).start();
  }, [digestCollapsed, digestHeight, chevronRotation]);

  // Show digest card on Sunday (0) and Monday (1) only
  const todayDow = new Date().getDay();
  const isDigestDay = todayDow === 0 || todayDow === 1;

  // Week key: Monday-based ISO date (Sunday uses previous Monday)
  const currentWeekOf = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.getFullYear(), now.getMonth(), diff).toISOString().split('T')[0];
  }, []);

  // Track whether a digest was already generated this week to prevent API spam
  // (e.g. user generates → deletes dream → creates another → would re-trigger)
  const digestGeneratedThisSession = useRef(false);

  // Auto-generate digest on Sunday/Monday if premium and not yet generated
  useEffect(() => {
    if (!isDigestDay || !isPremium || digestLoading) return;
    if (weeklyDigest?.weekOf === currentWeekOf) return;
    if (digestGeneratedThisSession.current) return;
    const recentDreams = dreams.filter((d) => {
      const diff = (Date.now() - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    });
    if (recentDreams.length === 0) return;

    setDigestLoading(true);
    digestGeneratedThisSession.current = true;
    generateWeeklyDigest(
      recentDreams.map((d) => ({ title: d.title, emotion: d.emotion, themes: d.themes, dreamType: d.dreamType })),
      currentWeekOf
    )
      .then((result) => setWeeklyDigest({
        summary: result.summary,
        weekOf: currentWeekOf,
        dreamCount: recentDreams.length,
        generatedAt: new Date().toISOString(),
      }))
      .catch(() => {/* silently fail — digest is non-critical */})
      .finally(() => setDigestLoading(false));
  }, [isDigestDay, isPremium, currentWeekOf, weeklyDigest?.weekOf, dreams.length]);

  // Digest freshness: how many dreams were logged since digest was generated
  const digestIsStale = useMemo(() => {
    if (!weeklyDigest || weeklyDigest.weekOf !== currentWeekOf) return false;
    const currentCount = dreams.filter((d) => {
      const diff = (Date.now() - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }).length;
    return currentCount > (weeklyDigest.dreamCount ?? 0);
  }, [weeklyDigest, currentWeekOf, dreams]);

  const digestTimestamp = useMemo(() => {
    if (!weeklyDigest?.generatedAt) return t('journal.generatedEarlierThisWeek');
    const gen = new Date(weeklyDigest.generatedAt);
    if (isNaN(gen.getTime())) return t('journal.generatedEarlierThisWeek');
    const now = new Date();
    const hoursAgo = Math.floor((now.getTime() - gen.getTime()) / (1000 * 60 * 60));
    if (hoursAgo < 1) return t('journal.generatedJustNow');
    if (hoursAgo < 24) return t('journal.generatedHoursAgo', { n: hoursAgo });
    const daysAgo = Math.floor(hoursAgo / 24);
    return t('journal.generatedDaysAgo', { n: daysAgo });
  }, [weeklyDigest?.generatedAt, t]);

  // Entrance animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(12)).current;
  const cardAnims = useRef<Map<string, Animated.Value>>(new Map()).current;
  const fabScale = useRef(new Animated.Value(0)).current;
  const prevDreamCount = useRef(dreams.length);
  const isInitialMount = useRef(true);

  // Get or create an anim value for a dream id
  // After initial mount, new cards start fully visible (1) to avoid invisible gaps
  const getCardAnim = useCallback((id: string) => {
    if (!cardAnims.has(id)) {
      cardAnims.set(id, new Animated.Value(isInitialMount.current ? 0 : 1));
    }
    return cardAnims.get(id)!;
  }, [cardAnims]);

  // Initial mount: stagger all cards
  useEffect(() => {
    // Header entrance
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 500, delay: 50, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, damping: 20, stiffness: 200, delay: 50, useNativeDriver: true }),
    ]).start();

    // Stagger all existing cards on first mount
    const cardAnimations = dreams.map((dream, i) => {
      const anim = getCardAnim(dream.id);
      return Animated.spring(anim, {
        toValue: 1,
        damping: 18,
        stiffness: 180,
        delay: 200 + i * 60,
        useNativeDriver: true,
      });
    });
    Animated.parallel(cardAnimations).start();

    // FAB pop-in
    Animated.spring(fabScale, {
      toValue: 1,
      damping: 12,
      stiffness: 200,
      delay: 400,
      useNativeDriver: true,
    }).start();

    isInitialMount.current = false;
  }, []);

  // When new dreams are added, animate them in
  useEffect(() => {
    if (isInitialMount.current) return;
    const added = dreams.length - prevDreamCount.current;
    if (added > 0 && dreams.length > 0) {
      // Animate all newly added dreams (they appear at the front)
      const newDreams = dreams.slice(0, added);
      newDreams.forEach((dream, i) => {
        const anim = getCardAnim(dream.id);
        anim.setValue(0);
        Animated.spring(anim, {
          toValue: 1,
          damping: 16,
          stiffness: 200,
          delay: i * 40,
          useNativeDriver: true,
        }).start();
      });
    }
    prevDreamCount.current = dreams.length;
  }, [dreams.length]);

  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('journal.goodMorning');
    if (hour < 18) return t('journal.goodAfternoon');
    return t('journal.goodEvening');
  }, [t]);

  const formatDate = useCallback((dateStr: string): string => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return t('journal.today');
    if (diff === 1) return t('journal.lastNight');
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }, [t]);

  const weekCount = useMemo(() => getWeekDreamCount(dreams), [dreams]);
  const hasDreamToday = useMemo(() => dreams.some((d) => d.date === getTodayString()), [dreams]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  const isSwiping = useRef(false);
  const deleteAnims = useRef<Map<string, Animated.Value>>(new Map());

  const getDeleteAnim = useCallback((id: string) => {
    if (!deleteAnims.current.has(id)) {
      deleteAnims.current.set(id, new Animated.Value(1));
    }
    return deleteAnims.current.get(id)!;
  }, []);

  const animateDelete = useCallback((id: string) => {
    isSwiping.current = false;
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const anim = getDeleteAnim(id);
    Animated.timing(anim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      deleteDream(id);
      deleteAnims.current.delete(id);
    });
  }, [deleteDream, getDeleteAnim]);

  const handleDeleteDream = useCallback((id: string, title: string) => {
    Alert.alert(
      t('journal.deleteDreamTitle'),
      t('journal.deleteDreamMessage', { title }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => swipeableRefs.current.get(id)?.close(),
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => animateDelete(id),
        },
      ]
    );
  }, [animateDelete, t]);

  const renderDeleteAction = useCallback(
    (progress: Animated.AnimatedInterpolation<number>) => {
      const translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [80, 0],
      });
      return (
        <Animated.View style={[styles.swipeDeleteAction, { transform: [{ translateX }] }]}>
          <Trash2 size={20} color="#FFFFFF" />
        </Animated.View>
      );
    },
    []
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textMuted}
          />
        }
      >
        <Animated.View style={{ opacity: headerFade, transform: [{ translateY: headerSlide }] }}>
          <Text style={styles.dateLabel}>{today}</Text>
          <Text style={styles.greeting}>{greeting}, {name || 'Dreamer'}.</Text>
          {weekCount > 0 && (
            <Text style={styles.weekStat}>{t('journal.dreamsThisWeek', { count: weekCount })}</Text>
          )}
        </Animated.View>

        {isDigestDay && (
          isPremium ? (
            <View style={styles.digestCard}>
              <TouchableOpacity
                style={styles.digestHeader}
                onPress={weeklyDigest?.weekOf === currentWeekOf && weeklyDigest.summary ? toggleDigest : undefined}
                activeOpacity={0.7}
              >
                <Sparkles size={14} color={colors.accent} />
                <Text style={styles.digestLabel}>{t('journal.weeklyDigestTitle')}</Text>
                {weeklyDigest?.weekOf === currentWeekOf && weeklyDigest.summary && (
                  <Animated.View style={{
                    marginLeft: 'auto',
                    transform: [{ rotate: chevronRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-90deg'] }) }],
                  }}>
                    <ChevronDown size={16} color={colors.textMuted} />
                  </Animated.View>
                )}
              </TouchableOpacity>
              {digestLoading ? (
                <Text style={styles.digestSummary}>{t('journal.generatingDigest')}</Text>
              ) : weeklyDigest?.weekOf === currentWeekOf && weeklyDigest.summary ? (
                <Animated.View style={{
                  maxHeight: digestHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 350] }),
                  opacity: digestHeight,
                  overflow: 'hidden',
                }}>
                  <Text style={styles.digestSummary}>{weeklyDigest.summary}</Text>
                  <View style={styles.digestMeta}>
                    <Text style={styles.digestMetaText}>
                      {digestTimestamp}{weeklyDigest.dreamCount ? ` · ${t('journal.basedOnDreams', { count: weeklyDigest.dreamCount })}` : ''}
                    </Text>
                    {digestIsStale && (
                      <Text style={styles.digestStaleText}>
                        {t('journal.digestStale')}
                      </Text>
                    )}
                  </View>
                </Animated.View>
              ) : weekCount > 0 ? (
                <Text style={styles.digestSummary}>{t('journal.digestGeneratesOnSunday')}</Text>
              ) : (
                <Text style={styles.digestSummary}>{t('journal.digestLogMore')}</Text>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.digestCard, styles.digestCardLocked]}
              onPress={() => router.push('/paywall?source=journal' as any)}
              activeOpacity={0.8}
            >
              <View style={styles.digestHeader}>
                <Sparkles size={14} color={colors.textMuted} />
                <Text style={[styles.digestLabel, { color: colors.textMuted }]}>{t('journal.weeklyDigestTitle')}</Text>
              </View>
              <Text style={[styles.digestSummary, { color: colors.textDisabled }]}>
                {t('journal.digestPremiumLock')}
              </Text>
            </TouchableOpacity>
          )
        )}

        {!hasDreamToday && (
          <TouchableOpacity
            style={styles.quickEntryCard}
            onPress={() => router.push('/new-dream')}
            activeOpacity={0.7}
            testID="quick-entry"
          >
            <GlassAsset
              source={glassAssets.feather}
              size={64}
              style={styles.quickEntryGlassAsset}
            />
            <Text style={styles.quickEntryTitle}>{t('journal.quickEntryTitle')}</Text>
            <Text style={styles.quickEntrySubtext}>{t('journal.quickEntrySubtext')}</Text>
          </TouchableOpacity>
        )}

        {dreams.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>{t('journal.recentDreams')}</Text>
            {dreams.map((dream) => {
              const deleteAnim = getDeleteAnim(dream.id);
              const entryAnim = getCardAnim(dream.id);
              return (
              <Animated.View
                key={dream.id}
                style={{
                  opacity: Animated.multiply(entryAnim, deleteAnim),
                  marginBottom: spacing.sm,
                  transform: [{
                    translateY: entryAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  }, {
                    scale: deleteAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  }, {
                    translateX: deleteAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [80, 0],
                    }),
                  }],
                }}
              >
              <Swipeable
                ref={(ref) => { if (ref) swipeableRefs.current.set(dream.id, ref); }}
                renderRightActions={renderDeleteAction}
                onSwipeableWillOpen={() => { isSwiping.current = true; }}
                onSwipeableOpen={() => {
                  if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleDeleteDream(dream.id, dream.title);
                }}
                onSwipeableClose={() => { isSwiping.current = false; }}
                rightThreshold={80}
                overshootRight={false}
              >
              <TouchableOpacity
                style={styles.dreamCard}
                onPress={() => {
                  if (isSwiping.current) return;
                  if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/dream/${dream.id}`);
                }}
                onLongPress={() => {
                  if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleDeleteDream(dream.id, dream.title);
                }}
                activeOpacity={0.7}
                testID={`dream-card-${dream.id}`}
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
                      <Text style={styles.dreamMeta}>
                        {formatDate(dream.date)} · {formatTime(dream.loggedAt)}
                      </Text>
                    </View>
                  </View>
                  {dream.interpretation && (
                    <Sparkles size={16} color={colors.accent} />
                  )}
                </View>
                <Text style={styles.dreamPreview} numberOfLines={2}>
                  {dream.content}
                </Text>
                <View style={styles.dreamPillsRow}>
                  {dream.dreamType === 'nightmare' ? (
                    <View style={styles.nightmarePill}>
                      <Skull size={10} color={colors.danger} />
                      <Text style={styles.nightmarePillText}>{t('journal.pillNightmare')}</Text>
                    </View>
                  ) : (
                    <View style={styles.dreamPill}>
                      <Moon size={10} color={colors.textSecondary} />
                      <Text style={styles.dreamPillText}>{t('journal.pillDream')}</Text>
                    </View>
                  )}
                  {dream.isLucid && (
                    <View style={styles.lucidPill}>
                      <Moon size={10} color={colors.accent} />
                      <Text style={styles.lucidPillText}>{t('journal.pillLucid')}</Text>
                    </View>
                  )}
                  {!dream.isFirstPerson ? (
                    <View style={styles.observerPill}>
                      <Eye size={10} color={colors.textSecondary} />
                      <Text style={styles.observerPillText}>{t('journal.pillObserver')}</Text>
                    </View>
                  ) : (
                    <View style={styles.observerPill}>
                      <Eye size={10} color={colors.accent} />
                      <Text style={[styles.observerPillText, { color: colors.accent }]}>{t('journal.pillFirstPerson')}</Text>
                      </View>
                  )}
                </View>
              </TouchableOpacity>
              </Swipeable>
              </Animated.View>
              );
            })}
          </>
        )}

        {dreams.length === 0 && (
          <View style={styles.emptyState}>
            <GlassAsset source={glassAssets.crescentMoon} size={120} />
            <Text style={styles.emptyTitle}>{t('journal.emptyTitle')}</Text>
            <Text style={styles.emptySubtext}>{t('journal.emptySubtext')}</Text>
          </View>
        )}
      </ScrollView>

      <Animated.View style={[styles.fab, { bottom: 44 + spacing.md, transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.fabTouchable}
          onPress={() => {
            if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/new-dream');
          }}
          activeOpacity={0.8}
          testID="fab-new-dream"
        >
          <Plus size={24} color={colors.ctaAccentText} />
        </TouchableOpacity>
      </Animated.View>
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
    paddingBottom: 100,
    paddingTop: spacing.md,
  },
  dateLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '500' as const,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  greeting: {
    fontFamily: fonts.serif,
    fontSize: typography.heading.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    lineHeight: 34,
    marginBottom: spacing.xs,
  },
  weekStat: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  quickEntryCard: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.cardPadding,
    marginBottom: spacing.sectionGap,
  },
  quickEntryGlassAsset: {
    position: 'absolute',
    top: -24,
    right: -12,
  },
  quickEntryTitle: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  quickEntrySubtext: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  sectionLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '500' as const,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  dreamCard: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.cardPadding,
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
  dreamPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.sm,
    marginLeft: sizes.emotionDot + spacing.sm,
  },
  dreamPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceInput,
    borderRadius: radii.lg,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dreamPillText: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  nightmarePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: radii.lg,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  nightmarePillText: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '500' as const,
    color: colors.danger,
  },
  lucidPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentMuted,
    borderRadius: radii.lg,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lucidPillText: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '500' as const,
    color: colors.accent,
  },
  observerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceInput,
    borderRadius: radii.lg,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  observerPillText: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  swipeDeleteAction: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.screenPadding,
    width: sizes.fabSize,
    height: sizes.fabSize,
    borderRadius: sizes.fabSize / 2,
    backgroundColor: colors.ctaAccentBg,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digestCard: {
    backgroundColor: 'rgba(201, 168, 76, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.20)',
    borderRadius: radii.md,
    padding: spacing.cardPadding,
    marginBottom: spacing.sectionGap,
    marginTop: spacing.sm,
  },
  digestCardLocked: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.surfaceCardBorder,
  },
  digestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  digestLabel: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    fontWeight: '500' as const,
    color: colors.accent,
  },
  digestSummary: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  digestMeta: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(201, 168, 76, 0.15)',
  },
  digestMetaText: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    color: colors.textDisabled,
  },
  digestStaleText: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    color: colors.accent,
    marginTop: 2,
  },
});
