import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import OnboardingButton from '@/components/OnboardingButton';
import { FlowingText } from '@/components/FlowingText';
import { GlassAsset } from '@/components/GlassAsset';
import { glassAssets } from '@/constants/glassAssets';
import { spacing } from '@/constants/theme';
import { styles } from './styles';
import { useTranslation } from 'react-i18next';

interface WelcomeScreenProps {
  goNext: () => void;
}

export function WelcomeScreen({ goNext }: WelcomeScreenProps) {
  const { t } = useTranslation();
  // 0=first line animating, 1=second line animating, 2=privacy+cta
  const [phase, setPhase] = useState(0);
  const line2Opacity = useRef(new Animated.Value(0)).current;
  const privacyOpacity = useRef(new Animated.Value(0)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase === 1) {
      Animated.timing(line2Opacity, { toValue: 1, duration: 1, useNativeDriver: true }).start();
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 2) {
      // Stagger: privacy fades in, then CTA
      Animated.sequence([
        Animated.timing(privacyOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(ctaFade, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [phase]);

  return (
    <View style={styles.centeredContent}>
      <GlassAsset source={glassAssets.crescentMoon} size={170} glowIntensity={2} style={{ alignSelf: 'center', marginBottom: spacing.lg }} />
      <Text style={styles.logoText}>Lucid</Text>

      {/* Both lines always rendered to reserve layout space — no shift */}
      <View style={styles.welcomeTextBlock}>
        <FlowingText
          text={t('onboarding.welcome.tagline1')}
          style={styles.welcomeHeading}
          wordDelay={70}
          haptic
          onComplete={() => setPhase(1)}
        />
        <Animated.View style={{ opacity: line2Opacity }}>
          {phase >= 1 ? (
            <FlowingText
              text={t('onboarding.welcome.tagline2')}
              style={[styles.welcomeHeading, { color: '#C9A84C' }]}
              wordDelay={80}
              haptic
              onComplete={() => setPhase(2)}
            />
          ) : (
            // Invisible placeholder — reserves exact same line height
            <Text style={[styles.welcomeHeading, { opacity: 0 }]}>
              {t('onboarding.welcome.tagline2')}
            </Text>
          )}
        </Animated.View>
      </View>

      {/* Always rendered, fades in via opacity — no layout shift */}
      <Animated.View style={{ opacity: privacyOpacity }}>
        <Text style={[styles.privacyText, { marginBottom: spacing.sm }]}>
          {t('onboarding.welcome.privacyLine1')}
        </Text>
        <Text style={[styles.privacyText, { marginBottom: spacing.xxl }]}>
          {t('onboarding.welcome.privacyLine2')}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.bottomCta, { opacity: ctaFade }]}>
        <OnboardingButton title={t('onboarding.welcome.cta')} onPress={goNext} />
      </Animated.View>
    </View>
  );
}
