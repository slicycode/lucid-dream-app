import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Platform, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GlassAsset } from '@/components/GlassAsset';
import OnboardingButton from '@/components/OnboardingButton';
import { glassAssets } from '@/constants/glassAssets';
import { colors, fonts, spacing, typography, radii } from '@/constants/theme';
import { trackEvent } from '@/services/analytics';
import { useTranslation } from 'react-i18next';

interface PremiumSuccessModalProps {
  visible: boolean;
  onDismiss: () => void;
  source: 'onboarding' | 'paywall';
}

export default function PremiumSuccessModal({ visible, onDismiss, source }: PremiumSuccessModalProps) {
  const { t } = useTranslation();

  // Animations
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.85)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const keyScale = useRef(new Animated.Value(0.3)).current;
  const keyOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(1)).current;
  const benefitAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaTranslateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (!visible) {
      // Reset all values for next open
      overlayOpacity.setValue(0);
      cardScale.setValue(0.85);
      cardOpacity.setValue(0);
      keyScale.setValue(0.3);
      keyOpacity.setValue(0);
      glowPulse.setValue(1);
      benefitAnims.forEach((a) => a.setValue(0));
      ctaOpacity.setValue(0);
      ctaTranslateY.setValue(12);
      return;
    }

    trackEvent('premium_success_screen_viewed', { source });

    // Haptic sequence: success then a light tap for each benefit
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // 1. Overlay fade in
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    // 2. Card enters with spring
    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        damping: 18,
        stiffness: 200,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Key pops in with overshoot
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(keyScale, {
          toValue: 1,
          damping: 12,
          stiffness: 180,
          mass: 0.6,
          useNativeDriver: true,
        }),
        Animated.timing(keyOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 4. Gentle glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1.08,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // 5. Benefits stagger in
    benefitAnims.forEach((anim, i) => {
      Animated.sequence([
        Animated.delay(400 + i * 100),
        Animated.spring(anim, {
          toValue: 1,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Light haptic per benefit row
      if (Platform.OS !== 'web') {
        setTimeout(() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 400 + i * 100);
      }
    });

    // 6. CTA fades up
    Animated.sequence([
      Animated.delay(850),
      Animated.parallel([
        Animated.timing(ctaOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(ctaTranslateY, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [visible, source]);

  const benefits = [
    t('premiumSuccess.benefitInterpretations'),
    t('premiumSuccess.benefitPatterns'),
    t('premiumSuccess.benefitDictionary'),
    t('premiumSuccess.benefitLucid'),
  ];

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          <Animated.View
            style={{
              alignSelf: 'center',
              marginBottom: spacing.md,
              opacity: keyOpacity,
              transform: [{ scale: Animated.multiply(keyScale, glowPulse) }],
            }}
          >
            <GlassAsset source={glassAssets.key} glowIntensity={3} size={110} />
          </Animated.View>

          <Text style={styles.heading}>{t('premiumSuccess.heading')}</Text>
          <Text style={styles.subtext}>{t('premiumSuccess.subtext')}</Text>

          <View style={styles.benefits}>
            {benefits.map((benefit, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.benefitRow,
                  {
                    opacity: benefitAnims[i],
                    transform: [
                      {
                        translateX: benefitAnims[i].interpolate({
                          inputRange: [0, 1],
                          outputRange: [-16, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.benefitCheck}>✦</Text>
                <Text style={styles.benefitText}>{benefit}</Text>
              </Animated.View>
            ))}
          </View>

          <Animated.View
            style={{
              opacity: ctaOpacity,
              transform: [{ translateY: ctaTranslateY }],
            }}
          >
            <OnboardingButton
              title={source === 'onboarding' ? t('premiumSuccess.ctaOnboarding') : t('premiumSuccess.ctaPaywall')}
              variant="accent"
              onPress={onDismiss}
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  card: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    width: '100%',
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: typography.heading.fontSize,
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtext: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  benefits: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  benefitCheck: {
    fontSize: 14,
    color: colors.accent,
  },
  benefitText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textPrimary,
    flex: 1,
  },
});
