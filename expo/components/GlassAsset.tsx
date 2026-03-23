import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { colors } from '@/constants/theme';

interface GlassAssetProps {
  source: ImageSource;
  size: number;
  glowIntensity?: number;
  style?: ViewStyle;
}

export function GlassAsset({ source, size, glowIntensity = 1, style }: GlassAssetProps) {
  return (
    <View
      style={[
        styles.wrapper,
        {
          width: size,
          height: size,
          shadowRadius: size * 0.3,
          shadowOpacity: 0.15 * glowIntensity,
        },
        style,
      ]}
    >
      <Image
        source={source}
        style={{ width: size, height: size }}
        contentFit="contain"
        cachePolicy="memory-disk"
        recyclingKey={typeof source === 'number' ? String(source) : undefined}
        transition={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
  },
});
