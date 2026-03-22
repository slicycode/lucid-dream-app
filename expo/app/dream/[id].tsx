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
import { ChevronLeft, MoreHorizontal, Sparkles, Moon } from 'lucide-react-native';
import { useDreamsStore } from '@/store/dreamsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { colors, fonts, typography, spacing, radii, sizes } from '@/constants/theme';

const PLACEHOLDER_INTERPRETATION = `This dream contains rich symbolic imagery that speaks to your current emotional landscape.

The central theme suggests a period of transition or transformation in your waking life. The symbols present point to unresolved feelings that are seeking expression.

Your subconscious appears to be processing experiences related to control, vulnerability, and self-discovery. Pay attention to recurring elements — they often hold the most personal significance.`;

const PLACEHOLDER_SYMBOLS = ['Transition', 'Self-discovery', 'Vulnerability'];

export default function DreamDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dreams = useDreamsStore((s) => s.dreams);
  const updateDream = useDreamsStore((s) => s.updateDream);
  const deleteDream = useDreamsStore((s) => s.deleteDream);
  const canInterpret = useSettingsStore((s) => s.canInterpret);
  const useInterpretation = useSettingsStore((s) => s.useInterpretation);
  const { monthlyPackage, isLoading: rcLoading, purchasePackage } = useRevenueCat();

  const dream = useMemo(() => dreams.find((d) => d.id === id), [dreams, id]);

  const [isInterpreting, setIsInterpreting] = useState(false);
  const [interpretationVisible, setInterpretationVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (interpretationVisible) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [interpretationVisible, fadeAnim]);

  const handleUpgrade = useCallback(async () => {
    if (!monthlyPackage) return;
    await purchasePackage(monthlyPackage);
  }, [monthlyPackage, purchasePackage]);

  const handleInterpret = useCallback(() => {
    if (!canInterpret()) {
      Alert.alert(
        'Free Limit Reached',
        'You\'ve used your free interpretation this week. Upgrade to Premium for unlimited interpretations.',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade', onPress: handleUpgrade },
        ]
      );
      return;
    }

    useInterpretation();
    setIsInterpreting(true);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    setTimeout(() => {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      setIsInterpreting(false);

      if (dream) {
        const interp = dream.interpretation || PLACEHOLDER_INTERPRETATION;
        const syms = dream.symbols.length > 0 ? dream.symbols : PLACEHOLDER_SYMBOLS;
        updateDream(dream.id, { interpretation: interp, symbols: syms });
      }
      setInterpretationVisible(true);
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 3000);
  }, [dream, updateDream, pulseAnim, canInterpret, useInterpretation, handleUpgrade]);

  const handleMenu = useCallback(() => {
    Alert.alert(
      dream?.title || 'Dream',
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
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="back-button">
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleMenu} testID="menu-button">
          <MoreHorizontal size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.dateText}>{formattedDate} · {formattedTime}</Text>

        <View style={styles.badgesRow}>
          <View style={[styles.emotionBadge, { borderColor: colors.emotions[dream.emotion] || colors.emotions.Neutral }]}>
            <View style={[styles.emotionDot, { backgroundColor: colors.emotions[dream.emotion] || colors.emotions.Neutral }]} />
            <Text style={[styles.emotionText, { color: colors.emotions[dream.emotion] || colors.emotions.Neutral }]}>
              {dream.emotion}
            </Text>
          </View>
          {dream.isLucid && (
            <View style={styles.lucidBadge}>
              <Moon size={12} color={colors.accent} />
              <Text style={styles.lucidText}>Lucid</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{dream.title}</Text>
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
            <Text style={styles.interpText}>{dream.interpretation}</Text>
            {dream.symbols.length > 0 && (
              <>
                <Text style={styles.symbolsLabel}>Key Symbols</Text>
                <View style={styles.symbolsRow}>
                  {dream.symbols.map((s) => (
                    <View key={s} style={styles.symbolTag}>
                      <Text style={styles.symbolTagText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </Animated.View>
        ) : isInterpreting ? (
          <View style={styles.interpretingContainer}>
            <Animated.View style={[styles.interpretingPulse, { transform: [{ scale: pulseAnim }] }]}>
              <Sparkles size={20} color={colors.accent} />
            </Animated.View>
            <Text style={styles.interpretingText}>Analyzing your dream...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.interpretCta}
            onPress={handleInterpret}
            activeOpacity={0.8}
            testID="interpret-button"
          >
            <Sparkles size={18} color={colors.ctaAccentText} />
            <Text style={styles.interpretCtaText}>Interpret this dream</Text>
          </TouchableOpacity>
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
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
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
    fontFamily: fonts.serif,
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
    fontFamily: fonts.serifItalic,
    fontSize: typography.aiInterpretation.fontSize,
    fontStyle: 'italic',
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
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  symbolTagText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
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
});
