import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  describeWelcomeStep,
  hasCompletedOnboarding,
  markOnboardingComplete,
  ONBOARDING_STORAGE_KEY,
  type KeyValueStore,
} from './onboarding.ts';

function memoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const values = new Map(Object.entries(initial));

  return {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
  };
}

const unreadableStore: KeyValueStore = {
  getItem: async () => {
    throw new Error('storage unavailable');
  },
  setItem: async () => {
    throw new Error('storage unavailable');
  },
};

test('shows the welcome flow on a fresh install', async () => {
  assert.equal(await hasCompletedOnboarding(memoryStore()), false);
});

test('skips the welcome flow once it has been completed', async () => {
  const store = memoryStore();

  await markOnboardingComplete(store);

  assert.equal(await hasCompletedOnboarding(store), true);
});

test('stores completion under a versioned key', () => {
  assert.equal(ONBOARDING_STORAGE_KEY, 'onboardingComplete_v1');
});

test('shows the welcome flow when the stored value is not a completion marker', async () => {
  assert.equal(
    await hasCompletedOnboarding(memoryStore({ onboardingComplete_v1: 'false' })),
    false
  );
});

test('lets the student into the app when storage cannot be read', async () => {
  assert.equal(await hasCompletedOnboarding(unreadableStore), true);
});

test('finishes the welcome flow even when storage cannot be written', async () => {
  await assert.doesNotReject(markOnboardingComplete(unreadableStore));
});

test('moves to the next page from an early step', () => {
  const step = describeWelcomeStep({ pageIndex: 0, pageCount: 4, isPermissionDenied: false });

  assert.equal(step.primaryAction, 'next');
  assert.equal(step.primaryLabel, 'Next');
});

test('offers to get started on the last step', () => {
  const step = describeWelcomeStep({ pageIndex: 3, pageCount: 4, isPermissionDenied: false });

  assert.equal(step.primaryAction, 'finish');
  assert.equal(step.primaryLabel, 'Get started');
});

test('points to Settings on the last step when notifications are blocked', () => {
  const step = describeWelcomeStep({ pageIndex: 3, pageCount: 4, isPermissionDenied: true });

  assert.equal(
    step.statusMessage,
    'Notifications are blocked. You can allow them later in Settings.'
  );
});

test('says nothing about notifications on earlier steps even when they are blocked', () => {
  const step = describeWelcomeStep({ pageIndex: 2, pageCount: 4, isPermissionDenied: true });

  assert.equal(step.statusMessage, null);
});

test('says nothing about notifications when they are allowed', () => {
  const step = describeWelcomeStep({ pageIndex: 3, pageCount: 4, isPermissionDenied: false });

  assert.equal(step.statusMessage, null);
});
