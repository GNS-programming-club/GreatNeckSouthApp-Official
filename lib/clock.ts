type ClockOverride = {
  fakeAnchorMilliseconds: number;
  realAnchorMilliseconds: number;
  speed: number;
};

export type Clock = {
  now: () => Date;
  override: (fakeStart: Date, speed?: number) => void;
  setSpeed: (speed: number) => void;
  clear: () => void;
  isOverridden: () => boolean;
  speed: () => number;
  subscribe: (listener: () => void) => () => void;
};

export function createClock(readRealMilliseconds: () => number): Clock {
  let activeOverride: ClockOverride | null = null;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());

  const currentMilliseconds = () => {
    const realMilliseconds = readRealMilliseconds();

    if (!activeOverride) {
      return realMilliseconds;
    }

    const realElapsed = realMilliseconds - activeOverride.realAnchorMilliseconds;

    return activeOverride.fakeAnchorMilliseconds + realElapsed * activeOverride.speed;
  };

  return {
    now: () => new Date(currentMilliseconds()),
    override: (fakeStart, speed = 1) => {
      activeOverride = {
        fakeAnchorMilliseconds: fakeStart.getTime(),
        realAnchorMilliseconds: readRealMilliseconds(),
        speed,
      };
      notify();
    },
    setSpeed: (speed) => {
      if (!activeOverride) {
        return;
      }

      activeOverride = {
        fakeAnchorMilliseconds: currentMilliseconds(),
        realAnchorMilliseconds: readRealMilliseconds(),
        speed,
      };
      notify();
    },
    clear: () => {
      activeOverride = null;
      notify();
    },
    isOverridden: () => activeOverride !== null,
    speed: () => activeOverride?.speed ?? 1,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const appClock = createClock(() => Date.now());
