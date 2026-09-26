import { useEffect, useMemo, useState } from 'react';

import { getSchoolDaysForMonth } from '@/api/daily-menu';
import { dayLetterFor, isWeekday, parseISODate, ROTATION_ANCHOR_DATE } from '@/constants/schedule';

export type DayLetterInfo = {
  letter: 'A' | 'B';
  isSchoolDay: boolean;
};

type SchoolDaySets = Record<string, Set<number> | null>;

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

function monthsSpanned(from: Date, to: Date) {
  const months: { year: number; month: number }[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);

  while (cursor.getTime() <= end.getTime()) {
    months.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

function spanKeys(anchor: Date, dates: Date[]) {
  const times = dates.map((date) => date.getTime());

  const first = new Date(Math.min(anchor.getTime(), ...times));
  const last = new Date(Math.max(anchor.getTime(), ...times));

  return monthsSpanned(first, last).map(({ year, month }) => `${year}-${month}`);
}

export function useDayLetters(dates: Date[]): DayLetterInfo[] {
  const [schoolDays, setSchoolDays] = useState<SchoolDaySets>({});

  const monthsKey = spanKeys(parseISODate(ROTATION_ANCHOR_DATE), dates).join(',');

  useEffect(() => {
    if (!monthsKey) return;

    let cancelled = false;

    const load = async () => {
      const entries = await Promise.all(
        monthsKey.split(',').map(async (key) => {
          const [year, month] = key.split('-').map(Number);

          return [key, await getSchoolDaysForMonth(year, month)] as const;
        })
      );

      if (cancelled) return;

      setSchoolDays((current) => {
        const next = { ...current };

        for (const [key, days] of entries) {
          next[key] = days;
        }

        return next;
      });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [monthsKey]);

  return useMemo(() => {
    const isSchoolDay = (date: Date) => {
      if (!isWeekday(date)) return false;

      const known = schoolDays[monthKey(date)];

      return known ? known.has(date.getDate()) : true;
    };

    return dates.map((date) => ({
      letter: dayLetterFor(date, isSchoolDay),
      isSchoolDay: isSchoolDay(date),
    }));
  }, [dates, schoolDays]);
}
