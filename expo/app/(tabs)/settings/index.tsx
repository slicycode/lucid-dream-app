import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Bell, FileText, Crown, RefreshCw, Brain, Moon, Download, Trash2, Shield, FileQuestion, HelpCircle, Info } from 'lucide-react-native';
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

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const settings = useSettingsStore();
  const isPremium = settings.isPremium;
  const { monthlyPackage, isLoading: rcLoading, purchasePackage, restorePurchases } = useRevenueCat();

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
    subtitle?: string
  ) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>{icon}</View>
        <View>
          <Text style={styles.rowLabel}>{label}</Text>
          {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.surfaceCardBorder, true: colors.accent }}
        thumbColor={colors.textPrimary}
      />
    </View>
  );

  const renderNavRow = (
    icon: React.ReactNode,
    label: string,
    onPress: () => void,
    options?: { accent?: boolean; danger?: boolean; badge?: string; value?: string }
  ) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
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
        <Text style={styles.pageTitle}>Settings</Text>

        <Text style={styles.sectionHeader}>JOURNALING</Text>
        {renderToggleRow(
          <Bell size={18} color={colors.textSecondary} />,
          'Morning Reminder',
          settings.morningReminderEnabled,
          handleMorningReminderToggle,
          settings.morningReminderEnabled ? settings.morningReminderTime : undefined,
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
          isPremium && settings.realityCheckEnabled ? `Every ${settings.realityCheckFrequency}` : undefined,
        )}
        {renderToggleRow(
          <Moon size={18} color={isPremium ? colors.textSecondary : colors.textDisabled} />,
          'WBTB Alarm',
          settings.wbtbEnabled && isPremium,
          (val) => isPremium ? settings.setWbtb(val) : handleUpgrade(),
          isPremium && settings.wbtbEnabled ? settings.wbtbTime : undefined,
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
      </ScrollView>
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
  row: {
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
    marginTop: 2,
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
