import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import OnboardingButton from '@/components/OnboardingButton';
import { DecodeText } from '@/components/DecodeText';
import { GlassAsset } from '@/components/GlassAsset';
import { glassAssets } from '@/constants/glassAssets';
import { spacing } from '@/constants/theme';
import { styles } from './styles';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { Gyroscope } from 'expo-sensors';
import { FlowingText } from '../FlowingText';

const STAR_COUNT = 35;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  duration: number;
  delay: number;
}

function generateStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const bright = Math.random() < 0.3;
    stars.push({
      x: Math.random() * SCREEN_W,
      // Concentrate in the top 55% of the screen
      y: Math.random() * SCREEN_H * 0.55,
      size: bright ? 1.5 + Math.random() * 1.2 : 1 + Math.random() * 1.5,
      baseOpacity: bright ? 0.6 + Math.random() * 0.35 : 0.15 + Math.random() * 0.4,
      duration: bright ? 1200 + Math.random() * 1500 : 2000 + Math.random() * 3000,
      delay: Math.random() * 2000,
    });
  }
  return stars;
}

function ShootingStar({
  delay = 1000,
  topPercent = 0.15,
  duration = 1400,
  easing = Easing.in(Easing.quad),
}: {
  delay?: number;
  topPercent?: number;
  duration?: number;
  easing?: (t: number) => number;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_W * 0.4, SCREEN_W + 60],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [
      0,
      SCREEN_H * 0.04,
      SCREEN_H * 0.09,
      SCREEN_H * 0.13,
      SCREEN_H * 0.15,
    ],
  });

  const fadeHold = duration * 0.4;
  const fadeOut = duration * 0.45;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(progress, {
          toValue: 1,
          duration,
          easing,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.9, duration: 150, useNativeDriver: true }),
          Animated.delay(fadeHold),
          Animated.timing(opacity, { toValue: 0, duration: fadeOut, useNativeDriver: true }),
        ]),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: SCREEN_H * topPercent,
        left: 0,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate: '12deg' }],
      }}
    >
      {/* Gradient tail */}
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.6)']}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ width: 120, height: 2, borderRadius: 1 }}
      />
      {/* Bright head */}
      <View
        style={{
          position: 'absolute',
          right: -2,
          top: -0.5,
          width: 6,
          height: 3.5,
          borderRadius: 1.75,
          backgroundColor: '#FFFFFF',
          shadowColor: '#FFFFFF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 4,
        }}
      />
    </Animated.View>
  );
}

const PARALLAX_INTENSITY = 12;

function Starfield() {
  const stars = useMemo(generateStars, []);
  const anims = useRef(stars.map((s) => new Animated.Value(s.baseOpacity * 0.3))).current;
  const offsetX = useRef(new Animated.Value(0)).current;
  const offsetY = useRef(new Animated.Value(0)).current;
  const tiltX = useRef(0);
  const tiltY = useRef(0);

  useEffect(() => {
    const loops = stars.map((star, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anims[i], {
            toValue: star.baseOpacity,
            duration: star.duration,
            delay: star.delay,
            useNativeDriver: true,
          }),
          Animated.timing(anims[i], {
            toValue: star.baseOpacity * 0.3,
            duration: star.duration,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    Animated.stagger(120, loops).start();

    return () => loops.forEach((l) => l.stop());
  }, []);

  // useEffect(() => {
  //   Gyroscope.setUpdateInterval(50);
  //   const sub = Gyroscope.addListener(({ x, y }) => {
  //     // Integrate gyroscope rotation rate into tilt, clamped
  //     tiltX.current = Math.max(-1, Math.min(1, tiltX.current + y * 0.08));
  //     tiltY.current = Math.max(-1, Math.min(1, tiltY.current + x * 0.08));

  //     Animated.timing(offsetX, {
  //       toValue: tiltX.current * PARALLAX_INTENSITY,
  //       duration: 80,
  //       useNativeDriver: true,
  //     }).start();
  //     Animated.timing(offsetY, {
  //       toValue: tiltY.current * PARALLAX_INTENSITY,
  //       duration: 80,
  //       useNativeDriver: true,
  //     }).start();
  //   });

  //   return () => sub.remove();
  // }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((star, i) => {
        // Bigger stars shift more for depth
        const depth = star.size / 2.5;
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              backgroundColor: '#FFFFFF',
              opacity: anims[i],
              transform: [
                { translateX: Animated.multiply(offsetX, depth) },
                { translateY: Animated.multiply(offsetY, depth) },
              ],
            }}
          />
        );
      })}
    </View>
  );
}

interface WelcomeScreenProps {
  goNext: () => void;
}

export function WelcomeScreen({ goNext }: WelcomeScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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
        Animated.timing(ctaFade, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }),
        Animated.timing(privacyOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [phase]);

  return (
    <View style={[styles.centeredContent, { paddingTop: insets.top, justifyContent: 'flex-start' }]}>
      <LinearGradient
        colors={['rgba(201, 168, 76, 0.1)', 'transparent']}
        locations={[0, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Starfield />
      <ShootingStar delay={2800} duration={950} easing={Easing.out(Easing.poly(1.3))} />
      <ShootingStar delay={3000} topPercent={0.25} duration={1000} easing={Easing.out(Easing.poly(1.2))} />
      <ShootingStar delay={3600} topPercent={0.1} duration={850} easing={Easing.out(Easing.poly(1.4))} />
      <View style={{ flex: 1 }} />
      <GlassAsset source={glassAssets.crescentMoon} size={170} glowIntensity={1.5} style={{ alignSelf: 'center', marginBottom: spacing.lg }} />
      <Text style={styles.logoText}>Lucid</Text>

      {/* Both lines always rendered to reserve layout space — no shift */}
      <View style={styles.welcomeTextBlock}>
        <FlowingText
          text={t('onboarding.welcome.tagline1')}
          style={styles.welcomeHeading}
          wordDelay={70}
          haptic
          onComplete={() => setTimeout(() => setPhase(1), 400)}
        />
        <Animated.View style={{ opacity: line2Opacity }}>
          {phase >= 1 ? (
            <DecodeText
              text={t('onboarding.welcome.tagline2')}
              style={[styles.welcomeHeading, { color: '#C9A84C' }]}
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

      <View style={{ flex: 1 }} />

      <Animated.View style={[styles.bottomCta, { opacity: ctaFade }]}>
        <OnboardingButton title={t('onboarding.welcome.cta')} onPress={goNext} />
      </Animated.View>

      {/* Always rendered, fades in via opacity — no layout shift */}
      <Animated.View style={{ opacity: privacyOpacity, paddingBottom: spacing.sm }}>
        <Text style={[styles.privacyText, { marginBottom: spacing.xs }]}>
          {t('onboarding.welcome.privacyLine1')}
        </Text>
        <Text style={styles.privacyText}>
          {t('onboarding.welcome.privacyLine2')}
        </Text>
      </Animated.View>
    </View>
  );
}
