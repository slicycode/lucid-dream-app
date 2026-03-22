import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@/constants/theme';

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.segment,
            i < current ? styles.filled : styles.empty,
            i < total - 1 && styles.gap,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  segment: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  filled: {
    backgroundColor: colors.textPrimary,
  },
  empty: {
    backgroundColor: colors.surfaceCardBorder,
  },
  gap: {
    marginRight: spacing.xs,
  },
});
