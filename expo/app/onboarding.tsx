import { FlowingText } from '@/components/FlowingText';
import { GlassAsset } from '@/components/GlassAsset';
import { AIConsentModal } from '@/components/AIConsentModal';
import PremiumSuccessModal from '@/components/PremiumSuccessModal';
import { FeaturePreviewScreen } from '@/components/onboarding/FeaturePreviewScreen';
import { NotificationScreen } from '@/components/onboarding/NotificationScreen';
import { PainPointScreen } from '@/components/onboarding/PainPointScreen';
import { QuizScreen } from '@/components/onboarding/QuizScreen';
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';
import OnboardingButton from '@/components/OnboardingButton';
import { StaggerChildren } from '@/components/StaggerChildren';
import { glassAssets } from '@/constants/glassAssets';
import { matchOnboardingInterpretation } from '@/constants/onboardingInterpretations';
import { colors, fonts, radii, sizes, spacing, typography } from '@/constants/theme';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { scheduleTrialReminder } from '@/services/notifications';
import { trackEvent, setUserProperty } from '@/services/analytics';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useSettingsStore } from '@/store/settingsStore';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as StoreReview from 'expo-store-review';
import { useRouter } from 'expo-router';
import { Bell, ChevronLeft, Lock, ShieldCheck, Sparkles, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const store = useOnboardingStore();
  const setCurrentStepInStore = useOnboardingStore((s) => s.setCurrentStep);

  const [step, setStep] = useState(store.currentStep || 0);
  const [localName, setLocalName] = useState(store.name);
  const [localFrequency, setLocalFrequency] = useState(store.dreamFrequency);
  const [localDetail, setLocalDetail] = useState(store.dreamDetail);
  const [localGoals, setLocalGoals] = useState<string[]>(store.mainGoals);
  const [localJournalExp, setLocalJournalExp] = useState(store.journalExperience);
  const [localRecurring, setLocalRecurring] = useState(store.recurringDreams);
  const [localDreamText, setLocalDreamText] = useState(store.firstDreamText);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const { monthlyPackage, annualPackage, isLoading: rcLoading, isLoadingOfferings, purchasePackage, restorePurchases, loadOfferings } = useRevenueCat();
  const aiDataConsentGiven = useSettingsStore((s) => s.aiDataConsentGiven);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showPremiumSuccess, setShowPremiumSuccess] = useState(false);

  const matchedInterpretation = React.useMemo(
    () => matchOnboardingInterpretation(localDreamText),
    [localDreamText]
  );

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [processingTexts, setProcessingTexts] = useState<number>(0);
  const ctaFadeAnim = useRef(new Animated.Value(0)).current;
  const interpDividerAnim = useRef(new Animated.Value(0)).current;
  const interpSymbolsAnim = useRef(new Animated.Value(0)).current;
  const interpPremiumAnim = useRef(new Animated.Value(0)).current;
  const interpCtaAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setCurrentStepInStore(step);
    const screenEvents: Record<number, string> = {
      0: 'onboarding_welcome_viewed',
      1: 'onboarding_name_viewed',
      2: 'onboarding_dream_frequency_viewed',
      3: 'onboarding_dream_detail_viewed',
      4: 'onboarding_goals_viewed',
      5: 'onboarding_stat_viewed',
      6: 'onboarding_journal_experience_viewed',
      7: 'onboarding_recurring_dreams_viewed',
      8: 'onboarding_features_viewed',
      9: 'onboarding_notifications_viewed',
      10: 'onboarding_dream_entry_viewed',
      11: 'onboarding_processing_viewed',
      12: 'onboarding_interpretation_viewed',
      13: 'onboarding_paywall_viewed',
    };
    const eventName = screenEvents[step];
    if (eventName) trackEvent(eventName);
  }, [step, setCurrentStepInStore]);

  useEffect(() => {
    if (step === 11) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      ).start();

      Animated.timing(progressAnim, { toValue: 1, duration: 4000, useNativeDriver: false }).start();

      const t1 = setTimeout(() => setProcessingTexts(1), 800);
      const t2 = setTimeout(() => setProcessingTexts(2), 1800);
      const t3 = setTimeout(() => setProcessingTexts(3), 2800);
      const t4 = setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
          setStep(12);
          interpDividerAnim.setValue(0);
          interpSymbolsAnim.setValue(0);
          interpPremiumAnim.setValue(0);
          interpCtaAnim.setValue(0);
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        });
      }, 4200);

      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
  }, [step, pulseAnim, progressAnim, fadeAnim]);

  useEffect(() => {
    if (step >= 8 && !monthlyPackage && !annualPackage) {
      void loadOfferings();
    }
  }, [step, monthlyPackage, annualPackage, loadOfferings]);

  const goToStep = useCallback((nextStep: number) => {
    const isForward = nextStep > step;
    // Phase 1: fade out + slide away
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: isForward ? -20 : 20, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      // Reset CTA fade for next screen
      ctaFadeAnim.setValue(0);
      // Phase 2: slide in from opposite direction + fade in
      slideAnim.setValue(isForward ? 20 : -20);
      Animated.parallel([
        Animated.spring(fadeAnim, { toValue: 1, damping: 22, stiffness: 280, mass: 0.8, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 280, mass: 0.8, useNativeDriver: true }),
      ]).start();
      // Delayed CTA appearance
      Animated.timing(ctaFadeAnim, { toValue: 1, duration: 400, delay: 300, useNativeDriver: true }).start();
    });
  }, [fadeAnim, slideAnim, ctaFadeAnim, step]);

  const goBack = useCallback(() => {
    if (step > 0) {
      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      goToStep(step - 1);
    }
  }, [step, goToStep]);

  const goNext = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (step) {
      case 0: trackEvent('onboarding_welcome_started'); break;
      case 1: trackEvent('onboarding_name_completed', { has_name: localName.trim().length > 0 }); break;
      case 2: trackEvent('onboarding_dream_frequency_completed', { frequency: localFrequency }); break;
      case 3: trackEvent('onboarding_dream_detail_completed', { detail_level: localDetail }); break;
      case 4: trackEvent('onboarding_goals_completed', { goals: localGoals, goal_count: localGoals.length }); break;
      case 5: trackEvent('onboarding_stat_continued'); break;
      case 6: trackEvent('onboarding_journal_experience_completed', { experience: localJournalExp }); break;
      case 7: trackEvent('onboarding_recurring_dreams_completed', { recurring_type: localRecurring }); break;
      case 8: trackEvent('onboarding_features_continued'); break;
      case 10: trackEvent('onboarding_dream_entry_completed', { dream_length: localDreamText.trim().length }); break;
      case 12: trackEvent('onboarding_interpretation_continued'); break;
    }
    goToStep(step + 1);
  }, [step, goToStep, localName, localFrequency, localDetail, localGoals, localJournalExp, localRecurring, localDreamText]);

  const finishOnboarding = useCallback(() => {
    store.setName(localName);
    store.setDreamFrequency(localFrequency);
    store.setDreamDetail(localDetail);
    store.setMainGoals(localGoals);
    store.setJournalExperience(localJournalExp);
    store.setRecurringDreams(localRecurring);
    store.setFirstDreamText(localDreamText);
    store.completeOnboarding();
    setUserProperty({
      dream_frequency: localFrequency,
      dream_detail: localDetail,
      main_goals: localGoals,
      journal_experience: localJournalExp,
      has_recurring_dreams: localRecurring,
      onboarding_completed_at: new Date().toISOString(),
    });
    router.replace('/(tabs)' as any);
  }, [localName, localFrequency, localDetail, localGoals, localJournalExp, localRecurring, localDreamText, store, router]);

  const handlePurchase = useCallback(async () => {
    const plan = selectedPlan;
    trackEvent('paywall_purchase_started', { plan, source: 'onboarding' });
    let pkg = plan === 'monthly' ? monthlyPackage : annualPackage;
    if (!pkg) {
      await loadOfferings();
      return;
    }
    const success = await purchasePackage(pkg);
    if (success) {
      trackEvent('paywall_purchase_completed', { plan, source: 'onboarding', has_trial: true });
      void scheduleTrialReminder();
      setShowPremiumSuccess(true);
    }
  }, [selectedPlan, monthlyPackage, annualPackage, purchasePackage, loadOfferings]);

  const handleRestore = useCallback(async () => {
    trackEvent('paywall_restore_tapped', { source: 'onboarding' });
    const restored = await restorePurchases();
    if (restored) finishOnboarding();
  }, [restorePurchases, finishOnboarding]);

  const toggleGoal = useCallback((goal: string) => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLocalGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }, []);

  const renderBackButton = () => {
    if (step === 0) return <View style={styles.backButtonPlaceholder} />;
    return (
      <TouchableOpacity onPress={goBack} style={styles.backButton} testID="back-button">
        <ChevronLeft size={24} color={colors.textPrimary} />
      </TouchableOpacity>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <WelcomeScreen goNext={goNext} />;
      case 1: return renderNameInput();
      case 2: return (
        <QuizScreen
          key="frequency"
          progress={{ current: 1, total: 5 }}
          heading={t('onboarding.quizFrequency.heading')}
          options={[
            { key: 'every_morning', title: t('onboarding.quizFrequency.everyMorningTitle'), sub: t('onboarding.quizFrequency.everyMorningSub') },
            { key: 'few_times_week', title: t('onboarding.quizFrequency.fewTimesWeekTitle'), sub: t('onboarding.quizFrequency.fewTimesWeekSub') },
            { key: 'once_twice_month', title: t('onboarding.quizFrequency.onceTwiceMonthTitle'), sub: t('onboarding.quizFrequency.onceTwiceMonthSub') },
            { key: 'rarely', title: t('onboarding.quizFrequency.rarelyTitle'), sub: t('onboarding.quizFrequency.rarelySub') },
          ]}
          selected={localFrequency}
          onSelect={setLocalFrequency}
          goNext={goNext}
          ctaFadeAnim={ctaFadeAnim}
        />
      );
      case 3: return (
        <QuizScreen
          key="detail"
          progress={{ current: 2, total: 5 }}
          heading={t('onboarding.quizDetail.heading')}
          options={[
            { key: 'vague', title: t('onboarding.quizDetail.vagueTitle'), sub: t('onboarding.quizDetail.vagueSub') },
            { key: 'fragments', title: t('onboarding.quizDetail.fragmentsTitle'), sub: t('onboarding.quizDetail.fragmentsSub') },
            { key: 'partial', title: t('onboarding.quizDetail.partialTitle'), sub: t('onboarding.quizDetail.partialSub') },
            { key: 'full', title: t('onboarding.quizDetail.fullTitle'), sub: t('onboarding.quizDetail.fullSub') },
          ]}
          selected={localDetail}
          onSelect={setLocalDetail}
          goNext={goNext}
          ctaFadeAnim={ctaFadeAnim}
        />
      );
      case 4: return (
        <QuizScreen
          key="goals"
          progress={{ current: 3, total: 5 }}
          heading={t('onboarding.quizGoals.heading')}
          subtext={t('onboarding.quizGoals.subtext')}
          options={[
            { key: 'meanings', title: t('onboarding.quizGoals.meaningsTitle'), sub: t('onboarding.quizGoals.meaningsSub') },
            { key: 'lucid', title: t('onboarding.quizGoals.lucidTitle'), sub: t('onboarding.quizGoals.lucidSub') },
            { key: 'patterns', title: t('onboarding.quizGoals.patternsTitle'), sub: t('onboarding.quizGoals.patternsSub') },
            { key: 'journaling', title: t('onboarding.quizGoals.journalingTitle'), sub: t('onboarding.quizGoals.journalingSub') },
          ]}
          selected={localGoals}
          onSelect={(key) => toggleGoal(key)}
          multiSelect
          goNext={goNext}
          ctaFadeAnim={ctaFadeAnim}
        />
      );
      case 5: return <PainPointScreen goNext={goNext} />;
      case 6: return (
        <QuizScreen
          key="journalExp"
          progress={{ current: 4, total: 5 }}
          heading={t('onboarding.quizJournalExp.heading')}
          options={[
            { key: 'never', title: t('onboarding.quizJournalExp.neverTitle'), sub: t('onboarding.quizJournalExp.neverSub') },
            { key: 'tried', title: t('onboarding.quizJournalExp.triedTitle'), sub: t('onboarding.quizJournalExp.triedSub') },
            { key: 'paper', title: t('onboarding.quizJournalExp.paperTitle'), sub: t('onboarding.quizJournalExp.paperSub') },
            { key: 'app', title: t('onboarding.quizJournalExp.appTitle'), sub: t('onboarding.quizJournalExp.appSub') },
            { key: 'active', title: t('onboarding.quizJournalExp.activeTitle'), sub: t('onboarding.quizJournalExp.activeSub') },
          ]}
          selected={localJournalExp}
          onSelect={setLocalJournalExp}
          goNext={goNext}
          ctaFadeAnim={ctaFadeAnim}
        />
      );
      case 7: return (
        <QuizScreen
          key="recurring"
          progress={{ current: 5, total: 5 }}
          heading={t('onboarding.quizRecurring.heading')}
          options={[
            { key: 'recurring', title: t('onboarding.quizRecurring.recurringTitle'), sub: t('onboarding.quizRecurring.recurringSub') },
            { key: 'nightmares', title: t('onboarding.quizRecurring.nightmaresTitle'), sub: t('onboarding.quizRecurring.nightmaresSub') },
            { key: 'both', title: t('onboarding.quizRecurring.bothTitle'), sub: t('onboarding.quizRecurring.bothSub') },
            { key: 'neither', title: t('onboarding.quizRecurring.neitherTitle'), sub: t('onboarding.quizRecurring.neitherSub') },
          ]}
          selected={localRecurring}
          onSelect={setLocalRecurring}
          goNext={goNext}
          ctaFadeAnim={ctaFadeAnim}
        />
      );
      case 8: return <FeaturePreviewScreen goNext={goNext} ctaFadeAnim={ctaFadeAnim} />;
      case 9: return <NotificationScreen goNext={goNext} />;
      case 10: return renderFirstDream();
      case 11: return renderProcessing();
      case 12: return renderInterpretation();
      case 13: return renderPaywall();
      default: return null;
    }
  };

  const renderNameInput = () => (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top + 44}>
      <View style={styles.stepContent}>
        <Text style={styles.stepHeading}>{t('onboarding.nameInput.heading')}</Text>
        <Text style={styles.stepSubtext}>{t('onboarding.nameInput.subtext')}</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={localName}
            onChangeText={(v) => setLocalName(v.slice(0, 20))}
            placeholder={t('onboarding.nameInput.placeholder')}
            placeholderTextColor={colors.textMuted}
            autoFocus
            testID="name-input"
          />
          <Text style={styles.charCount}>{localName.length}/20</Text>
        </View>
        <View style={styles.privacyRow}>
          <Lock size={12} color={colors.textMuted} />
          <Text style={styles.privacySmall}>{t('onboarding.nameInput.privacy')}</Text>
        </View>
      </View>
      <View style={styles.bottomCta}>
        <OnboardingButton title={t('common.continue')} onPress={goNext} disabled={localName.trim().length === 0} />
      </View>
    </KeyboardAvoidingView>
  );


  const renderFirstDream = () => (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top + 44}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.stepHeading}>{t('onboarding.firstDream.heading')}</Text>
        <Text style={styles.stepSubtext}>{t('onboarding.firstDream.subtext')}</Text>
        <TextInput
          style={styles.dreamInput}
          value={localDreamText}
          onChangeText={setLocalDreamText}
          placeholder={t('onboarding.firstDream.placeholder')}
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
          autoFocus
          testID="dream-input"
        />
        <View style={styles.privacyRow}>
          <Lock size={12} color={colors.textMuted} />
          <Text style={styles.privacySmall}>{t('onboarding.firstDream.privacy')}</Text>
        </View>
      </ScrollView>
      <View style={styles.bottomCta}>
        <OnboardingButton
          title={localDreamText.length < 20 ? t('onboarding.firstDream.writeAFewWords') : t('onboarding.firstDream.interpretMyDream')}
          variant="accent"
          onPress={() => {
            if (!aiDataConsentGiven) {
              setShowConsentModal(true);
            } else {
              goNext();
            }
          }}
          disabled={localDreamText.length < 20}
        />
        <Text style={styles.freeTrialNote}>{t('onboarding.firstDream.freeNote')}</Text>
      </View>
    </KeyboardAvoidingView>
  );

  const renderProcessing = () => {
    const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

    return (
      <View style={styles.processingContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: spacing.xl }}>
          <GlassAsset source={glassAssets.eye} size={120} />
        </Animated.View>
        <FlowingText
          text={t('onboarding.processing.analyzing')}
          style={styles.processingTitle}
          wordDelay={80}
          initialDelay={100}
          haptic
        />
        <View style={styles.processingSteps}>
          {processingTexts >= 1 ? (
            <FlowingText text={t('onboarding.processing.identifyingSymbols')} style={styles.processingStep} wordDelay={60} initialDelay={0} haptic />
          ) : (
            <Text style={[styles.processingStep, { opacity: 0 }]}>{t('onboarding.processing.identifyingSymbols')}</Text>
          )}
          {processingTexts >= 2 ? (
            <FlowingText text={t('onboarding.processing.mappingEmotions')} style={styles.processingStep} wordDelay={60} initialDelay={0} haptic />
          ) : (
            <Text style={[styles.processingStep, { opacity: 0 }]}>{t('onboarding.processing.mappingEmotions')}</Text>
          )}
          {processingTexts >= 3 ? (
            <FlowingText text={t('onboarding.processing.buildingInterpretation')} style={styles.processingStep} wordDelay={60} initialDelay={0} haptic />
          ) : (
            <Text style={[styles.processingStep, { opacity: 0 }]}>{t('onboarding.processing.buildingInterpretation')}</Text>
          )}
        </View>
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>
      </View>
    );
  };

  const onInterpretationFlowComplete = useCallback(() => {
    const stagger = 200;
    const spring = (anim: Animated.Value, delay: number) =>
      Animated.spring(anim, { toValue: 1, damping: 20, stiffness: 260, mass: 0.9, delay, useNativeDriver: true });

    Animated.stagger(stagger, [
      spring(interpDividerAnim, 0),
      spring(interpSymbolsAnim, 0),
      spring(interpPremiumAnim, 0),
      spring(interpCtaAnim, 0),
    ]).start();

    // Request review after premium upsell is visible but before CTA is tappable
    setTimeout(() => void StoreReview.requestReview(), stagger * 3);
  }, [interpDividerAnim, interpSymbolsAnim, interpPremiumAnim, interpCtaAnim]);

  const interpFadeSlide = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  });

  const renderInterpretation = () => (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.interpretationLabel}>{t('onboarding.interpretation.label')}</Text>
        <FlowingText
          text={matchedInterpretation.interpretation}
          style={styles.interpretationText}
          wordDelay={35}
          haptic
          onComplete={onInterpretationFlowComplete}
        />
        <Animated.View style={interpFadeSlide(interpDividerAnim)}>
          <View style={styles.divider} />
        </Animated.View>
        <Animated.View style={interpFadeSlide(interpSymbolsAnim)}>
          <Text style={styles.symbolsLabel}>{t('onboarding.interpretation.keySymbols')}</Text>
          <StaggerChildren stagger={120} initialDelay={200} style={styles.tagsRow} triggerKey={step}>
            {matchedInterpretation.symbols.map((s) => (
              <View key={s} style={styles.symbolTag}>
                <Text style={styles.symbolTagText}>{s}</Text>
              </View>
            ))}
          </StaggerChildren>
        </Animated.View>
        <Animated.View style={interpFadeSlide(interpPremiumAnim)}>
          <View style={styles.premiumCard}>
            <Lock size={14} color={colors.accent} />
            <Text style={styles.premiumCardText}>
              {t('onboarding.interpretation.premiumUpsell')}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
      <Animated.View style={[styles.bottomCta, interpFadeSlide(interpCtaAnim)]}>
        <OnboardingButton title={t('common.continue')} onPress={goNext} />
      </Animated.View>
    </View>
  );

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

  const renderPaywall = () => (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.paywallHeader}>
          <TouchableOpacity
            onPress={() => { trackEvent('paywall_dismissed', { source: 'onboarding' }); finishOnboarding(); }}
            style={styles.dismissButton}
            testID="paywall-dismiss"
          >
            <X size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <GlassAsset source={glassAssets.diamond} glowIntensity={2} size={120} style={{ alignSelf: 'center', marginBottom: spacing.sm }} />

        <Text style={[styles.stepHeading, { textAlign: 'center' as const, marginBottom: spacing.xs }]}>
          {t('paywall.genericHeading')}
        </Text>
        <Text style={[styles.stepSubtext, { textAlign: 'center' as const, marginBottom: spacing.sm }]}>{t('paywall.genericSubtext')}</Text>

        {/* Timeline with fading accent line */}
        <View style={styles.pwTimeline}>
          {/* Gradient line behind icons */}
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
                <View style={styles.pwTimelineIconWrap}>
                  {item.icon}
                </View>
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
            onPress={() => { setSelectedPlan('monthly'); trackEvent('paywall_plan_selected', { plan: 'monthly', source: 'onboarding' }); }}
            activeOpacity={0.7}
          >
            <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>{t('paywall.popular')}</Text></View>
            <Text style={styles.pricingPrice}>{t('paywall.monthlyPrice')}</Text>
            <Text style={[styles.pricingTrial, selectedPlan === 'monthly' ? { color: colors.accent } : { color: colors.textSecondary }]}>{t('paywall.freeTrial')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pricingCard, selectedPlan === 'yearly' && styles.pricingCardSelected]}
            onPress={() => { setSelectedPlan('yearly'); trackEvent('paywall_plan_selected', { plan: 'yearly', source: 'onboarding' }); }}
            activeOpacity={0.7}
          >
            <Text style={styles.pricingPrice}>{t('paywall.yearlyPrice')}</Text>
            <Text style={styles.pricingTrial}>{t('paywall.freeTrial')}</Text>
            <View style={styles.saveBadge}><Text style={styles.saveBadgeText}>{t('paywall.save67')}</Text></View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomCta}>
        <OnboardingButton title={isLoadingOfferings ? t('common.loading') : rcLoading ? t('common.processing') : t('paywall.startFreeTrial')} variant="accent" onPress={handlePurchase} disabled={rcLoading || isLoadingOfferings} />

        <Text style={styles.paywallSmall}>
          {selectedPlan === 'monthly'
            ? t('paywall.monthlyTerms')
            : t('paywall.yearlyTerms')}
        </Text>

        <View style={styles.pwBottomLinks}>
          <TouchableOpacity onPress={handleRestore} disabled={rcLoading}>
            <Text style={styles.restoreText}>{t('paywall.restorePurchases')}</Text>
          </TouchableOpacity>
          <Text style={styles.pwLinkDot}>·</Text>
          <TouchableOpacity onPress={() => { trackEvent('paywall_dismissed', { source: 'onboarding' }); finishOnboarding(); }}>
            <Text style={styles.continueFreeTxt}>{t('onboarding.continueFree')}</Text>
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

  return (
    <View style={[styles.container, { paddingTop: step === 0 ? 0 : insets.top, paddingBottom: insets.bottom }]}>
      {step !== 0 && step !== 11 && (
        <View style={styles.header}>
          {renderBackButton()}
        </View>
      )}
      <Animated.View style={[styles.flex, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
        {renderStep()}
      </Animated.View>

      <AIConsentModal
        visible={showConsentModal}
        onAllow={() => { setShowConsentModal(false); goNext(); }}
        onDecline={() => setShowConsentModal(false)}
      />

      <PremiumSuccessModal
        visible={showPremiumSuccess}
        onDismiss={() => { setShowPremiumSuccess(false); finishOnboarding(); }}
        source="onboarding"
      />
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
    paddingHorizontal: spacing.screenPadding,
    height: 44,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xl,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.sm,
  },
  stepHeading: {
    fontFamily: fonts.serif,
    fontSize: typography.heading.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    lineHeight: 36,
    marginBottom: spacing.sm,
  },
  stepSubtext: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  optionsContainer: {
    marginTop: spacing.sm,
  },
  bottomCta: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
    paddingTop: spacing.md,
  },
  logoText: {
    fontFamily: fonts.serif,
    fontSize: typography.display.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  welcomeTextBlock: {
    marginBottom: spacing.xxl,
  },
  welcomeHeading: {
    fontFamily: fonts.serif,
    fontSize: typography.heading.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 38,
  },
  privacyText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xxl,
  },
  inputContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    height: sizes.inputHeight,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
  },
  charCount: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  privacySmall: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  painPointBlock: {
    marginBottom: spacing.xl,
  },
  painPointText: {
    fontFamily: fonts.serif,
    fontSize: typography.heading.fontSize,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
  },
  painPointAccent: {
    fontFamily: fonts.serif,
    fontSize: typography.heading.fontSize,
    fontWeight: '700' as const,
    color: colors.accent,
    textAlign: 'center',
    lineHeight: 38,
  },
  painPointSub: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  featureCard: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  featureDesc: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  notifTextBlock: {
    marginBottom: spacing.xxl,
  },
  notifBody: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  skipText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  dreamInput: {
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.md,
    minHeight: 200,
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    fontSize: typography.dreamText.fontSize,
    lineHeight: 28,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  freeTrialNote: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  pulseCircle: {
    width: 60,
    height: 60,
    borderRadius: radii.full,
    backgroundColor: colors.surfacePulse,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  pulseInner: {
    width: 20,
    height: 20,
    borderRadius: radii.full,
    backgroundColor: colors.textPrimary,
  },
  processingTitle: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  processingSteps: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  processingStep: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  progressBarContainer: {
    width: '60%',
    height: 2,
    backgroundColor: colors.surfaceCardBorder,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.textPrimary,
  },
  interpretationLabel: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    fontWeight: '500' as const,
    color: colors.accent,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  interpretationText: {
    fontFamily: fonts.sans,
    fontSize: typography.aiInterpretation.fontSize,
    fontStyle: 'italic',
    color: colors.textSecondary,
    lineHeight: 27,
    marginBottom: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceCardBorder,
    marginVertical: spacing.lg,
  },
  symbolsLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  symbolTag: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  symbolTagText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  premiumCard: {
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  premiumCardText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.accent,
    flex: 1,
    lineHeight: 20,
  },
  statLine: {
    fontFamily: fonts.serif,
    fontSize: typography.subheading.fontSize,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  reviewCard: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.cardPadding,
    marginBottom: spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: spacing.sm,
  },
  reviewText: {
    fontFamily: fonts.serifItalic,
    fontSize: typography.body.fontSize,
    fontStyle: 'italic',
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  reviewName: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
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
  pwTrustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  pwTrustText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  floatingBadge: {
    position: 'absolute',
    top: -14,
    left: -10,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
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
  paywallHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  premiumBadge: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  premiumBadgeText: {
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '600' as const,
    color: colors.accent,
    letterSpacing: 1,
  },
  dismissButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
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
  paywallSmall: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  restoreLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  restoreText: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  continueFreeTxt: {
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
