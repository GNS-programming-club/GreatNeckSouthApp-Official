import assert from 'node:assert/strict';
import { test } from 'node:test';

import { planEventReminders } from './event-reminders.ts';
import type { CalendarEvent } from './school-data.ts';

const letters = { '2030-09-03': 'A', '2030-09-04': 'B' } as const;

function schoolEvent(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: 'invented',
    title: 'Invented Kite Night',
    source: 'school',
    allDay: false,
    start: '2030-09-03T19:00:00-04:00',
    end: '2030-09-03T21:00:00-04:00',
    location: 'Invented Gym',
    ...overrides,
  };
}

test('sends one heads-up at 7 AM on a school day with a school event', () => {
  const [reminder] = planEventReminders({
    now: new Date(2030, 8, 2, 9, 0),
    events: [schoolEvent({})],
    letters,
    days: 7,
  });

  assert.deepEqual(reminder.fireAt, new Date(2030, 8, 3, 7, 0));
});

test('sends the heads-up at 10 AM on a day without school', () => {
  const [reminder] = planEventReminders({
    now: new Date(2030, 8, 2, 9, 0),
    events: [schoolEvent({ start: '2030-09-07T19:00:00-04:00', end: '2030-09-07T21:00:00-04:00' })],
    letters,
    days: 7,
  });

  assert.deepEqual(reminder.fireAt, new Date(2030, 8, 7, 10, 0));
});

test('titles a single event by name with its time and place in the body', () => {
  const [reminder] = planEventReminders({
    now: new Date(2030, 8, 2, 9, 0),
    events: [schoolEvent({})],
    letters,
    days: 7,
  });

  assert.equal(reminder.title, 'Today: Invented Kite Night');
  assert.equal(reminder.body, '7:00 PM · Invented Gym');
});

test('leaves the place out of the body when the event has none', () => {
  const [reminder] = planEventReminders({
    now: new Date(2030, 8, 2, 9, 0),
    events: [schoolEvent({ location: null })],
    letters,
    days: 7,
  });

  assert.equal(reminder.body, '7:00 PM');
});

test('folds several events on one day into one heads-up', () => {
  const reminders = planEventReminders({
    now: new Date(2030, 8, 2, 9, 0),
    events: [
      schoolEvent({ start: '2030-09-03T14:45:00-04:00', title: 'Invented Chess Meet' }),
      schoolEvent({}),
    ],
    letters,
    days: 7,
  });

  assert.equal(reminders.length, 1);
  assert.equal(reminders[0].title, '2 school events today');
  assert.equal(reminders[0].body, 'Invented Chess Meet 2:45 PM · Invented Kite Night 7:00 PM');
});

test('ignores district and holiday events', () => {
  const reminders = planEventReminders({
    now: new Date(2030, 8, 2, 9, 0),
    events: [
      schoolEvent({ source: 'district', title: 'Invented Board Meeting' }),
      schoolEvent({ source: 'holiday', title: 'Invented Holiday', allDay: true }),
    ],
    letters,
    days: 7,
  });

  assert.deepEqual(reminders, []);
});

test('announces a multi-day event only on its first day', () => {
  const reminders = planEventReminders({
    now: new Date(2030, 8, 2, 9, 0),
    events: [
      schoolEvent({
        allDay: true,
        start: '2030-09-03',
        end: '2030-09-05',
        title: 'Invented Spirit Week',
      }),
    ],
    letters,
    days: 7,
  });

  assert.deepEqual(
    reminders.map((reminder) => reminder.eventDate),
    ['2030-09-03']
  );
  assert.equal(reminders[0].body, 'All day · Invented Gym');
});

test('skips a heads-up whose time has already passed', () => {
  const reminders = planEventReminders({
    now: new Date(2030, 8, 3, 8, 0),
    events: [schoolEvent({})],
    letters,
    days: 7,
  });

  assert.deepEqual(reminders, []);
});

test('includes an event later today when the heads-up time is still ahead', () => {
  const reminders = planEventReminders({
    now: new Date(2030, 8, 3, 6, 0),
    events: [schoolEvent({})],
    letters,
    days: 7,
  });

  assert.deepEqual(
    reminders.map((reminder) => reminder.eventDate),
    ['2030-09-03']
  );
});

test('leaves out events beyond the planning window', () => {
  const reminders = planEventReminders({
    now: new Date(2030, 8, 2, 9, 0),
    events: [schoolEvent({ start: '2030-09-20T19:00:00-04:00', end: '2030-09-20T21:00:00-04:00' })],
    letters,
    days: 7,
  });

  assert.deepEqual(reminders, []);
});

test('plans nothing before the calendar has loaded', () => {
  const reminders = planEventReminders({
    now: new Date(2030, 8, 2, 9, 0),
    events: null,
    letters,
    days: 7,
  });

  assert.deepEqual(reminders, []);
});
