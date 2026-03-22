import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Lock, Sparkles, Repeat, Moon, Calendar, Star, X } from 'lucide-react-native';
import { useOnboardingStore } from '@/store/onboardingStore';
import { colors, fonts, typography, spacing, radii, sizes } from '@/constants/theme';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import OnboardingButton from '@/components/OnboardingButton';
import QuizOptionCard from '@/components/QuizOptionCard';
import ProgressBar from '@/components/ProgressBar';

const HARDCODED_INTERPRETATION = `The unfamiliar house that felt familiar often represents aspects of yourself you haven't fully explored yet — rooms you haven't entered, potential you sense but haven't accessed.

Water rising gradually is one of the most common dream symbols. It typically reflects emotions building up slowly — things you've been setting aside that are starting to demand attention.

The combination suggests you may be on the edge of an emotional or personal transition. Your subconscious is inviting you to explore these rising feelings rather than wait for them to overflow.`;

const INTERPRETATION_SYMBOLS = ['Unfamiliar house', 'Rising water', 'Familiarity'];

export default function OnboardingScreen() {
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
  const { monthlyPackage, annualPackage, isLoading: rcLoading, purchasePackage, restorePurchases } = useRevenueCat();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [processingTexts, setProcessingTexts] = useState<number>(0);

  useEffect(() => {
    setCurrentStepInStore(step);
  }, [step, setCurrentStepInStore]);

  useEffect(() => {
    if (step === 11) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 1200, useNativeDriver: true }),
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
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        });
      }, 4200);

      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
  }, [step, pulseAnim, progressAnim, fadeAnim]);

  const goToStep = useCallback((nextStep: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  const goBack = useCallback(() => {
    if (step > 0) {
      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      goToStep(step - 1);
    }
  }, [step, goToStep]);

  const goNext = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goToStep(step + 1);
  }, [step, goToStep]);

  const finishOnboarding = useCallback(() => {
    store.setName(localName);
    store.setDreamFrequency(localFrequency);
    store.setDreamDetail(localDetail);
    store.setMainGoals(localGoals);
    store.setJournalExperience(localJournalExp);
    store.setRecurringDreams(localRecurring);
    store.setFirstDreamText(localDreamText);
    store.completeOnboarding();
    router.replace('/(tabs)' as any);
  }, [localName, localFrequency, localDetail, localGoals, localJournalExp, localRecurring, localDreamText, store, router]);

  const handlePurchase = useCallback(async () => {
    const pkg = selectedPlan === 'monthly' ? monthlyPackage : annualPackage;
    if (!pkg) {
      finishOnboarding();
      return;
    }
    const success = await purchasePackage(pkg);
    if (success) finishOnboarding();
  }, [selectedPlan, monthlyPackage, annualPackage, purchasePackage, finishOnboarding]);

  const handleDiscountPurchase = useCallback(async () => {
    if (!annualPackage) {
      finishOnboarding();
      return;
    }
    const success = await purchasePackage(annualPackage);
    if (success) finishOnboarding();
  }, [annualPackage, purchasePackage, finishOnboarding]);

  const handleRestore = useCallback(async () => {
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
      case 0: return renderWelcome();
      case 1: return renderNameInput();
      case 2: return renderDreamFrequency();
      case 3: return renderDreamDetail();
      case 4: return renderMainGoals();
      case 5: return renderPainPoint();
      case 6: return renderJournalExperience();
      case 7: return renderRecurringDreams();
      case 8: return renderFeaturePreview();
      case 9: return renderNotificationPermission();
      case 10: return renderFirstDream();
      case 11: return renderProcessing();
      case 12: return renderInterpretation();
      case 13: return renderSocialProof();
      case 14: return renderTrialReassurance();
      case 15: return renderPaywall();
      case 16: return renderDiscountedPaywall();
      default: return null;
    }
  };

  const renderWelcome = () => (
    <View style={styles.centeredContent}>
      <Text style={styles.logoText}>Lucid</Text>
      <View style={styles.welcomeTextBlock}>
        <Text style={styles.welcomeHeading}>Your dreams have meaning.</Text>
        <Text style={[styles.welcomeHeading, { color: colors.accent }]}>Let's decode them.</Text>
      </View>
      <Text style={styles.privacyText}>Private. No account needed. Your dreams stay on your device.</Text>
      <View style={styles.bottomCta}>
        <OnboardingButton title="Get Started" onPress={goNext} />
      </View>
    </View>
  );

  const renderNameInput = () => (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.stepContent}>
        <Text style={styles.stepHeading}>What should we call you?</Text>
        <Text style={styles.stepSubtext}>We'll use this to personalize your experience.</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={localName}
            onChangeText={(t) => setLocalName(t.slice(0, 20))}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            autoFocus
            testID="name-input"
          />
          <Text style={styles.charCount}>{localName.length}/20</Text>
        </View>
        <View style={styles.privacyRow}>
          <Lock size={12} color={colors.textMuted} />
          <Text style={styles.privacySmall}>Your name stays on this device</Text>
        </View>
      </View>
      <View style={styles.bottomCta}>
        <OnboardingButton title="Continue" onPress={goNext} disabled={localName.trim().length === 0} />
      </View>
    </KeyboardAvoidingView>
  );

  const renderDreamFrequency = () => (
    <View style={styles.flex}>
      <ProgressBar current={1} total={5} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepHeading}>How often do you remember your dreams?</Text>
        <View style={styles.optionsContainer}>
          {[
            { key: 'every_morning', title: 'Every morning', sub: 'I usually wake up with a dream fresh in my mind' },
            { key: 'few_times_week', title: 'A few times a week', sub: "Some mornings I remember, some I don't" },
            { key: 'once_twice_month', title: 'Once or twice a month', sub: 'Dreams come and go' },
            { key: 'rarely', title: 'Rarely', sub: 'I almost never remember what I dreamed' },
          ].map((opt) => (
            <QuizOptionCard
              key={opt.key}
              title={opt.title}
              subtitle={opt.sub}
              selected={localFrequency === opt.key}
              onPress={() => setLocalFrequency(opt.key)}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.bottomCta}>
        <OnboardingButton title="Continue" onPress={goNext} disabled={!localFrequency} />
      </View>
    </View>
  );

  const renderDreamDetail = () => (
    <View style={styles.flex}>
      <ProgressBar current={2} total={5} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepHeading}>When you remember a dream, how detailed is it?</Text>
        <View style={styles.optionsContainer}>
          {[
            { key: 'vague', title: 'Vague feelings', sub: 'More of a mood than a memory' },
            { key: 'fragments', title: 'Fragments', sub: 'Flashes of scenes, faces, places' },
            { key: 'partial', title: 'Partial stories', sub: 'I remember a rough sequence of events' },
            { key: 'full', title: 'Full narratives', sub: 'I could describe them in detail' },
          ].map((opt) => (
            <QuizOptionCard
              key={opt.key}
              title={opt.title}
              subtitle={opt.sub}
              selected={localDetail === opt.key}
              onPress={() => setLocalDetail(opt.key)}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.bottomCta}>
        <OnboardingButton title="Continue" onPress={goNext} disabled={!localDetail} />
      </View>
    </View>
  );

  const renderMainGoals = () => (
    <View style={styles.flex}>
      <ProgressBar current={3} total={5} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepHeading}>What interests you most?</Text>
        <Text style={styles.stepSubtext}>Select all that apply</Text>
        <View style={styles.optionsContainer}>
          {[
            { key: 'meanings', title: 'Understanding dream meanings', sub: 'Decode the symbols and messages in your dreams' },
            { key: 'lucid', title: 'Lucid dreaming', sub: 'Learn to become aware and take control inside your dreams' },
            { key: 'patterns', title: 'Tracking patterns', sub: 'See recurring themes, emotions, and symbols over time' },
            { key: 'journaling', title: 'Just journaling', sub: 'A private space to record my dreams before they fade' },
          ].map((opt) => (
            <QuizOptionCard
              key={opt.key}
              title={opt.title}
              subtitle={opt.sub}
              selected={localGoals.includes(opt.key)}
              onPress={() => toggleGoal(opt.key)}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.bottomCta}>
        <OnboardingButton title="Continue" onPress={goNext} disabled={localGoals.length === 0} />
      </View>
    </View>
  );

  const renderPainPoint = () => (
    <View style={styles.centeredContent}>
      <View style={styles.painPointBlock}>
        <Text style={styles.painPointText}>Most dreams are forgotten</Text>
        <Text style={styles.painPointAccent}>within 5 minutes</Text>
        <Text style={styles.painPointText}>of waking up.</Text>
      </View>
      <Text style={styles.painPointSub}>People who journal their dreams recall 3x more within two weeks.</Text>
      <View style={styles.bottomCta}>
        <OnboardingButton title="Continue" onPress={goNext} />
      </View>
    </View>
  );

  const renderJournalExperience = () => (
    <View style={styles.flex}>
      <ProgressBar current={4} total={5} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepHeading}>Have you kept a dream journal before?</Text>
        <View style={styles.optionsContainer}>
          {[
            { key: 'never', title: 'Never', sub: 'This is my first time' },
            { key: 'tried', title: "Tried but didn't stick", sub: 'Started once or twice but fell off' },
            { key: 'paper', title: 'Paper journal', sub: "I've used a physical notebook" },
            { key: 'app', title: 'Another app', sub: "I've tried a different dream journal app" },
            { key: 'active', title: 'Active journaler', sub: 'I currently log my dreams regularly' },
          ].map((opt) => (
            <QuizOptionCard
              key={opt.key}
              title={opt.title}
              subtitle={opt.sub}
              selected={localJournalExp === opt.key}
              onPress={() => setLocalJournalExp(opt.key)}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.bottomCta}>
        <OnboardingButton title="Continue" onPress={goNext} disabled={!localJournalExp} />
      </View>
    </View>
  );

  const renderRecurringDreams = () => (
    <View style={styles.flex}>
      <ProgressBar current={5} total={5} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepHeading}>Do you experience recurring dreams or nightmares?</Text>
        <View style={styles.optionsContainer}>
          {[
            { key: 'recurring', title: 'Recurring dreams', sub: 'The same dream keeps coming back' },
            { key: 'nightmares', title: 'Nightmares', sub: 'I have disturbing dreams that wake me up' },
            { key: 'both', title: 'Both', sub: 'Recurring themes and nightmares' },
            { key: 'neither', title: 'Neither', sub: 'My dreams are mostly unique each time' },
          ].map((opt) => (
            <QuizOptionCard
              key={opt.key}
              title={opt.title}
              subtitle={opt.sub}
              selected={localRecurring === opt.key}
              onPress={() => setLocalRecurring(opt.key)}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.bottomCta}>
        <OnboardingButton title="Continue" onPress={goNext} disabled={!localRecurring} />
      </View>
    </View>
  );

  const renderFeaturePreview = () => {
    const features = [
      { icon: <Sparkles size={22} color={colors.accent} />, title: 'AI Dream Interpretation', desc: 'Understand what your dreams mean with personalized AI analysis' },
      { icon: <Repeat size={22} color={colors.accent} />, title: 'Pattern Detection', desc: 'Discover recurring symbols, emotions, and themes across your dreams' },
      { icon: <Moon size={22} color={colors.accent} />, title: 'Lucid Dreaming Tools', desc: 'Reality checks, WBTB timers, and techniques to dream consciously' },
      { icon: <Calendar size={22} color={colors.accent} />, title: 'Dream Calendar', desc: 'See your complete dream history at a glance, color-coded by mood' },
    ];

    return (
      <View style={styles.flex}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.stepHeading}>Here's what Lucid can do for you</Text>
          <Text style={styles.stepSubtext}>Personalized to your dream profile</Text>
          <View style={styles.optionsContainer}>
            {features.map((f, i) => (
              <View key={i} style={styles.featureCard}>
                <View style={styles.featureIcon}>{f.icon}</View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={styles.bottomCta}>
          <OnboardingButton title="Continue" onPress={goNext} />
        </View>
      </View>
    );
  };

  const renderNotificationPermission = () => (
    <View style={styles.centeredContent}>
      <Text style={styles.stepHeading}>Never lose a dream again</Text>
      <View style={styles.notifTextBlock}>
        <Text style={styles.notifBody}>Journaling within 5 minutes of waking triples dream recall.</Text>
        <Text style={[styles.notifBody, { marginTop: spacing.md }]}>
          We'll send a gentle morning reminder to help you capture your dreams before they fade.
        </Text>
      </View>
      <View style={styles.bottomCta}>
        <OnboardingButton title="Enable Reminders" onPress={goNext} />
        <TouchableOpacity onPress={goNext} style={styles.skipLink} testID="skip-button">
          <Text style={styles.skipText}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFirstDream = () => (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.stepHeading}>Let's try it right now.</Text>
        <Text style={styles.stepSubtext}>What did you dream about last night?</Text>
        <TextInput
          style={styles.dreamInput}
          value={localDreamText}
          onChangeText={setLocalDreamText}
          placeholder="I was in a house I didn't recognize, but it felt familiar. There was water rising slowly from the floor..."
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
          testID="dream-input"
        />
        <View style={styles.privacyRow}>
          <Lock size={12} color={colors.textMuted} />
          <Text style={styles.privacySmall}>Your dreams are private and never leave your device</Text>
        </View>
      </ScrollView>
      <View style={styles.bottomCta}>
        <OnboardingButton
          title="Interpret My Dream"
          variant="accent"
          onPress={goNext}
          disabled={localDreamText.length < 20}
        />
        <Text style={styles.freeTrialNote}>Your first interpretation is free</Text>
      </View>
    </KeyboardAvoidingView>
  );

  const renderProcessing = () => {
    const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

    return (
      <View style={styles.processingContainer}>
        <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.pulseInner} />
        </Animated.View>
        <Text style={styles.processingTitle}>Analyzing your dream...</Text>
        <View style={styles.processingSteps}>
          {processingTexts >= 1 && <Text style={styles.processingStep}>Identifying symbols and themes...</Text>}
          {processingTexts >= 2 && <Text style={styles.processingStep}>Mapping emotional patterns...</Text>}
          {processingTexts >= 3 && <Text style={styles.processingStep}>Building your interpretation...</Text>}
        </View>
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>
      </View>
    );
  };

  const renderInterpretation = () => (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.interpretationLabel}>YOUR DREAM INTERPRETATION</Text>
        <Text style={styles.interpretationText}>{HARDCODED_INTERPRETATION}</Text>
        <View style={styles.divider} />
        <Text style={styles.symbolsLabel}>Key symbols</Text>
        <View style={styles.tagsRow}>
          {INTERPRETATION_SYMBOLS.map((s) => (
            <View key={s} style={styles.symbolTag}>
              <Text style={styles.symbolTagText}>{s}</Text>
            </View>
          ))}
        </View>
        <View style={styles.premiumCard}>
          <Lock size={14} color={colors.accent} />
          <Text style={styles.premiumCardText}>
            Your first interpretation is free. Unlock unlimited interpretations with Premium.
          </Text>
        </View>
      </ScrollView>
      <View style={styles.bottomCta}>
        <OnboardingButton title="Continue" onPress={goNext} />
      </View>
    </View>
  );

  const renderSocialProof = () => {
    const reviews = [
      { stars: 5, text: "I've been journaling dreams for years but never understood them. The AI interpretations gave me actual insight into recurring patterns I'd missed.", name: 'Sarah K.' },
      { stars: 5, text: 'The morning reminder changed everything. I went from remembering dreams once a month to logging them almost daily.', name: 'Marcus T.' },
      { stars: 5, text: 'Clean, private, no ads. Exactly what a dream journal should be. The interpretation quality blew me away.', name: 'Lina R.' },
    ];

    return (
      <View style={styles.flex}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.stepHeading}>Join thousands of dreamers</Text>
          <Text style={[styles.statLine, { color: colors.accent }]}>50,000+ dreams interpreted</Text>
          <View style={styles.optionsContainer}>
            {reviews.map((r, i) => (
              <View key={i} style={styles.reviewCard}>
                <View style={styles.starsRow}>
                  {Array.from({ length: r.stars }, (_, j) => (
                    <Star key={j} size={14} color={colors.accent} fill={colors.accent} />
                  ))}
                </View>
                <Text style={styles.reviewText}>"{r.text}"</Text>
                <Text style={styles.reviewName}>— {r.name}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={styles.bottomCta}>
          <OnboardingButton title="Continue" onPress={goNext} />
        </View>
      </View>
    );
  };

  const renderTrialReassurance = () => (
    <View style={styles.centeredContent}>
      <Text style={styles.stepHeading}>No surprises. No pressure.</Text>
      <View style={styles.timeline}>
        {[
          { label: 'Today', desc: 'Full access to everything', filled: true },
          { label: 'Before trial ends', desc: "We'll send you a reminder", filled: false },
          { label: 'Your choice', desc: 'Cancel anytime in Settings. No questions asked.', filled: false },
        ].map((item, i) => (
          <View key={i} style={styles.timelineItem}>
            <View style={styles.timelineDotColumn}>
              <View style={[styles.timelineDot, item.filled && styles.timelineDotFilled]} />
              {i < 2 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>{item.label}</Text>
              <Text style={styles.timelineDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.bottomCta}>
        <OnboardingButton title="Continue" onPress={goNext} />
      </View>
    </View>
  );

  const renderPaywall = () => (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.paywallHeader}>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>PREMIUM</Text>
          </View>
          <TouchableOpacity
            onPress={() => goToStep(16)}
            style={styles.dismissButton}
            testID="paywall-dismiss"
          >
            <X size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.stepHeading, { textAlign: 'center' as const }]}>Unlock the full power of your dreams.</Text>
        <Text style={[styles.stepSubtext, { textAlign: 'center' as const }]}>Start your free trial today.</Text>

        <View style={styles.trialTimeline}>
          {[
            { day: 'Today', desc: 'Unlock everything: unlimited AI interpretations, pattern detection, lucid dreaming tools, and more.' },
            { day: 'Day 5', desc: "We'll remind you before your trial ends." },
            { day: 'Day 7', desc: 'Your subscription begins. Cancel before then and pay nothing.' },
          ].map((item, i) => (
            <View key={i} style={styles.trialTimelineItem}>
              <Text style={styles.trialDay}>{item.day}</Text>
              <Text style={styles.trialDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>

        <View style={styles.pricingCards}>
          <TouchableOpacity
            style={[styles.pricingCard, selectedPlan === 'monthly' && styles.pricingCardSelected]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.7}
          >
            {selectedPlan === 'monthly' && <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>POPULAR</Text></View>}
            <Text style={styles.pricingPrice}>$9.99 / month</Text>
            <Text style={[styles.pricingTrial, selectedPlan === 'monthly' ? { color: colors.accent } : { color: colors.textSecondary }]}>7-day free trial</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pricingCard, selectedPlan === 'yearly' && styles.pricingCardSelected]}
            onPress={() => setSelectedPlan('yearly')}
            activeOpacity={0.7}
          >
            <Text style={styles.pricingPrice}>$39.99 / year</Text>
            <Text style={styles.pricingTrial}>7-day free trial</Text>
            <View style={styles.saveBadge}><Text style={styles.saveBadgeText}>Save 67%</Text></View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <View style={styles.bottomCta}>
        <OnboardingButton title={rcLoading ? 'Processing...' : 'Start Free Trial'} variant="accent" onPress={handlePurchase} disabled={rcLoading} />
        <Text style={styles.paywallSmall}>
          {selectedPlan === 'monthly' ? 'Then $9.99/month. Cancel anytime.' : 'Then $39.99/year. Cancel anytime.'}
        </Text>
        <TouchableOpacity onPress={handleRestore} style={styles.restoreLink} disabled={rcLoading}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => goToStep(16)} style={styles.skipLink}>
          <Text style={styles.continueFreeTxt}>Continue with free version</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDiscountedPaywall = () => (
    <View style={styles.centeredContent}>
      <View style={styles.discountSheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>SPECIAL OFFER</Text>
        </View>
        <Text style={styles.discountHeading}>Still thinking?</Text>
        <Text style={styles.discountSub}>Here's something to make the decision easier.</Text>
        <View style={styles.discountPriceCard}>
          <Text style={styles.crossedPrice}>$39.99/year</Text>
          <Text style={styles.discountPrice}>$29.99 / year</Text>
          <Text style={styles.discountTrial}>First week free</Text>
        </View>
        <OnboardingButton title={rcLoading ? 'Processing...' : 'Claim This Offer'} variant="accent" onPress={handleDiscountPurchase} disabled={rcLoading} />
        <TouchableOpacity onPress={finishOnboarding} style={[styles.skipLink, { marginTop: spacing.md }]}>
          <Text style={styles.continueFreeTxt}>No thanks</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {step !== 0 && step !== 11 && (
        <View style={styles.header}>
          {renderBackButton()}
        </View>
      )}
      <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
        {renderStep()}
      </Animated.View>
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
    paddingBottom: spacing.lg,
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
    fontFamily: fonts.serif,
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
    fontFamily: fonts.sans,
    fontSize: typography.tiny.fontSize,
    fontWeight: '500' as const,
    color: colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  interpretationText: {
    fontFamily: fonts.serifItalic,
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
  timeline: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
    paddingLeft: spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timelineDotColumn: {
    alignItems: 'center',
    width: 20,
    marginRight: spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.textMuted,
    backgroundColor: 'transparent',
  },
  timelineDotFilled: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: colors.surfaceCardBorder,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  timelineLabel: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  timelineDesc: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  paywallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
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
  trialTimeline: {
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  trialTimelineItem: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  trialDay: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  trialDesc: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  pricingCards: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pricingCard: {
    flex: 1,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.surfaceCardBorder,
    borderRadius: radii.md,
    padding: spacing.md,
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
  discountSheet: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    padding: spacing.screenPadding,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textDisabled,
    marginBottom: spacing.lg,
  },
  discountHeading: {
    fontFamily: fonts.serif,
    fontSize: typography.heading.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  discountSub: {
    fontFamily: fonts.sans,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  discountPriceCard: {
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: radii.md,
    padding: spacing.cardPadding,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
  },
  crossedPrice: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    marginBottom: spacing.xs,
  },
  discountPrice: {
    fontFamily: fonts.sans,
    fontSize: typography.heading.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  discountTrial: {
    fontFamily: fonts.sans,
    fontSize: typography.caption.fontSize,
    color: colors.accent,
  },
});
