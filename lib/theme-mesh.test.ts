import assert from 'node:assert/strict';
import { test } from 'node:test';

import { contrastRatio } from './color.ts';
import { THEMES } from './theme-catalog.ts';
import { meshColorsFor, swatchColorsFor } from './theme-mesh.ts';

test('blends four colors into every theme gradient', () => {
  assert.equal(meshColorsFor(THEMES.light).length, 4);
});

test('tints the light theme gradient with its accent instead of leaving it flat', () => {
  const [, accentGlow] = meshColorsFor(THEMES.light);

  assert.notEqual(accentGlow.toLowerCase(), THEMES.light.palette.background.toLowerCase());
});

test('keeps the accent glow just strong enough that muted text stays readable on it', () => {
  const [, accentGlow] = meshColorsFor(THEMES.light);

  assert.ok(contrastRatio(THEMES.light.palette.mutedText, accentGlow) < 5.2);
});

test('starts an Ember gradient from the first color of its own backdrop', () => {
  const [base] = meshColorsFor(THEMES.ember);

  assert.equal(base.toLowerCase(), THEMES.ember.traits.backdrop?.gradient?.colors[0].toLowerCase());
});

test('paints a dial swatch with the full-strength accent so pale themes stay tellable apart', () => {
  const [, accent] = swatchColorsFor(THEMES.paper);

  assert.equal(accent.toLowerCase(), THEMES.paper.palette.primaryFill.toLowerCase());
});
