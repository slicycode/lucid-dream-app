import { GlassAsset } from '@/components/GlassAsset';
import OnboardingButton from '@/components/OnboardingButton';
import { glassAssets } from '@/constants/glassAssets';
import { colors, fonts, radii, spacing, typography } from '@/constants/theme';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { scheduleTrialReminder } from '@/services/notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { trackEvent } from '@/services/analytics';
import { Bell, ShieldCheck, Sparkles, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function PaywallScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const paywallViewTracked = React.useRef(false);
  const { monthlyPackage, annualPackage, isLoading: rcLoading, purchasePackage, restorePurchases } = useRevenueCat();
  const { dreamTitle, source } = useLocalSearchParams<{ dreamTitle?: string; source?: string }>();
  const contextualDreamTitle = dreamTitle ? decodeURIComponent(dreamTitle) : null;
  const paywallSource = source || 'settings';

  React.useEffect(() => {
    if (!paywallViewTracked.current) {
      trackEvent('paywall_viewed', { source: paywallSource });
      paywallViewTracked.current = true;
    }
  }, [paywallSource]);

  const dismiss = () => { trackEvent('paywall_dismissed', { source: paywallSource }); router.back(); };

  const handlePurchase = async () => {
    const plan = selectedPlan;
    trackEvent('paywall_purchase_started', { plan, source: paywallSource });
    const pkg = plan === 'monthly' ? monthlyPackage : annualPackage;
    if (!pkg) {
      dismiss();
      return;
    }
    const success = await purchasePackage(pkg);
    if (success) {
      trackEvent('paywall_purchase_completed', { plan, source: paywallSource, has_trial: true });
      void scheduleTrialReminder();
      router.back();
    }
  };

  const handleRestore = async () => {
    trackEvent('paywall_restore_tapped', { source: paywallSource });
    const restored = await restorePurchases();
    if (restored) router.back();
  };

  const trialTimelineSteps = [
    {
      icon: <Sparkles size={15} color={colors.accent} />,
      label: t('paywall.timelineToday'),
      desc: t('paywall.timelineTodayDesc'),
    },
    {
      icon: <Bell size={15} color={colors.accent} />,
      label: t('paywall.timelineDay5'),
      desc: t('paywall.timelineDay5Desc'),
    },
    {
      icon: <ShieldCheck size={15} color={colors.accent} />,
      label: t('paywall.timelineDay7'),
      desc: t('paywall.timelineDay7Desc'),
    },
  ];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.paywallHeader}>
          <TouchableOpacity onPress={dismiss} style={styles.dismissButton}>
            <X size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <GlassAsset source={glassAssets.diamond} glowIntensity={2} size={120} style={{ alignSelf: 'center', marginBottom: spacing.sm }} />

        {contextualDreamTitle ? (
          <>
            <Text style={styles.heading}>{t('paywall.contextualHeading', { title: contextualDreamTitle })}</Text>
            <Text style={styles.subtext}>{t('paywall.contextualSubtext')}</Text>
          </>
        ) : (
          <>
            <Text style={styles.heading}>{t('paywall.genericHeading')}</Text>
            <Text style={styles.subtext}>{t('paywall.genericSubtext')}</Text>
          </>
        )}

        {/* Timeline */}
        <View style={styles.pwTimeline}>
          <View style={styles.pwTimelineLineTrack}>
            <LinearGradient
              colors={[colors.accent, 'rgba(201, 168, 76, 0.25)', 'transparent']}
              locations={[0, 0.75, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>
          {trialTimelineSteps.map((item, i) => (
            <View key={i} style={styles.pwTimelineItem}>
              <View style={styles.pwTimelineDotCol}>
                <View style={styles.pwTimelineIconWrap}>{item.icon}</View>
              </View>
              <View style={styles.pwTimelineContent}>
                <Text style={styles.pwTimelineLabel}>{item.label}</Text>
                <Text style={styles.pwTimelineDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing cards */}
        <View style={styles.pricingCards}>
          <TouchableOpacity
            style={[styles.pricingCard, selectedPlan === 'monthly' && styles.pricingCardSelected]}
            onPress={() => { setSelectedPlan('monthly'); trackEvent('paywall_plan_selected', { plan: 'monthly', source: paywallSource }); }}
            activeOpacity={0.7}
          >
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>{t('paywall.popular')}</Text>
            </View>
            <Text style={styles.pricingPrice}>{t('paywall.monthlyPrice')}</Text>
            <Text style={[styles.pricingTrial, selectedPlan === 'monthly' ? { color: colors.accent } : { color: colors.textSecondary }]}>
              {t('paywall.freeTrial')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pricingCard, selectedPlan === 'yearly' && styles.pricingCardSelected]}
            onPress={() => { setSelectedPlan('yearly'); trackEvent('paywall_plan_selected', { plan: 'yearly', source: paywallSource }); }}
            activeOpacity={0.7}
          >
            <Text style={styles.pricingPrice}>{t('paywall.yearlyPrice')}</Text>
            <Text style={styles.pricingTrial}>{t('paywall.freeTrial')}</Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>{t('paywall.save67')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomCta}>
        <OnboardingButton
          title={rcLoading ? t('paywall.processing') : t('paywall.startFreeTrial')}
          variant="accent"
          onPress={handlePurchase}
          disabled={rcLoading}
        />

        <Text style={styles.paywallSmall}>
          {selectedPlan === 'monthly' ? t('paywall.monthlyTerms') : t('paywall.yearlyTerms')}
        </Text>

        <View style={styles.pwBottomLinks}>
          <TouchableOpacity onPress={handleRestore} disabled={rcLoading}>
            <Text style={styles.linkText}>{t('paywall.restorePurchases')}</Text>
          </TouchableOpacity>
          <Text style={styles.pwLinkDot}>·</Text>
          <TouchableOpacity onPress={dismiss}>
            <Text style={styles.linkText}>{t('paywall.maybeLater')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.pwBottomLinks}>
          <TouchableOpacity onPress={() => Linking.openURL('https://slicycode.github.io/lucid-dream-app/terms/')}>
            <Text style={styles.legalLinkText}>{t('paywall.termsOfUse')}</Text>
          </TouchableOpacity>
          <Text style={styles.pwLinkDot}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://slicycode.github.io/lucid-dream-app/privacy/')}>
            <Text style={styles.legalLinkText}>{t('paywall.privacyPolicy')}</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.sm,
  },
  paywallHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  dismissButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: typography.heading.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    lineHeight: 36,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  pwTimeline: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    paddingLeft: spacing.xs,
  },
  pwTimelineLineTrack: {
    position: 'absolute',
    left: spacing.xs + 10,
    top: 20,
    bottom: 10,
    width: 10,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  pwTimelineItem: {
    flexDirection: 'row',
    minHeight: 64,
  },
  pwTimelineDotCol: {
    alignItems: 'center',
    width: 30,
    marginRight: spacing.sm,
    zIndex: 1,
  },
  pwTimelineIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pwTimelineContent: {
    flex: 1,
    paddingBottom: spacing.md,
    paddingTop: 2,
  },
  pwTimelineLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  pwTimelineDesc: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  pricingCards: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  pricingCard: {
    flex: 1,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  pricingCardSelected: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accentBorder,
  },
  popularBadge: {
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: spacing.sm,
  },
  popularBadgeText: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '700' as const,
    color: colors.ctaAccentText,
  },
  pricingPrice: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  pricingTrial: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  saveBadge: {
    marginTop: spacing.sm,
  },
  saveBadgeText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  bottomCta: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
    paddingTop: spacing.md,
  },
  paywallSmall: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  pwBottomLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  pwLinkDot: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  linkText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  legalLinkText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textDisabled,
  },
});
