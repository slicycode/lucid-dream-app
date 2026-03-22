import React, { useCallback, useRef, useEffect } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Platform, Animated } from 'react-native';
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
      // Spring bounce on selection
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 0.97,
          damping: 15,
          stiffness: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 12,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
      // Check icon pop-in
      Animated.spring(checkAnim, {
        toValue: 1,
        damping: 10,
        stiffness: 300,
        useNativeDriver: true,
      }).start();
    } else {
      checkAnim.setValue(0);
    }
  }, [selected]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  }, [onPress]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.card, selected && styles.cardSelected]}
        onPress={handlePress}
        activeOpacity={0.7}
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
      </TouchableOpacity>
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
