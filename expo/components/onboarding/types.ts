import { Animated } from 'react-native';

export interface OnboardingScreenProps {
  goNext: () => void;
  ctaFadeAnim: Animated.Value;
}
