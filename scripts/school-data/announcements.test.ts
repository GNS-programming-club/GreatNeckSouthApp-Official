import assert from 'node:assert/strict';
import { test } from 'node:test';

import { findClub, parseAnnouncements } from './announcements.ts';

const NO_CLUBS: string[] = [];

test('makes one announcement per slide', () => {
  const items = parseAnnouncements(
    [
      { title: null, paragraphs: ['Chess meets Tuesday in room 112.'] },
      { title: null, paragraphs: ['Bake sale today!'] },
    ],
    NO_CLUBS
  );

  assert.deepEqual(
    items.map((item) => item.text),
    ['Chess meets Tuesday in room 112.', 'Bake sale today!']
  );
});

test('joins hard-wrapped lines within one block', () => {
  const [item] = parseAnnouncements(
    [{ title: null, paragraphs: ['Seniors must hand in', 'the form by Friday.', ''] }],
    NO_CLUBS
  );

  assert.equal(item.text, 'Seniors must hand in the form by Friday.');
  assert.equal(item.title, null);
});

test('uses a short first block followed by more text as the title', () => {
  const [item] = parseAnnouncements(
    [{ title: null, paragraphs: ['Fall treats are here!', '', 'Cider donuts are $2 on Friday.'] }],
    NO_CLUBS
  );

  assert.equal(item.title, 'Fall treats are here!');
  assert.equal(item.text, 'Cider donuts are $2 on Friday.');
});

test('leaves the title empty when the first block is too long to be a headline', () => {
  const longOpening =
    'There will be an interest meeting for the spring show on Thursday after school';
  const [item] = parseAnnouncements(
    [{ title: null, paragraphs: [longOpening, '', 'Bring a pencil.'] }],
    NO_CLUBS
  );

  assert.equal(item.title, null);
  assert.equal(item.text, `${longOpening}\n\nBring a pencil.`);
});

test('prefers the slide title placeholder over guessing', () => {
  const [item] = parseAnnouncements(
    [{ title: 'Spirit Week', paragraphs: ['Monday is pajama day.', '', 'Tuesday is hat day.'] }],
    NO_CLUBS
  );

  assert.equal(item.title, 'Spirit Week');
  assert.equal(item.text, 'Monday is pajama day.\n\nTuesday is hat day.');
});

test('uses a lone title as the text when the slide has nothing else', () => {
  const [item] = parseAnnouncements([{ title: 'No school Monday', paragraphs: [] }], NO_CLUBS);

  assert.equal(item.title, null);
  assert.equal(item.text, 'No school Monday');
});

test('skips the mission statement slide and slides without text', () => {
  const items = parseAnnouncements(
    [
      {
        title: null,
        paragraphs: ['Mission Statement', '', 'Our district supports every student.'],
      },
      { title: null, paragraphs: [] },
      { title: null, paragraphs: ['', ''] },
      { title: null, paragraphs: ['Bake sale today!'] },
    ],
    NO_CLUBS
  );

  assert.deepEqual(
    items.map((item) => item.text),
    ['Bake sale today!']
  );
});

test('gives each item an 8-character id that depends only on its title and text', () => {
  const [first] = parseAnnouncements([{ title: null, paragraphs: ['Bake sale today!'] }], NO_CLUBS);
  const [again] = parseAnnouncements(
    [{ title: null, paragraphs: ['', 'Bake sale today!', ''] }],
    NO_CLUBS
  );

  assert.match(first.id, /^[0-9a-f]{8}$/);
  assert.equal(first.id, again.id);
});

test('tags an announcement with the club it names', () => {
  const [item] = parseAnnouncements(
    [{ title: null, paragraphs: ['The Kite Flying Club meets Friday on the field.'] }],
    ['Kite Flying Club', 'Origami Society']
  );

  assert.equal(item.club, 'Kite Flying Club');
});

test('leaves the club empty when no club is named', () => {
  const [item] = parseAnnouncements(
    [{ title: null, paragraphs: ['Picture day is Monday.'] }],
    ['Kite Flying Club']
  );

  assert.equal(item.club, null);
});

test('matches a multi-word club name in any letter case', () => {
  assert.equal(
    findClub('JOIN THE KITE FLYING CLUB TODAY', ['Kite Flying Club']),
    'Kite Flying Club'
  );
});

test('matches a long club name without its trailing club word', () => {
  assert.equal(
    findClub('Kite Flying tryouts are Monday.', ['Kite Flying Club']),
    'Kite Flying Club'
  );
});

test('does not shorten a two-word club name to one common word', () => {
  assert.equal(findClub('Read the history of kites.', ['History Club']), null);
});

test('matches a one-word club name only when club or team follows it', () => {
  assert.equal(findClub('Origami team meets at noon.', ['Origami']), 'Origami');
  assert.equal(findClub('Origami paper is on sale.', ['Origami']), null);
});

test('matches an all-capitals club name only in capitals and as a whole word', () => {
  assert.equal(findClub('KAZOO meets in room 4.', ['KAZOO']), 'KAZOO');
  assert.equal(findClub('Bring a kazoo to class.', ['KAZOO']), null);
  assert.equal(findClub('KAZOOS are on sale.', ['KAZOO']), null);
});

test('matches each part of a club name joined by a slash or parentheses', () => {
  assert.equal(
    findClub('The Snack Shop opens at 8.', ['Kite Club/Snack Shop']),
    'Kite Club/Snack Shop'
  );
  assert.equal(
    findClub('Submit poems to the Paper Planes magazine.', ['Paper Planes (Poetry Magazine)']),
    'Paper Planes (Poetry Magazine)'
  );
});

test('picks the club named earliest when several are named', () => {
  assert.equal(
    findClub('Origami Society and Kite Flying Club share a booth.', [
      'Kite Flying Club',
      'Origami Society',
    ]),
    'Origami Society'
  );
});
