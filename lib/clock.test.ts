import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createClock } from './clock.ts';

function manualTime(startMilliseconds: number) {
  let currentMilliseconds = startMilliseconds;

  return {
    read: () => currentMilliseconds,
    advance: (milliseconds: number) => {
      currentMilliseconds += milliseconds;
    },
  };
}

test('clock without an override reports real time', () => {
  const realTime = manualTime(1_000_000);
  const clock = createClock(realTime.read);

  assert.equal(clock.now().getTime(), 1_000_000);
  assert.equal(clock.isOverridden(), false);
});

test('overridden clock starts at the fake time and advances with real time', () => {
  const realTime = manualTime(1_000_000);
  const clock = createClock(realTime.read);

  clock.override(new Date(5_000_000));
  realTime.advance(2_000);

  assert.equal(clock.now().getTime(), 5_002_000);
  assert.equal(clock.isOverridden(), true);
});

test('overridden clock runs faster by the chosen speed', () => {
  const realTime = manualTime(0);
  const clock = createClock(realTime.read);

  clock.override(new Date(10_000), 60);
  realTime.advance(1_000);

  assert.equal(clock.now().getTime(), 70_000);
});

test('changing speed continues from the current fake time without jumping', () => {
  const realTime = manualTime(0);
  const clock = createClock(realTime.read);

  clock.override(new Date(10_000), 60);
  realTime.advance(1_000);
  clock.setSpeed(1);
  realTime.advance(1_000);

  assert.equal(clock.now().getTime(), 71_000);
  assert.equal(clock.speed(), 1);
});

test('clearing the override returns to real time', () => {
  const realTime = manualTime(1_000_000);
  const clock = createClock(realTime.read);

  clock.override(new Date(5_000_000));
  clock.clear();

  assert.equal(clock.now().getTime(), 1_000_000);
  assert.equal(clock.isOverridden(), false);
});

test('listeners hear every override, speed change and clear until they unsubscribe', () => {
  const clock = createClock(() => 0);
  let notifications = 0;
  const unsubscribe = clock.subscribe(() => {
    notifications += 1;
  });

  clock.override(new Date(1));
  clock.setSpeed(10);
  clock.clear();
  unsubscribe();
  clock.override(new Date(2));

  assert.equal(notifications, 3);
});
