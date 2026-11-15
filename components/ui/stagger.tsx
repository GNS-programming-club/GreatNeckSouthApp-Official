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

type StaggerItemProps = {
  children: React.ReactNode;
  index: number;
  skipEntrance?: boolean;
};

export function StaggerItem({ children, index, skipEntrance = false }: StaggerItemProps) {
  const reduceMotion = useReducedMotion();
  const startsVisible = reduceMotion || skipEntrance;
  const progress = useSharedValue(startsVisible ? 1 : 0);

  useEffect(() => {
    if (startsVisible) {
      return;
    }

    progress.set(withDelay(index * Motion.staggerStep, withTiming(1, baseTiming)));
  }, [index, progress, startsVisible]);

  const riseStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: (1 - progress.get()) * Motion.riseDistance }],
  }));

  return <Animated.View style={riseStyle}>{children}</Animated.View>;
}

export default function Stagger({ children }: { children: React.ReactNode }) {
  return (
    <>
      {React.Children.toArray(children).map((child, index) => (
        <StaggerItem key={index} index={index}>
          {child}
        </StaggerItem>
      ))}
    </>
  );
}
