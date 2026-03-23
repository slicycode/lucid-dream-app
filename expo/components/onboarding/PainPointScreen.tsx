import React, { useState, useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import OnboardingButton from '@/components/OnboardingButton';
import { FlowingText } from '@/components/FlowingText';
import { styles } from './styles';

interface PainPointScreenProps {
  goNext: () => void;
}

export function PainPointScreen({ goNext }: PainPointScreenProps) {
  const [phase, setPhase] = useState(0);
  const ctaFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase >= 3) {
      Animated.timing(ctaFade, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }).start();
    }
  }, [phase]);

  return (
    <View style={styles.centeredContent}>
      <View style={styles.painPointBlock}>
        <FlowingText
          text="Most dreams are forgotten"
          style={styles.painPointText}
          wordDelay={80}
          initialDelay={300}
          haptic
          onComplete={() => setPhase(1)}
        />
        {phase >= 1 && (
          <FlowingText
            text="within 5 minutes"
            style={styles.painPointAccent}
            wordDelay={100}
            initialDelay={100}
            haptic
            onComplete={() => setPhase(2)}
          />
        )}
        {phase >= 2 && (
          <FlowingText
            text="of waking up."
            style={styles.painPointText}
            wordDelay={90}
            initialDelay={100}
            haptic
            onComplete={() => setPhase(3)}
          />
        )}
      </View>
      {phase >= 3 && (
        <FlowingText
          text="People who journal their dreams recall 3x more within two weeks."
          style={styles.painPointSub}
          wordDelay={45}
          initialDelay={100}
        />
      )}
      <Animated.View style={[styles.bottomCta, { opacity: ctaFade }]}>
        <OnboardingButton title="Continue" onPress={goNext} />
      </Animated.View>
    </View>
  );
}
