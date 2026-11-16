import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isThemeMode, resolveTheme } from './theme-modes.ts';

test('auto follows a dark device into the dark theme', () => {
  assert.equal(resolveTheme('auto', 'dark'), 'dark');
});

test('auto falls back to light when the device reports no scheme', () => {
  assert.equal(resolveTheme('auto', null), 'light');
});

test('ember stays ember on a dark device', () => {
  assert.equal(resolveTheme('ember', 'dark'), 'ember');
});

test('a saved ember preference is recognized', () => {
  assert.equal(isThemeMode('ember'), true);
});

test('an unknown saved preference is rejected', () => {
  assert.equal(isThemeMode('blue'), false);
});
