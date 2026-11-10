import { useEffect, useMemo, useState } from 'react';

interface RawPeriod {
  id: string;
  period: string;
  start: string;
  end: string;
  duration: string;
}

interface ScheduleData {
  periods: RawPeriod[];
  totalSchoolDay: string;
  totalDuration: string;
}

const scheduleData = require('../assets/data/schedule.json') as ScheduleData;

export function getEasternSeconds(): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(new Date());
    const hour = Number(parts.find((p) => p.type === 'hour')?.value);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value);
    const second = Number(parts.find((p) => p.type === 'second')?.value);

    if (Number.isFinite(hour) && Number.isFinite(minute) && Number.isFinite(second)) {
      return hour * 3600 + minute * 60 + second;
    }
  } catch {}

  const now = new Date();

  return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
}

export function parseClockToSeconds(time: string): number | null {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) return null;

  const [, hourRaw, minuteRaw, ampmRaw] = match;
  let hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const ampm = ampmRaw.toUpperCase();

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;

  if (ampm === 'AM') {
    if (hour === 12) hour = 0;
  } else {
    if (hour !== 12) hour += 12;
  }

  return hour * 3600 + minute * 60;
}

export type LivePeriod = {
  kind: 'current' | 'next';
  index: number;
  period: RawPeriod;
  startSeconds: number;
  endSeconds: number;
  secondsToBell: number;
  minutesToBell: number;
  elapsedFraction: number;
};

export function computeLivePeriod(nowSeconds: number): LivePeriod | null {
  const periods = scheduleData.periods;

  for (let i = 0; i < periods.length; i++) {
    const startSeconds = parseClockToSeconds(periods[i].start);
    const endSeconds = parseClockToSeconds(periods[i].end);

    if (startSeconds == null || endSeconds == null || endSeconds <= startSeconds) continue;

    const isCurrent = nowSeconds >= startSeconds && nowSeconds < endSeconds;
    const isNext = nowSeconds < startSeconds;

    if (!isCurrent && !isNext) continue;

    const secondsToBell = isCurrent ? endSeconds - nowSeconds : startSeconds - nowSeconds;

    return {
      kind: isCurrent ? 'current' : 'next',
      index: i,
      period: periods[i],
      startSeconds,
      endSeconds,
      secondsToBell,
      minutesToBell: Math.max(1, Math.ceil(secondsToBell / 60)),
      elapsedFraction: isCurrent
        ? Math.min(1, Math.max(0, (nowSeconds - startSeconds) / (endSeconds - startSeconds)))
        : 0,
    };
  }

  return null;
}

export function useNowSeconds(): number {
  const [now, setNow] = useState(() => getEasternSeconds());

  useEffect(() => {
    const interval = setInterval(() => setNow(getEasternSeconds()), 1000);

    return () => clearInterval(interval);
  }, []);

  return now;
}

export function useLivePeriod(): { nowSeconds: number; live: LivePeriod | null } {
  const nowSeconds = useNowSeconds();
  const live = useMemo(() => computeLivePeriod(nowSeconds), [nowSeconds]);

  return { nowSeconds, live };
}
