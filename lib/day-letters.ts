import type { DayLetter, DayLetters } from '../scripts/school-data/day-letters.ts';
import type { DayLettersFile } from '../scripts/school-data/build-outputs.ts';

export type { DayLetter, DayLetters, DayLettersFile };

export type DayStatus =
  | { kind: 'school'; letter: DayLetter }
  | { kind: 'no-school' }
  | { kind: 'unknown' };

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function padded(value: number): string {
  return String(value).padStart(2, '0');
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${padded(date.getMonth() + 1)}-${padded(date.getDate())}`;
}

export function fromIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);

  return new Date(year, month - 1, day);
}

export function addDays(isoDate: string, days: number): string {
  const date = fromIsoDate(isoDate);
  date.setDate(date.getDate() + days);

  return toIsoDate(date);
}

export function weekDates(isoDate: string, weekOffset: number): string[] {
  const sunday = addDays(isoDate, -fromIsoDate(isoDate).getDay() + weekOffset * 7);

  return Array.from({ length: 7 }, (_, index) => addDays(sunday, index));
}

export function parseDayLettersFile(value: unknown): DayLettersFile | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const { generatedAt, letters } = value as Record<string, unknown>;

  if (typeof generatedAt !== 'string' || typeof letters !== 'object' || letters === null) {
    return null;
  }

  const entries = Object.entries(letters);
  const isValid = entries.every(
    ([date, letter]) => ISO_DATE_PATTERN.test(date) && (letter === 'A' || letter === 'B')
  );

  return isValid ? { generatedAt, letters: Object.fromEntries(entries) as DayLetters } : null;
}

function schoolYearBounds(letters: DayLetters): { first: string; last: string } | null {
  const dates = Object.keys(letters).sort();

  return dates.length === 0 ? null : { first: dates[0], last: dates[dates.length - 1] };
}

export function dayStatusFor(isoDate: string, letters: DayLetters | null): DayStatus {
  const bounds = letters ? schoolYearBounds(letters) : null;

  if (!letters || !bounds || isoDate < bounds.first || isoDate > bounds.last) {
    return { kind: 'unknown' };
  }

  const letter = letters[isoDate];

  return letter ? { kind: 'school', letter } : { kind: 'no-school' };
}

export function nextSchoolDay(
  isoDate: string,
  letters: DayLetters | null
): { date: string; letter: DayLetter } | null {
  if (!letters) {
    return null;
  }

  const date = Object.keys(letters)
    .sort()
    .find((candidate) => candidate > isoDate);

  return date ? { date, letter: letters[date] } : null;
}
