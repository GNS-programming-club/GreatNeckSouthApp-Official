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
  hasAnsweredAlerts: boolean;
  isAlertsEnabled: boolean;
  isPermissionDenied: boolean;
};

export type WelcomeStep = {
  primaryAction: 'next' | 'enable-alerts' | 'finish';
  primaryLabel: string;
  canSkip: boolean;
  statusMessage: string | null;
};

const ALERTS_ON_MESSAGE = 'Alerts are on.';
const ALERTS_BLOCKED_MESSAGE = 'Notifications are blocked. You can allow them later in Settings.';

function alertsStatusMessage({
  hasAnsweredAlerts,
  isAlertsEnabled,
  isPermissionDenied,
}: WelcomeStepInput): string | null {
  if (isAlertsEnabled) {
    return ALERTS_ON_MESSAGE;
  }

  if (hasAnsweredAlerts && isPermissionDenied) {
    return ALERTS_BLOCKED_MESSAGE;
  }

  return null;
}

export function describeWelcomeStep(input: WelcomeStepInput): WelcomeStep {
  if (input.pageIndex < input.pageCount - 1) {
    return { primaryAction: 'next', primaryLabel: 'Next', canSkip: false, statusMessage: null };
  }

  const statusMessage = alertsStatusMessage(input);

  if (input.hasAnsweredAlerts || input.isAlertsEnabled) {
    return { primaryAction: 'finish', primaryLabel: 'Get started', canSkip: false, statusMessage };
  }

  return {
    primaryAction: 'enable-alerts',
    primaryLabel: 'Turn on alerts',
    canSkip: true,
    statusMessage,
  };
}
