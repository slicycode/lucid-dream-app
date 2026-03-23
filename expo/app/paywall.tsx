import { GlassAsset } from '@/components/GlassAsset';
import OnboardingButton from '@/components/OnboardingButton';
import { glassAssets } from '@/constants/glassAssets';
import { colors, fonts, radii, spacing, typography } from '@/constants/theme';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, ShieldCheck, Sparkles, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const { monthlyPackage, annualPackage, isLoading: rcLoading, purchasePackage, restorePurchases } = useRevenueCat();

  const dismiss = () => router.back();

  const handlePurchase = async () => {
    const pkg = selectedPlan === 'monthly' ? monthlyPackage : annualPackage;
    if (!pkg) {
      dismiss();
      return;
    }
    const success = await purchasePackage(pkg);
    if (success) dismiss();
  };

  const handleRestore = async () => {
    const restored = await restorePurchases();
    if (restored) dismiss();
  };

  const trialTimelineSteps = [
    {
      icon: <Sparkles size={15} color={colors.accent} />,
      label: 'Today',
      desc: 'Unlock everything — unlimited interpretations, patterns, lucid dreaming tools & more.',
    },
    {
      icon: <Bell size={15} color={colors.accent} />,
      label: 'Day 5',
      desc: "We'll remind you before your trial ends.",
    },
    {
      icon: <ShieldCheck size={15} color={colors.accent} />,
      label: 'Day 7',
      desc: 'Subscription begins — cancel anytime in a few taps.',
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.paywallHeader}>
          <TouchableOpacity onPress={dismiss} style={styles.dismissButton}>
            <X size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <GlassAsset source={glassAssets.key} glowIntensity={2} size={120} style={{ alignSelf: 'center', marginBottom: spacing.sm }} />

        <Text style={styles.heading}>
          How does your free{'\n'}trial work?
        </Text>
        <Text style={styles.subtext}>No surprises. No pressure.</Text>

        {/* Timeline */}
        <View style={styles.pwTimeline}>
          <View style={styles.pwTimelineLineTrack}>
            <LinearGradient
              colors={[colors.accent, 'rgba(201, 168, 76, 0.25)', 'transparent']}
              locations={[0, 0.55, 1]}
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
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.7}
          >
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>POPULAR</Text>
            </View>
            <Text style={styles.pricingPrice}>$9.99 / mo</Text>
            <Text style={[styles.pricingTrial, selectedPlan === 'monthly' ? { color: colors.accent } : { color: colors.textSecondary }]}>
              7-day free trial
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pricingCard, selectedPlan === 'yearly' && styles.pricingCardSelected]}
            onPress={() => setSelectedPlan('yearly')}
            activeOpacity={0.7}
          >
            <Text style={styles.pricingPrice}>$39.99 / yr</Text>
            <Text style={styles.pricingTrial}>7-day free trial</Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>Save 67%</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomCta}>
        <OnboardingButton
          title={rcLoading ? 'Processing...' : 'Start Free Trial'}
          variant="accent"
          onPress={handlePurchase}
          disabled={rcLoading}
        />

        <Text style={styles.paywallSmall}>
          {selectedPlan === 'monthly'
            ? '7 days free, then $9.99/month. Cancel anytime.'
            : '7 days free, then $39.99/year ($3.33/mo). Cancel anytime.'}
        </Text>

        <View style={styles.pwBottomLinks}>
          <TouchableOpacity onPress={handleRestore} disabled={rcLoading}>
            <Text style={styles.linkText}>Restore Purchases</Text>
          </TouchableOpacity>
          <Text style={styles.pwLinkDot}>·</Text>
          <TouchableOpacity onPress={dismiss}>
            <Text style={styles.linkText}>Maybe Later</Text>
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
    left: spacing.xs + 13,
    top: 30,
    bottom: 10,
    width: 3,
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
});
