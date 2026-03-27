import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GlassAsset } from '@/components/GlassAsset';
import { glassAssets } from '@/constants/glassAssets';
import { getTodayInsight, type InsightCategory } from '@/constants/dailyInsights';
import { colors, fonts, spacing, typography, radii } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

const categoryLabels: Record<InsightCategory, string> = {
  symbol: 'journal.insightSymbol',
  fact: 'journal.insightFact',
  technique: 'journal.insightTechnique',
  culture: 'journal.insightCulture',
};

export default function DailyInsightCard() {
  const { t } = useTranslation(['translation', 'dailyInsights']);
  const insight = getTodayInsight();
  const [expanded, setExpanded] = useState(false);
  const bodyHeight = useRef(new Animated.Value(0)).current;

  const toggle = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toExpanded = !expanded;
    setExpanded(toExpanded);
    Animated.spring(bodyHeight, {
      toValue: toExpanded ? 1 : 0,
      damping: 20,
      stiffness: 200,
      useNativeDriver: false,
    }).start();
  }, [expanded, bodyHeight]);

  const glassIcon = glassAssets[insight.icon as keyof typeof glassAssets] ?? glassAssets.crescentMoon;

  return (
    <TouchableOpacity style={styles.card} onPress={toggle} activeOpacity={0.8}>
      <View style={styles.header}>
        <GlassAsset source={glassIcon} size={36} glowIntensity={1.2} />
        <View style={styles.headerText}>
          <Text style={styles.categoryLabel}>{t(categoryLabels[insight.category])}</Text>
          <Text style={styles.title}>{t(`dailyInsights:${insight.id}.title`)}</Text>
        </View>
      </View>
      <Animated.View style={{
        maxHeight: bodyHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }),
        opacity: bodyHeight,
        overflow: 'hidden',
      }}>
        <Text style={styles.body}>{t(`dailyInsights:${insight.id}.body`)}</Text>
      </Animated.View>
      {!expanded && (
        <Text style={styles.tapHint}>{t('journal.insightTapToRead')}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.cardPadding,
    marginBottom: spacing.sectionGap,
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  categoryLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  tapHint: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    color: colors.textDisabled,
    marginTop: spacing.xs,
    marginLeft: "auto"
  },
});
