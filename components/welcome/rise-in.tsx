import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { baseTiming } from '@/constants/motion';
import { Motion } from '@/constants/theme';

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
      reduceMotion ? 1 : withDelay(order * Motion.staggerStep, withTiming(1, baseTiming))
    );
  }, [isActive, order, progress, reduceMotion]);

  const riseStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: (1 - progress.get()) * Motion.riseDistance }],
  }));

  return <Animated.View style={riseStyle}>{children}</Animated.View>;
}
