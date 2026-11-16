import assert from 'node:assert/strict';
import { test } from 'node:test';

import { centeredIndexAt } from './dial-index.ts';

test('picks the item whose slot the scroll position is closest to', () => {
  assert.equal(centeredIndexAt(250, 100, 10), 3);
});

test('stays on the current item until the scroll passes halfway to the next', () => {
  assert.equal(centeredIndexAt(249, 100, 10), 2);
});

test('keeps the first item when the list bounces past its start', () => {
  assert.equal(centeredIndexAt(-80, 100, 10), 0);
});

test('keeps the last item when the list bounces past its end', () => {
  assert.equal(centeredIndexAt(1200, 100, 10), 9);
});
