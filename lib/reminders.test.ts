import assert from 'node:assert/strict';
import { test } from 'node:test';

import { planEveningReminders } from './reminders.ts';

const letters = {
  '2030-09-03': 'A',
  '2030-09-04': 'B',
  '2030-09-06': 'A',
  '2030-09-16': 'B',
} as const;

const noFirstPeriods = { A: null, B: null };

test('schedules a reminder at 8 PM the evening before each lettered day', () => {
  const reminders = planEveningReminders({
    now: new Date(2030, 8, 2, 9, 0),
    letters,
    firstPeriodByLetter: noFirstPeriods,
    days: 7,
  });

  assert.deepEqual(
    reminders.map((reminder) => reminder.fireAt),
    [new Date(2030, 8, 2, 20, 0), new Date(2030, 8, 3, 20, 0), new Date(2030, 8, 5, 20, 0)]
  );
});

test('titles each reminder with the next day letter', () => {
  const [reminder] = planEveningReminders({
    now: new Date(2030, 8, 2, 9, 0),
    letters,
    firstPeriodByLetter: noFirstPeriods,
    days: 1,
  });

  assert.equal(reminder.title, 'Tomorrow is an A day');
});

test('skips a reminder whose evening has already passed', () => {
  const reminders = planEveningReminders({
    now: new Date(2030, 8, 2, 21, 0),
    letters,
    firstPeriodByLetter: noFirstPeriods,
    days: 7,
  });

  assert.equal(reminders[0].schoolDate, '2030-09-04');
});

test('leaves out lettered days beyond the planning window', () => {
  const reminders = planEveningReminders({
    now: new Date(2030, 8, 2, 9, 0),
    letters,
    firstPeriodByLetter: noFirstPeriods,
    days: 7,
  });

  assert.equal(
    reminders.some((reminder) => reminder.schoolDate === '2030-09-16'),
    false
  );
});

test('names the first period class when the schedule has one', () => {
  const [reminder] = planEveningReminders({
    now: new Date(2030, 8, 2, 9, 0),
    letters,
    firstPeriodByLetter: { A: 'Invented Chemistry', B: null },
    days: 1,
  });

  assert.equal(reminder.body, 'First period: Invented Chemistry');
});

test('points to the app when the first period is empty', () => {
  const [reminder] = planEveningReminders({
    now: new Date(2030, 8, 2, 9, 0),
    letters,
    firstPeriodByLetter: noFirstPeriods,
    days: 1,
  });

  assert.equal(reminder.body, 'Check your schedule in the app');
});

test('plans nothing before the day letters have loaded', () => {
  const reminders = planEveningReminders({
    now: new Date(2030, 8, 2, 9, 0),
    letters: null,
    firstPeriodByLetter: noFirstPeriods,
    days: 7,
  });

  assert.deepEqual(reminders, []);
});
