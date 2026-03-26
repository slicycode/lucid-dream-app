import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { colors, fonts, radii, spacing, typography } from '@/constants/theme';
import { GlassAsset } from '@/components/GlassAsset';
import { glassAssets } from '@/constants/glassAssets';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/settingsStore';
import { trackEvent } from '@/services/analytics';

const PRIVACY_URL = 'https://slicycode.github.io/lucid-dream-app/privacy/';

interface AIConsentModalProps {
  visible: boolean;
  onAllow: () => void;
  onDecline: () => void;
}

export function AIConsentModal({ visible, onAllow, onDecline }: AIConsentModalProps) {
  const { t } = useTranslation();
  const setAiDataConsentGiven = useSettingsStore((s) => s.setAiDataConsentGiven);

  const handleAllow = () => {
    setAiDataConsentGiven(true);
    trackEvent('ai_consent_accepted');
    onAllow();
  };

  const handleDecline = () => {
    trackEvent('ai_consent_declined');
    onDecline();
  };

  React.useEffect(() => {
    if (visible) {
      trackEvent('ai_consent_shown');
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconRow}>
            <GlassAsset source={glassAssets.eye} size={64} />
          </View>

          <Text style={styles.title}>{t('aiConsent.title')}</Text>
          <Text style={styles.body}>{t('aiConsent.body')}</Text>

          <TouchableOpacity
            onPress={() => Linking.openURL(PRIVACY_URL)}
            activeOpacity={0.7}
          >
            <Text style={styles.privacyLink}>{t('aiConsent.privacyLink')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.allowButton} onPress={handleAllow} activeOpacity={0.8}>
            <Text style={styles.allowText}>{t('aiConsent.allow')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.declineButton} onPress={handleDecline} activeOpacity={0.7}>
            <Text style={styles.declineText}>{t('aiConsent.notNow')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 360,
  },
  iconRow: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  privacyLink: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.accent,
    textAlign: 'center',
    marginBottom: spacing.lg,
    textDecorationLine: 'underline',
  },
  allowButton: {
    backgroundColor: colors.ctaAccentBg,
    borderRadius: radii.pill,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  allowText: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.ctaAccentText,
  },
  declineButton: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
});
