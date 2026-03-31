import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Text, Platform, TextStyle, StyleProp, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
const TICK_MS = 40;

interface DecodeTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  /** Ms before the decode starts */
  initialDelay?: number;
  /** Ms between each letter resolving */
  resolveSpeed?: number;
  /** How many random swaps per letter before it locks */
  scrambleCycles?: number;
  haptic?: boolean;
  onComplete?: () => void;
}

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Text decode animation — each character starts as a random glyph
 * and cycles through random characters before resolving to the
 * correct letter in a randomised order.
 */
export function DecodeText({
  text,
  style,
  initialDelay = 0,
  resolveSpeed = 60,
  scrambleCycles = 3,
  haptic = false,
  onComplete,
}: DecodeTextProps) {
  const [display, setDisplay] = useState('');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    cleanup();

    const chars = text.split('');
    const len = chars.length;

    // Build a shuffled resolve order (skip spaces)
    const nonSpaceIndices = chars.reduce<number[]>((acc, ch, i) => {
      if (ch !== ' ') acc.push(i);
      return acc;
    }, []);
    const resolveOrder = shuffle(nonSpaceIndices);

    // Spread reveals evenly: first letter resolves after scrambleCycles,
    // last letter resolves at the end of the full duration
    const count = resolveOrder.length;
    const totalTicks = Math.floor((count * resolveSpeed) / TICK_MS) + scrambleCycles;
    const resolveTick = new Array(len).fill(Infinity);
    resolveOrder.forEach((charIdx, order) => {
      // Linearly distribute from scrambleCycles → totalTicks
      resolveTick[charIdx] = scrambleCycles + Math.floor((order / Math.max(count - 1, 1)) * (totalTicks - scrambleCycles));
    });

    // Initialize with scrambled text (preserve spaces)
    const current = chars.map((ch) => (ch === ' ' ? ' ' : randomChar()));
    setDisplay(current.join(''));

    let tick = 0;
    let resolvedCount = 0;
    const totalToResolve = nonSpaceIndices.length;
    let hapticFired = false;

    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        tick++;
        resolvedCount = 0;

        for (let i = 0; i < len; i++) {
          if (chars[i] === ' ') continue;

          if (tick >= resolveTick[i]) {
            current[i] = chars[i];
            resolvedCount++;
          } else {
            current[i] = randomChar();
          }
        }

        setDisplay(current.join(''));

        // Fire haptic around the midpoint
        if (haptic && !hapticFired && resolvedCount > totalToResolve / 2) {
          hapticFired = true;
          if (Platform.OS !== 'web') {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }

        if (resolvedCount >= totalToResolve) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setDisplay(text);
          if (haptic && Platform.OS !== 'web') {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
          }
          onCompleteRef.current?.();
        }
      }, TICK_MS);
    }, initialDelay);

    return cleanup;
  }, [text, resolveSpeed, scrambleCycles, initialDelay, haptic, cleanup]);

  return <Text style={[localStyles.container, style]}>{display}</Text>;
}

const localStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
