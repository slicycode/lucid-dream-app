import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, MoreHorizontal, Sparkles, Moon, Skull, Star, Eye } from 'lucide-react-native';
import { useDreamsStore } from '@/store/dreamsStore';
import { useSettingsStore } from '@/store/settingsStore';

import { interpretDream } from '@/services/interpretation';
import { colors, fonts, typography, spacing, radii, sizes } from '@/constants/theme';

function highlightSymbols(text: string, symbols: string[]) {
  if (symbols.length === 0) return text;

  // Build regex matching any symbol word (case-insensitive, whole-ish match)
  const escaped = symbols.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');

  const parts = text.split(pattern);
  const symbolsLower = new Set(symbols.map((s) => s.toLowerCase()));

  return parts.map((part, i) => {
    if (symbolsLower.has(part.toLowerCase())) {
      return (
        <Text key={i} style={{ color: colors.accent }}>
          {part}
        </Text>
      );
    }
    return part;
  });
}

export default function DreamDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dreams = useDreamsStore((s) => s.dreams);
  const updateDream = useDreamsStore((s) => s.updateDream);
  const deleteDream = useDreamsStore((s) => s.deleteDream);
  const canInterpret = useSettingsStore((s) => s.canInterpret);
  const useInterpretation = useSettingsStore((s) => s.useInterpretation);


  const dream = useMemo(() => dreams.find((d) => d.id === id), [dreams, id]);

  // useEffect(() => {
  //   if (dream) console.log('[Dream Detail]', JSON.stringify(dream, null, 2));
  // }, [dream]);

  const [isInterpreting, setIsInterpreting] = useState(false);
  const [interpretationVisible, setInterpretationVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Content entrance animation
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 450, delay: 100, useNativeDriver: true }),
      Animated.spring(contentSlide, { toValue: 0, damping: 20, stiffness: 200, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (interpretationVisible) {
      Animated.spring(fadeAnim, { toValue: 1, damping: 18, stiffness: 200, useNativeDriver: true }).start();
    }
  }, [interpretationVisible, fadeAnim]);

  const handleUpgrade = useCallback(() => {
    router.push('/paywall' as any);
  }, [router]);

  const isPremium = useSettingsStore((s) => s.isPremium);

  const doInterpret = useCallback(async () => {
    if (!canInterpret()) {
      if (isPremium) {
        Alert.alert(
          'Daily Limit Reached',
          'You\'ve used all 10 interpretations for today. Come back tomorrow!',
          [{ text: 'OK' }]
        );
      } else {
        handleUpgrade();
      }
      return;
    }
    if (!dream) return;

    setIsInterpreting(true);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    try {
      const result = await interpretDream({
        dreamText: dream.content,
        emotion: dream.emotion,
        themes: dream.themes,
        isLucid: dream.isLucid,
        dreamType: dream.dreamType,
        vividness: dream.vividness,
        isFirstPerson: dream.isFirstPerson,
      });

      // Only decrement after successful API response
      useInterpretation();

      pulseLoop.stop();
      pulseAnim.setValue(1);
      setIsInterpreting(false);

      updateDream(dream.id, {
        interpretation: result.interpretation,
        symbols: result.symbols,
      });
      setInterpretationVisible(true);
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      pulseLoop.stop();
      pulseAnim.setValue(1);
      setIsInterpreting(false);

      const isOffline = e?.message?.includes('Network') || e?.message?.includes('fetch');
      Alert.alert(
        isOffline ? 'No Connection' : 'Interpretation Failed',
        isOffline
          ? 'Please check your internet connection and try again.'
          : 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [dream, updateDream, pulseAnim, canInterpret, useInterpretation, handleUpgrade]);

  const handleInterpret = useCallback(() => {
    if (dream?.interpretation) {
      Alert.alert(
        'Re-interpret this dream?',
        `This will replace the current interpretation and use one of your ${isPremium ? 'daily' : 'weekly'} interpretations.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Re-interpret', onPress: () => void doInterpret() },
        ]
      );
    } else {
      void doInterpret();
    }
  }, [dream, isPremium, doInterpret]);

  const handleMenu = useCallback(() => {
    Alert.alert(
      'Are you sure you want to delete this dream?',
      undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (dream) {
              deleteDream(dream.id);
              router.back();
            }
          },
        },
      ]
    );
  }, [dream, deleteDream, router]);

  if (!dream) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Dream not found</Text>
        </View>
      </View>
    );
  }

  const date = new Date(dream.loggedAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const hasInterpretation = dream.interpretation !== null || interpretationVisible;

  return (
    <View style={[styles.container, { paddingTop: insets.top - 32, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="back-button">
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleMenu} testID="menu-button">
          <MoreHorizontal size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: contentFade, transform: [{ translateY: contentSlide }] }}>
        <Text style={styles.dateText}>{formattedDate} · {formattedTime}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
          <View style={styles.badgesRow}>
            <View style={[styles.emotionBadge, { borderColor: colors.emotions[dream.emotion] || colors.emotions.Neutral }]}>
              <View style={[styles.emotionDot, { backgroundColor: colors.emotions[dream.emotion] || colors.emotions.Neutral }]} />
              <Text style={[styles.emotionText, { color: colors.emotions[dream.emotion] || colors.emotions.Neutral }]}>
                {dream.emotion}
              </Text>
            </View>
            {dream.dreamType === 'nightmare' && (
              <View style={styles.nightmareBadge}>
                <Skull size={12} color={colors.danger} />
                <Text style={styles.nightmareText}>Nightmare</Text>
              </View>
            )}
            {dream.isLucid && (
              <View style={styles.lucidBadge}>
                <Moon size={12} color={colors.accent} />
                <Text style={styles.lucidText}>Lucid</Text>
              </View>
            )}
            <View style={styles.observerBadge}>
              <Eye size={12} color={dream.isFirstPerson === false ? colors.accent : colors.textSecondary} />
              <Text style={[styles.observerText, dream.isFirstPerson === false && { color: colors.accent }]}>
                {dream.isFirstPerson === false ? 'Observer' : 'First person'}
              </Text>
            </View>
          </View>
        </ScrollView>

        <Text style={styles.title}>{dream.title}</Text>

        {(dream.rating !== null || dream.vividness !== null) && (
          <View style={styles.metaRow}>
            {dream.rating !== null && (
              <View style={styles.metaBadge}>
                <Star size={12} color={colors.textSecondary} />
                <Text style={styles.metaText}>{dream.rating}/5</Text>
              </View>
            )}
            {dream.vividness !== null && (
              <View style={styles.metaBadge}>
                <Eye size={12} color={colors.textSecondary} />
                <Text style={styles.metaText}>{dream.vividness}/5 vivid</Text>
              </View>
            )}
          </View>
        )}
        <Text style={styles.dreamContent}>{dream.content}</Text>

        {dream.themes.length > 0 && (
          <View style={styles.themesRow}>
            {dream.themes.map((theme) => (
              <View key={theme} style={styles.themeTag}>
                <Text style={styles.themeTagText}>{theme}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.divider} />

        {hasInterpretation ? (
          <Animated.View style={[styles.interpretSection, { opacity: dream.interpretation ? 1 : fadeAnim }]}>
            <View style={styles.interpHeader}>
              <Sparkles size={16} color={colors.accent} />
              <Text style={styles.interpLabel}>AI Interpretation</Text>
            </View>
            <Text style={styles.interpText}>
              {highlightSymbols(dream.interpretation ?? '', dream.symbols)}
            </Text>
            {dream.symbols.length > 0 && (
              <>
                <Text style={styles.symbolsLabel}>Key Symbols</Text>
                <View style={styles.symbolsRow}>
                  {dream.symbols.map((s) => (
                    <View key={s} style={styles.symbolTag}>
                      <Sparkles size={10} color={colors.accent} />
                      <Text style={styles.symbolTagText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            <Text style={styles.disclaimer}>For entertainment and self-reflection only. Not professional psychological advice.</Text>
            {canInterpret() && (
              <TouchableOpacity
                style={styles.reinterpretCta}
                onPress={handleInterpret}
                activeOpacity={0.7}
              >
                <Sparkles size={14} color={colors.accent} />
                <Text style={styles.reinterpretCtaText}>Re-interpret</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        ) : isInterpreting ? (
          <View style={styles.interpretingContainer}>
            <Animated.View style={[styles.interpretingPulse, { transform: [{ scale: pulseAnim }] }]}>
              <Sparkles size={20} color={colors.accent} />
            </Animated.View>
            <Text style={styles.interpretingText}>Analyzing your dream...</Text>
          </View>
        ) : canInterpret() ? (
          <TouchableOpacity
            style={styles.interpretCta}
            onPress={handleInterpret}
            activeOpacity={0.8}
            testID="interpret-button"
          >
            <Sparkles size={18} color={colors.ctaAccentText} />
            <Text style={styles.interpretCtaText}>Interpret this dream</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.interpretDisabled}>
            <View style={styles.interpretDisabledRow}>
              <Sparkles size={16} color={colors.textDisabled} />
              <Text style={styles.interpretDisabledText}>
                {isPremium ? 'Daily limit reached — come back tomorrow' : 'Free interpretation used this week'}
              </Text>
            </View>
            {!isPremium && (
              <TouchableOpacity onPress={handleUpgrade} activeOpacity={0.7}>
                <Text style={styles.upgradeLink}>Upgrade to Premium</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    height: 52,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    color: colors.textMuted,
  },
  dateText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  badgesScroll: {
    marginBottom: spacing.md,
    marginHorizontal: -spacing.screenPadding,
    paddingHorizontal: spacing.screenPadding,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  emotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  emotionDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
  },
  emotionText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    fontWeight: '500' as const,
  },
  nightmareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.30)',
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  nightmareText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    fontWeight: '500' as const,
    color: colors.danger,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  observerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  observerText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  lucidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  lucidText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    fontWeight: '500' as const,
    color: colors.accent,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: typography.heading.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    lineHeight: 32,
    marginBottom: spacing.md,
  },
  dreamContent: {
    fontFamily: fonts.sans,
    fontSize: typography.dreamText.fontSize,
    color: colors.textSecondary,
    lineHeight: 29,
    marginBottom: spacing.lg,
  },
  themesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  themeTag: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  themeTagText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceCardBorder,
    marginVertical: spacing.lg,
  },
  interpretSection: {
    marginTop: spacing.sm,
  },
  interpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  interpLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  interpText: {
    fontFamily: fonts.sans,
    fontSize: typography.aiInterpretation.fontSize,
    color: colors.textSecondary,
    lineHeight: 27,
    marginBottom: spacing.lg,
  },
  symbolsLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  symbolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  symbolTag: {
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
  },
  symbolTagText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.accent,
  },
  disclaimer: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    color: colors.textDisabled,
    marginTop: spacing.lg,
    lineHeight: 16,
  },
  interpretingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  interpretingPulse: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interpretingText: {
    fontFamily: fonts.serif,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  interpretCta: {
    backgroundColor: colors.ctaAccentBg,
    borderRadius: radii.pill,
    height: sizes.buttonHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  interpretCtaText: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.ctaAccentText,
  },
  reinterpretCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  reinterpretCtaText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    fontWeight: '500' as const,
    color: colors.accent,
  },
  interpretDisabled: {
    borderRadius: radii.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing.sm,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  interpretDisabledRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  interpretDisabledText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  upgradeLink: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.accent,
    marginTop: spacing.xs,
  },
});
