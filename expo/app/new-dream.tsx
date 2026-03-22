import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useDreamsStore } from '@/store/dreamsStore';
import { EMOTIONS, THEMES } from '@/types/dream';
import { colors, fonts, typography, spacing, radii, sizes } from '@/constants/theme';

export default function NewDreamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addDream = useDreamsStore((s) => s.addDream);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [emotion, setEmotion] = useState('');
  const [themes, setThemes] = useState<string[]>([]);
  const [isLucid, setIsLucid] = useState(false);

  const canSave = title.trim().length > 0 && content.trim().length > 0;

  const handleSave = useCallback(() => {
    if (!canSave) return;
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 0);

    addDream({
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      date: now.toISOString().split('T')[0],
      loggedAt: now.toISOString(),
      emotion: emotion || 'Neutral',
      themes,
      isLucid,
      interpretation: null,
      symbols: [],
    });

    router.back();
  }, [canSave, title, content, emotion, themes, isLucid, addDream, router]);

  const toggleTheme = useCallback((theme: string) => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    );
  }, []);

  const selectEmotion = useCallback((em: string) => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEmotion(em);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="cancel-button">
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Dream</Text>
        <TouchableOpacity onPress={handleSave} disabled={!canSave} testID="save-button">
          <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.dateRow}>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>Last night</Text>
            </View>
          </View>

          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Give your dream a title..."
            placeholderTextColor={colors.textMuted}
            testID="dream-title-input"
          />

          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="Describe your dream in as much detail as you can remember..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            testID="dream-content-input"
          />

          <Text style={styles.sectionLabel}>How did this dream feel?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
            <View style={styles.tagsRow}>
              {EMOTIONS.map((em) => (
                <TouchableOpacity
                  key={em}
                  style={[styles.emotionTag, emotion === em && styles.emotionTagSelected]}
                  onPress={() => selectEmotion(em)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.emotionColorDot, { backgroundColor: colors.emotions[em] }]} />
                  <Text style={[styles.emotionTagText, emotion === em && styles.emotionTagTextSelected]}>{em}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.sectionLabel}>Dream themes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
            <View style={styles.tagsRow}>
              {THEMES.map((theme) => (
                <TouchableOpacity
                  key={theme}
                  style={[styles.themeTag, themes.includes(theme) && styles.themeTagSelected]}
                  onPress={() => toggleTheme(theme)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.themeTagText, themes.includes(theme) && styles.themeTagTextSelected]}>{theme}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.lucidRow}>
            <Text style={styles.lucidLabel}>Was this a lucid dream?</Text>
            <TouchableOpacity
              style={[styles.lucidToggle, isLucid && styles.lucidToggleActive]}
              onPress={() => {
                if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsLucid(!isLucid);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.lucidKnob, isLucid && styles.lucidKnobActive]} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceCardBorder,
  },
  cancelText: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    color: colors.textMuted,
  },
  headerTitle: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  saveText: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  saveTextDisabled: {
    color: colors.textDisabled,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  dateRow: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  datePill: {
    backgroundColor: colors.accentMuted,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  datePillText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.accent,
    fontWeight: '500' as const,
  },
  titleInput: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    height: sizes.inputHeight,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  contentInput: {
    fontFamily: fonts.serif,
    fontSize: typography.dreamText.fontSize,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.md,
    minHeight: 200,
    lineHeight: 28,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  tagScroll: {
    marginBottom: spacing.lg,
    marginHorizontal: -spacing.screenPadding,
    paddingHorizontal: spacing.screenPadding,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.screenPadding,
  },
  emotionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  emotionTagSelected: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accentBorder,
  },
  emotionColorDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
  },
  emotionTagText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  emotionTagTextSelected: {
    color: colors.textPrimary,
  },
  themeTag: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  themeTagSelected: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accentBorder,
  },
  themeTagText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  themeTagTextSelected: {
    color: colors.textPrimary,
  },
  lucidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  lucidLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
  },
  lucidToggle: {
    width: 48,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceCardBorder,
    padding: 2,
    justifyContent: 'center',
  },
  lucidToggleActive: {
    backgroundColor: colors.accent,
  },
  lucidKnob: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: colors.textPrimary,
  },
  lucidKnobActive: {
    alignSelf: 'flex-end',
  },
});
