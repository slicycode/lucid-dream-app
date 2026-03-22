import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, typography, radii, sizes } from '@/constants/theme';

interface OnboardingButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'accent';
  disabled?: boolean;
}

export default function OnboardingButton({ title, onPress, variant = 'primary', disabled = false }: OnboardingButtonProps) {
  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [onPress]);

  const isAccent = variant === 'accent';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isAccent ? styles.accentButton : styles.primaryButton,
        disabled && styles.disabledButton,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
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
    </TouchableOpacity>
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
