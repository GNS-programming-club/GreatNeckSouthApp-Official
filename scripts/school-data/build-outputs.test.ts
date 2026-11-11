import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  buildOutputs,
  hasContentChanged,
  type DayLettersFile,
  type FetchedSources,
  type PreviousFiles,
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
    dayLetters: schoolYearPdf(120),
  };
}

function schoolYearPdf(letteredDayCount: number): FetchedSources['dayLetters'] {
  const words = [
    '<word xMin="40" yMin="20" xMax="80" yMax="27">09/01/2030</word>',
    '<word xMin="90" yMin="20" xMax="120" yMax="27">through</word>',
    '<word xMin="130" yMin="20" xMax="170" yMax="27">06/30/2031</word>',
  ];
  const cells: string[] = [];
  const months = ['September', 'October', 'November', 'December', 'January'];

  months.forEach((month, monthIndex) => {
    const top = 100 + monthIndex * 200;
    words.push(`<word xMin="100" yMin="${top}" xMax="140" yMax="${top + 7}">${month}</word>`);

    for (let day = 1; day <= 28 && monthIndex * 28 + day <= letteredDayCount; day++) {
      const left = 60 + ((day - 1) % 7) * 24;
      const rowTop = top + 20 + Math.floor((day - 1) / 7) * 14;
      words.push(
        `<word xMin="${left + 4}" yMin="${rowTop + 2}" xMax="${left + 13}" yMax="${rowTop + 9}">${day}</word>`
      );
      cells.push(
        `<path fill="rgb(94%, 0%, 0%)" d="M ${left} ${rowTop} L ${left + 20} ${rowTop} L ${left + 20} ${rowTop + 12} L ${left} ${rowTop + 12} Z"/>`
      );
    }
  });

  return { ok: true, wordBoxes: words.join('\n'), drawing: cells.join('\n') };
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

function previousCalendar(event: CalendarEvent): PreviousFiles {
  return {
    calendar: { generatedAt: 'earlier', events: [event] },
    announcements: null,
    dayLetters: null,
  };
}

function noPrevious(): PreviousFiles {
  return { calendar: null, announcements: null, dayLetters: null };
}

function previousDayLetters(): PreviousFiles {
  const dayLetters: DayLettersFile = { generatedAt: 'earlier', letters: { '2030-09-03': 'B' } };

  return { calendar: null, announcements: null, dayLetters };
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
      dayLetters: null,
    },
    now
  );
  assert.deepEqual(
    result.announcements.items.map((item) => item.text),
    ['Previous item']
  );
  assert.deepEqual(result.failures, ['announcements: no items']);
});

test('publishes the letters read from the schedule PDF', () => {
  const letters = buildOutputs(allOk(), noPrevious(), now).dayLetters.letters;
  assert.equal(Object.keys(letters).length, 120);
  assert.equal(letters['2030-09-03'], 'A');
  assert.equal(letters['2031-01-08'], 'A');
});

test('keeps the previous letters when the schedule PDF failed to download', () => {
  const result = buildOutputs(
    { ...allOk(), dayLetters: { ok: false, reason: 'no schedule PDF link' } },
    previousDayLetters(),
    now
  );
  assert.deepEqual(result.dayLetters.letters, { '2030-09-03': 'B' });
  assert.deepEqual(result.failures, ['dayLetters: no schedule PDF link']);
});

test('keeps the previous letters when the schedule PDF yields too few days', () => {
  const result = buildOutputs(
    { ...allOk(), dayLetters: schoolYearPdf(40) },
    previousDayLetters(),
    now
  );
  assert.deepEqual(result.dayLetters.letters, { '2030-09-03': 'B' });
  assert.deepEqual(result.failures, ['dayLetters: too few lettered days (40)']);
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
