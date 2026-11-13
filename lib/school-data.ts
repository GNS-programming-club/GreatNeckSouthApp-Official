import type { Announcement } from '../scripts/school-data/announcements.ts';
import type { AnnouncementsFile, CalendarFile } from '../scripts/school-data/build-outputs.ts';
import type { CalendarEvent } from '../scripts/school-data/calendar.ts';

import { addDays } from './day-letters.ts';

export type { Announcement, AnnouncementsFile, CalendarEvent, CalendarFile };

const SOURCES = new Set(['school', 'holiday', 'district']);
const YOUNGER_STUDENT_PATTERNS = [
  /\bGr\. K-\d/,
  /\bPre[- ]?K(indergarten)?\b/i,
  /\bElementary\b/i,
  /\bMiddle School\b/i,
  /^MS\b/,
  /\bFifth[- ]Grade\b/i,
];
const CLOSURE_PATTERN = /^SCHOOLS CLOSED/i;
const MILLISECONDS_PER_MINUTE = 60_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCalendarEvent(value: unknown): value is CalendarEvent {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    SOURCES.has(value.source as string) &&
    typeof value.allDay === 'boolean' &&
    typeof value.start === 'string' &&
    typeof value.end === 'string' &&
    (value.location === null || typeof value.location === 'string')
  );
}

function isOptionalText(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === 'string';
}

function toAnnouncement(value: unknown): Announcement | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.text !== 'string' ||
    !isOptionalText(value.title) ||
    !isOptionalText(value.club)
  ) {
    return null;
  }

  return { id: value.id, title: value.title ?? null, text: value.text, club: value.club ?? null };
}

export function parseCalendarFile(value: unknown): CalendarFile | null {
  if (!isRecord(value) || typeof value.generatedAt !== 'string' || !Array.isArray(value.events)) {
    return null;
  }

  return value.events.every(isCalendarEvent)
    ? { generatedAt: value.generatedAt, events: value.events }
    : null;
}

export function parseAnnouncementsFile(value: unknown): AnnouncementsFile | null {
  if (!isRecord(value) || typeof value.generatedAt !== 'string' || !Array.isArray(value.items)) {
    return null;
  }

  if (!isOptionalText(value.deckUrl)) {
    return null;
  }

  const items = value.items.map(toAnnouncement);

  return items.every((item) => item !== null)
    ? { generatedAt: value.generatedAt, deckUrl: value.deckUrl ?? null, items }
    : null;
}

export function isForHighSchool(event: CalendarEvent): boolean {
  return (
    event.source !== 'district' ||
    !YOUNGER_STUDENT_PATTERNS.some((pattern) => pattern.test(event.title))
  );
}

function isHoliday(event: CalendarEvent): boolean {
  return event.source === 'holiday' || CLOSURE_PATTERN.test(event.title);
}

function lastDate(event: CalendarEvent): string {
  const endDate = event.end.slice(0, 10);

  if (
    !event.allDay &&
    event.end.slice(11, 19) === '00:00:00' &&
    endDate > event.start.slice(0, 10)
  ) {
    return addDays(endDate, -1);
  }

  return endDate;
}

function coversDate(event: CalendarEvent, isoDate: string): boolean {
  return event.start.slice(0, 10) <= isoDate && isoDate <= lastDate(event);
}

export function eventsOnDate(events: CalendarEvent[], isoDate: string): CalendarEvent[] {
  return events.filter(
    (event) => !isHoliday(event) && isForHighSchool(event) && coversDate(event, isoDate)
  );
}

export function holidaysOnDate(events: CalendarEvent[], isoDate: string): CalendarEvent[] {
  return events.filter((event) => isHoliday(event) && coversDate(event, isoDate));
}

export function nextEventAfter(events: CalendarEvent[], isoDate: string): CalendarEvent | null {
  return (
    events.find(
      (event) => !isHoliday(event) && isForHighSchool(event) && event.start.slice(0, 10) > isoDate
    ) ?? null
  );
}

export function formatUpdatedAgo(generatedAt: string, now: Date): string {
  const minutes = Math.floor((now.getTime() - Date.parse(generatedAt)) / MILLISECONDS_PER_MINUTE);

  if (minutes < 1) {
    return 'Updated just now';
  }

  if (minutes < 60) {
    return `Updated ${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `Updated ${hours} h ago`;
  }

  const days = Math.floor(hours / 24);

  return `Updated ${days} ${days === 1 ? 'day' : 'days'} ago`;
}

export function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) {
    return 'All day';
  }

  const [hour, minute] = event.start.slice(11, 16).split(':').map(Number);
  const suffix = hour >= 12 ? 'PM' : 'AM';

  return `${hour % 12 === 0 ? 12 : hour % 12}:${String(minute).padStart(2, '0')} ${suffix}`;
}
