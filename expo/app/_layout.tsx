import '@/i18n';
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";
import { useFonts } from "expo-font";
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from "@expo-google-fonts/instrument-serif";
import React, { useEffect, useCallback, useRef } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import Purchases from "react-native-purchases";
import { useOnboardingStore } from "@/store/onboardingStore";
import { configureRevenueCat } from "@/hooks/useRevenueCat";
import { identifyUser } from "@/services/analytics";
import { colors } from "@/constants/theme";
import "@/services/analytics";

void SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding);

  useEffect(() => {
    const inOnboarding = segments[0] === "onboarding";

    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace("/onboarding");
    } else if (hasCompletedOnboarding && inOnboarding) {
      router.replace("/(tabs)" as any);
    }
  }, [hasCompletedOnboarding, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "fade",
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen
        name="new-dream"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="dream/[id]"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="paywall"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="dream-dictionary"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="emotion-tags"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });

  const sentryInitialized = useRef(false);
  useEffect(() => {
    if (sentryInitialized.current) return;
    sentryInitialized.current = true;

    const sentryDsn = Constants.expoConfig?.extra?.sentryDsn;
    if (sentryDsn && sentryDsn !== "YOUR_SENTRY_DSN") {
      Sentry.init({
        dsn: sentryDsn,
        tracesSampleRate: 0.2,
        sendDefaultPii: false,
      });
    }
  }, []);

  // Identify PostHog user with RevenueCat's stable appUserID
  const analyticsIdentified = useRef(false);
  useEffect(() => {
    if (analyticsIdentified.current || Platform.OS === "web") return;
    analyticsIdentified.current = true;

    (async () => {
      try {
        configureRevenueCat();
        const { originalAppUserId } = await Purchases.getCustomerInfo();
        identifyUser(originalAppUserId);
      } catch (e) {
        console.warn("[Analytics] Failed to identify user:", e);
      }
    })();
  }, []);

  const onLayoutReady = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
      onLayout={onLayoutReady}
    >
      <StatusBar style="light" />
      <RootLayoutNav />
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
