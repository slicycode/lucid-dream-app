import React, { useCallback, useRef } from 'react';
import { Pressable, Text, StyleSheet, Platform, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, typography, radii, sizes } from '@/constants/theme';

interface OnboardingButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'accent';
  disabled?: boolean;
}

export default function OnboardingButton({ title, onPress, variant = 'primary', disabled = false }: OnboardingButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      damping: 40,
      stiffness: 400,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 40,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [onPress]);

  const isAccent = variant === 'accent';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={[
          styles.button,
          isAccent ? styles.accentButton : styles.primaryButton,
          disabled && styles.disabledButton,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        testID="onboarding-button"
      >
        <Text
          style={[
            styles.text,
            isAccent ? styles.accentText : styles.primaryText,
            disabled && styles.disabledText,
          ]}
        >
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: sizes.buttonHeight,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryButton: {
    backgroundColor: colors.ctaPrimaryBg,
  },
  accentButton: {
    backgroundColor: colors.ctaAccentBg,
  },
  disabledButton: {
    opacity: 0.3,
  },
  text: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
  },
  primaryText: {
    color: colors.ctaPrimaryText,
  },
  accentText: {
    color: colors.ctaAccentText,
  },
  disabledText: {
    color: colors.ctaPrimaryText,
  },
});
