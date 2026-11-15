import Feather from '@expo/vector-icons/Feather';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Colors, IconSize, LineHeight, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type EmptyStateProps = {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  message: string;
};

const ICON_CIRCLE_SIZE = 64;
const MESSAGE_MAX_WIDTH = 280;
const ENTER_DURATION_MS = 420;
const ENTER_SCALE_FROM = 0.92;
const ENTER_RISE_FROM = 8;

export default function EmptyState({ icon, title, message }: EmptyStateProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();
  const appearance = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    appearance.value = reduceMotion
      ? 1
      : withTiming(1, { duration: ENTER_DURATION_MS, easing: Easing.out(Easing.cubic) });
  }, [appearance, reduceMotion]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: appearance.value,
    transform: [{ scale: ENTER_SCALE_FROM + (1 - ENTER_SCALE_FROM) * appearance.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: appearance.value,
    transform: [{ translateY: (1 - appearance.value) * ENTER_RISE_FROM }],
  }));

  return (
    <View style={styles.container} accessible accessibilityLabel={`${title}. ${message}`}>
      <Animated.View style={[styles.iconCircle, iconStyle]}>
        <Feather name={icon} size={IconSize.xl} color={colors.primary} />
      </Animated.View>
      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: Spacing.xxl,
      paddingHorizontal: Spacing.lg,
      gap: Spacing.lg,
    },
    iconCircle: {
      width: ICON_CIRCLE_SIZE,
      height: ICON_CIRCLE_SIZE,
      borderRadius: ICON_CIRCLE_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accentSoft,
    },
    textBlock: {
      alignItems: 'center',
      gap: Spacing.xs,
    },
    title: {
      ...Type.heading,
      color: colors.text,
      textAlign: 'center',
    },
    message: {
      ...Type.body,
      color: colors.mutedText,
      lineHeight: LineHeight.relaxed,
      textAlign: 'center',
      maxWidth: MESSAGE_MAX_WIDTH,
    },
  });
