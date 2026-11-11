import { parseAnnouncements, type Announcement } from './announcements.ts';
import {
  sortCalendarEvents,
  toCalendarEvents,
  type CalendarEvent,
  type CalendarSource,
} from './calendar.ts';
import { parseIcs } from './ics.ts';

export type SourceText = { ok: true; text: string } | { ok: false; reason: string };

export type FetchedSources = {
  school: SourceText;
  holiday: SourceText;
  district: SourceText;
  announcements: SourceText;
};

export type CalendarFile = { generatedAt: string; events: CalendarEvent[] };

export type AnnouncementsFile = { generatedAt: string; items: Announcement[] };

export type PreviousFiles = {
  calendar: CalendarFile | null;
  announcements: AnnouncementsFile | null;
};

export type BuildResult = {
  calendar: CalendarFile;
  announcements: AnnouncementsFile;
  failures: string[];
};

const CALENDAR_SOURCES: CalendarSource[] = ['school', 'holiday', 'district'];

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
    items = parseNonEmpty(fetched.announcements, parseAnnouncements, 'no items');
  } catch (error) {
    failures.push(`announcements: ${errorMessage(error)}`);
    items = previous.announcements?.items ?? [];
  }

  const generatedAt = now.toISOString();

  return {
    calendar: { generatedAt, events: sortCalendarEvents(events) },
    announcements: { generatedAt, items },
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
