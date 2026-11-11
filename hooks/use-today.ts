import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

function atMidnight(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  return result;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function useToday(): Date {
  const [today, setToday] = useState(() => atMidnight(new Date()));

  useEffect(() => {
    const refresh = () => {
      setToday((current) => {
        const now = new Date();

        return isSameDay(current, now) ? current : atMidnight(now);
      });
    };

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refresh();
      }
    });

    const interval = setInterval(refresh, 60 * 1000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  return today;
}
