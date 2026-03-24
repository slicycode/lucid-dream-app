import { ExpoConfig, ConfigContext } from 'expo/config';

const PRODUCTION_ORIGIN = 'https://slicycode.github.io/lucid-dream-app/';
const isProduction = process.env.EXPO_ENV === 'production' || process.env.APP_VARIANT === 'production';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Lucid',
  slug: 'lucid-dream-journal',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'lucid',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#000000',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.slicycode.lucid',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
      ],
      NSPrivacyCollectedDataTypes: [
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeProductInteraction',
          NSPrivacyCollectedDataTypeLinked: false,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAnalytics'],
        },
      ],
      NSPrivacyTracking: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#000000',
    },
    package: 'com.slicycode.lucid',
  },
  web: {
    favicon: './assets/images/favicon.png',
    output: 'server',
  },
  plugins: [
    isProduction ? ['expo-router', { origin: PRODUCTION_ORIGIN }] : 'expo-router',
    'expo-font',
    'expo-web-browser',
    'expo-sharing',
    [
      '@sentry/react-native',
      {
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        autoUploadSourceMaps: !!process.env.SENTRY_AUTH_TOKEN,
      },
    ],
    'expo-localization',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    revenueCatApiKeyIos: process.env.REVENUECAT_API_KEY_IOS,
    sentryDsn: process.env.SENTRY_DSN,
    posthogApiKey: process.env.POSTHOG_API_KEY,
    router: isProduction ? { origin: PRODUCTION_ORIGIN } : undefined,
    eas: {
      projectId: '90293442-b8b8-4d05-a613-1305f2076caf',
    },
  },
  owner: 'slicycode',
});
