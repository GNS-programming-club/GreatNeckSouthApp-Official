import { useSyncExternalStore } from 'react';

import { appClock } from '@/lib/clock';

let clockVersion = 0;

appClock.subscribe(() => {
  clockVersion += 1;
});

export function useClockVersion(): number {
  return useSyncExternalStore(appClock.subscribe, () => clockVersion);
}
