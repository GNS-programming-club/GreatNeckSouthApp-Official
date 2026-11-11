import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  buildOutputs,
  hasContentChanged,
  type AnnouncementsFile,
  type CalendarFile,
  type FetchedSources,
} from './build-outputs.ts';
import type { CalendarEvent, CalendarSource } from './calendar.ts';

const now = new Date('2026-10-01T00:00:00Z');

function allOk(): FetchedSources {
  const calendar = readFileSync(
    join(import.meta.dirname, 'fixtures', 'example-calendar.ics'),
    'utf8'
  );

  return {
    school: { ok: true, text: calendar },
    holiday: { ok: true, text: calendar },
    district: { ok: true, text: calendar },
    announcements: { ok: true, text: 'Robotics club meets Tuesday.\n\nBake sale today!\n' },
  };
}

function previousEvent(id: string, source: CalendarSource): CalendarEvent {
  return {
    id,
    title: 'Previous event',
    source,
    allDay: true,
    start: '2026-10-05',
    end: '2026-10-05',
    location: null,
  };
}

function previousCalendar(event: CalendarEvent): {
  calendar: CalendarFile;
  announcements: AnnouncementsFile | null;
} {
  return { calendar: { generatedAt: 'earlier', events: [event] }, announcements: null };
}

function noPrevious(): { calendar: null; announcements: null } {
  return { calendar: null, announcements: null };
}

test('keeps the previous events of a calendar that served an HTML error page', () => {
  const result = buildOutputs(
    { ...allOk(), holiday: { ok: true, text: '<html>Error</html>' } },
    previousCalendar(previousEvent('previous-holiday', 'holiday')),
    now
  );
  assert.deepEqual(
    result.calendar.events.filter((event) => event.source === 'holiday').map((event) => event.id),
    ['previous-holiday']
  );
  assert.deepEqual(result.failures, ['holiday: Not an iCalendar document']);
});

test('keeps the previous events of a calendar that failed to download', () => {
  const result = buildOutputs(
    { ...allOk(), school: { ok: false, reason: 'timeout' } },
    previousCalendar(previousEvent('previous-school', 'school')),
    now
  );
  assert.equal(
    result.calendar.events.some((event) => event.id === 'previous-school'),
    true
  );
  assert.deepEqual(result.failures, ['school: timeout']);
});

test('treats a calendar with zero events as a failure', () => {
  const result = buildOutputs(
    { ...allOk(), district: { ok: true, text: 'BEGIN:VCALENDAR\nEND:VCALENDAR' } },
    noPrevious(),
    now
  );
  assert.deepEqual(result.failures, ['district: no events']);
});

test('keeps the previous announcements when the deck parses to nothing', () => {
  const result = buildOutputs(
    {
      ...allOk(),
      announcements: { ok: true, text: 'Mission Statement\n\nThe district provides...' },
    },
    {
      calendar: null,
      announcements: { generatedAt: 'earlier', items: [{ id: 'abcd1234', text: 'Previous item' }] },
    },
    now
  );
  assert.deepEqual(
    result.announcements.items.map((item) => item.text),
    ['Previous item']
  );
  assert.deepEqual(result.failures, ['announcements: no items']);
});

test('reports no failures when every source succeeds', () => {
  assert.deepEqual(buildOutputs(allOk(), noPrevious(), now).failures, []);
});

test('ignores generatedAt when deciding whether a file changed', () => {
  assert.equal(
    hasContentChanged({ generatedAt: 'a', items: [] }, { generatedAt: 'b', items: [] }),
    false
  );
  assert.equal(hasContentChanged(null, { generatedAt: 'b' }), true);
});
