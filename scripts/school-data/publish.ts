import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  buildOutputs,
  hasContentChanged,
  type AnnouncementsFile,
  type CalendarFile,
  type SourceText,
} from './build-outputs.ts';

const CALENDAR_FEED_URL =
  'https://shs.greatneck.k12.ny.us/fs/calendar-manager/events.ics?calendar_ids[]=';
const SOURCE_URLS = {
  school: `${CALENDAR_FEED_URL}11`,
  holiday: `${CALENDAR_FEED_URL}58`,
  district: `${CALENDAR_FEED_URL}53`,
  announcements:
    'https://docs.google.com/presentation/d/1SUIhXFy_Sl0eaCF-TgDycv273qTtNZpgEAQQbZ_k7Cg/export/txt',
};
const FETCH_TIMEOUT_MILLISECONDS = 20_000;
const USER_AGENT = 'gns-school-data-pipeline';
const CALENDAR_FILE_NAME = 'calendar.json';
const ANNOUNCEMENTS_FILE_NAME = 'announcements.json';

async function fetchSource(url: string): Promise<SourceText> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MILLISECONDS),
    });

    if (!response.ok) {
      return { ok: false, reason: `HTTP ${response.status}` };
    }

    return { ok: true, text: await response.text() };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

async function readPreviousFile<FileShape>(path: string): Promise<FileShape | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as FileShape;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

async function writeIfChanged<FileShape extends { generatedAt: string }>(
  path: string,
  previous: FileShape | null,
  next: FileShape
): Promise<void> {
  if (hasContentChanged(previous, next)) {
    await writeFile(path, `${JSON.stringify(next, null, 2)}\n`);
    console.log(`Wrote ${path}`);
  } else {
    console.log(`Unchanged ${path}`);
  }
}

async function publish(outputDirectory: string): Promise<number> {
  await mkdir(outputDirectory, { recursive: true });

  const calendarPath = join(outputDirectory, CALENDAR_FILE_NAME);
  const announcementsPath = join(outputDirectory, ANNOUNCEMENTS_FILE_NAME);

  const [school, holiday, district, announcements, previousCalendar, previousAnnouncements] =
    await Promise.all([
      fetchSource(SOURCE_URLS.school),
      fetchSource(SOURCE_URLS.holiday),
      fetchSource(SOURCE_URLS.district),
      fetchSource(SOURCE_URLS.announcements),
      readPreviousFile<CalendarFile>(calendarPath),
      readPreviousFile<AnnouncementsFile>(announcementsPath),
    ]);

  const result = buildOutputs(
    { school, holiday, district, announcements },
    { calendar: previousCalendar, announcements: previousAnnouncements },
    new Date()
  );

  await writeIfChanged(calendarPath, previousCalendar, result.calendar);
  await writeIfChanged(announcementsPath, previousAnnouncements, result.announcements);

  for (const failure of result.failures) {
    console.error(`Source failed, previous data kept: ${failure}`);
  }

  return result.failures.length > 0 ? 1 : 0;
}

const outputDirectory = process.argv[2];

if (!outputDirectory) {
  console.error('Usage: publish.ts <outputDirectory>');
  process.exitCode = 2;
} else {
  process.exitCode = await publish(outputDirectory);
}
