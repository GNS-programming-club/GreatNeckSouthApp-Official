import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { toIsoDate } from '@/lib/day-letters';

const CHECK_INTERVAL_MILLISECONDS = 60 * 1000;

export function useTodayIso(): string {
  const [todayIso, setTodayIso] = useState(() => toIsoDate(new Date()));

  useEffect(() => {
    const syncToday = () => setTodayIso(toIsoDate(new Date()));
    const interval = setInterval(syncToday, CHECK_INTERVAL_MILLISECONDS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        syncToday();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return todayIso;
}
