import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildSearchIndex, filterSearchIndex } from './search-index.ts';

type Gadget = { name: string; maker: string };

const gadgets: Gadget[] = [
  { name: 'Whirling Teapot', maker: 'Orbit Kitchens' },
  { name: 'Silent Kettle', maker: 'Whirl Works' },
  { name: 'Folding Ladder', maker: 'Stepwise' },
];

const gadgetIndex = buildSearchIndex(gadgets, (gadget) => [gadget.name, gadget.maker]);

function namesOf(matches: Gadget[]) {
  return matches.map((gadget) => gadget.name);
}

test('an empty query returns every item in original order', () => {
  assert.deepEqual(namesOf(filterSearchIndex(gadgetIndex, '')), [
    'Whirling Teapot',
    'Silent Kettle',
    'Folding Ladder',
  ]);
});

test('a whitespace-only query returns every item', () => {
  assert.equal(filterSearchIndex(gadgetIndex, '   ').length, 3);
});

test('matching ignores letter case in both query and text', () => {
  assert.deepEqual(namesOf(filterSearchIndex(gadgetIndex, 'TEAPOT')), ['Whirling Teapot']);
});

test('surrounding spaces in the query are ignored', () => {
  assert.deepEqual(namesOf(filterSearchIndex(gadgetIndex, '  ladder ')), ['Folding Ladder']);
});

test('an item matches when any one of its fields contains the query', () => {
  assert.deepEqual(namesOf(filterSearchIndex(gadgetIndex, 'stepwise')), ['Folding Ladder']);
});

test('matches keep the order of the original items', () => {
  assert.deepEqual(namesOf(filterSearchIndex(gadgetIndex, 'whirl')), [
    'Whirling Teapot',
    'Silent Kettle',
  ]);
});

test('a query spanning two fields does not match', () => {
  assert.deepEqual(filterSearchIndex(gadgetIndex, 'kettle whirl'), []);
});

test('a query found nowhere returns no items', () => {
  assert.deepEqual(filterSearchIndex(gadgetIndex, 'submarine'), []);
});

test('matches return the original item objects', () => {
  assert.equal(filterSearchIndex(gadgetIndex, 'kettle')[0], gadgets[1]);
});
