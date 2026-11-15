import assert from 'node:assert/strict';
import { test } from 'node:test';

import { digitColumns, glyphOffset, nearestRollTarget } from './rolling-number-math.ts';

test('splits a two-digit number into tens and ones columns', () => {
  assert.deepEqual(digitColumns(42), [
    { place: 10, digit: 4 },
    { place: 1, digit: 2 },
  ]);
});

test('keeps a single ones column for zero', () => {
  assert.deepEqual(digitColumns(0), [{ place: 1, digit: 0 }]);
});

test('rounds fractional values before splitting', () => {
  assert.deepEqual(digitColumns(7.6), [{ place: 1, digit: 8 }]);
});

test('drops the sign of negative values', () => {
  assert.deepEqual(digitColumns(-35), [
    { place: 10, digit: 3 },
    { place: 1, digit: 5 },
  ]);
});

test('treats non-finite values as zero', () => {
  assert.deepEqual(digitColumns(Number.NaN), [{ place: 1, digit: 0 }]);
});

test('rolls from 9 to 0 forward through the wrap instead of back through every digit', () => {
  assert.equal(nearestRollTarget(9, 0), 10);
});

test('rolls from 0 to 9 backward through the wrap', () => {
  assert.equal(nearestRollTarget(0, 9), -1);
});

test('rolls straight to a nearby digit without wrapping', () => {
  assert.equal(nearestRollTarget(3, 5), 5);
});

test('keeps the accumulated turn count when rolling after several wraps', () => {
  assert.equal(nearestRollTarget(23, 4), 24);
});

test('places the glyph matching the rolled position at zero offset', () => {
  assert.equal(glyphOffset(14, 4), 0);
});

test('places the next glyph one slot below the current one', () => {
  assert.equal(glyphOffset(4, 5), 1);
});

test('places the glyph across the wrap one slot above instead of nine below', () => {
  assert.equal(glyphOffset(0, 9), -1);
});

test('places a glyph halfway through a roll at a fractional offset', () => {
  assert.equal(glyphOffset(4.5, 5), 0.5);
});
