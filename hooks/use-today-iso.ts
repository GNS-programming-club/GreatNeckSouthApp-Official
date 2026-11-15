import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { appClock } from '@/lib/clock';
import { toIsoDate } from '@/lib/day-letters';

const CHECK_INTERVAL_MILLISECONDS = 60 * 1000;

export function useTodayIso(): string {
  const [todayIso, setTodayIso] = useState(() => toIsoDate(appClock.now()));

  useEffect(() => {
    const syncToday = () => setTodayIso(toIsoDate(appClock.now()));
    const interval = setInterval(syncToday, CHECK_INTERVAL_MILLISECONDS);
    const unsubscribeFromClock = appClock.subscribe(syncToday);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        syncToday();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
      unsubscribeFromClock();
    };
  }, []);

  return todayIso;
}
