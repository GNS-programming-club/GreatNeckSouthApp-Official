export type KeyValueStore = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

export const ONBOARDING_STORAGE_KEY = 'onboardingComplete_v1';

const COMPLETED_MARKER = 'true';

export async function hasCompletedOnboarding(store: KeyValueStore): Promise<boolean> {
  try {
    return (await store.getItem(ONBOARDING_STORAGE_KEY)) === COMPLETED_MARKER;
  } catch {
    return true;
  }
}

export async function markOnboardingComplete(store: KeyValueStore): Promise<void> {
  await store.setItem(ONBOARDING_STORAGE_KEY, COMPLETED_MARKER).catch(() => undefined);
}

export type WelcomeStepInput = {
  pageIndex: number;
  pageCount: number;
  isPermissionDenied: boolean;
};

export type WelcomeStep = {
  primaryAction: 'next' | 'finish';
  primaryLabel: string;
  statusMessage: string | null;
};

const NOTIFICATIONS_BLOCKED_MESSAGE =
  'Notifications are blocked. You can allow them later in Settings.';

export function describeWelcomeStep({
  pageIndex,
  pageCount,
  isPermissionDenied,
}: WelcomeStepInput): WelcomeStep {
  if (pageIndex < pageCount - 1) {
    return { primaryAction: 'next', primaryLabel: 'Next', statusMessage: null };
  }

  return {
    primaryAction: 'finish',
    primaryLabel: 'Get started',
    statusMessage: isPermissionDenied ? NOTIFICATIONS_BLOCKED_MESSAGE : null,
  };
}
