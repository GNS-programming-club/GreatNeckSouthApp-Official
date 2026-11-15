import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';

const RISE_DURATION_MS = 520;
const RISE_STEP_DELAY_MS = 90;
const RISE_DISTANCE = Spacing.md;

type RiseInProps = {
  children: React.ReactNode;
  isActive: boolean;
  order: number;
};

export default function RiseIn({ children, isActive, order }: RiseInProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    progress.set(
      reduceMotion
        ? 1
        : withDelay(
            order * RISE_STEP_DELAY_MS,
            withTiming(1, { duration: RISE_DURATION_MS, easing: Easing.out(Easing.cubic) })
          )
    );
  }, [isActive, order, progress, reduceMotion]);

  const riseStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: (1 - progress.get()) * RISE_DISTANCE }],
  }));

  return <Animated.View style={riseStyle}>{children}</Animated.View>;
}
