import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Modal,
  Pressable,
  Linking,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { FileText, Crown, RefreshCw, Download, Trash2, Shield, FileQuestion, HelpCircle, Info, Clock, Scan, AlarmClock, BookOpen } from 'lucide-react-native';
import { useSettingsStore } from '@/store/settingsStore';
import { useDreamsStore } from '@/store/dreamsStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { resetAllData } from '@/store/mmkv';
import { seedDreams, removeSeedDreams } from '@/utils/seedDreams';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  requestPermissions,
  scheduleMorningReminder,
  cancelMorningReminder,
  scheduleRealityChecks,
  cancelRealityChecks,
  scheduleWbtbAlarm,
  cancelWbtbAlarm,
  cancelAllNotifications,
} from '@/services/notifications';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { colors, fonts, typography, spacing, radii } from '@/constants/theme';
import { resetAnalytics, trackEvent, trackScreen } from '@/services/analytics';
import { useTranslation } from 'react-i18next';

const REALITY_CHECK_OPTIONS = ['2h', '3h', '4h'] as const;

function timeStringToDate(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

type PickerTarget = 'morning' | 'wbtb' | 'reality' | null;

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const settings = useSettingsStore();
  const isPremium = settings.isPremium;
  const { isLoading: rcLoading, restorePurchases } = useRevenueCat();
  const { t } = useTranslation();

  useFocusEffect(useCallback(() => { trackScreen('Settings'); }, []));

  const [activePicker, setActivePicker] = useState<PickerTarget>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  // Entrance animation
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 400, delay: 50, useNativeDriver: true }),
      Animated.spring(contentSlide, { toValue: 0, damping: 20, stiffness: 200, delay: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const openPicker = useCallback((target: PickerTarget) => {
    setActivePicker(target);
    sheetAnim.setValue(0);
    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 24,
    }).start();
  }, [sheetAnim]);

  const closePicker = useCallback(() => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setActivePicker(null));
  }, [sheetAnim]);

  const pickerTitle = activePicker === 'morning' ? t('settings.morningReminder')
    : activePicker === 'wbtb' ? t('settings.wbtbAlarm')
    : activePicker === 'reality' ? t('settings.realityCheckReminders')
    : '';

  const pickerTime = activePicker === 'morning' ? settings.morningReminderTime
    : activePicker === 'wbtb' ? settings.wbtbTime
    : '07:00';

  const handleUpgrade = useCallback(() => {
    router.push('/paywall?source=settings' as any);
  }, [router]);

  const handleRestore = useCallback(async () => {
    await restorePurchases();
  }, [restorePurchases]);

  const handleMorningReminderToggle = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(t('settings.notificationsDisabledTitle'), t('settings.notificationsDisabledMessage'), [
          { text: t('common.openSettings'), onPress: () => Linking.openSettings() },
          { text: t('common.cancel'), style: 'cancel' },
        ]);
        return;
      }
      settings.setMorningReminder(true);
      await scheduleMorningReminder(settings.morningReminderTime);
    } else {
      settings.setMorningReminder(false);
      await cancelMorningReminder();
    }
    trackEvent('morning_reminder_toggled', { enabled, time: settings.morningReminderTime });
  }, [settings]);

  const handleRealityCheckToggle = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(t('settings.notificationsDisabledTitle'), t('settings.notificationsDisabledMessage'), [
          { text: t('common.openSettings'), onPress: () => Linking.openSettings() },
          { text: t('common.cancel'), style: 'cancel' },
        ]);
        return;
      }
      settings.setRealityCheck(true);
      await scheduleRealityChecks(settings.realityCheckFrequency);
    } else {
      settings.setRealityCheck(false);
      await cancelRealityChecks();
    }
    trackEvent('reality_check_toggled', { enabled, frequency: settings.realityCheckFrequency });
  }, [settings]);

  const handleRealityFreqChange = useCallback(async (freq: string) => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    settings.setRealityCheckFrequency(freq);
    if (settings.realityCheckEnabled) {
      await scheduleRealityChecks(freq);
    }
  }, [settings]);

  const handleWbtbToggle = useCallback(async (enabled: boolean) => {
    if (!isPremium) {
      void handleUpgrade();
      return;
    }
    if (enabled) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(t('settings.notificationsDisabledTitle'), t('settings.notificationsDisabledWbtb'), [
          { text: t('common.openSettings'), onPress: () => Linking.openSettings() },
          { text: t('common.cancel'), style: 'cancel' },
        ]);
        return;
      }
      settings.setWbtb(true);
      await scheduleWbtbAlarm(settings.wbtbTime);
    } else {
      settings.setWbtb(false);
      await cancelWbtbAlarm();
    }
    trackEvent('wbtb_toggled', { enabled, time: settings.wbtbTime });
  }, [isPremium, settings, handleUpgrade]);

  const handlePickerTimeChange = useCallback(async (_event: DateTimePickerEvent, date?: Date) => {
    if (!date) return;
    const timeStr = dateToTimeString(date);
    if (activePicker === 'morning') {
      settings.setMorningReminderTime(timeStr);
      if (settings.morningReminderEnabled) await scheduleMorningReminder(timeStr);
    } else if (activePicker === 'wbtb') {
      settings.setWbtbTime(timeStr);
      if (settings.wbtbEnabled) await scheduleWbtbAlarm(timeStr);
    }
  }, [activePicker, settings]);

  const handlePickerDone = closePicker;

  const handleResetData = useCallback(() => {
    Alert.alert(
      t('settings.resetDataTitle'),
      t('settings.resetDataMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.resetEverything'),
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            trackEvent('data_reset_confirmed');
            void cancelAllNotifications();
            resetAllData();
            useOnboardingStore.persist.clearStorage();
            useDreamsStore.persist.clearStorage();
            useSettingsStore.persist.clearStorage();
            useOnboardingStore.setState(useOnboardingStore.getInitialState());
            useDreamsStore.setState(useDreamsStore.getInitialState());
            useSettingsStore.setState(useSettingsStore.getInitialState());
            resetAnalytics();
          },
        },
      ]
    );
  }, []);

  const handleExportDreams = useCallback(async () => {
    const allDreams = useDreamsStore.getState().dreams;
    const exportable = allDreams
      .filter((d) => !d.isForgotten)
      .map(({ id, isForgotten, ...rest }) => rest);
    trackEvent('export_dreams_tapped', { dream_count: exportable.length });

    if (exportable.length === 0) {
      Alert.alert(t('settings.noDreamsTitle'), t('settings.noDreamsMessage'));
      return;
    }

    try {
      const jsonString = JSON.stringify(
        { exportedAt: new Date().toISOString(), dreamCount: exportable.length, dreams: exportable },
        null,
        2
      );
      const fileName = `lucid-dreams-${new Date().toISOString().split('T')[0]}.json`;
      const file = new File(Paths.cache, fileName);
      file.write(jsonString);

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(t('settings.sharingError'), t('settings.sharingUnavailable'));
        return;
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: t('settings.exportDreamsShare'),
        UTI: 'public.json',
      });

      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert(t('settings.exportFailedTitle'), t('settings.exportFailedMessage'));
    }
  }, []);

  const renderToggleRow = (
    icon: React.ReactNode,
    label: string,
    value: boolean,
    onToggle: (val: boolean) => void,
    options?: { subtitle?: string; timeValue?: string; onTimeTap?: () => void }
  ) => (
    <View style={styles.toggleCard}>
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <View style={styles.rowIcon}>{icon}</View>
          <Text style={styles.rowLabel}>{label}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={(val) => {
            if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggle(val);
          }}
          trackColor={{ false: colors.surfaceCardBorder, true: colors.accent }}
          thumbColor={colors.textPrimary}
        />
      </View>
      {value && (options?.subtitle || options?.timeValue) && (
        <View style={styles.detailRow}>
          {options?.subtitle && <Text style={styles.rowSub}>{options.subtitle}</Text>}
          {options?.timeValue && options?.onTimeTap && (
            <TouchableOpacity
              style={styles.timePill}
              onPress={options.onTimeTap}
              activeOpacity={0.7}
            >
              <Clock size={12} color={colors.accent} />
              <Text style={styles.timePillText}>{options.timeValue}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderNavRow = (
    icon: React.ReactNode,
    label: string,
    onPress: () => void,
    options?: { accent?: boolean; danger?: boolean; badge?: string; value?: string }
  ) => (
    <TouchableOpacity style={styles.navRow} onPress={() => {
      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>{icon}</View>
        <Text style={[styles.rowLabel, options?.accent && styles.rowAccent, options?.danger && styles.rowDanger]}>
          {label}
        </Text>
        {options?.badge && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>{options.badge}</Text>
          </View>
        )}
      </View>
      {options?.value && <Text style={styles.rowValue}>{options.value}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: contentFade, transform: [{ translateY: contentSlide }] }}>
        <Text style={styles.pageTitle}>{t('settings.title')}</Text>

        <Text style={styles.sectionHeader}>{t('settings.sectionJournaling')}</Text>
        {renderToggleRow(
          <Clock size={18} color={colors.textSecondary} />,
          t('settings.morningReminder'),
          settings.morningReminderEnabled,
          handleMorningReminderToggle,
          {
            subtitle: t('settings.morningReminderSub'),
            timeValue: formatTime(settings.morningReminderTime),
            onTimeTap: () => openPicker('morning'),
          },
        )}
        {renderNavRow(
          <FileText size={18} color={colors.textSecondary} />,
          t('settings.defaultEmotionTags'),
          () => router.push('/emotion-tags' as any),
          { value: t('settings.customize') }
        )}

        <Text style={styles.sectionHeader}>{t('settings.sectionPremium')}</Text>
        {!isPremium ? (
          renderNavRow(
            <Crown size={18} color={colors.accent} />,
            rcLoading ? t('common.processing') : t('settings.upgradePremium'),
            handleUpgrade,
            { accent: true }
          )
        ) : (
          <View style={styles.premiumActive}>
            <Crown size={18} color={colors.accent} />
            <Text style={styles.premiumActiveText}>{t('settings.premiumActive')}</Text>
          </View>
        )}
        {renderNavRow(
          <RefreshCw size={18} color={colors.textSecondary} />,
          rcLoading ? t('common.restoring') : t('common.restorePurchases'),
          handleRestore,
        )}

        {__DEV__ && (
          <View style={styles.devToggle}>
            {renderToggleRow(
              <Crown size={18} color={colors.accent} />,
              t('settings.premiumDevToggle'),
              isPremium,
              settings.setIsPremium,
            )}
          </View>
        )}

        <View style={styles.sectionDivider} />
        <Text style={styles.sectionHeader}>
          {t('settings.sectionLucidDreaming')}
          <Text style={styles.sectionBadge}> {t('settings.sectionPremiumBadge')}</Text>
        </Text>
        {renderToggleRow(
          <Scan size={18} color={colors.textSecondary} />,
          t('settings.realityCheckReminders'),
          settings.realityCheckEnabled && isPremium,
          (val) => isPremium ? handleRealityCheckToggle(val) : handleUpgrade(),
          {
            subtitle: isPremium ? t('settings.realityCheckSub') : undefined,
            timeValue: t('settings.everyInterval', { interval: settings.realityCheckFrequency }),
            onTimeTap: () => openPicker('reality'),
          },
        )}
        {renderToggleRow(
          <AlarmClock size={18} color={colors.textSecondary} />,
          t('settings.wbtbAlarm'),
          settings.wbtbEnabled && isPremium,
          handleWbtbToggle,
          {
            subtitle: isPremium ? t('settings.wbtbAlarmSub') : undefined,
            timeValue: formatTime(settings.wbtbTime),
            onTimeTap: () => openPicker('wbtb'),
          },
        )}

        <Text style={styles.sectionHeader}>{t('settings.sectionData')}</Text>
        {renderNavRow(
          <Download size={18} color={colors.textSecondary} />,
          t('settings.exportDreams'),
          isPremium ? handleExportDreams : handleUpgrade,
          { badge: isPremium ? undefined : t('settings.sectionPremiumBadge') }
        )}
         {__DEV__ && (
          <>
            {renderNavRow(
              <Trash2 size={18} color={colors.danger} />,
              t('settings.resetAllData'),
              handleResetData,
              { danger: true }
            )}
            {renderNavRow(
              <Download size={18} color={colors.textSecondary} />,
              t('settings.seed10Dreams'),
              () => { seedDreams(); Alert.alert(t('common.done'), t('settings.seededDreams')); },
            )}
            {renderNavRow(
              <Trash2 size={18} color={colors.danger} />,
              t('settings.removeSeedDreams'),
              () => { removeSeedDreams(); Alert.alert(t('common.done'), t('settings.removedSeedDreams')); },
              { danger: true }
            )}
          </>
        )}

        <Text style={styles.sectionHeader}>{t('settings.sectionAbout')}</Text>
        {renderNavRow(
          <BookOpen size={18} color={colors.textSecondary} />,
          t('settings.dreamDictionary'),
          () => router.push('/dream-dictionary' as any),
          { badge: isPremium ? undefined : t('settings.sectionPremiumBadge') }
        )}
        {renderNavRow(
          <Shield size={18} color={colors.textSecondary} />,
          t('settings.privacyPolicy'),
          () => Linking.openURL('https://slicycode.github.io/lucid-dream-app/privacy/'),
        )}
        {renderNavRow(
          <FileQuestion size={18} color={colors.textSecondary} />,
          t('settings.termsOfService'),
          () => Linking.openURL('https://slicycode.github.io/lucid-dream-app/terms/'),
        )}
        {renderNavRow(
          <HelpCircle size={18} color={colors.textSecondary} />,
          t('settings.helpSupport'),
          () => Linking.openURL('https://slicycode.github.io/lucid-dream-app/support/'),
        )}
        <View style={styles.versionRow}>
          <Info size={14} color={colors.textDisabled} />
          <Text style={styles.versionText}>{t('settings.version', { version: '1.0.0' })}</Text>
        </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom sheet time picker */}
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="none"
        onRequestClose={handlePickerDone}
      >
        <Pressable style={styles.sheetOverlay} onPress={handlePickerDone}>
          <Animated.View
            style={[
              styles.sheetContainer,
              { paddingBottom: insets.bottom || spacing.md },
              { transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }] },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{pickerTitle}</Text>
              <TouchableOpacity onPress={handlePickerDone} activeOpacity={0.7}>
                <Text style={styles.sheetDone}>{t('settings.done')}</Text>
              </TouchableOpacity>
            </View>

            {activePicker === 'reality' ? (
              <View style={styles.freqContent}>
                <Text style={styles.freqLabel}>{t('settings.howOftenRemind')}</Text>
                <View style={styles.freqRow}>
                  {REALITY_CHECK_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.freqPill,
                        settings.realityCheckFrequency === opt && styles.freqPillActive,
                      ]}
                      onPress={() => handleRealityFreqChange(opt)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.freqPillText,
                          settings.realityCheckFrequency === opt && styles.freqPillTextActive,
                        ]}
                      >
                        {t('settings.everyInterval', { interval: opt })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <DateTimePicker
                value={timeStringToDate(pickerTime)}
                mode="time"
                display="spinner"
                onChange={handlePickerTimeChange}
                themeVariant="dark"
                textColor={colors.textPrimary}
                minuteInterval={5}
                style={{ alignSelf: 'center' }}
              />
            )}
          </Animated.View>
        </Pressable>
      </Modal>
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
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  pageTitle: {
    fontFamily: fonts.serif,
    fontSize: typography.heading.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '500' as const,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionBadge: {
    color: colors.accent,
  },
  toggleCard: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    minHeight: 52,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  navRow: {
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
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  rowIcon: {
    width: 28,
    alignItems: 'center',
  },
  rowLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
  },
  rowSub: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  rowAccent: {
    color: colors.accent,
    fontWeight: '600' as const,
  },
  rowDanger: {
    color: colors.danger,
  },
  rowValue: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: radii.lg,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  timePillText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    fontWeight: '500' as const,
    color: colors.accent,
  },
  // Bottom sheet
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceCardBorder,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  sheetTitle: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  sheetDone: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  freqContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  freqLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  freqRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  freqPill: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.lg,
    paddingVertical: 12,
  },
  freqPillActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accentBorder,
  },
  freqPillText: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  freqPillTextActive: {
    color: colors.accent,
  },
  premiumBadge: {
    backgroundColor: colors.accentMuted,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '600' as const,
    color: colors.accent,
    letterSpacing: 0.5,
  },
  premiumActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  premiumActiveText: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  devToggle: {
    opacity: 0.6,
    marginTop: spacing.xs,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.surfaceCardBorder,
    marginTop: spacing.lg,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  versionText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textDisabled,
  },
});
