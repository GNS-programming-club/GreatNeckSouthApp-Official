import assert from 'node:assert/strict';
import { test } from 'node:test';

import { radiusScaleFor } from './radius-scale.ts';
import { THEMES } from './theme-catalog.ts';

test('a square-shaped theme squares every corner, including one-off sizes', () => {
  const classic = radiusScaleFor(THEMES.classic.traits.shape.radius);

  assert.equal(classic.md, 0);
  assert.equal(classic.pill, 0);
  assert.equal(classic.custom(12), 0);
});

test('a rounded theme keeps the standard corner sizes and one-off sizes', () => {
  const daydream = radiusScaleFor(THEMES.daydream.traits.shape.radius);

  assert.equal(daydream.lg, 16);
  assert.equal(daydream.pill, 999);
  assert.equal(daydream.custom(12), 12);
});
