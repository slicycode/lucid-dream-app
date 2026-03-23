import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import OnboardingButton from '@/components/OnboardingButton';
import { FlowingText } from '@/components/FlowingText';
import { GlassAsset } from '@/components/GlassAsset';
import { glassAssets } from '@/constants/glassAssets';
import { useSettingsStore } from '@/store/settingsStore';
import { requestPermissions, scheduleMorningReminder } from '@/services/notifications';
import { spacing } from '@/constants/theme';
import { styles } from './styles';

interface NotificationScreenProps {
  goNext: () => void;
}

export function NotificationScreen({ goNext }: NotificationScreenProps) {
  const [phase, setPhase] = useState(0);
  const bellRotation = useRef(new Animated.Value(0)).current;
  const body1Opacity = useRef(new Animated.Value(0)).current;
  const body2Opacity = useRef(new Animated.Value(0)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const swing = Animated.sequence([
      Animated.timing(bellRotation, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(bellRotation, { toValue: -1, duration: 160, useNativeDriver: true }),
      Animated.timing(bellRotation, { toValue: 0.6, duration: 130, useNativeDriver: true }),
      Animated.timing(bellRotation, { toValue: -0.4, duration: 110, useNativeDriver: true }),
      Animated.timing(bellRotation, { toValue: 0.15, duration: 90, useNativeDriver: true }),
      Animated.timing(bellRotation, { toValue: 0, duration: 70, useNativeDriver: true }),
    ]);
    Animated.sequence([
      Animated.delay(300),
      swing,
    ]).start();
  }, []);

  const bellTilt = bellRotation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-20deg', '20deg'],
  });

  useEffect(() => {
    if (phase === 1) {
      Animated.sequence([
        Animated.timing(body1Opacity, { toValue: 1, duration: 500, delay: 100, useNativeDriver: true }),
        Animated.timing(body2Opacity, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
        Animated.timing(ctaFade, { toValue: 1, duration: 400, delay: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [phase]);

  const handleEnableReminders = useCallback(async () => {
    const granted = await requestPermissions();
    if (granted) {
      useSettingsStore.getState().setMorningReminder(true);
      await scheduleMorningReminder('07:00');
    }
    goNext();
  }, [goNext]);

  return (
    <View style={styles.centeredContent}>
      <Animated.View style={{ alignSelf: 'center', marginBottom: spacing.lg, transform: [{ rotate: bellTilt }] }}>
        <GlassAsset source={glassAssets.bell} size={140} />
      </Animated.View>
      <FlowingText
        text="Never lose a dream again"
        style={[styles.stepHeading, { textAlign: 'center' }]}
        wordDelay={80}
        haptic
        onComplete={() => setPhase(1)}
      />

      <View style={styles.notifTextBlock}>
        <Animated.Text style={[styles.notifBody, { opacity: body1Opacity }]}>
          Journaling within 5 minutes of waking triples dream recall.
        </Animated.Text>
        <Animated.Text style={[styles.notifBody, { marginTop: spacing.md, opacity: body2Opacity }]}>
          We'll send a gentle morning reminder to help you capture your dreams before they fade.
        </Animated.Text>
      </View>

      <Animated.View style={[styles.bottomCta, { opacity: ctaFade }]}>
        <OnboardingButton title="Enable Reminders" onPress={handleEnableReminders} />
        <TouchableOpacity onPress={goNext} style={styles.skipLink} testID="skip-button">
          <Text style={styles.skipText}>Maybe later</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
