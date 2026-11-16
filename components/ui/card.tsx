import React, { useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { surfaceShapeStyle } from '@/components/ui/surface-shape';
import { Colors, Elevation, Motion, Spacing, ThemeTraits } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

const PRESSED_SCALE = 0.97;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: keyof typeof Elevation;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export default function Card({
  children,
  style,
  elevation = 'raised',
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const elevationStyle = surfaceShapeStyle(ThemeTraits[actualTheme].shape, colors, elevation);

  if (onPress) {
    return (
      <PressableCard
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={[styles.card, elevationStyle, style]}
      >
        {children}
      </PressableCard>
    );
  }

  return <View style={[styles.card, elevationStyle, style]}>{children}</View>;
}

type PressableCardProps = {
  children: React.ReactNode;
  style: StyleProp<ViewStyle>;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

function PressableCard({
  children,
  style,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: PressableCardProps) {
  const reduceMotion = useReducedMotion();
  const pressScale = useSharedValue(1);

  const animateScaleTo = (target: number) => {
    pressScale.set(reduceMotion ? target : withSpring(target, Motion.pressSpring));
  };

  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.get() }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => animateScaleTo(PRESSED_SCALE)}
      onPressOut={() => animateScaleTo(1)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={[style, scaleStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
  });
