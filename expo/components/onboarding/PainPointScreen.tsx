import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import OnboardingButton from '@/components/OnboardingButton';
import { FlowingText } from '@/components/FlowingText';
import { GlassAsset } from '@/components/GlassAsset';
import { glassAssets } from '@/constants/glassAssets';
import { spacing } from '@/constants/theme';
import { styles } from './styles';

interface PainPointScreenProps {
  goNext: () => void;
}

export function PainPointScreen({ goNext }: PainPointScreenProps) {
  const [phase, setPhase] = useState(0);
  const line2Opacity = useRef(new Animated.Value(0)).current;
  const line3Opacity = useRef(new Animated.Value(0)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase === 1) {
      Animated.timing(line2Opacity, { toValue: 1, duration: 1, useNativeDriver: true }).start();
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 2) {
      Animated.timing(line3Opacity, { toValue: 1, duration: 1, useNativeDriver: true }).start();
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 3) {
      Animated.sequence([
        Animated.timing(subOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(ctaFade, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [phase]);

  return (
    <View style={styles.centeredContent}>
      <GlassAsset source={glassAssets.cloud} size={170} style={{ alignSelf: 'center', marginBottom: spacing.lg }} />

      <View style={styles.painPointBlock}>
        <FlowingText
          text="Most dreams are forgotten"
          style={styles.painPointText}
          wordDelay={80}
          haptic
          onComplete={() => setPhase(1)}
        />
        <Animated.View style={{ opacity: line2Opacity }}>
          {phase >= 1 ? (
            <FlowingText
              text="within 5 minutes"
              style={styles.painPointAccent}
              wordDelay={100}
              initialDelay={150}
              haptic
              onComplete={() => setPhase(2)}
            />
          ) : (
            <Text style={[styles.painPointAccent, { opacity: 0 }]}>within 5 minutes</Text>
          )}
        </Animated.View>
        <Animated.View style={{ opacity: line3Opacity }}>
          {phase >= 2 ? (
            <FlowingText
              text="of waking up."
              style={styles.painPointText}
              wordDelay={90}
              haptic
              onComplete={() => setPhase(3)}
            />
          ) : (
            <Text style={[styles.painPointText, { opacity: 0 }]}>of waking up.</Text>
          )}
        </Animated.View>
      </View>

      <Animated.View style={{ opacity: subOpacity }}>
        <Text style={styles.painPointSub}>
          People who journal their dreams recall 3x more within two weeks.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.bottomCta, { opacity: ctaFade }]}>
        <OnboardingButton title="Continue" onPress={goNext} />
      </Animated.View>
    </View>
  );
}
