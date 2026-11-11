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
import type { DayLetter, DayLetters } from '@/lib/day-letters';
import { planEveningReminders } from '@/lib/reminders';

type RemindersValue = {
  isEnabled: boolean;
  isPermissionDenied: boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
};

const ENABLED_STORAGE_KEY = 'eveningReminderEnabled';
const SCHEDULE_STORAGE_KEY = 'userSchedule_v1';
const ANDROID_CHANNEL_ID = 'reminders';
const PLANNING_WINDOW_DAYS = 14;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const RemindersContext = createContext<RemindersValue | undefined>(undefined);

async function readFirstPeriod(letter: DayLetter): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(`${SCHEDULE_STORAGE_KEY}_${letter}`);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    const first = Array.isArray(parsed) ? parsed[0] : null;

    return typeof first === 'string' && first !== '' ? first : null;
  } catch {
    return null;
  }
}

async function scheduleEveningReminders(
  letters: DayLetters,
  isStale: () => boolean
): Promise<void> {
  const [firstA, firstB] = await Promise.all([readFirstPeriod('A'), readFirstPeriod('B')]);

  if (isStale()) {
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (isStale()) {
    return;
  }

  const reminders = planEveningReminders({
    now: new Date(),
    letters,
    firstPeriodByLetter: { A: firstA, B: firstB },
    days: PLANNING_WINDOW_DAYS,
  });

  await Promise.all(
    reminders.map((reminder) =>
      Notifications.scheduleNotificationAsync({
        identifier: `evening-reminder-${reminder.schoolDate}`,
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
  const { dayLetters } = useSchoolData();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const isEnabledRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(ENABLED_STORAGE_KEY)
      .then((raw) => {
        isEnabledRef.current = raw === 'true';
        setIsEnabled(raw === 'true');
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

  const setEnabled = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermission().catch(() => false);

      setIsPermissionDenied(!granted);

      if (!granted) {
        return;
      }
    } else {
      isEnabledRef.current = false;
      await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
    }

    isEnabledRef.current = enabled;
    setIsEnabled(enabled);
    await AsyncStorage.setItem(ENABLED_STORAGE_KEY, String(enabled)).catch(() => undefined);
  }, []);

  const value = useMemo<RemindersValue>(
    () => ({ isEnabled, isPermissionDenied, setEnabled }),
    [isEnabled, isPermissionDenied, setEnabled]
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
