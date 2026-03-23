import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Search } from 'lucide-react-native';
import { useSettingsStore } from '@/store/settingsStore';
import { GlassAsset } from '@/components/GlassAsset';
import { glassAssets } from '@/constants/glassAssets';
import { DREAM_DICTIONARY, DictionaryEntry } from '@/constants/dreamDictionary';
import { colors, fonts, typography, spacing, radii } from '@/constants/theme';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

type LetterHeader = { type: 'header'; letter: string };
type EntryRow = { type: 'entry'; entry: DictionaryEntry };
type ListItem = LetterHeader | EntryRow;

function buildFlatList(entries: DictionaryEntry[]): { items: ListItem[]; stickyIndices: number[] } {
  const items: ListItem[] = [];
  const stickyIndices: number[] = [];
  let currentLetter = '';

  for (const entry of entries) {
    const letter = entry.symbol[0].toUpperCase();
    if (letter !== currentLetter) {
      currentLetter = letter;
      stickyIndices.push(items.length);
      items.push({ type: 'header', letter });
    }
    items.push({ type: 'entry', entry });
  }

  return { items, stickyIndices };
}

export default function DreamDictionaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isPremium = useSettingsStore((s) => s.isPremium);
  const [query, setQuery] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const headerPositions = useRef<Map<string, number>>(new Map());

  const { items, stickyIndices } = useMemo(() => {
    headerPositions.current.clear();
    const source = query.trim()
      ? DREAM_DICTIONARY.filter((e) => e.symbol.toLowerCase().includes(query.toLowerCase()))
      : DREAM_DICTIONARY;
    return buildFlatList(source);
  }, [query]);

  const sectionLetters = useMemo(() => {
    const letters: string[] = [];
    for (const item of items) {
      if (item.type === 'header') letters.push(item.letter);
    }
    return letters;
  }, [items]);

  const scrollToLetter = useCallback((letter: string) => {
    const y = headerPositions.current.get(letter);
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y, animated: false });
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dream Dictionary</Text>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <X size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {!isPremium ? (
        <View style={styles.lockContainer}>
          <GlassAsset source={glassAssets.book} size={144} />
          <Text style={styles.lockTitle}>Premium Feature</Text>
          <Text style={styles.lockSubtext}>
            Unlock the full dream symbol reference with Premium — 80+ symbols, offline, no ads.
          </Text>
          <TouchableOpacity
            style={styles.lockCta}
            onPress={() => router.push('/paywall' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.lockCtaText}>Start Free Trial</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Search */}
          <View style={styles.searchRow}>
            <Search size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search symbols..."
              placeholderTextColor={colors.textDisabled}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                <X size={14} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.listWrapper}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              stickyHeaderIndices={stickyIndices}
            >
              {items.map((item, i) => {
                if (item.type === 'header') {
                  return (
                    <View
                      key={`header-${item.letter}`}
                      style={styles.sectionHeader}
                      onLayout={(e) => {
                        headerPositions.current.set(item.letter, e.nativeEvent.layout.y);
                      }}
                    >
                      <Text style={styles.sectionHeaderText}>{item.letter}</Text>
                    </View>
                  );
                }
                return (
                  <View key={`entry-${item.entry.symbol}-${i}`} style={styles.entry}>
                    <Text style={styles.symbol}>{item.entry.symbol}</Text>
                    <Text style={styles.meaning}>{item.entry.meaning}</Text>
                  </View>
                );
              })}
            </ScrollView>

            {/* Alphabet sidebar */}
            {!query && (
              <View style={[styles.sidebar, { paddingBottom: insets.bottom + spacing.md }]}>
                {ALPHABET.map((letter) => {
                  const hasEntries = sectionLetters.includes(letter);
                  return (
                    <TouchableOpacity
                      key={letter}
                      style={styles.sidebarLetterContainer}
                      activeOpacity={0.6}
                      disabled={!hasEntries}
                      hitSlop={{ left: 10, right: 6 }}
                      onPress={() => scrollToLetter(letter)}
                    >
                      <Text
                        style={[
                          styles.sidebarLetter,
                          !hasEntries && styles.sidebarLetterDim,
                        ]}
                      >
                        {letter}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const SIDEBAR_WIDTH = 36;

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
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceCardBorder,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: typography.heading.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    margin: spacing.screenPadding,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    padding: 0,
  },
  listWrapper: {
    flex: 1,
  },
  listContent: {
    paddingLeft: spacing.screenPadding,
    paddingRight: spacing.screenPadding + SIDEBAR_WIDTH,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  sectionHeaderText: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    fontWeight: '700' as const,
    color: colors.accent,
  },
  entry: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceCardBorder,
  },
  symbol: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  meaning: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    color: colors.textMuted,
    textAlign: 'center',
    paddingTop: spacing.xl,
  },
  sidebar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.md,
  },
  sidebarLetterContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarLetter: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  sidebarLetterDim: {
    color: colors.textDisabled,
  },
  lockContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl * 2,
    paddingHorizontal: spacing.screenPadding,
  },
  lockTitle: {
    fontFamily: fonts.serif,
    fontSize: typography.heading.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  lockSubtext: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  lockCta: {
    backgroundColor: colors.ctaAccentBg,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
  },
  lockCtaText: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.ctaAccentText,
  },
});
