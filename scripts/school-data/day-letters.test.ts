import assert from 'node:assert/strict';
import { test } from 'node:test';

import { findSchedulePdfUrl, parseDayLetters } from './day-letters.ts';

const RED = 'rgb(94.117737%, 0%, 0%)';
const BLUE = 'rgb(39.99939%, 39.99939%, 100%)';
const GRAY = 'rgb(79.998779%, 79.998779%, 79.998779%)';
const YELLOW = 'rgb(100%, 100%, 19.999695%)';
const CYAN = 'rgb(60.00061%, 100%, 100%)';

function word(xMin: number, yMin: number, text: string): string {
  return `<word xMin="${xMin}" yMin="${yMin}" xMax="${xMin + 9}" yMax="${yMin + 7}">${text}</word>`;
}

function wordBoxes(...words: string[]): string {
  return `<doc><page width="612" height="792">${[
    word(40, 20, '08/01/2030'),
    word(90, 20, 'through'),
    word(130, 20, '07/31/2031'),
    ...words,
  ].join('\n')}</page></doc>`;
}

function cell(xMin: number, yMin: number, fill: string): string {
  return `<path fill-rule="nonzero" fill="${fill}" fill-opacity="1" d="M ${xMin} ${yMin} L ${xMin + 20} ${yMin} L ${xMin + 20} ${yMin + 12} L ${xMin} ${yMin + 12} Z M ${xMin} ${yMin} "/>`;
}

function drawing(...cells: string[]): string {
  return `<svg viewBox="0 0 612 792">${cells.join('\n')}</svg>`;
}

test('reads a red cell as an A day and a blue cell as a B day', () => {
  const letters = parseDayLetters(
    wordBoxes(word(100, 100, 'September'), word(92, 130, '3'), word(116, 130, '4')),
    drawing(cell(88, 128, RED), cell(112, 128, BLUE))
  );
  assert.deepEqual(letters, { '2030-09-03': 'A', '2030-09-04': 'B' });
});

test('gives no letter to days in gray, yellow, cyan, or uncolored cells', () => {
  const letters = parseDayLetters(
    wordBoxes(
      word(100, 100, 'September'),
      word(92, 130, '5'),
      word(116, 130, '6'),
      word(140, 130, '7'),
      word(164, 130, '8')
    ),
    drawing(cell(88, 128, GRAY), cell(112, 128, YELLOW), cell(136, 128, CYAN))
  );
  assert.deepEqual(letters, {});
});

test('places months before the start month in the second year', () => {
  const letters = parseDayLetters(
    wordBoxes(word(100, 100, 'January'), word(92, 130, '4')),
    drawing(cell(88, 128, BLUE))
  );
  assert.deepEqual(letters, { '2031-01-04': 'B' });
});

test('assigns each day to the month heading its own column', () => {
  const letters = parseDayLetters(
    wordBoxes(
      word(100, 100, 'October'),
      word(290, 100, 'February'),
      word(160, 130, '9'),
      word(250, 130, '10')
    ),
    drawing(cell(156, 128, RED), cell(246, 128, BLUE))
  );
  assert.deepEqual(letters, { '2030-10-09': 'A', '2031-02-10': 'B' });
});

test('assigns each day to the nearest month heading above it', () => {
  const letters = parseDayLetters(
    wordBoxes(
      word(100, 100, 'November'),
      word(92, 130, '2'),
      word(100, 200, 'December'),
      word(92, 230, '2')
    ),
    drawing(cell(88, 128, RED), cell(88, 228, BLUE))
  );
  assert.deepEqual(letters, { '2030-11-02': 'A', '2030-12-02': 'B' });
});

test('ignores a day number that is not a real date in its month', () => {
  const letters = parseDayLetters(
    wordBoxes(word(100, 100, 'February'), word(92, 130, '30')),
    drawing(cell(88, 128, RED))
  );
  assert.deepEqual(letters, {});
});

test('throws when the document has no school year range', () => {
  assert.throws(() => parseDayLetters('<doc></doc>', drawing()), /no school year range/);
});

test('finds the A/B schedule PDF among other PDF links', () => {
  const page = `
    <a href="https://example.org/files/device_directions.pdf">Directions</a>
    <a href="https://example.org/files/v123/A_BSchedule.pdf">A/B Schedule</a>`;
  assert.equal(
    findSchedulePdfUrl(page, 'https://example.org/ab-schedule'),
    'https://example.org/files/v123/A_BSchedule.pdf'
  );
});

test('resolves a relative schedule PDF link against the page address', () => {
  assert.equal(
    findSchedulePdfUrl('<a href="/docs/AB-Schedule.pdf">x</a>', 'https://example.org/ab-schedule'),
    'https://example.org/docs/AB-Schedule.pdf'
  );
});

test('returns null when the page links no schedule PDF', () => {
  assert.equal(
    findSchedulePdfUrl(
      '<a href="https://example.org/menu.pdf">Menu</a>',
      'https://example.org/ab-schedule'
    ),
    null
  );
});

test('reads the letter from the smallest shape around a day when a backdrop is drawn first', () => {
  const backdrop = '<path fill="rgb(100%, 100%, 100%)" d="M 0 0 L 612 0 L 612 792 L 0 792 Z"/>';
  const letters = parseDayLetters(
    wordBoxes(word(100, 100, 'September'), word(92, 130, '3')),
    drawing(backdrop, cell(88, 128, RED))
  );
  assert.deepEqual(letters, { '2030-09-03': 'A' });
});
