import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';

import { useSchoolData } from '@/contexts/school-data-context';
import type { DayLetters } from '@/lib/day-letters';
import { planEventReminders } from '@/lib/event-reminders';
import { planEveningReminders } from '@/lib/reminders';
import type { CalendarEvent } from '@/lib/school-data';

type RemindersValue = {
  isEnabled: boolean;
  isPermissionDenied: boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
  isEventRemindersEnabled: boolean;
  setEventRemindersEnabled: (enabled: boolean) => Promise<void>;
};

const ENABLED_STORAGE_KEY = 'eveningReminderEnabled';
const ANDROID_CHANNEL_ID = 'reminders';
const PLANNING_WINDOW_DAYS = 14;
const REMINDER_IDENTIFIER_PREFIX = 'evening-reminder-';
const EVENT_ENABLED_STORAGE_KEY = 'eventReminderEnabled';
const EVENT_IDENTIFIER_PREFIX = 'event-reminder-';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const RemindersContext = createContext<RemindersValue | undefined>(undefined);

async function cancelRemindersWithPrefix(identifierPrefix: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  await Promise.all(
    scheduled
      .filter((request) => request.identifier.startsWith(identifierPrefix))
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier))
  );
}

async function scheduleEveningReminders(
  letters: DayLetters,
  isStale: () => boolean
): Promise<void> {
  await cancelRemindersWithPrefix(REMINDER_IDENTIFIER_PREFIX);

  if (isStale()) {
    return;
  }

  const reminders = planEveningReminders({
    now: new Date(),
    letters,
    days: PLANNING_WINDOW_DAYS,
  });

  await Promise.all(
    reminders.map((reminder) =>
      Notifications.scheduleNotificationAsync({
        identifier: `${REMINDER_IDENTIFIER_PREFIX}${reminder.schoolDate}`,
        content: { title: reminder.title, body: reminder.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminder.fireAt,
          channelId: ANDROID_CHANNEL_ID,
        },
      })
    )
  );
}

async function scheduleEventReminders(
  events: CalendarEvent[],
  letters: DayLetters | null,
  isStale: () => boolean
): Promise<void> {
  await cancelRemindersWithPrefix(EVENT_IDENTIFIER_PREFIX);

  if (isStale()) {
    return;
  }

  const reminders = planEventReminders({
    now: new Date(),
    events,
    letters,
    days: PLANNING_WINDOW_DAYS,
  });

  await Promise.all(
    reminders.map((reminder) =>
      Notifications.scheduleNotificationAsync({
        identifier: `${EVENT_IDENTIFIER_PREFIX}${reminder.eventDate}`,
        content: { title: reminder.title, body: reminder.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminder.fireAt,
          channelId: ANDROID_CHANNEL_ID,
        },
      })
    )
  );
}

async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Day reminders',
      importance: AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();

  if (existing.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();

  return requested.granted;
}

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const { dayLetters, calendar } = useSchoolData();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isEventRemindersEnabled, setIsEventRemindersEnabled] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const isEnabledRef = useRef(false);
  const isEventRemindersEnabledRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(ENABLED_STORAGE_KEY)
      .then((raw) => {
        isEnabledRef.current = raw === 'true';
        setIsEnabled(raw === 'true');
      })
      .catch(() => undefined);
    AsyncStorage.getItem(EVENT_ENABLED_STORAGE_KEY)
      .then((raw) => {
        isEventRemindersEnabledRef.current = raw === 'true';
        setIsEventRemindersEnabled(raw === 'true');
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isEnabled || !dayLetters) {
      return;
    }

    let isStale = false;

    scheduleEveningReminders(dayLetters, () => isStale || !isEnabledRef.current).catch(
      () => undefined
    );

    return () => {
      isStale = true;
    };
  }, [isEnabled, dayLetters]);

  useEffect(() => {
    if (!isEventRemindersEnabled || !calendar) {
      return;
    }

    let isStale = false;

    scheduleEventReminders(
      calendar.events,
      dayLetters,
      () => isStale || !isEventRemindersEnabledRef.current
    ).catch(() => undefined);

    return () => {
      isStale = true;
    };
  }, [isEventRemindersEnabled, calendar, dayLetters]);

  const setEnabled = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermission().catch(() => false);

      setIsPermissionDenied(!granted);

      if (!granted) {
        return;
      }
    } else {
      isEnabledRef.current = false;
      await cancelRemindersWithPrefix(REMINDER_IDENTIFIER_PREFIX).catch(() => undefined);
    }

    isEnabledRef.current = enabled;
    setIsEnabled(enabled);
    await AsyncStorage.setItem(ENABLED_STORAGE_KEY, String(enabled)).catch(() => undefined);
  }, []);

  const setEventRemindersEnabled = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermission().catch(() => false);

      setIsPermissionDenied(!granted);

      if (!granted) {
        return;
      }
    } else {
      isEventRemindersEnabledRef.current = false;
      await cancelRemindersWithPrefix(EVENT_IDENTIFIER_PREFIX).catch(() => undefined);
    }

    isEventRemindersEnabledRef.current = enabled;
    setIsEventRemindersEnabled(enabled);
    await AsyncStorage.setItem(EVENT_ENABLED_STORAGE_KEY, String(enabled)).catch(() => undefined);
  }, []);

  const value = useMemo<RemindersValue>(
    () => ({
      isEnabled,
      isPermissionDenied,
      setEnabled,
      isEventRemindersEnabled,
      setEventRemindersEnabled,
    }),
    [isEnabled, isPermissionDenied, setEnabled, isEventRemindersEnabled, setEventRemindersEnabled]
  );

  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}

export function useReminders(): RemindersValue {
  const context = useContext(RemindersContext);

  if (!context) {
    throw new Error('useReminders must be used within a RemindersProvider');
  }

  return context;
}
