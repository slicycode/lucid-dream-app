import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Platform, TextStyle, StyleProp } from 'react-native';
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
export function FlowingText({
  text,
  style,
  wordDelay = 55,
  initialDelay = 0,
  haptic = false,
  onComplete,
}: FlowingTextProps) {
  const words = text.split(' ');
  const anims = useRef<Animated.Value[]>([]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Rebuild anim values when text changes
  if (anims.current.length !== words.length) {
    anims.current = words.map(() => new Animated.Value(0));
  }

  useEffect(() => {
    anims.current.forEach((a) => a.setValue(0));

    const timers: ReturnType<typeof setTimeout>[] = [];

    words.forEach((_, i) => {
      const timer = setTimeout(() => {
        Animated.spring(anims.current[i], {
          toValue: 1,
          damping: 20,
          stiffness: 300,
          mass: 0.8,
          useNativeDriver: true,
        }).start();

        // Haptic delayed ~60ms so it lands when the spring reaches
        // visible opacity (~0.3), not when it starts from 0
        if (haptic && i % 2 === 0 && Platform.OS !== 'web') {
          setTimeout(() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
          }, 700);
        }

        // Notify completion after last word's spring settles
        if (i === words.length - 1 && onCompleteRef.current) {
          setTimeout(() => onCompleteRef.current?.(), 500);
        }
      }, initialDelay + i * wordDelay);

      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [text, wordDelay, initialDelay, haptic]);

  return (
    <Text style={[styles.container, style]}>
      {words.map((word, i) => (
        <Animated.Text
          key={`${word}-${i}`}
          style={{
            opacity: anims.current[i],
            transform: [
              {
                translateY: anims.current[i].interpolate({
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
