import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  eventsOnDate,
  formatEventTime,
  formatUpdatedAgo,
  holidaysOnDate,
  isForHighSchool,
  nextEventAfter,
  parseAnnouncementsFile,
  parseCalendarFile,
  type CalendarEvent,
} from './school-data.ts';

function event(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: overrides.title ?? 'event',
    title: 'Chess Club Tournament',
    source: 'school',
    allDay: true,
    start: '2030-09-03',
    end: '2030-09-03',
    location: null,
    ...overrides,
  };
}

test('accepts a well-formed calendar file', () => {
  const file = { generatedAt: 'x', events: [event({})] };
  assert.deepEqual(parseCalendarFile(file), file);
});

test('rejects a calendar file whose events are malformed', () => {
  assert.equal(parseCalendarFile({ generatedAt: 'x', events: [{ title: 'No dates' }] }), null);
  assert.equal(parseCalendarFile(null), null);
});

test('accepts a well-formed announcements file', () => {
  const file = { generatedAt: 'x', items: [{ id: 'a1', text: 'Yearbook photos Friday' }] };
  assert.deepEqual(parseAnnouncementsFile(file), file);
});

test('rejects an announcements file whose items lack text', () => {
  assert.equal(parseAnnouncementsFile({ generatedAt: 'x', items: [{ id: 'a1' }] }), null);
});

test('shows a multi-day event on a day in the middle of its range', () => {
  const fair = event({ title: 'Science Fair', start: '2030-09-03', end: '2030-09-05' });
  assert.deepEqual(eventsOnDate([fair], '2030-09-04'), [fair]);
});

test('shows an overnight event on both days it touches', () => {
  const lockIn = event({
    title: 'Robotics Lock-In',
    allDay: false,
    start: '2030-09-03T21:00:00-04:00',
    end: '2030-09-04T02:00:00-04:00',
  });
  assert.deepEqual(eventsOnDate([lockIn], '2030-09-03'), [lockIn]);
  assert.deepEqual(eventsOnDate([lockIn], '2030-09-04'), [lockIn]);
});

test('leaves a timed event that ends at midnight off the next day', () => {
  const dance = event({
    allDay: false,
    start: '2030-09-03T20:00:00-04:00',
    end: '2030-09-04T00:00:00-04:00',
  });
  assert.deepEqual(eventsOnDate([dance], '2030-09-04'), []);
});

test('hides district events meant only for younger students', () => {
  assert.equal(
    isForHighSchool(event({ source: 'district', title: 'Gr. K-5 Early Dismissal' })),
    false
  );
  assert.equal(
    isForHighSchool(event({ source: 'district', title: 'MS Spring Sports Begin' })),
    false
  );
  assert.equal(isForHighSchool(event({ source: 'district', title: 'Pre-K Open House' })), false);
  assert.equal(
    isForHighSchool(event({ source: 'district', title: 'HS Spring Sports Begin' })),
    true
  );
});

test('lists closures and holidays as holidays, not events', () => {
  const closure = event({ source: 'district', title: 'SCHOOLS CLOSED - Autumn Recess' });
  const holiday = event({ source: 'holiday', title: 'Harvest Day' });
  const concert = event({ title: 'Band Concert' });
  assert.deepEqual(eventsOnDate([closure, holiday, concert], '2030-09-03'), [concert]);
  assert.deepEqual(holidaysOnDate([closure, holiday, concert], '2030-09-03'), [closure, holiday]);
});

test('finds the next visible event after a date', () => {
  const today = event({ title: 'Today Event', start: '2030-09-03', end: '2030-09-03' });
  const younger = event({
    source: 'district',
    title: 'Gr. K-5 Picnic',
    start: '2030-09-04',
    end: '2030-09-04',
  });
  const later = event({ title: 'Later Event', start: '2030-09-05', end: '2030-09-05' });
  assert.equal(nextEventAfter([today, younger, later], '2030-09-03'), later);
});

test('describes how long ago the data was updated', () => {
  const now = new Date('2030-09-03T12:00:00Z');
  assert.equal(formatUpdatedAgo('2030-09-03T11:59:40Z', now), 'Updated just now');
  assert.equal(formatUpdatedAgo('2030-09-03T11:55:00Z', now), 'Updated 5 min ago');
  assert.equal(formatUpdatedAgo('2030-09-03T09:00:00Z', now), 'Updated 3 h ago');
  assert.equal(formatUpdatedAgo('2030-09-02T12:00:00Z', now), 'Updated 1 day ago');
  assert.equal(formatUpdatedAgo('2030-09-01T12:00:00Z', now), 'Updated 2 days ago');
});

test('labels an event by its start time on a 12-hour clock', () => {
  assert.equal(
    formatEventTime(event({ allDay: false, start: '2030-09-03T19:05:00-04:00' })),
    '7:05 PM'
  );
  assert.equal(
    formatEventTime(event({ allDay: false, start: '2030-09-03T00:30:00-04:00' })),
    '12:30 AM'
  );
  assert.equal(formatEventTime(event({})), 'All day');
});
