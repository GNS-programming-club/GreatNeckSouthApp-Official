import assert from 'node:assert/strict';
import { test } from 'node:test';

import { composite, contrastRatio, mix, toHex } from './color.ts';
import { THEME_IDS, THEMES, type ThemeDefinition } from './theme-catalog.ts';
import { meshColorsFor } from './theme-mesh.ts';

const READABLE = 4.5;

function solid(foreground: string, background: string) {
  return toHex(composite(foreground, background));
}

function overlapsOf(colors: string[]) {
  return colors.flatMap((color, index) =>
    colors.slice(index + 1).map((other) => mix(color, other, 0.5))
  );
}

function canvasColors(theme: ThemeDefinition) {
  const { palette, traits } = theme;
  const meshColors = meshColorsFor(theme);

  return [
    palette.background,
    ...(traits.backdrop?.gradient?.colors ?? []),
    ...meshColors,
    ...overlapsOf(meshColors),
  ];
}

function worstContrast(foreground: string, backgrounds: string[]) {
  return Math.min(...backgrounds.map((background) => contrastRatio(foreground, background)));
}

for (const id of THEME_IDS) {
  const theme: ThemeDefinition = THEMES[id];
  const { palette } = theme;
  const canvas = canvasColors(theme);
  const cards = canvas.map((background) => solid(palette.surface, background));
  const badges = cards.map((card) => solid(palette.surfaceAlt, card));
  const chipsOnCards = cards.map((card) => solid(palette.accentSoft, card));

  test(`${id}: body and muted text are readable on cards wherever they scroll`, () => {
    assert.ok(worstContrast(palette.text, cards) >= READABLE);
    assert.ok(worstContrast(palette.mutedText, cards) >= READABLE);
  });

  test(`${id}: body and muted text are readable anywhere on the bare screen`, () => {
    assert.ok(worstContrast(palette.text, canvas) >= READABLE);
    assert.ok(worstContrast(palette.mutedText, canvas) >= READABLE);
  });

  test(`${id}: body, muted and accent text are readable on badges inside cards`, () => {
    assert.ok(worstContrast(palette.text, badges) >= READABLE);
    assert.ok(worstContrast(palette.mutedText, badges) >= READABLE);
    assert.ok(worstContrast(palette.primary, badges) >= READABLE);
  });

  test(`${id}: accent text is readable on cards, the screen and tinted chips`, () => {
    const tintedChips = canvas.map((background) => solid(palette.accentSoft, background));

    assert.ok(worstContrast(palette.primary, cards) >= READABLE);
    assert.ok(worstContrast(palette.primary, canvas) >= READABLE);
    assert.ok(worstContrast(palette.primary, tintedChips) >= READABLE);
    assert.ok(worstContrast(palette.primary, chipsOnCards) >= READABLE);
    assert.ok(worstContrast(palette.text, chipsOnCards) >= READABLE);
  });

  test(`${id}: hero text and its muted line are readable on the hero fill`, () => {
    const mutedOnFill = solid(palette.onPrimaryMuted, palette.primaryFill);

    assert.ok(contrastRatio(palette.primaryText, palette.primaryFill) >= READABLE);
    assert.ok(contrastRatio(mutedOnFill, palette.primaryFill) >= READABLE);
  });

  test(`${id}: the active tab icon is readable on the tab pill`, () => {
    assert.ok(contrastRatio(palette.background, palette.primary) >= READABLE);
  });

  test(`${id}: inactive tab labels are readable on the tab bar`, () => {
    const barFill = theme.traits.glass?.fill ?? palette.surface;
    const bars = canvas.map((background) => solid(barFill, background));

    assert.ok(worstContrast(palette.mutedText, bars) >= READABLE);
  });
}
