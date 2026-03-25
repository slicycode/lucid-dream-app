import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '@/constants/theme';

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const fraction = current / total;
  const prevFraction = Math.max(0, (current - 1) / total);
  const widthAnim = useRef(new Animated.Value(prevFraction)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: fraction,
      damping: 20,
      stiffness: 200,
      useNativeDriver: false,
    }).start();
  }, [fraction]);

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        >
          {/* Fade the right edge of the white fill to transparent */}
          <LinearGradient
            colors={[colors.textPrimary, 'transparent']}
            start={{ x: 0.6, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  track: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 1,
  },
});
