import { useEffect, useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
} from 'react-native-purchases';
import Constants from 'expo-constants';
import { useSettingsStore } from '@/store/settingsStore';
import { trackEvent } from '@/services/analytics';

// Read from .env locally or EAS secrets in CI builds
const RC_API_KEY_IOS = Constants.expoConfig?.extra?.revenueCatApiKeyIos ?? '';

const ENTITLEMENT_ID = 'premium';

let isConfigured = false;

export function configureRevenueCat() {
  if (isConfigured || Platform.OS === 'web') return;

  try {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: RC_API_KEY_IOS });
    isConfigured = true;
  } catch (e) {
    console.warn('[RevenueCat] Failed to configure:', e);
  }
}

function checkPremium(customerInfo: CustomerInfo): boolean {
  // Primary: check entitlement
  if (customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined) {
    return true;
  }
  // Fallback: any active subscription counts as premium
  if (customerInfo.activeSubscriptions.length > 0) {
    return true;
  }
  return false;
}

function syncPremiumStatus(customerInfo: CustomerInfo) {
  useSettingsStore.getState().setIsPremium(checkPremium(customerInfo));
}

export function useRevenueCat() {
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [discountOffering, setDiscountOffering] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(false);
  const isPremium = useSettingsStore((s) => s.isPremium);

  const loadOfferings = useCallback(async () => {
    if (Platform.OS === 'web') return;
    configureRevenueCat();
    setIsLoadingOfferings(true);
    try {
      const offeringsResult = await Purchases.getOfferings();
      if (offeringsResult.current) {
        setOfferings(offeringsResult.current);
      }
      if (offeringsResult.all['discount']) {
        setDiscountOffering(offeringsResult.all['discount']);
      }

      const customerInfo = await Purchases.getCustomerInfo();
      syncPremiumStatus(customerInfo);
    } catch (e) {
      console.warn('[RevenueCat] Failed to load offerings:', e);
    } finally {
      setIsLoadingOfferings(false);
    }
  }, []);

  useEffect(() => {
    loadOfferings();

    const onUpdate = (info: CustomerInfo) => {
      syncPremiumStatus(info);
    };

    Purchases.addCustomerInfoUpdateListener(onUpdate);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(onUpdate);
    };
  }, []);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    if (Platform.OS === 'web') return false;
    setIsLoading(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      syncPremiumStatus(customerInfo);
      return checkPremium(customerInfo);
    } catch (e: any) {
      if (e.userCancelled) {
        trackEvent('paywall_purchase_cancelled');
      } else {
        trackEvent('paywall_purchase_failed', { error: e.message || 'unknown' });
        Alert.alert('Purchase Failed', e.message || 'Something went wrong. Please try again.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    if (Platform.OS === 'web') return false;
    setIsLoading(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      syncPremiumStatus(customerInfo);
      const restored = checkPremium(customerInfo);
      if (restored) {
        Alert.alert('Restored', 'Your premium access has been restored.');
      } else {
        Alert.alert('No Purchases Found', 'We couldn\'t find any previous purchases to restore.');
      }
      return restored;
    } catch (e: any) {
      Alert.alert('Restore Failed', e.message || 'Something went wrong. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Convenience getters for the two plan packages
  const monthlyPackage = offerings?.availablePackages.find(
    (p) => p.packageType === 'MONTHLY'
  ) ?? offerings?.availablePackages.find(
    (p) => p.identifier === '$rc_monthly'
  ) ?? null;

  const annualPackage = offerings?.availablePackages.find(
    (p) => p.packageType === 'ANNUAL'
  ) ?? offerings?.availablePackages.find(
    (p) => p.identifier === '$rc_annual'
  ) ?? null;

  const discountAnnualPackage = discountOffering?.availablePackages.find(
    (p) => p.packageType === 'ANNUAL'
  ) ?? discountOffering?.availablePackages.find(
    (p) => p.identifier === '$rc_annual'
  ) ?? null;

  return {
    offerings,
    monthlyPackage,
    annualPackage,
    discountAnnualPackage,
    isPremium,
    isLoading,
    isLoadingOfferings,
    purchasePackage,
    restorePurchases,
    loadOfferings,
  };
}
