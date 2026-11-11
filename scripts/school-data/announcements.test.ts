import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseAnnouncements } from './announcements.ts';

test('drops the mission statement heading and its paragraph', () => {
  const deck =
    '\nMission Statement\n\nOur district supports the growth of every student.\n\n\n' +
    'Robotics club meets Tuesday in room 112.\n   \n\n\nBake sale today!\n\n';
  assert.deepEqual(
    parseAnnouncements(deck).map((item) => item.text),
    ['Robotics club meets Tuesday in room 112.', 'Bake sale today!']
  );
});

test('joins hard-wrapped lines within one item', () => {
  const [item] = parseAnnouncements(
    'The art club is selling cookies for $1\nnear the gym  \nduring lunch in the student’s lounge.\n'
  );
  assert.equal(
    item.text,
    'The art club is selling cookies for $1 near the gym during lunch in the student’s lounge.'
  );
});

test('gives each item an 8-character id that depends only on its text', () => {
  const [first] = parseAnnouncements('Fall treats are here!');
  const [again] = parseAnnouncements('\n\nFall treats are here!\n');
  assert.match(first.id, /^[0-9a-f]{8}$/);
  assert.equal(first.id, again.id);
});

test('returns no items for an empty deck or one holding only the mission statement', () => {
  assert.deepEqual(parseAnnouncements(''), []);
  assert.deepEqual(
    parseAnnouncements('Mission Statement\n\nOur district supports the growth of every student.'),
    []
  );
});
