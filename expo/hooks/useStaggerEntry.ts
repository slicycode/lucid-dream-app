import { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Returns an array of Animated.Values that stagger-fade-in on mount.
 * Each element gets { opacity, translateY } for a slide-up-and-fade effect.
 *
 * @param count Number of elements to animate
 * @param delay Ms between each element (default 80)
 * @param initialDelay Ms before first element starts (default 100)
 * @param distance Vertical slide distance in px (default 16)
 */
export function useStaggerEntry(
  count: number,
  delay = 80,
  initialDelay = 100,
  distance = 16
) {
  const anims = useRef(
    Array.from({ length: count }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Reset
    anims.forEach((a) => a.setValue(0));

    const animations = anims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: initialDelay + i * delay,
        useNativeDriver: true,
      })
    );

    Animated.stagger(delay, animations).start();
  }, []);

  return anims.map((anim) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        }),
      },
    ],
  }));
}

/**
 * Word-by-word text reveal animation.
 * Returns animated values and the words array.
 */
export function useFlowingText(
  text: string,
  wordDelay = 50,
  initialDelay = 200,
  hapticOnWord = false
) {
  const words = text.split(' ');
  const anims = useRef(
    Array.from({ length: words.length }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    anims.forEach((a) => a.setValue(0));

    const timers: NodeJS.Timeout[] = [];

    words.forEach((_, i) => {
      const timer = setTimeout(() => {
        Animated.timing(anims[i], {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();

        if (hapticOnWord && i % 3 === 0 && Platform.OS !== 'web') {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        }
      }, initialDelay + i * wordDelay);

      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return { words, anims };
}
