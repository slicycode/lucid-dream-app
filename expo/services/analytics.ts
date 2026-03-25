import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';

const posthogApiKey = Constants.expoConfig?.extra?.posthogApiKey;

let _posthog: PostHog | null = null;

function getPostHog(): PostHog | null {
  if (!_posthog && posthogApiKey) {
    _posthog = new PostHog(posthogApiKey, {
      host: 'https://eu.i.posthog.com',
      captureAppLifecycleEvents: true,
    });
  }
  return _posthog;
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  getPostHog()?.capture(event, properties);
}

export function trackScreen(screenName: string, properties?: Record<string, any>) {
  getPostHog()?.screen(screenName, properties);
}

export function identifyUser(userId: string, properties?: Record<string, any>) {
  getPostHog()?.identify(userId, properties);
}

export function setUserProperty(properties: Record<string, any>) {
  getPostHog()?.identify(undefined, properties);
}

export function resetAnalytics() {
  getPostHog()?.reset();
}
