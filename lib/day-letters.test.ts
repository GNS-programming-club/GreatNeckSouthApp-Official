import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addDays,
  dayStatusFor,
  nextSchoolDay,
  parseDayLettersFile,
  toIsoDate,
  weekDates,
} from './day-letters.ts';

const letters = {
  '2030-09-03': 'A',
  '2030-09-04': 'B',
  '2030-09-06': 'A',
  '2030-09-09': 'B',
} as const;

test('reports a lettered date as a school day with its letter', () => {
  assert.deepEqual(dayStatusFor('2030-09-04', letters), { kind: 'school', letter: 'B' });
});

test('reports an unlettered weekday inside the school year as no school', () => {
  assert.deepEqual(dayStatusFor('2030-09-05', letters), { kind: 'no-school' });
});

test('reports a weekend inside the school year as no school', () => {
  assert.deepEqual(dayStatusFor('2030-09-07', letters), { kind: 'no-school' });
});

test('reports a date outside the school year as unknown', () => {
  assert.deepEqual(dayStatusFor('2030-09-10', letters), { kind: 'unknown' });
  assert.deepEqual(dayStatusFor('2030-09-02', letters), { kind: 'unknown' });
});

test('reports every date as unknown before letters have loaded', () => {
  assert.deepEqual(dayStatusFor('2030-09-04', null), { kind: 'unknown' });
});

test('finds the next school day after a gap', () => {
  assert.deepEqual(nextSchoolDay('2030-09-06', letters), { date: '2030-09-09', letter: 'B' });
});

test('finds no next school day after the last lettered date', () => {
  assert.equal(nextSchoolDay('2030-09-09', letters), null);
});

test('adds days across a month boundary', () => {
  assert.equal(addDays('2030-09-29', 3), '2030-10-02');
});

test('formats a date by its device-local calendar day', () => {
  assert.equal(toIsoDate(new Date(2030, 0, 5, 23, 30)), '2030-01-05');
});

test('accepts a well-formed day letters file', () => {
  assert.deepEqual(parseDayLettersFile({ generatedAt: 'x', letters: { '2030-09-03': 'A' } }), {
    generatedAt: 'x',
    letters: { '2030-09-03': 'A' },
  });
});

test('rejects a day letters file with a letter other than A or B', () => {
  assert.equal(parseDayLettersFile({ generatedAt: 'x', letters: { '2030-09-03': 'C' } }), null);
});

test('rejects a day letters file without letters', () => {
  assert.equal(parseDayLettersFile({ generatedAt: 'x' }), null);
  assert.equal(parseDayLettersFile('not json'), null);
});

test('lists the seven dates of a week that starts on the day clocks fall back', () => {
  assert.deepEqual(weekDates('2026-11-04', 0), [
    '2026-11-01',
    '2026-11-02',
    '2026-11-03',
    '2026-11-04',
    '2026-11-05',
    '2026-11-06',
    '2026-11-07',
  ]);
});

test('moves a whole week per week offset', () => {
  assert.equal(weekDates('2026-11-04', -1)[0], '2026-10-25');
});
