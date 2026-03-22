import { useEffect, useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
} from 'react-native-purchases';
import { useSettingsStore } from '@/store/settingsStore';

// TODO: Replace with production RevenueCat API key before release
const RC_API_KEY_IOS = 'test_tswNbtSNOtzugoRQAtNuGSYJQHK';

const ENTITLEMENT_ID = 'premium';

let isConfigured = false;

export function configureRevenueCat() {
  if (isConfigured || Platform.OS === 'web') return;

  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: RC_API_KEY_IOS });
  isConfigured = true;
}

function syncPremiumStatus(customerInfo: CustomerInfo) {
  const isPremium =
    customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  useSettingsStore.getState().setIsPremium(isPremium);
}

export function useRevenueCat() {
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isPremium = useSettingsStore((s) => s.isPremium);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    async function init() {
      try {
        const offeringsResult = await Purchases.getOfferings();
        if (offeringsResult.current) {
          setOfferings(offeringsResult.current);
        }

        const customerInfo = await Purchases.getCustomerInfo();
        syncPremiumStatus(customerInfo);
      } catch (e) {
        console.warn('[RevenueCat] Failed to load offerings:', e);
      }
    }

    init();

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
      return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (e: any) {
      if (!e.userCancelled) {
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
      const restored = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
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

  return {
    offerings,
    monthlyPackage,
    annualPackage,
    isPremium,
    isLoading,
    purchasePackage,
    restorePurchases,
  };
}
