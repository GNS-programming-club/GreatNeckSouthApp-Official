import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildScenarios,
  easternWallTimeToDate,
  nextSaturday,
  upcomingSchoolDay,
  type PeriodBounds,
} from './dev-scenarios.ts';

const HOUR = 3600;
const MINUTE = 60;

const inventedPeriods: PeriodBounds[] = [
  { startSeconds: 8 * HOUR, endSeconds: 8 * HOUR + 40 * MINUTE },
  { startSeconds: 8 * HOUR + 45 * MINUTE, endSeconds: 9 * HOUR + 25 * MINUTE },
  { startSeconds: 9 * HOUR + 30 * MINUTE, endSeconds: 10 * HOUR + 10 * MINUTE },
];

function scenario(id: string) {
  const found = buildScenarios(inventedPeriods).find((candidate) => candidate.id === id);
  assert.ok(found, `missing scenario ${id}`);

  return found;
}

test('mid-class scenario lands two and a half minutes before the third bell at real speed', () => {
  assert.equal(scenario('mid-class').secondsOfDay, 10 * HOUR + 10 * MINUTE - 150);
  assert.equal(scenario('mid-class').speed, 1);
});

test('bell scenario lands fifteen seconds before the third bell', () => {
  assert.equal(scenario('bell').secondsOfDay, 10 * HOUR + 10 * MINUTE - 15);
});

test('passing scenario lands thirty seconds after the third bell', () => {
  assert.equal(scenario('passing').secondsOfDay, 10 * HOUR + 10 * MINUTE + 30);
});

test('before-school scenario lands twenty-five minutes before first period', () => {
  assert.equal(scenario('before-school').secondsOfDay, 8 * HOUR - 25 * MINUTE);
});

test('after-school scenario lands an hour after the last bell', () => {
  assert.equal(scenario('after-school').secondsOfDay, 10 * HOUR + 10 * MINUTE + HOUR);
});

test('full-day scenario starts five minutes before first period at sixty times speed', () => {
  assert.equal(scenario('full-day').secondsOfDay, 8 * HOUR - 5 * MINUTE);
  assert.equal(scenario('full-day').speed, 60);
});

test('weekend scenario is the only one set on a Saturday', () => {
  const weekendIds = buildScenarios(inventedPeriods)
    .filter((candidate) => candidate.day === 'weekend')
    .map((candidate) => candidate.id);

  assert.deepEqual(weekendIds, ['weekend']);
});

test('eastern wall time in winter is five hours behind UTC', () => {
  assert.equal(
    easternWallTimeToDate('2026-11-16', 9 * HOUR).toISOString(),
    '2026-11-16T14:00:00.000Z'
  );
});

test('eastern wall time in summer is four hours behind UTC', () => {
  assert.equal(
    easternWallTimeToDate('2026-06-15', 9 * HOUR + 30 * MINUTE + 15).toISOString(),
    '2026-06-15T13:30:15.000Z'
  );
});

test('upcoming school day is today when today has a letter', () => {
  assert.equal(
    upcomingSchoolDay('2026-11-16', { '2026-11-16': 'A', '2026-11-17': 'B' }),
    '2026-11-16'
  );
});

test('upcoming school day skips to the next lettered date', () => {
  assert.equal(
    upcomingSchoolDay('2026-11-14', { '2026-11-16': 'A', '2026-11-17': 'B' }),
    '2026-11-16'
  );
});

test('upcoming school day falls back to the next weekday without letters', () => {
  assert.equal(upcomingSchoolDay('2026-11-14', null), '2026-11-16');
});

test('next saturday from a monday is five days later', () => {
  assert.equal(nextSaturday('2026-11-16'), '2026-11-21');
});

test('next saturday from a saturday is the same day', () => {
  assert.equal(nextSaturday('2026-11-14'), '2026-11-14');
});
