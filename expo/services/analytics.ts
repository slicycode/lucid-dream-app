import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';

const posthogApiKey = Constants.expoConfig?.extra?.posthogApiKey;

export const posthog = posthogApiKey
  ? new PostHog(posthogApiKey, {
      host: 'https://us.i.posthog.com',
      captureAppLifecycleEvents: true,
    })
  : null;

export function trackEvent(event: string, properties?: Record<string, any>) {
  posthog?.capture(event, properties);
}

export function trackScreen(screenName: string, properties?: Record<string, any>) {
  posthog?.screen(screenName, properties);
}

export function identifyUser(userId: string, properties?: Record<string, any>) {
  posthog?.identify(userId, properties);
}

export function setUserProperty(properties: Record<string, any>) {
  posthog?.identify(undefined, properties);
}

export function resetAnalytics() {
  posthog?.reset();
}
