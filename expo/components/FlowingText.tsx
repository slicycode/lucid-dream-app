import React, { useEffect, useRef, memo } from 'react';
import { Animated, Text, View, StyleSheet, Platform, TextStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';

interface FlowingTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  wordDelay?: number;
  initialDelay?: number;
  haptic?: boolean;
  /** Fire when last word finishes animating */
  onComplete?: () => void;
}

/**
 * Renders text word-by-word with a fade-in-up micro-animation.
 * Each word appears sequentially like water flowing — premium feel.
 */
function FlowingTextInner({
  text,
  style,
  wordDelay = 55,
  initialDelay = 0,
  haptic = false,
  onComplete,
}: FlowingTextProps) {
  const words = text.split(' ');
  const anims = useRef(words.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    anims.forEach((a) => a.setValue(0));

    const timers: ReturnType<typeof setTimeout>[] = [];

    words.forEach((_, i) => {
      const timer = setTimeout(() => {
        Animated.spring(anims[i], {
          toValue: 1,
          damping: 20,
          stiffness: 300,
          mass: 0.8,
          useNativeDriver: true,
        }).start();

        // Subtle haptic every 4th word for tactile rhythm
        if (haptic && i % 4 === 0 && Platform.OS !== 'web') {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        }

        // Notify completion after last word
        if (i === words.length - 1 && onComplete) {
          setTimeout(onComplete, 250);
        }
      }, initialDelay + i * wordDelay);

      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [text]);

  return (
    <Text style={[styles.container, style]}>
      {words.map((word, i) => (
        <Animated.Text
          key={`${word}-${i}`}
          style={{
            opacity: anims[i],
            transform: [
              {
                translateY: anims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 0],
                }),
              },
            ],
          }}
        >
          {word}
          {i < words.length - 1 ? ' ' : ''}
        </Animated.Text>
      ))}
    </Text>
  );
}

export const FlowingText = memo(FlowingTextInner);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
