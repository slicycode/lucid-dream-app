import React, { useCallback } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { colors, fonts, spacing, radii } from '@/constants/theme';

interface QuizOptionCardProps {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  multiSelect?: boolean;
}

export default function QuizOptionCard({ title, subtitle, selected, onPress }: QuizOptionCardProps) {
  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  }, [onPress]);

  return (
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
        <View style={styles.checkContainer}>
          <Check size={16} color={colors.accent} />
        </View>
      )}
    </TouchableOpacity>
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
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  titleSelected: {
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  checkContainer: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
  },
});
