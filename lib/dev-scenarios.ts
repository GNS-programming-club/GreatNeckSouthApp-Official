import { addDays, fromIsoDate, type DayLetters } from './day-letters.ts';

export type PeriodBounds = {
  startSeconds: number;
  endSeconds: number;
};

export type ScenarioDay = 'school' | 'weekend';

export type Scenario = {
  id: string;
  title: string;
  description: string;
  day: ScenarioDay;
  secondsOfDay: number;
  speed: number;
};

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const SATURDAY = 6;
const SUNDAY = 0;
const FEATURED_PERIOD_INDEX = 2;

export function buildScenarios(periods: PeriodBounds[]): Scenario[] {
  const firstStart = periods[0].startSeconds;
  const lastEnd = periods[periods.length - 1].endSeconds;
  const featuredIndex = Math.min(FEATURED_PERIOD_INDEX, periods.length - 1);
  const featuredEnd = periods[featuredIndex].endSeconds;
  const featuredNumber = featuredIndex + 1;

  return [
    {
      id: 'mid-class',
      title: `Period ${featuredNumber}, minutes left`,
      description: 'Hero minutes roll down 3, 2, 1 in real time.',
      day: 'school',
      secondsOfDay: featuredEnd - 150,
      speed: 1,
    },
    {
      id: 'bell',
      title: 'Bell in 15 seconds',
      description: 'Watch the hero flip from NOW to NEXT.',
      day: 'school',
      secondsOfDay: featuredEnd - 15,
      speed: 1,
    },
    {
      id: 'passing',
      title: 'Passing time',
      description: 'Between classes, counting down to the next period.',
      day: 'school',
      secondsOfDay: featuredEnd + 30,
      speed: 1,
    },
    {
      id: 'before-school',
      title: 'Before school',
      description: 'Morning greeting, first period up next.',
      day: 'school',
      secondsOfDay: firstStart - 25 * MINUTE,
      speed: 1,
    },
    {
      id: 'after-school',
      title: 'After school',
      description: 'Day done, next school day shown.',
      day: 'school',
      secondsOfDay: lastEnd + HOUR,
      speed: 1,
    },
    {
      id: 'weekend',
      title: 'Saturday',
      description: 'No-school state and an empty agenda day.',
      day: 'weekend',
      secondsOfDay: 11 * HOUR,
      speed: 1,
    },
    {
      id: 'full-day',
      title: 'Whole day, fast',
      description: 'One real second is one school minute.',
      day: 'school',
      secondsOfDay: firstStart - 5 * MINUTE,
      speed: 60,
    },
  ];
}

function easternWallClockAsUtcMilliseconds(instant: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((candidate) => candidate.type === type)?.value);

  return Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
    part('second')
  );
}

export function easternWallTimeToDate(isoDate: string, secondsOfDay: number): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  const wallAsUtc = Date.UTC(year, month - 1, day) + secondsOfDay * 1000;
  const easternOffset = easternWallClockAsUtcMilliseconds(new Date(wallAsUtc)) - wallAsUtc;

  return new Date(wallAsUtc - easternOffset);
}

export function upcomingSchoolDay(todayIso: string, letters: DayLetters | null): string {
  const letteredDate = letters
    ? Object.keys(letters)
        .sort()
        .find((candidate) => candidate >= todayIso)
    : undefined;

  if (letteredDate) {
    return letteredDate;
  }

  let candidate = todayIso;

  while ([SATURDAY, SUNDAY].includes(fromIsoDate(candidate).getDay())) {
    candidate = addDays(candidate, 1);
  }

  return candidate;
}

export function nextSaturday(todayIso: string): string {
  const weekday = fromIsoDate(todayIso).getDay();

  return addDays(todayIso, (SATURDAY - weekday + 7) % 7);
}
