import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import OnboardingButton from '@/components/OnboardingButton';
import { FlowingText } from '@/components/FlowingText';
import { useSettingsStore } from '@/store/settingsStore';
import { requestPermissions, scheduleMorningReminder } from '@/services/notifications';
import { spacing } from '@/constants/theme';
import { styles } from './styles';

interface NotificationScreenProps {
  goNext: () => void;
}

export function NotificationScreen({ goNext }: NotificationScreenProps) {
  const [phase, setPhase] = useState(0);
  const ctaFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase >= 2) {
      Animated.timing(ctaFade, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }).start();
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
      <FlowingText
        text="Never lose a dream again"
        style={styles.stepHeading}
        wordDelay={80}
        initialDelay={200}
        haptic
        onComplete={() => setPhase(1)}
      />
      <View style={styles.notifTextBlock}>
        {phase >= 1 && (
          <FlowingText
            text="Journaling within 5 minutes of waking triples dream recall."
            style={styles.notifBody}
            wordDelay={45}
            initialDelay={100}
            onComplete={() => setPhase(2)}
          />
        )}
        {phase >= 2 && (
          <FlowingText
            text="We'll send a gentle morning reminder to help you capture your dreams before they fade."
            style={[styles.notifBody, { marginTop: spacing.md }]}
            wordDelay={40}
            initialDelay={100}
          />
        )}
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
