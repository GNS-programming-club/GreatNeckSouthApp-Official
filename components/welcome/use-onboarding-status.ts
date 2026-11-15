import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { hasCompletedOnboarding, markOnboardingComplete } from '@/lib/onboarding';

export type OnboardingStatus = 'loading' | 'pending' | 'complete';

export function useOnboardingStatus(): OnboardingStatus {
  const [status, setStatus] = useState<OnboardingStatus>('loading');

  useEffect(() => {
    let isCurrent = true;

    hasCompletedOnboarding(AsyncStorage).then((isComplete) => {
      if (isCurrent) {
        setStatus(isComplete ? 'complete' : 'pending');
      }
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  return status;
}

export function completeOnboarding(): Promise<void> {
  return markOnboardingComplete(AsyncStorage);
}
