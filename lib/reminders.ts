import { addDays, fromIsoDate, toIsoDate, type DayLetter, type DayLetters } from './day-letters.ts';

export type EveningReminder = {
  schoolDate: string;
  fireAt: Date;
  title: string;
  body: string;
};

export type EveningReminderInput = {
  now: Date;
  letters: DayLetters | null;
  firstPeriodByLetter: Record<DayLetter, string | null>;
  days: number;
};

const REMINDER_HOUR = 20;

function articleFor(letter: DayLetter): string {
  return letter === 'A' ? 'an' : 'a';
}

export function planEveningReminders({
  now,
  letters,
  firstPeriodByLetter,
  days,
}: EveningReminderInput): EveningReminder[] {
  if (!letters) {
    return [];
  }

  const todayIso = toIsoDate(now);
  const reminders: EveningReminder[] = [];

  for (let offset = 1; offset <= days; offset++) {
    const schoolDate = addDays(todayIso, offset);
    const letter = letters[schoolDate];

    if (!letter) {
      continue;
    }

    const fireAt = fromIsoDate(addDays(schoolDate, -1));

    fireAt.setHours(REMINDER_HOUR, 0, 0, 0);

    if (fireAt <= now) {
      continue;
    }

    const firstPeriod = firstPeriodByLetter[letter];

    reminders.push({
      schoolDate,
      fireAt,
      title: `Tomorrow is ${articleFor(letter)} ${letter} day`,
      body: firstPeriod ? `First period: ${firstPeriod}` : 'Check your schedule in the app',
    });
  }

  return reminders;
}
