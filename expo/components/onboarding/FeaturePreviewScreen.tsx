import React from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
import { Sparkles, Repeat, Moon, Calendar } from 'lucide-react-native';
import OnboardingButton from '@/components/OnboardingButton';
import { StaggerChildren } from '@/components/StaggerChildren';
import { colors } from '@/constants/theme';
import { styles } from './styles';

interface FeaturePreviewScreenProps {
  goNext: () => void;
  ctaFadeAnim: Animated.Value;
}

const FEATURES = [
  { icon: <Sparkles size={22} color={colors.accent} />, title: 'AI Dream Interpretation', desc: 'Understand what your dreams mean with personalized AI analysis' },
  { icon: <Repeat size={22} color={colors.accent} />, title: 'Pattern Detection', desc: 'Discover recurring symbols, emotions, and themes across your dreams' },
  { icon: <Moon size={22} color={colors.accent} />, title: 'Lucid Dreaming Tools', desc: 'Reality checks, WBTB timers, and techniques to dream consciously' },
  { icon: <Calendar size={22} color={colors.accent} />, title: 'Dream Calendar', desc: 'See your complete dream history at a glance, color-coded by mood' },
];

export function FeaturePreviewScreen({ goNext, ctaFadeAnim }: FeaturePreviewScreenProps) {
  return (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepHeading}>Here's what Lucid can do for you</Text>
        <Text style={styles.stepSubtext}>Personalized to your dream profile</Text>
        <StaggerChildren stagger={100} initialDelay={200} distance={16} style={styles.optionsContainer}>
          {FEATURES.map((f, i) => (
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
        <OnboardingButton title="Continue" onPress={goNext} />
      </Animated.View>
    </View>
  );
}
