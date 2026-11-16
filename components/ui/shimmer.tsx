import React, { useEffect, useMemo } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Opacity, Radii, type RadiusScale } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

const PULSE_DURATION_MS = 750;

type ShimmerProps = {
  style?: StyleProp<ViewStyle>;
};

export default function Shimmer({ style }: ShimmerProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const radius = Radii[actualTheme];
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);
  const reduceMotion = useReducedMotion();
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      pulseOpacity.set(1);

      return;
    }

    pulseOpacity.set(
      withRepeat(
        withTiming(Opacity.dim, { duration: PULSE_DURATION_MS, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );

    return () => cancelAnimation(pulseOpacity);
  }, [pulseOpacity, reduceMotion]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.get() }));

  return <Animated.View pointerEvents="none" style={[styles.block, style, pulseStyle]} />;
}

const createStyles = (colors: (typeof Colors)['light'], radius: RadiusScale) =>
  StyleSheet.create({
    block: {
      height: 12,
      borderRadius: radius.sm,
      borderCurve: 'continuous',
      backgroundColor: colors.surfaceAlt,
    },
  });
