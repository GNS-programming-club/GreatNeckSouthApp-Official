import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { parseIcs } from './ics.ts';

function readFixture(name: string): string {
  return readFileSync(join(import.meta.dirname, 'fixtures', name), 'utf8');
}

function eventWith(line: string): string {
  return [
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT',
    'UID:x',
    'DTSTART;VALUE=DATE:20261101',
    'SUMMARY:x',
    line,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

test('parses every event in the example calendar', () => {
  const events = parseIcs(readFixture('example-calendar.ics'));
  assert.equal(events.length, 3);
  assert.equal(events[0].summary, 'SH Club Fair');
  assert.deepEqual(events[0].start, { kind: 'date', date: '2026-10-17' });
  assert.deepEqual(events[0].end, { kind: 'date', date: '2026-10-18' });
});

test('joins folded lines and strips carriage returns', () => {
  const text =
    'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:a\r\nDTSTART;VALUE=DATE:20261101\r\nSUMMARY:SH Gr. 12 Photo Make-ups\r\n  by Appt.\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
  assert.equal(parseIcs(text)[0].summary, 'SH Gr. 12 Photo Make-ups by Appt.');
});

test('decodes escaped commas, semicolons, newlines and backslashes', () => {
  assert.equal(parseIcs(eventWith('SUMMARY:A\\, B\\; C\\nD\\\\E'))[0].summary, 'A, B; C\nD\\E');
});

test('reads timed starts with a timezone and UTC starts', () => {
  const [local] = parseIcs(eventWith('DTSTART;TZID=America/New_York:20261112T190000'));
  assert.deepEqual(local.start, {
    kind: 'local',
    dateTime: '2026-11-12T19:00:00',
    timeZone: 'America/New_York',
  });
  const [utc] = parseIcs(eventWith('DTSTART:20270624T140000Z'));
  assert.deepEqual(utc.start, { kind: 'utc', dateTime: '2027-06-24T14:00:00' });
});

test('leaves end null and location empty when the feed omits them', () => {
  const [event] = parseIcs(eventWith('LOCATION:'));
  assert.equal(event.end, null);
  assert.equal(event.location, '');
});

test('rejects text that is not a calendar', () => {
  assert.throws(() => parseIcs('<html>Service Unavailable</html>'), /Not an iCalendar document/);
});
