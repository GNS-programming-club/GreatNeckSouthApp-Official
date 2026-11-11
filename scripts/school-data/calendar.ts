import type { IcsDateValue, IcsEvent } from './ics.ts';

export type CalendarSource = 'school' | 'holiday' | 'district';

export type CalendarEvent = {
  id: string;
  title: string;
  source: CalendarSource;
  allDay: boolean;
  start: string;
  end: string;
  location: string | null;
};

const SCHOOL_TIME_ZONE = 'America/New_York';
const PAST_EVENT_CUTOFF_DAYS = 7;
const MILLISECONDS_PER_DAY = 86_400_000;
const MILLISECONDS_PER_MINUTE = 60_000;

const offsetFormatters = new Map<string, Intl.DateTimeFormat>();
const wallClockFormatters = new Map<string, Intl.DateTimeFormat>();

function offsetFormatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = offsetFormatters.get(timeZone);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' });
    offsetFormatters.set(timeZone, formatter);
  }

  return formatter;
}

function wallClockFormatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = wallClockFormatters.get(timeZone);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    wallClockFormatters.set(timeZone, formatter);
  }

  return formatter;
}

function offsetAt(instant: Date, timeZone: string): string {
  const offsetName =
    offsetFormatterFor(timeZone)
      .formatToParts(instant)
      .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';

  return offsetName === 'GMT' ? '+00:00' : offsetName.slice('GMT'.length);
}

function offsetInMilliseconds(offset: string): number {
  const sign = offset.startsWith('-') ? -1 : 1;
  const [hours, minutes] = offset.slice(1).split(':').map(Number);

  return sign * (hours * 60 + minutes) * MILLISECONDS_PER_MINUTE;
}

function wallClockAt(instant: Date, timeZone: string): string {
  const parts = Object.fromEntries(
    wallClockFormatterFor(timeZone)
      .formatToParts(instant)
      .map((part) => [part.type, part.value])
  );

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

function instantFromWallClock(dateTime: string, timeZone: string): Date {
  const wallClockAsUtc = new Date(`${dateTime}Z`).getTime();
  const firstGuess = new Date(
    wallClockAsUtc - offsetInMilliseconds(offsetAt(new Date(wallClockAsUtc), timeZone))
  );

  return new Date(wallClockAsUtc - offsetInMilliseconds(offsetAt(firstGuess, timeZone)));
}

function toSchoolTime(instant: Date): string {
  return `${wallClockAt(instant, SCHOOL_TIME_ZONE)}${offsetAt(instant, SCHOOL_TIME_ZONE)}`;
}

function toInstant(value: IcsDateValue): Date | null {
  switch (value.kind) {
    case 'utc':
      return new Date(`${value.dateTime}Z`);

    case 'local':
      return instantFromWallClock(value.dateTime, value.timeZone);

    case 'date':
      return null;
  }
}

function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);

  return new Date(Date.UTC(year, month - 1, day) + days * MILLISECONDS_PER_DAY)
    .toISOString()
    .slice(0, 10);
}

function inclusiveEndDate(startDate: string, end: IcsDateValue | null): string {
  if (end?.kind !== 'date') {
    return startDate;
  }

  const lastDay = shiftDate(end.date, -1);

  return lastDay < startDate ? startDate : lastDay;
}

function toCalendarEvent(event: IcsEvent, source: CalendarSource): CalendarEvent | null {
  const common = {
    id: event.uid,
    title: event.summary.replace(/^SH\s+/, '').trim(),
    source,
    location: event.location.trim() || null,
  };

  if (event.start.kind === 'date') {
    const start = event.start.date;

    return { ...common, allDay: true, start, end: inclusiveEndDate(start, event.end) };
  }

  const startInstant = toInstant(event.start);
  const endInstant = event.end ? toInstant(event.end) : null;

  if (!startInstant) {
    return null;
  }

  const start = toSchoolTime(startInstant);

  return { ...common, allDay: false, start, end: endInstant ? toSchoolTime(endInstant) : start };
}

export function toCalendarEvents(
  events: IcsEvent[],
  source: CalendarSource,
  now: Date
): CalendarEvent[] {
  const cutoffDate = wallClockAt(
    new Date(now.getTime() - PAST_EVENT_CUTOFF_DAYS * MILLISECONDS_PER_DAY),
    SCHOOL_TIME_ZONE
  ).slice(0, 10);

  return events
    .map((event) => toCalendarEvent(event, source))
    .filter(
      (event): event is CalendarEvent => event !== null && event.end.slice(0, 10) >= cutoffDate
    );
}

export function sortCalendarEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((first, second) => {
    if (first.start !== second.start) {
      return first.start < second.start ? -1 : 1;
    }

    return first.id < second.id ? -1 : first.id > second.id ? 1 : 0;
  });
}
