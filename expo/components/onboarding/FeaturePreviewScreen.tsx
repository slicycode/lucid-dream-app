import React, { useEffect, useRef } from 'react';
import { Platform, View, Text, ScrollView, Animated, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import OnboardingButton from '@/components/OnboardingButton';
import { GlassAsset } from '@/components/GlassAsset';
import { glassAssets } from '@/constants/glassAssets';
import { colors, fonts, typography, spacing, radii } from '@/constants/theme';
import { styles as sharedStyles } from './styles';
import { useTranslation } from 'react-i18next';

interface FeaturePreviewScreenProps {
  goNext: () => void;
  ctaFadeAnim: Animated.Value;
}

export function FeaturePreviewScreen({ goNext, ctaFadeAnim }: FeaturePreviewScreenProps) {
  const { t } = useTranslation();
  const anims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Override parent's auto CTA fade — we control it after the last card reveals
    ctaFadeAnim.setValue(0);

    const springs = anims.map((a) =>
      Animated.spring(a, {
        toValue: 1,
        damping: 18,
        stiffness: 200,
        mass: 0.9,
        delay: 200,
        useNativeDriver: true,
      })
    );

    // Fire haptic at the start of each card reveal
    anims.forEach((_, i) => {
      setTimeout(() => {
        if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 200 + i * 750);
    });

    Animated.stagger(750, springs).start();

    // Fade in CTA as the last card starts revealing, not after it finishes
    setTimeout(() => {
      Animated.timing(ctaFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, 200 + 3 * 750);
  }, []);

  const features = [
    { asset: glassAssets.eye, title: t('onboarding.features.aiInterpretationTitle'), desc: t('onboarding.features.aiInterpretationDesc') },
    { asset: glassAssets.key, title: t('onboarding.features.patternDetectionTitle'), desc: t('onboarding.features.patternDetectionDesc') },
    { asset: glassAssets.crescentMoon, title: t('onboarding.features.lucidToolsTitle'), desc: t('onboarding.features.lucidToolsDesc') },
    { asset: glassAssets.hourglass, size: 56, title: t('onboarding.features.calendarTitle'), desc: t('onboarding.features.calendarDesc') },
  ];

  const renderCard = (f: (typeof features)[number], i: number) => (
    <Animated.View
      key={i}
      style={[
        styles.card,
        {
          opacity: anims[i],
          transform: [{ translateX: anims[i].interpolate({ inputRange: [0, 1], outputRange: [i % 2 === 0 ? -30 : 30, 0] }) }],
        },
      ]}
    >
      <GlassAsset source={f.asset} size={f.size ?? 56} glowIntensity={1.5} style={styles.cardAsset} />
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{f.title}</Text>
        <Text style={styles.cardDesc}>{f.desc}</Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={sharedStyles.flex}>
      <ScrollView style={sharedStyles.flex} contentContainerStyle={sharedStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={sharedStyles.stepHeading}>{t('onboarding.features.heading')}</Text>
        <Text style={sharedStyles.stepSubtext}>{t('onboarding.features.subheading')}</Text>
        <View style={styles.grid}>
          {renderCard(features[0], 0)}
          {renderCard(features[1], 1)}
          {renderCard(features[2], 2)}
          {renderCard(features[3], 3)}
        </View>
      </ScrollView>
      <Animated.View style={[sharedStyles.bottomCta, { opacity: ctaFadeAnim }]}>
        <OnboardingButton title={t('onboarding.features.cta')} onPress={goNext} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardAsset: {},
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
