import React from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import OnboardingButton from '@/components/OnboardingButton';
import QuizOptionCard from '@/components/QuizOptionCard';
import ProgressBar from '@/components/ProgressBar';
import { StaggerChildren } from '@/components/StaggerChildren';
import { styles } from './styles';

interface QuizOption {
  key: string;
  title: string;
  sub: string;
}

interface QuizScreenProps {
  progress: { current: number; total: number };
  heading: string;
  subtext?: string;
  options: QuizOption[];
  selected: string | string[];
  onSelect: (key: string) => void;
  multiSelect?: boolean;
  goNext: () => void;
  ctaFadeAnim: Animated.Value;
}

export function QuizScreen({
  progress,
  heading,
  subtext,
  options,
  selected,
  onSelect,
  multiSelect = false,
  goNext,
  ctaFadeAnim,
}: QuizScreenProps) {
  const { t } = useTranslation();
  const isSelected = (key: string) =>
    Array.isArray(selected) ? selected.includes(key) : selected === key;

  const hasSelection = Array.isArray(selected) ? selected.length > 0 : !!selected;

  return (
    <View style={styles.flex}>
      <ProgressBar current={progress.current} total={progress.total} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepHeading}>{heading}</Text>
        {subtext && <Text style={styles.stepSubtext}>{subtext}</Text>}
        <StaggerChildren stagger={multiSelect ? 70 : 70} initialDelay={150} style={styles.optionsContainer}>
          {options.map((opt) => (
            <QuizOptionCard
              key={opt.key}
              title={opt.title}
              subtitle={opt.sub}
              selected={isSelected(opt.key)}
              onPress={() => onSelect(opt.key)}
            />
          ))}
        </StaggerChildren>
      </ScrollView>
      <Animated.View style={[styles.bottomCta, { opacity: ctaFadeAnim }]}>
        <OnboardingButton title={t('common.continue')} onPress={goNext} disabled={!hasSelection} />
      </Animated.View>
    </View>
  );
}
