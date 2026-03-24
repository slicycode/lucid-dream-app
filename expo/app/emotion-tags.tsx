import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, RotateCcw, Check } from 'lucide-react-native';
import { useSettingsStore } from '@/store/settingsStore';
import { ALL_EMOTION_TAGS, DEFAULT_EMOTION_TAGS } from '@/types/dream';
import { colors, fonts, typography, spacing, radii } from '@/constants/theme';
import { trackEvent } from '@/services/analytics';
import { useTranslation } from 'react-i18next';

export default function EmotionTagsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const customEmotionTags = useSettingsStore((s) => s.customEmotionTags);
  const setCustomEmotionTags = useSettingsStore((s) => s.setCustomEmotionTags);

  const toggleTag = (tag: string) => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isEnabled = customEmotionTags.includes(tag);
    if (isEnabled) {
      if (customEmotionTags.length <= 2) {
        Alert.alert(t('emotionTags.minimumTagsTitle'), t('emotionTags.minimumTagsMessage'));
        return;
      }
      const removed = customEmotionTags.filter((t) => t !== tag);
      setCustomEmotionTags(removed);
      trackEvent('emotion_tags_customized', { tag_count: removed.length });
    } else {
      // Preserve canonical order from ALL_EMOTION_TAGS
      const updated = ALL_EMOTION_TAGS.filter(
        (t) => customEmotionTags.includes(t) || t === tag
      ) as unknown as string[];
      setCustomEmotionTags(updated);
      trackEvent('emotion_tags_customized', { tag_count: updated.length });
    }
  };

  const handleReset = () => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCustomEmotionTags([...DEFAULT_EMOTION_TAGS]);
    trackEvent('emotion_tags_customized', { tag_count: DEFAULT_EMOTION_TAGS.length });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} activeOpacity={0.7}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('emotionTags.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>{t('emotionTags.description')}</Text>

        {ALL_EMOTION_TAGS.map((tag) => {
          const isEnabled = customEmotionTags.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              style={styles.tagRow}
              onPress={() => toggleTag(tag)}
              activeOpacity={0.7}
            >
              <View style={styles.tagLeft}>
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: colors.emotions[tag] || colors.emotions.Neutral },
                  ]}
                />
                <Text style={[styles.tagLabel, !isEnabled && styles.tagLabelDisabled]}>
                  {tag}
                </Text>
              </View>
              {isEnabled && <Check size={18} color={colors.accent} />}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.7}>
          <RotateCcw size={14} color={colors.textMuted} />
          <Text style={styles.resetText}>{t('emotionTags.resetToDefaults')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
  },
  description: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 52,
  },
  tagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tagLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
  },
  tagLabelDisabled: {
    color: colors.textMuted,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  resetText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
});
