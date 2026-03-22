import React, { useCallback, useRef, useEffect } from 'react';
import { Pressable, Text, View, StyleSheet, Platform, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { colors, fonts, typography, spacing, radii } from '@/constants/theme';

interface QuizOptionCardProps {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  multiSelect?: boolean;
}

export default function QuizOptionCard({ title, subtitle, selected, onPress }: QuizOptionCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selected) {
      Animated.spring(checkAnim, {
        toValue: 1,
        damping: 100,
        stiffness: 300,
        useNativeDriver: true,
      }).start();
    } else {
      checkAnim.setValue(0);
    }
  }, [selected]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  }, [onPress]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={[styles.card, selected && styles.cardSelected]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID="quiz-option-card"
      >
        <View style={styles.content}>
          <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {selected && (
          <Animated.View
            style={[
              styles.checkContainer,
              {
                transform: [{ scale: checkAnim }],
                opacity: checkAnim,
              },
            ]}
          >
            <Check size={16} color={colors.accent} />
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardSelected: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accentBorder,
  },
  content: {
    flex: 1,
    paddingRight: spacing.lg,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  titleSelected: {
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  checkContainer: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
  },
});
