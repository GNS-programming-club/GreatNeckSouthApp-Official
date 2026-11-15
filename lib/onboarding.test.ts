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
  const step = describeWelcomeStep({
    pageIndex: 0,
    pageCount: 3,
    hasAnsweredAlerts: false,
    isAlertsEnabled: false,
    isPermissionDenied: false,
  });

  assert.equal(step.primaryAction, 'next');
});

test('offers to turn on alerts on the last step', () => {
  const step = describeWelcomeStep({
    pageIndex: 2,
    pageCount: 3,
    hasAnsweredAlerts: false,
    isAlertsEnabled: false,
    isPermissionDenied: false,
  });

  assert.equal(step.primaryAction, 'enable-alerts');
  assert.equal(step.primaryLabel, 'Turn on alerts');
});

test('lets the student decline alerts on the last step', () => {
  const step = describeWelcomeStep({
    pageIndex: 2,
    pageCount: 3,
    hasAnsweredAlerts: false,
    isAlertsEnabled: false,
    isPermissionDenied: false,
  });

  assert.equal(step.canSkip, true);
});

test('hides the decline option on earlier steps', () => {
  const step = describeWelcomeStep({
    pageIndex: 1,
    pageCount: 3,
    hasAnsweredAlerts: false,
    isAlertsEnabled: false,
    isPermissionDenied: false,
  });

  assert.equal(step.canSkip, false);
});

test('offers to get started once alerts are on', () => {
  const step = describeWelcomeStep({
    pageIndex: 2,
    pageCount: 3,
    hasAnsweredAlerts: true,
    isAlertsEnabled: true,
    isPermissionDenied: false,
  });

  assert.equal(step.primaryAction, 'finish');
  assert.equal(step.primaryLabel, 'Get started');
  assert.equal(step.statusMessage, 'Alerts are on.');
});

test('points to Settings and offers to get started when notifications were blocked', () => {
  const step = describeWelcomeStep({
    pageIndex: 2,
    pageCount: 3,
    hasAnsweredAlerts: true,
    isAlertsEnabled: false,
    isPermissionDenied: true,
  });

  assert.equal(step.primaryAction, 'finish');
  assert.equal(
    step.statusMessage,
    'Notifications are blocked. You can allow them later in Settings.'
  );
});

test('skips the alerts question when alerts were already on', () => {
  const step = describeWelcomeStep({
    pageIndex: 2,
    pageCount: 3,
    hasAnsweredAlerts: false,
    isAlertsEnabled: true,
    isPermissionDenied: false,
  });

  assert.equal(step.primaryAction, 'finish');
});

test('says nothing about notifications before the student answers', () => {
  const step = describeWelcomeStep({
    pageIndex: 2,
    pageCount: 3,
    hasAnsweredAlerts: false,
    isAlertsEnabled: false,
    isPermissionDenied: true,
  });

  assert.equal(step.statusMessage, null);
});
