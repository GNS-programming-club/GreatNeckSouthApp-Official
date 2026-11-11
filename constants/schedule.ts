export const PERIOD_COUNT = 9;

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
