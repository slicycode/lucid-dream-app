import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Notification identifiers for cancellation
const MORNING_REMINDER_ID = 'morning-reminder';
const REALITY_CHECK_PREFIX = 'reality-check';

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getPermissionStatus(): Promise<string> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

// --- Morning Reminder ---
// Fires daily at the user's chosen time

export async function scheduleMorningReminder(time: string) {
  // Cancel existing first
  await cancelMorningReminder();

  const [hours, minutes] = time.split(':').map(Number);

  await Notifications.scheduleNotificationAsync({
    identifier: MORNING_REMINDER_ID,
    content: {
      title: 'Your dreams are fading',
      body: 'Capture them now before they slip away.',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    },
  });
}

export async function cancelMorningReminder() {
  await Notifications.cancelScheduledNotificationAsync(MORNING_REMINDER_ID);
}

// --- Reality Check Reminders (Premium) ---
// Fires at intervals throughout the day

export async function scheduleRealityChecks(frequency: string) {
  await cancelRealityChecks();

  const intervalHours = frequency === '2h' ? 2 : frequency === '3h' ? 3 : 2;
  const startHour = 9;
  const endHour = 22;

  let index = 0;
  for (let hour = startHour; hour < endHour; hour += intervalHours) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${REALITY_CHECK_PREFIX}-${index}`,
      content: {
        title: 'Reality Check',
        body: 'Are you dreaming right now? Look around. Check the time.',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
    });
    index++;
  }
}

export async function cancelRealityChecks() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.identifier.startsWith(REALITY_CHECK_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

// --- Cancel all ---

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
