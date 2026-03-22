import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Plus, Sparkles, Moon, Skull, Eye } from 'lucide-react-native';
import { useDreamsStore } from '@/store/dreamsStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { colors, fonts, typography, spacing, radii, sizes } from '@/constants/theme';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Last night';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getWeekDreamCount(dreams: { date: string }[]): number {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return dreams.filter((d) => new Date(d.date) >= weekAgo).length;
}

function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export default function JournalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const allDreams = useDreamsStore((s) => s.dreams);
  const dreams = useMemo(() => allDreams.filter((d) => !d.isForgotten), [allDreams]);
  const deleteDream = useDreamsStore((s) => s.deleteDream);
  const name = useOnboardingStore((s) => s.name);
  const [refreshing, setRefreshing] = React.useState(false);

  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
  }, []);

  const weekCount = useMemo(() => getWeekDreamCount(dreams), [dreams]);
  const hasDreamToday = useMemo(() => dreams.some((d) => d.date === getTodayString()), [dreams]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleDeleteDream = useCallback((id: string, title: string) => {
    Alert.alert(
      'Delete Dream',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            deleteDream(id);
          },
        },
      ]
    );
  }, [deleteDream]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textMuted}
          />
        }
      >
        <Text style={styles.dateLabel}>{today}</Text>
        <Text style={styles.greeting}>{getGreeting()}, {name || 'Dreamer'}.</Text>
        {weekCount > 0 && (
          <Text style={styles.weekStat}>{weekCount} dream{weekCount !== 1 ? 's' : ''} this week</Text>
        )}

        {!hasDreamToday && (
          <TouchableOpacity
            style={styles.quickEntryCard}
            onPress={() => router.push('/new-dream')}
            activeOpacity={0.7}
            testID="quick-entry"
          >
            <Text style={styles.quickEntryTitle}>What did you dream about?</Text>
            <Text style={styles.quickEntrySubtext}>Dreams fade fast — capture yours now</Text>
          </TouchableOpacity>
        )}

        {dreams.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>RECENT DREAMS</Text>
            {dreams.map((dream) => (
              <TouchableOpacity
                key={dream.id}
                style={styles.dreamCard}
                onPress={() => router.push(`/dream/${dream.id}`)}
                onLongPress={() => handleDeleteDream(dream.id, dream.title)}
                activeOpacity={0.7}
                testID={`dream-card-${dream.id}`}
              >
                <View style={styles.dreamCardHeader}>
                  <View style={styles.dreamCardLeft}>
                    <View
                      style={[
                        styles.emotionDot,
                        { backgroundColor: colors.emotions[dream.emotion] || colors.emotions.Neutral },
                      ]}
                    />
                    <View style={styles.dreamCardInfo}>
                      <Text style={styles.dreamTitle}>{dream.title}</Text>
                      <Text style={styles.dreamMeta}>
                        {formatDate(dream.date)} · {formatTime(dream.loggedAt)}
                      </Text>
                    </View>
                  </View>
                  {dream.interpretation && (
                    <Sparkles size={16} color={colors.accent} />
                  )}
                </View>
                <Text style={styles.dreamPreview} numberOfLines={2}>
                  {dream.content}
                </Text>
                <View style={styles.dreamPillsRow}>
                  {dream.dreamType === 'nightmare' ? (
                    <View style={styles.nightmarePill}>
                      <Skull size={10} color={colors.danger} />
                      <Text style={styles.nightmarePillText}>Nightmare</Text>
                    </View>
                  ) : (
                    <View style={styles.dreamPill}>
                      <Moon size={10} color={colors.textSecondary} />
                      <Text style={styles.dreamPillText}>Dream</Text>
                    </View>
                  )}
                  {dream.isLucid && (
                    <View style={styles.lucidPill}>
                      <Moon size={10} color={colors.accent} />
                      <Text style={styles.lucidPillText}>Lucid</Text>
                    </View>
                  )}
                  {!dream.isFirstPerson ? (
                    <View style={styles.observerPill}>
                      <Eye size={10} color={colors.textSecondary} />
                      <Text style={styles.observerPillText}>Observer</Text>
                    </View>
                  ) : (
                    <View style={styles.observerPill}>
                      <Eye size={10} color={colors.accent} />
                      <Text style={[styles.observerPillText, { color: colors.accent }]}>First person</Text>
                      </View> 
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {dreams.length === 0 && (
          <View style={styles.emptyState}>
            <Moon size={48} color={colors.textDisabled} />
            <Text style={styles.emptyTitle}>Your dream journal is empty</Text>
            <Text style={styles.emptySubtext}>Tap the + button to log your first dream</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { bottom: 44 + spacing.md }]}
        onPress={() => {
          if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/new-dream');
        }}
        activeOpacity={0.8}
        testID="fab-new-dream"
      >
        <Plus size={24} color={colors.ctaAccentText} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 100,
    paddingTop: spacing.md,
  },
  dateLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '500' as const,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  greeting: {
    fontFamily: fonts.serif,
    fontSize: typography.heading.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    lineHeight: 34,
    marginBottom: spacing.xs,
  },
  weekStat: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  quickEntryCard: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.cardPadding,
    marginBottom: spacing.sectionGap,
  },
  quickEntryTitle: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  quickEntrySubtext: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  sectionLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '500' as const,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  dreamCard: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.cardPadding,
    marginBottom: spacing.sm,
  },
  dreamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  dreamCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  emotionDot: {
    width: sizes.emotionDot,
    height: sizes.emotionDot,
    borderRadius: sizes.emotionDot / 2,
    marginTop: 6,
    marginRight: spacing.sm,
  },
  dreamCardInfo: {
    flex: 1,
  },
  dreamTitle: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  dreamMeta: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  dreamPreview: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: sizes.emotionDot + spacing.sm,
  },
  dreamPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.sm,
    marginLeft: sizes.emotionDot + spacing.sm,
  },
  dreamPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceInput,
    borderRadius: radii.lg,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dreamPillText: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  nightmarePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: radii.lg,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  nightmarePillText: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '500' as const,
    color: colors.danger,
  },
  lucidPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentMuted,
    borderRadius: radii.lg,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lucidPillText: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '500' as const,
    color: colors.accent,
  },
  observerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceInput,
    borderRadius: radii.lg,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  observerPillText: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  fab: {
    position: 'absolute',
    right: spacing.screenPadding,
    width: sizes.fabSize,
    height: sizes.fabSize,
    borderRadius: sizes.fabSize / 2,
    backgroundColor: colors.ctaAccentBg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
