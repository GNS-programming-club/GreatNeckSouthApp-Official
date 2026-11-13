import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import {
  buildOutputs,
  hasContentChanged,
  type AnnouncementsFile,
  type CalendarFile,
  type DayLettersFile,
  type SchedulePdfText,
  type SourceSlides,
  type SourceText,
} from './build-outputs.ts';
import { findSchedulePdfUrl } from './day-letters.ts';
import { extractSlideText, readSlideXmlFromPptx } from './slides.ts';

const CALENDAR_FEED_URL =
  'https://shs.greatneck.k12.ny.us/fs/calendar-manager/events.ics?calendar_ids[]=';
const SOURCE_URLS = {
  school: `${CALENDAR_FEED_URL}11`,
  holiday: `${CALENDAR_FEED_URL}58`,
  district: `${CALENDAR_FEED_URL}53`,
};
const ANNOUNCEMENTS_DECK_URL =
  'https://docs.google.com/presentation/d/1SUIhXFy_Sl0eaCF-TgDycv273qTtNZpgEAQQbZ_k7Cg';
const CLUBS_FILE_URL = new URL('../../assets/data/club.json', import.meta.url);
const SCHEDULE_PAGE_URL = 'https://shs.greatneck.k12.ny.us/ab-schedule';
const FETCH_TIMEOUT_MILLISECONDS = 20_000;
const USER_AGENT = 'gns-school-data-pipeline';
const CALENDAR_FILE_NAME = 'calendar.json';
const ANNOUNCEMENTS_FILE_NAME = 'announcements.json';
const DAY_LETTERS_FILE_NAME = 'day-letters.json';
const runCommand = promisify(execFile);

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

async function fetchAnnouncementSlides(): Promise<SourceSlides> {
  try {
    const response = await fetch(`${ANNOUNCEMENTS_DECK_URL}/export/pptx`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MILLISECONDS),
    });

    if (!response.ok) {
      return { ok: false, reason: `HTTP ${response.status}` };
    }

    const pptx = new Uint8Array(await response.arrayBuffer());

    return { ok: true, slides: readSlideXmlFromPptx(pptx).map(extractSlideText) };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

async function readClubNames(): Promise<string[]> {
  const clubs = JSON.parse(await readFile(CLUBS_FILE_URL, 'utf8')) as { title: string }[];

  return clubs.map((club) => club.title);
}

async function fetchSchedulePdf(): Promise<SchedulePdfText> {
  const page = await fetchSource(SCHEDULE_PAGE_URL);

  if (!page.ok) {
    return { ok: false, reason: `schedule page ${page.reason}` };
  }

  const pdfUrl = findSchedulePdfUrl(page.text, SCHEDULE_PAGE_URL);

  if (!pdfUrl) {
    return { ok: false, reason: 'no schedule PDF link on the page' };
  }

  const workDirectory = await mkdtemp(join(tmpdir(), 'ab-schedule-'));

  try {
    const response = await fetch(pdfUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MILLISECONDS),
    });

    if (!response.ok) {
      return { ok: false, reason: `schedule PDF HTTP ${response.status}` };
    }

    const pdfPath = join(workDirectory, 'schedule.pdf');
    await writeFile(pdfPath, Buffer.from(await response.arrayBuffer()));
    const [wordBoxes, drawing] = await Promise.all([
      runCommand('pdftotext', ['-bbox', '-f', '1', '-l', '1', pdfPath, '-']),
      runCommand('pdftocairo', ['-svg', '-f', '1', '-l', '1', pdfPath, '-'], {
        maxBuffer: 64 * 1024 * 1024,
      }),
    ]);

    return { ok: true, wordBoxes: wordBoxes.stdout, drawing: drawing.stdout };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  } finally {
    await rm(workDirectory, { recursive: true, force: true });
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
  const dayLettersPath = join(outputDirectory, DAY_LETTERS_FILE_NAME);

  const [
    school,
    holiday,
    district,
    announcements,
    dayLetters,
    previousCalendar,
    previousAnnouncements,
    previousDayLetters,
    clubNames,
  ] = await Promise.all([
    fetchSource(SOURCE_URLS.school),
    fetchSource(SOURCE_URLS.holiday),
    fetchSource(SOURCE_URLS.district),
    fetchAnnouncementSlides(),
    fetchSchedulePdf(),
    readPreviousFile<CalendarFile>(calendarPath),
    readPreviousFile<AnnouncementsFile>(announcementsPath),
    readPreviousFile<DayLettersFile>(dayLettersPath),
    readClubNames(),
  ]);

  const result = buildOutputs(
    {
      school,
      holiday,
      district,
      announcements,
      announcementsDeckUrl: `${ANNOUNCEMENTS_DECK_URL}/present`,
      clubNames,
      dayLetters,
    },
    {
      calendar: previousCalendar,
      announcements: previousAnnouncements,
      dayLetters: previousDayLetters,
    },
    new Date()
  );

  await writeIfChanged(calendarPath, previousCalendar, result.calendar);
  await writeIfChanged(announcementsPath, previousAnnouncements, result.announcements);
  await writeIfChanged(dayLettersPath, previousDayLetters, result.dayLetters);

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
