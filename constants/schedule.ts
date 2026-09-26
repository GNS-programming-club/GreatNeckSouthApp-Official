export const PERIOD_COUNT = 9;

export const ROTATION_ANCHOR_DATE = '2026-09-25';
export const ROTATION_ANCHOR_LETTER: 'A' | 'B' = 'A';

export function formatMinutes(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const hh = h % 24;

  return `${hh}:${m.toString().padStart(2, '0')}`;
}

export function computePeriodTimes(
  count: number,
  startMinutes = 7 * 60 + 59,
  lessonLen = 40,
  breakLen = 4
) {
  const times: { start: string; end: string }[] = [];

  for (let i = 0; i < count; i++) {
    const start = startMinutes + i * (lessonLen + breakLen);
    const end = start + lessonLen;
    times.push({ start: formatMinutes(start), end: formatMinutes(end) });
  }

  return times;
}

export function parse24hToMinutes(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) return null;

  const h = Number(match[1]);
  const m = Number(match[2]);

  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;

  if (h < 0 || h > 23 || m < 0 || m > 59) return null;

  return h * 60 + m;
}

export function nowMinutesLocal() {
  const now = new Date();

  return now.getHours() * 60 + now.getMinutes();
}

export function toMidnight(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  return result;
}

export function isWeekday(date: Date) {
  const weekday = date.getDay();

  return weekday >= 1 && weekday <= 5;
}

export function parseISODate(dateString: string) {
  return new Date(`${dateString}T00:00:00`);
}

export function dayLetterFor(
  date: Date,
  isSchoolDay: (date: Date) => boolean = isWeekday
): 'A' | 'B' {
  const anchor = parseISODate(ROTATION_ANCHOR_DATE);
  const target = toMidnight(date);

  const start = target.getTime() < anchor.getTime() ? target : anchor;
  const end = target.getTime() < anchor.getTime() ? anchor : target;

  let letter = ROTATION_ANCHOR_LETTER;
  const cursor = toMidnight(start);

  while (cursor.getTime() < end.getTime()) {
    cursor.setDate(cursor.getDate() + 1);

    if (isSchoolDay(cursor)) {
      letter = letter === 'A' ? 'B' : 'A';
    }
  }

  return letter;
}
