import { parseAnnouncements, type Announcement } from './announcements.ts';
import {
  sortCalendarEvents,
  toCalendarEvents,
  type CalendarEvent,
  type CalendarSource,
} from './calendar.ts';
import { parseDayLetters, type DayLetters } from './day-letters.ts';
import { parseIcs } from './ics.ts';
import type { SlideText } from './slides.ts';

export type SourceText = { ok: true; text: string } | { ok: false; reason: string };

export type SourceSlides = { ok: true; slides: SlideText[] } | { ok: false; reason: string };

export type SchedulePdfText =
  | { ok: true; wordBoxes: string; drawing: string }
  | { ok: false; reason: string };

export type FetchedSources = {
  school: SourceText;
  holiday: SourceText;
  district: SourceText;
  announcements: SourceSlides;
  announcementsDeckUrl: string;
  clubNames: string[];
  dayLetters: SchedulePdfText;
};

export type CalendarFile = { generatedAt: string; events: CalendarEvent[] };

export type AnnouncementsFile = {
  generatedAt: string;
  deckUrl: string | null;
  items: Announcement[];
};

export type DayLettersFile = { generatedAt: string; letters: DayLetters };

export type PreviousFiles = {
  calendar: CalendarFile | null;
  announcements: AnnouncementsFile | null;
  dayLetters: DayLettersFile | null;
};

export type BuildResult = {
  calendar: CalendarFile;
  announcements: AnnouncementsFile;
  dayLetters: DayLettersFile;
  failures: string[];
};

const CALENDAR_SOURCES: CalendarSource[] = ['school', 'holiday', 'district'];
const MINIMUM_LETTERED_DAYS = 100;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parseNonEmpty<Item>(
  source: SourceText,
  parse: (text: string) => Item[],
  emptyReason: string
): Item[] {
  if (!source.ok) {
    throw new Error(source.reason);
  }

  const items = parse(source.text);

  if (items.length === 0) {
    throw new Error(emptyReason);
  }

  return items;
}

function readAnnouncements(source: SourceSlides, clubNames: string[]): Announcement[] {
  if (!source.ok) {
    throw new Error(source.reason);
  }

  const items = parseAnnouncements(source.slides, clubNames);

  if (items.length === 0) {
    throw new Error('no items');
  }

  return items;
}

function readSchedulePdf(source: SchedulePdfText): DayLetters {
  if (!source.ok) {
    throw new Error(source.reason);
  }

  const letters = parseDayLetters(source.wordBoxes, source.drawing);
  const count = Object.keys(letters).length;

  if (count < MINIMUM_LETTERED_DAYS) {
    throw new Error(`too few lettered days (${count})`);
  }

  return letters;
}

export function buildOutputs(
  fetched: FetchedSources,
  previous: PreviousFiles,
  now: Date
): BuildResult {
  const failures: string[] = [];
  const events: CalendarEvent[] = [];

  for (const source of CALENDAR_SOURCES) {
    try {
      const icsEvents = parseNonEmpty(fetched[source], parseIcs, 'no events');
      events.push(...toCalendarEvents(icsEvents, source, now));
    } catch (error) {
      failures.push(`${source}: ${errorMessage(error)}`);
      events.push(...(previous.calendar?.events.filter((event) => event.source === source) ?? []));
    }
  }

  let items: Announcement[];

  try {
    items = readAnnouncements(fetched.announcements, fetched.clubNames);
  } catch (error) {
    failures.push(`announcements: ${errorMessage(error)}`);
    items = previous.announcements?.items ?? [];
  }

  let letters: DayLetters;

  try {
    letters = readSchedulePdf(fetched.dayLetters);
  } catch (error) {
    failures.push(`dayLetters: ${errorMessage(error)}`);
    letters = previous.dayLetters?.letters ?? {};
  }

  const generatedAt = now.toISOString();

  return {
    calendar: { generatedAt, events: sortCalendarEvents(events) },
    announcements: { generatedAt, deckUrl: fetched.announcementsDeckUrl, items },
    dayLetters: { generatedAt, letters },
    failures,
  };
}

export function hasContentChanged<FileShape extends { generatedAt: string }>(
  previous: FileShape | null,
  next: FileShape
): boolean {
  if (!previous) {
    return true;
  }

  return (
    JSON.stringify({ ...previous, generatedAt: '' }) !==
    JSON.stringify({ ...next, generatedAt: '' })
  );
}
