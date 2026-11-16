import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sparklePath } from './sparkle-path.ts';

test('the sparkle starts at the top center of its box', () => {
  assert.match(sparklePath(12), /^M 6 0 /);
});

test('the sparkle has four curved sides', () => {
  assert.equal(sparklePath(12).match(/Q /g)?.length, 4);
});

test('the sparkle reaches the right edge at mid height', () => {
  assert.match(sparklePath(12), / 12 6 /);
});

test('the sparkle sides bend toward the center', () => {
  assert.match(sparklePath(10, 0.1), /^M 5 0 Q 6 4 10 5 /);
});
