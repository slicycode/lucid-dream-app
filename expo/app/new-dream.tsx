import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
  Switch,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useDreamsStore } from '@/store/dreamsStore';
import { EMOTIONS, THEMES, DreamType } from '@/types/dream';
import { isLikelyGibberish, MIN_DREAM_CONTENT_LENGTH } from '@/services/interpretation';
import { colors, fonts, typography, spacing, radii, sizes } from '@/constants/theme';

const SLIDER_STEPS = 5;
const THUMB_SIZE = 28;
const TRACK_HEIGHT = 6;

function SnapSlider({
  value,
  onValueChange,
  onSlidingStart,
  onSlidingEnd,
  leftLabel,
  rightLabel,
}: {
  value: number | null;
  onValueChange: (v: number) => void;
  onSlidingStart?: () => void;
  onSlidingEnd?: () => void;
  leftLabel: string;
  rightLabel: string;
}) {
  const trackWidth = useRef(0);
  const containerPageX = useRef(0);
  const lastSnap = useRef<number | null>(value);
  const trackRef = useRef<View>(null);

  const getPositionForStep = (step: number, width: number) =>
    ((step - 1) / (SLIDER_STEPS - 1)) * (width - THUMB_SIZE);

  const getStepForPageX = (pageX: number) => {
    const localX = pageX - containerPageX.current;
    const usable = trackWidth.current - THUMB_SIZE;
    const clamped = Math.max(0, Math.min(localX - THUMB_SIZE / 2, usable));
    return Math.round((clamped / usable) * (SLIDER_STEPS - 1)) + 1;
  };

  const handleTouch = useCallback((pageX: number) => {
    const step = getStepForPageX(pageX);
    if (step !== lastSnap.current) {
      lastSnap.current = step;
      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onValueChange(step);
  }, [onValueChange]);

  const tapStep = useCallback((step: number) => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    lastSnap.current = step;
    onValueChange(step);
  }, [onValueChange]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => handleTouch(evt.nativeEvent.pageX),
      onPanResponderMove: (evt) => handleTouch(evt.nativeEvent.pageX),
    })
  ).current;

  const [, forceUpdate] = useState(0);
  const handleLayout = useCallback(() => {
    trackRef.current?.measure((_x, _y, width, _h, pageX) => {
      trackWidth.current = width;
      containerPageX.current = pageX;
      forceUpdate((n) => n + 1);
    });
  }, []);

  const hasValue = value !== null;
  const displayThumbLeft =
    hasValue && trackWidth.current > 0
      ? getPositionForStep(value, trackWidth.current)
      : null;

  return (
    <View
      style={sliderStyles.wrapper}
      onTouchStart={() => onSlidingStart?.()}
      onTouchEnd={() => onSlidingEnd?.()}
      onTouchCancel={() => onSlidingEnd?.()}
    >
      <View
        ref={trackRef}
        style={sliderStyles.trackContainer}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <View style={sliderStyles.track} />
        {hasValue && (
          <View
            style={[
              sliderStyles.trackFill,
              {
                width:
                  trackWidth.current > 0
                    ? getPositionForStep(value, trackWidth.current) + THUMB_SIZE / 2
                    : 0,
              },
            ]}
          />
        )}
        {[1, 2, 3, 4, 5].map((step) => {
          const active = hasValue && step <= value;
          return (
            <View
              key={step}
              style={[
                sliderStyles.notch,
                active && sliderStyles.notchActive,
                {
                  left:
                    trackWidth.current > 0
                      ? getPositionForStep(step, trackWidth.current) + THUMB_SIZE / 2 - 3
                      : `${((step - 1) / (SLIDER_STEPS - 1)) * 100}%`,
                },
              ]}
            />
          );
        })}
        {displayThumbLeft !== null && (
          <View style={[sliderStyles.thumb, { left: displayThumbLeft }]}>
            <Text style={sliderStyles.thumbText}>{value}</Text>
          </View>
        )}
      </View>
      <View style={sliderStyles.stepNumbers}>
        <TouchableOpacity
          onPress={() => tapStep(1)}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          activeOpacity={0.7}
        >
          <Text style={[sliderStyles.stepText, value === 1 && sliderStyles.stepTextActive]}>1</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => tapStep(5)}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          activeOpacity={0.7}
        >
          <Text style={[sliderStyles.stepText, value === 5 && sliderStyles.stepTextActive]}>5</Text>
        </TouchableOpacity>
      </View>
      <View style={sliderStyles.labels}>
        <Text style={sliderStyles.labelText}>{leftLabel}</Text>
        <Text style={sliderStyles.labelText}>{rightLabel}</Text>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  trackContainer: {
    height: 44,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    position: 'absolute',
    left: THUMB_SIZE / 2,
    right: THUMB_SIZE / 2,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.surfaceCardBorder,
  },
  trackFill: {
    position: 'absolute',
    left: THUMB_SIZE / 2,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.accent,
  },
  notch: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceCardBorder,
    top: 19,
  },
  notchActive: {
    backgroundColor: colors.accent,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    top: (44 - THUMB_SIZE) / 2,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  thumbText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#000000',
  },
  stepNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: THUMB_SIZE / 2 - 4,
  },
  stepText: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    color: colors.textDisabled,
    width: 14,
    textAlign: 'center',
  },
  stepTextActive: {
    color: colors.accent,
    fontWeight: '600' as const,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  labelText: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    color: colors.textDisabled,
  },
});

