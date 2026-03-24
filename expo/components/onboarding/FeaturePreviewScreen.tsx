import React from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
import { Sparkles, Repeat, Moon, Calendar } from 'lucide-react-native';
import OnboardingButton from '@/components/OnboardingButton';
import { StaggerChildren } from '@/components/StaggerChildren';
import { colors } from '@/constants/theme';
import { styles } from './styles';
import { useTranslation } from 'react-i18next';

interface FeaturePreviewScreenProps {
  goNext: () => void;
  ctaFadeAnim: Animated.Value;
}

export function FeaturePreviewScreen({ goNext, ctaFadeAnim }: FeaturePreviewScreenProps) {
  const { t } = useTranslation();

  const features = [
    { icon: <Sparkles size={22} color={colors.accent} />, title: t('onboarding.features.aiInterpretationTitle'), desc: t('onboarding.features.aiInterpretationDesc') },
    { icon: <Repeat size={22} color={colors.accent} />, title: t('onboarding.features.patternDetectionTitle'), desc: t('onboarding.features.patternDetectionDesc') },
    { icon: <Moon size={22} color={colors.accent} />, title: t('onboarding.features.lucidToolsTitle'), desc: t('onboarding.features.lucidToolsDesc') },
    { icon: <Calendar size={22} color={colors.accent} />, title: t('onboarding.features.calendarTitle'), desc: t('onboarding.features.calendarDesc') },
  ];

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepHeading}>{t('onboarding.features.heading')}</Text>
        <Text style={styles.stepSubtext}>{t('onboarding.features.subheading')}</Text>
        <StaggerChildren stagger={100} initialDelay={200} distance={16} style={styles.optionsContainer}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureCard}>
              <View style={styles.featureIcon}>{f.icon}</View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </StaggerChildren>
      </ScrollView>
      <Animated.View style={[styles.bottomCta, { opacity: ctaFadeAnim }]}>
        <OnboardingButton title={t('onboarding.features.cta')} onPress={goNext} />
      </Animated.View>
    </View>
  );
}
