import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sortCalendarEvents, toCalendarEvents, type CalendarEvent } from './calendar.ts';
import type { IcsEvent } from './ics.ts';

const now = new Date('2026-11-10T12:00:00Z');

function allDay(startDate: string, exclusiveEndDate: string): IcsEvent {
  return {
    uid: `all-day-${startDate}`,
    summary: 'Event',
    location: '',
    start: { kind: 'date', date: startDate },
    end: { kind: 'date', date: exclusiveEndDate },
  };
}

function timed(dateTime: string): IcsEvent {
  return {
    uid: `timed-${dateTime}`,
    summary: 'Event',
    location: '',
    start: { kind: 'local', dateTime, timeZone: 'America/New_York' },
    end: { kind: 'local', dateTime, timeZone: 'America/New_York' },
  };
}

function utc(dateTime: string): IcsEvent {
  return {
    uid: `utc-${dateTime}`,
    summary: 'Event',
    location: '',
    start: { kind: 'utc', dateTime },
    end: null,
  };
}

function record(start: string): CalendarEvent {
  return {
    id: start,
    title: 'Event',
    source: 'school',
    allDay: start.length === 10,
    start,
    end: start,
    location: null,
  };
}

test('makes the exclusive all-day end inclusive', () => {
  const [event] = toCalendarEvents(
    [allDay('2026-10-17', '2026-10-18')],
    'school',
    new Date('2026-10-01T00:00:00Z')
  );
  assert.equal(event.start, '2026-10-17');
  assert.equal(event.end, '2026-10-17');
  assert.equal(event.allDay, true);
});

test('crosses a month boundary when making the end inclusive', () => {
  const [event] = toCalendarEvents([allDay('2026-11-30', '2026-12-01')], 'school', now);
  assert.equal(event.end, '2026-11-30');
});

test('gives timed events the New York offset for their date', () => {
  const [winter] = toCalendarEvents([timed('2026-11-12T19:00:00')], 'school', now);
  assert.equal(winter.start, '2026-11-12T19:00:00-05:00');
  const [summer] = toCalendarEvents([timed('2027-06-24T10:00:00')], 'school', now);
  assert.equal(summer.start, '2027-06-24T10:00:00-04:00');
});

test('converts UTC times to New York time', () => {
  const [event] = toCalendarEvents([utc('2027-06-24T14:00:00')], 'school', now);
  assert.equal(event.start, '2027-06-24T10:00:00-04:00');
});

test('uses the start as the end when the feed has no end', () => {
  const [event] = toCalendarEvents([{ ...timed('2026-11-12T19:00:00'), end: null }], 'school', now);
  assert.equal(event.end, event.start);
});

test('strips the SH prefix, trims the title and nulls an empty location', () => {
  const [event] = toCalendarEvents(
    [
      {
        ...allDay('2026-12-01', '2026-12-02'),
        summary: 'SH Fall Sports Awards Night ',
        location: '',
      },
    ],
    'school',
    now
  );
  assert.equal(event.title, 'Fall Sports Awards Night');
  assert.equal(event.location, null);
});

test('drops events that ended more than 7 days ago', () => {
  const events = toCalendarEvents(
    [allDay('2026-11-02', '2026-11-03'), allDay('2026-11-04', '2026-11-05')],
    'school',
    now
  );
  assert.deepEqual(
    events.map((event) => event.start),
    ['2026-11-04']
  );
});

test('sorts by start across sources', () => {
  const sorted = sortCalendarEvents([
    record('2026-12-02'),
    record('2026-11-20T09:00:00-05:00'),
    record('2026-11-20'),
  ]);
  assert.deepEqual(
    sorted.map((event) => event.start),
    ['2026-11-20', '2026-11-20T09:00:00-05:00', '2026-12-02']
  );
});
