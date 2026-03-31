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
const WBTB_ALARM_ID = 'wbtb-alarm';

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
  try {
    await Notifications.cancelScheduledNotificationAsync(MORNING_REMINDER_ID);
  } catch {
    // Notification may not exist yet
  }
}

// --- Reality Check Reminders (Premium) ---
// Fires at intervals throughout the day

const REALITY_CHECK_MESSAGES = [
  {
    title: 'Are you dreaming?',
    body: 'Look at your hands. Read something nearby. Look again. Did it change?',
  },
  {
    title: 'Pause for a moment',
    body: 'How did you get here? Can you trace your steps back to this morning?',
  },
  {
    title: 'Check in with yourself',
    body: 'Does anything feel slightly off right now? Trust that feeling.',
  },
  {
    title: 'A gentle question',
    body: "Are you sure you're awake? Look around. Really look.",
  },
  {
    title: 'Reality check',
    body: 'Try pushing your finger through your palm. In a dream, it might go through.',
  },
  {
    title: 'Notice your surroundings',
    body: 'What time is it? Look away. Now check again. Same time?',
  },
  {
    title: 'This might be a dream',
    body: 'Can you remember waking up this morning? Every detail?',
  },
  {
    title: 'Look closer',
    body: "Read any text near you. Look away. Read it again. Dreams can't keep text stable.",
  },
];

export async function scheduleRealityChecks(frequency: string) {
  await cancelRealityChecks();

  const intervalHours = frequency === '2h' ? 2 : frequency === '3h' ? 3 : frequency === '4h' ? 4 : 2;
  const startHour = 9;
  const endHour = 22;

  let index = 0;
  for (let hour = startHour; hour < endHour; hour += intervalHours) {
    const message = REALITY_CHECK_MESSAGES[index % REALITY_CHECK_MESSAGES.length];
    await Notifications.scheduleNotificationAsync({
      identifier: `${REALITY_CHECK_PREFIX}-${index}`,
      content: {
        title: message.title,
        body: message.body,
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

// --- WBTB Alarm (Premium) ---
// Fires daily at the user's chosen WBTB time

export async function scheduleWbtbAlarm(time: string) {
  await cancelWbtbAlarm();

  const [hours, minutes] = time.split(':').map(Number);

  await Notifications.scheduleNotificationAsync({
    identifier: WBTB_ALARM_ID,
    content: {
      title: 'Time to wake up briefly',
      body: 'Stay still. Keep your eyes soft. Hold onto whatever was just happening in your mind.',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    },
  });
}

export async function cancelWbtbAlarm() {
  try {
    await Notifications.cancelScheduledNotificationAsync(WBTB_ALARM_ID);
  } catch {
    // Notification may not exist yet
  }
}

// --- Trial Reminder ---
// One-shot notification on Day 5 of a 7-day trial

const TRIAL_REMINDER_ID = 'trial-reminder';

export async function scheduleTrialReminder() {
  await cancelTrialReminder();

  const triggerDate = new Date();
  triggerDate.setDate(triggerDate.getDate() + 5);
  triggerDate.setHours(10, 0, 0, 0);

  await Notifications.scheduleNotificationAsync({
    identifier: TRIAL_REMINDER_ID,
    content: {
      title: 'Your free trial ends in 2 days',
      body: "Just a heads up — your Lucid trial wraps up soon. Cancel anytime in Settings if you'd like.",
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

export async function cancelTrialReminder() {
  try {
    await Notifications.cancelScheduledNotificationAsync(TRIAL_REMINDER_ID);
  } catch {
    // Notification may not exist yet
  }
}

// --- Cancel all ---

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