function DreamTypeToggle({
  value,
  onChange,
}: {
  value: DreamType;
  onChange: (v: DreamType) => void;
}) {
  const slideAnim = useRef(new Animated.Value(value === 'nightmare' ? 1 : 0)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: value === 'nightmare' ? 1 : 0,
      useNativeDriver: false,
      tension: 200,
      friction: 20,
    }).start();
  }, [value, slideAnim]);

  const indicatorWidth = containerWidth > 0 ? (containerWidth - 8) / 2 : 0;

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, indicatorWidth],
  });

  const backgroundColor = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.accentMuted, 'rgba(239, 68, 68, 0.12)'],
  });

  return (
    <View
      style={styles.dreamTypeRow}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.dreamTypeIndicator,
            {
              width: indicatorWidth,
              transform: [{ translateX }],
              backgroundColor,
            },
          ]}
        />
      )}
      {(['dream', 'nightmare'] as const).map((type) => (
        <TouchableOpacity
          key={type}
          style={styles.dreamTypeOption}
          onPress={() => {
            if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(type);
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dreamTypeText,
              value === type && (type === 'nightmare' ? styles.dreamTypeNightmareTextSelected : styles.dreamTypeTextSelected),
            ]}
          >
            {type === 'dream' ? 'Dream' : 'Nightmare'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function formatDatePill(dateStr: string | undefined): string {
  if (!dateStr) return 'Last night';
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const todayKey = today.toISOString().split('T')[0];
  const yesterdayKey = yesterday.toISOString().split('T')[0];
  if (dateStr === todayKey) return 'Last night';
  if (dateStr === yesterdayKey) return 'Last night';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function NewDreamScreen() {
  const router = useRouter();
  const { date: paramDate } = useLocalSearchParams<{ date?: string }>();
  const insets = useSafeAreaInsets();
  const addDream = useDreamsStore((s) => s.addDream);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [emotion, setEmotion] = useState('');
  const [themes, setThemes] = useState<string[]>([]);
  const [isLucid, setIsLucid] = useState(false);
  const [dreamType, setDreamType] = useState<DreamType>('dream');
  const [rating, setRating] = useState<number | null>(null);
  const [vividness, setVividness] = useState<number | null>(null);
  const [isFirstPerson, setIsFirstPerson] = useState(true);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const contentTrimmed = content.trim();
  const isGibberish = contentTrimmed.length >= MIN_DREAM_CONTENT_LENGTH && isLikelyGibberish(contentTrimmed);
  const canSave = title.trim().length > 0 && contentTrimmed.length >= MIN_DREAM_CONTENT_LENGTH && !isGibberish;

  const handleSave = useCallback(() => {
    if (!canSave) return;
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const now = new Date();
    const dreamDate = paramDate || now.toISOString().split('T')[0];

    addDream({
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      date: dreamDate,
      loggedAt: now.toISOString(),
      emotion: emotion || 'Neutral',
      themes,
      isLucid,
      dreamType,
      rating,
      vividness,
      isFirstPerson,
      interpretation: null,
      symbols: [],
      interpretationRating: null,
      isForgotten: false,
    });

    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [canSave, title, content, emotion, themes, isLucid, dreamType, rating, vividness, isFirstPerson, addDream, router]);

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
    <View style={[styles.container, { paddingTop: insets.top - 32 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="cancel-button">
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title.trim() || 'New Dream'}</Text>
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
          scrollEnabled={scrollEnabled}
        >
          <View style={styles.dateRow}>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>{formatDatePill(paramDate)}</Text>
            </View>
          </View>

          <View>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Give your dream a title..."
              placeholderTextColor={colors.textMuted}
              maxLength={30}
              testID="dream-title-input"
            />
            <Text style={styles.charCount}>{title.length}/30</Text>
          </View>

          <View>
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="Describe your dream in as much detail as you can remember..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              maxLength={500}
              testID="dream-content-input"
            />
            <Text style={[styles.charCount, (isGibberish || (contentTrimmed.length > 0 && contentTrimmed.length < MIN_DREAM_CONTENT_LENGTH)) && { color: colors.danger }]}>
              {isGibberish
                ? 'Please describe your dream using real words'
                : contentTrimmed.length > 0 && contentTrimmed.length < MIN_DREAM_CONTENT_LENGTH
                  ? `${MIN_DREAM_CONTENT_LENGTH - contentTrimmed.length} more characters needed`
                  : `${content.length}/500`}
            </Text>
          </View>

          <DreamTypeToggle value={dreamType} onChange={setDreamType} />

          <Text style={styles.sectionLabel}>How was this dream?</Text>
          <SnapSlider
            value={rating}
            onValueChange={setRating}
            onSlidingStart={() => setScrollEnabled(false)}
            onSlidingEnd={() => setScrollEnabled(true)}
            leftLabel="Very bad"
            rightLabel="Very good"
          />

          <Text style={styles.sectionLabel}>How vivid was it?</Text>
          <SnapSlider
            value={vividness}
            onValueChange={setVividness}
            onSlidingStart={() => setScrollEnabled(false)}
            onSlidingEnd={() => setScrollEnabled(true)}
            leftLabel="Very vague"
            rightLabel="Very vivid"
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
            <Switch
              value={isLucid}
              onValueChange={(val) => {
                if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsLucid(val);
              }}
              trackColor={{ false: colors.surfaceCardBorder, true: colors.accent }}
              thumbColor={colors.textPrimary}
            />
          </View>

          <View style={[styles.lucidRow, { marginTop: spacing.sm }]}>
            <Text style={styles.lucidLabel}>Were you in this dream?</Text>
            <Switch
              value={isFirstPerson}
              onValueChange={(val) => {
                if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsFirstPerson(val);
              }}
              trackColor={{ false: colors.surfaceCardBorder, true: colors.accent }}
              thumbColor={colors.textPrimary}
            />
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
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    textAlign: 'center',
    marginHorizontal: spacing.md,
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
    fontFamily: fonts.sans,
    fontSize: typography.subheading.fontSize,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    height: sizes.inputHeight,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  contentInput: {
    fontFamily: fonts.sans,
    fontSize: typography.dreamText.fontSize,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.md,
    minHeight: 200,
    lineHeight: 28,
    marginBottom: spacing.xs,
  },
  charCount: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    color: colors.textDisabled,
    textAlign: 'right',
    marginBottom: spacing.md,
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
  dreamTypeRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  dreamTypeIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: radii.md - 2,
  },
  dreamTypeOption: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    borderRadius: radii.md - 2,
  },
  dreamTypeText: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  dreamTypeTextSelected: {
    color: colors.accent,
  },
  dreamTypeNightmareTextSelected: {
    color: colors.danger,
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
});
