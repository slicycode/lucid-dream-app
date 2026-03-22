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
import { Bell, FileText, Crown, RefreshCw, Brain, Moon, Download, Trash2, Shield, FileQuestion, HelpCircle, Info, Clock } from 'lucide-react-native';
import { useSettingsStore } from '@/store/settingsStore';
import { useDreamsStore } from '@/store/dreamsStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { resetAllData } from '@/store/mmkv';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import {
  requestPermissions,
  scheduleMorningReminder,
  cancelMorningReminder,
  scheduleRealityChecks,
  cancelRealityChecks,
  cancelAllNotifications,
} from '@/services/notifications';
import { colors, fonts, typography, spacing, radii } from '@/constants/theme';

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
  const insets = useSafeAreaInsets();
  const settings = useSettingsStore();
  const isPremium = settings.isPremium;
  const { monthlyPackage, isLoading: rcLoading, purchasePackage, restorePurchases } = useRevenueCat();

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

  const pickerTitle = activePicker === 'morning' ? 'Morning Reminder'
    : activePicker === 'wbtb' ? 'WBTB Alarm'
    : activePicker === 'reality' ? 'Reality Check Frequency'
    : '';

  const pickerTime = activePicker === 'morning' ? settings.morningReminderTime
    : activePicker === 'wbtb' ? settings.wbtbTime
    : '07:00';

  const handleUpgrade = useCallback(async () => {
    if (!monthlyPackage) return;
    await purchasePackage(monthlyPackage);
  }, [monthlyPackage, purchasePackage]);

  const handleRestore = useCallback(async () => {
    await restorePurchases();
  }, [restorePurchases]);

  const handleMorningReminderToggle = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Notifications Disabled', 'Enable notifications in your device Settings to use reminders.', [
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
          { text: 'Cancel', style: 'cancel' },
        ]);
        return;
      }
      settings.setMorningReminder(true);
      await scheduleMorningReminder(settings.morningReminderTime);
    } else {
      settings.setMorningReminder(false);
      await cancelMorningReminder();
    }
  }, [settings]);

  const handleRealityCheckToggle = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Notifications Disabled', 'Enable notifications in your device Settings to use reminders.', [
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
          { text: 'Cancel', style: 'cancel' },
        ]);
        return;
      }
      settings.setRealityCheck(true);
      await scheduleRealityChecks(settings.realityCheckFrequency);
    } else {
      settings.setRealityCheck(false);
      await cancelRealityChecks();
    }
  }, [settings]);

  const handleRealityFreqChange = useCallback(async (freq: string) => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    settings.setRealityCheckFrequency(freq);
    if (settings.realityCheckEnabled) {
      await scheduleRealityChecks(freq);
    }
  }, [settings]);

  const handleWbtbToggle = useCallback((enabled: boolean) => {
    if (!isPremium) {
      void handleUpgrade();
      return;
    }
    settings.setWbtb(enabled);
  }, [isPremium, settings, handleUpgrade]);

  const handlePickerTimeChange = useCallback(async (_event: DateTimePickerEvent, date?: Date) => {
    if (!date) return;
    const timeStr = dateToTimeString(date);
    if (activePicker === 'morning') {
      settings.setMorningReminderTime(timeStr);
      if (settings.morningReminderEnabled) await scheduleMorningReminder(timeStr);
    } else if (activePicker === 'wbtb') {
      settings.setWbtbTime(timeStr);
    }
  }, [activePicker, settings]);

  const handlePickerDone = closePicker;

  const handleResetData = useCallback(() => {
    Alert.alert(
      'Reset All Data',
      'This will delete all dreams, settings, and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            void cancelAllNotifications();
            resetAllData();
            useOnboardingStore.persist.clearStorage();
            useDreamsStore.persist.clearStorage();
            useSettingsStore.persist.clearStorage();
            useOnboardingStore.setState(useOnboardingStore.getInitialState());
            useDreamsStore.setState(useDreamsStore.getInitialState());
            useSettingsStore.setState(useSettingsStore.getInitialState());
          },
        },
      ]
    );
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
        <Text style={styles.pageTitle}>Settings</Text>

        <Text style={styles.sectionHeader}>JOURNALING</Text>
        {renderToggleRow(
          <Bell size={18} color={colors.textSecondary} />,
          'Morning Reminder',
          settings.morningReminderEnabled,
          handleMorningReminderToggle,
          {
            subtitle: 'Get reminded to log your dreams',
            timeValue: formatTime(settings.morningReminderTime),
            onTimeTap: () => openPicker('morning'),
          },
        )}
        {renderNavRow(
          <FileText size={18} color={colors.textSecondary} />,
          'Default Emotion Tags',
          () => {},
          { value: 'Customize' }
        )}

        <Text style={styles.sectionHeader}>PREMIUM</Text>
        {!isPremium ? (
          renderNavRow(
            <Crown size={18} color={colors.accent} />,
            rcLoading ? 'Processing...' : 'Upgrade to Premium',
            handleUpgrade,
            { accent: true }
          )
        ) : (
          <View style={styles.premiumActive}>
            <Crown size={18} color={colors.accent} />
            <Text style={styles.premiumActiveText}>Premium Active</Text>
          </View>
        )}
        {renderNavRow(
          <RefreshCw size={18} color={colors.textSecondary} />,
          rcLoading ? 'Restoring...' : 'Restore Purchases',
          handleRestore,
        )}

        <View style={styles.devToggle}>
          {renderToggleRow(
            <Crown size={18} color={colors.accent} />,
            'Premium (Dev Toggle)',
            isPremium,
            settings.setIsPremium,
          )}
        </View>

        <Text style={styles.sectionHeader}>
          LUCID DREAMING
          <Text style={styles.sectionBadge}> PREMIUM</Text>
        </Text>
        {renderToggleRow(
          <Brain size={18} color={isPremium ? colors.textSecondary : colors.textDisabled} />,
          'Reality Check Reminders',
          settings.realityCheckEnabled && isPremium,
          (val) => isPremium ? handleRealityCheckToggle(val) : handleUpgrade(),
          {
            subtitle: isPremium ? 'Periodic "Am I dreaming?" prompts' : undefined,
            timeValue: `Every ${settings.realityCheckFrequency}`,
            onTimeTap: () => openPicker('reality'),
          },
        )}
        {renderToggleRow(
          <Moon size={18} color={isPremium ? colors.textSecondary : colors.textDisabled} />,
          'WBTB Alarm',
          settings.wbtbEnabled && isPremium,
          handleWbtbToggle,
          {
            subtitle: isPremium ? 'Wake Back to Bed technique alarm' : undefined,
            timeValue: formatTime(settings.wbtbTime),
            onTimeTap: () => openPicker('wbtb'),
          },
        )}

        <Text style={styles.sectionHeader}>DATA</Text>
        {renderNavRow(
          <Download size={18} color={colors.textSecondary} />,
          'Export Dreams (JSON)',
          isPremium ? () => {} : handleUpgrade,
          { badge: isPremium ? undefined : 'PREMIUM' }
        )}
        {renderNavRow(
          <Trash2 size={18} color={colors.danger} />,
          'Reset All Data',
          handleResetData,
          { danger: true }
        )}

        <Text style={styles.sectionHeader}>ABOUT</Text>
        {renderNavRow(
          <Shield size={18} color={colors.textSecondary} />,
          'Privacy Policy',
          () => Linking.openURL('https://example.com/privacy'),
        )}
        {renderNavRow(
          <FileQuestion size={18} color={colors.textSecondary} />,
          'Terms of Service',
          () => Linking.openURL('https://example.com/terms'),
        )}
        {renderNavRow(
          <HelpCircle size={18} color={colors.textSecondary} />,
          'Help & Support',
          () => Linking.openURL('https://example.com/support'),
        )}
        <View style={styles.versionRow}>
          <Info size={14} color={colors.textDisabled} />
          <Text style={styles.versionText}>Version 1.0.0</Text>
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
                <Text style={styles.sheetDone}>Done</Text>
              </TouchableOpacity>
            </View>

            {activePicker === 'reality' ? (
              <View style={styles.freqContent}>
                <Text style={styles.freqLabel}>How often should we remind you?</Text>
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
                        Every {opt}
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
