import { addDays, fromIsoDate, toIsoDate, type DayLetters } from './day-letters.ts';
import { eventsOnDate, formatEventTime, type CalendarEvent } from './school-data.ts';

export type EventReminder = {
  eventDate: string;
  fireAt: Date;
  title: string;
  body: string;
};

export type EventReminderInput = {
  now: Date;
  events: CalendarEvent[] | null;
  letters: DayLetters | null;
  days: number;
};

const SCHOOL_DAY_HOUR = 7;
const DAY_OFF_HOUR = 10;
const DETAIL_SEPARATOR = ' · ';

function startsOn(event: CalendarEvent, isoDate: string): boolean {
  return event.start.slice(0, 10) === isoDate;
}

function describeSingle(event: CalendarEvent): Pick<EventReminder, 'title' | 'body'> {
  return {
    title: `Today: ${event.title}`,
    body: [formatEventTime(event), event.location]
      .filter((detail): detail is string => Boolean(detail))
      .join(DETAIL_SEPARATOR),
  };
}

function describeSeveral(events: CalendarEvent[]): Pick<EventReminder, 'title' | 'body'> {
  return {
    title: `${events.length} school events today`,
    body: events.map((event) => `${event.title} ${formatEventTime(event)}`).join(DETAIL_SEPARATOR),
  };
}

export function planEventReminders({
  now,
  events,
  letters,
  days,
}: EventReminderInput): EventReminder[] {
  if (!events) {
    return [];
  }

  const todayIso = toIsoDate(now);
  const reminders: EventReminder[] = [];

  for (let offset = 0; offset < days; offset++) {
    const eventDate = addDays(todayIso, offset);
    const startingToday = eventsOnDate(events, eventDate).filter(
      (event) => event.source === 'school' && startsOn(event, eventDate)
    );

    if (startingToday.length === 0) {
      continue;
    }

    const fireAt = fromIsoDate(eventDate);

    fireAt.setHours(letters?.[eventDate] ? SCHOOL_DAY_HOUR : DAY_OFF_HOUR, 0, 0, 0);

    if (fireAt <= now) {
      continue;
    }

    const description =
      startingToday.length === 1
        ? describeSingle(startingToday[0])
        : describeSeveral(startingToday);

    reminders.push({ eventDate, fireAt, ...description });
  }

  return reminders;
}
