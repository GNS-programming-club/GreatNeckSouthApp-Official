import React, { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Colors, Elevation, Motion, Radii, Spacing, ThemeTraits, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';
import { tickSelection } from '@/lib/haptics';

export type SegmentOption<Value extends string> = {
  value: Value;
  label: string;
};

type SegmentedControlProps<Value extends string> = {
  options: SegmentOption<Value>[];
  value: Value;
  onChange: (next: Value) => void;
};

const TRACK_INSET = Spacing.xs;

export default function SegmentedControl<Value extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<Value>) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors, actualTheme), [colors, actualTheme]);
  const reduceMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const segmentWidth = trackWidth > 0 ? (trackWidth - TRACK_INSET * 2) / options.length : 0;
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );
  const pillOffset = useSharedValue(activeIndex * segmentWidth);

  useEffect(() => {
    const target = activeIndex * segmentWidth;

    pillOffset.value = reduceMotion ? target : withSpring(target, Motion.settleSpring);
  }, [activeIndex, segmentWidth, pillOffset, reduceMotion]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillOffset.value }],
  }));

  const onTrackLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;

    if (nextWidth !== trackWidth) {
      pillOffset.set(activeIndex * ((nextWidth - TRACK_INSET * 2) / options.length));
      setTrackWidth(nextWidth);
    }
  };

  return (
    <View style={styles.track} onLayout={onTrackLayout} accessibilityRole="tablist">
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.pill, { width: segmentWidth }, pillStyle]}
        />
      ) : null}
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <Pressable
            key={option.value}
            style={styles.segment}
            onPress={() => {
              if (!isActive) {
                tickSelection();
                onChange(option.value);
              }
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: (typeof Colors)['light'], theme: keyof typeof Colors) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceAlt,
      borderRadius: Radii[theme].md,
      borderCurve: 'continuous',
      padding: TRACK_INSET,
    },
    pill: {
      position: 'absolute',
      top: TRACK_INSET,
      bottom: TRACK_INSET,
      left: TRACK_INSET,
      borderRadius: Math.max(Radii[theme].md - TRACK_INSET, 0),
      borderCurve: 'continuous',
      backgroundColor: ThemeTraits[theme].isDark ? colors.surface : colors.background,
      ...Elevation.raised,
      shadowColor: colors.shadow,
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
    },
    label: {
      ...Type.label,
    },
    labelActive: {
      color: colors.text,
    },
    labelInactive: {
      color: colors.mutedText,
    },
  });
