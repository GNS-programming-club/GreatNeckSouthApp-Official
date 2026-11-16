import assert from 'node:assert/strict';
import { test } from 'node:test';

import { composite, contrastRatio, mix, parseColor, toHex, withAlpha } from './color.ts';

test('black on white has the maximum contrast of 21 to 1', () => {
  assert.equal(contrastRatio('#000000', '#FFFFFF'), 21);
});

test('a color on itself has the minimum contrast of 1 to 1', () => {
  assert.equal(contrastRatio('#3B82F6', '#3B82F6'), 1);
});

test('a translucent foreground is blended over its background before measuring', () => {
  assert.equal(contrastRatio('rgba(0,0,0,0)', '#FFFFFF'), 1);
});

test('rgba strings parse into channels and alpha', () => {
  assert.deepEqual(parseColor('rgba(28,16,11,0.86)'), {
    red: 28,
    green: 16,
    blue: 11,
    alpha: 0.86,
  });
});

test('half black over white composites to middle grey', () => {
  assert.equal(toHex(composite('rgba(0,0,0,0.5)', '#FFFFFF')), '#808080');
});

test('mixing halfway between black and white gives middle grey', () => {
  assert.equal(mix('#000000', '#FFFFFF', 0.5), '#808080');
});

test('withAlpha rewrites a hex color as rgba', () => {
  assert.equal(withAlpha('#FF7A1A', 0.3), 'rgba(255,122,26,0.3)');
});

test('an unsupported color string is rejected', () => {
  assert.throws(() => parseColor('orange'));
});
