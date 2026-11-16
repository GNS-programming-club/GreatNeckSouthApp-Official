import React, { useMemo } from 'react';
import { StyleSheet, Text, type LayoutChangeEvent } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

import type { MapSpotlightTarget, MapViewportValues } from '@/components/map/map-types';
import {
  Colors,
  Elevation,
  FontWeight,
  Radii,
  type RadiusScale,
  Spacing,
  Type,
} from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';
import { projectBox, type Insets, type MapFrame } from '@/lib/map-viewport';

const SCRIM_COLOR = 'rgba(10,11,13,0.55)';
const OUTLINE_WIDTH = 1.5;
const CUTOUT_OUTSET = Spacing.xs;
const LABEL_GAP = Spacing.sm;
const LABEL_EDGE_MARGIN = Spacing.md;

type MapSpotlightProps = {
  target: MapSpotlightTarget;
  frame: MapFrame;
  obscured: Insets;
  viewport: MapViewportValues;
};

function clampWorklet(value: number, min: number, max: number) {
  'worklet';

  return Math.min(Math.max(value, min), Math.max(min, max));
}

export default function MapSpotlight({ target, frame, obscured, viewport }: MapSpotlightProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const radius = Radii[actualTheme];
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);
  const labelSize = useSharedValue({ width: 0, height: 0 });
  const stageWidth = frame.stage.width;
  const stageHeight = frame.stage.height;

  const cutout = useDerivedValue(() => {
    const projected = projectBox(
      target.box,
      {
        scale: viewport.scale.get(),
        translateX: viewport.translateX.get(),
        translateY: viewport.translateY.get(),
      },
      frame
    );
    const left = clampWorklet(projected.x - CUTOUT_OUTSET, 0, stageWidth);
    const top = clampWorklet(projected.y - CUTOUT_OUTSET, 0, stageHeight);
    const right = clampWorklet(projected.x + projected.width + CUTOUT_OUTSET, left, stageWidth);
    const bottom = clampWorklet(projected.y + projected.height + CUTOUT_OUTSET, top, stageHeight);

    return { left, top, right, bottom };
  });

  const scrimTopStyle = useAnimatedStyle(() => ({
    top: 0,
    left: 0,
    width: stageWidth,
    height: cutout.get().top,
  }));

  const scrimBottomStyle = useAnimatedStyle(() => ({
    top: cutout.get().bottom,
    left: 0,
    width: stageWidth,
    height: stageHeight - cutout.get().bottom,
  }));

  const scrimLeftStyle = useAnimatedStyle(() => ({
    top: cutout.get().top,
    left: 0,
    width: cutout.get().left,
    height: cutout.get().bottom - cutout.get().top,
  }));

  const scrimRightStyle = useAnimatedStyle(() => ({
    top: cutout.get().top,
    left: cutout.get().right,
    width: stageWidth - cutout.get().right,
    height: cutout.get().bottom - cutout.get().top,
  }));

  const outlineStyle = useAnimatedStyle(() => ({
    top: cutout.get().top,
    left: cutout.get().left,
    width: cutout.get().right - cutout.get().left,
    height: cutout.get().bottom - cutout.get().top,
  }));

  const labelStyle = useAnimatedStyle(() => {
    const box = cutout.get();
    const size = labelSize.get();
    const centeredLeft = (box.left + box.right) / 2 - size.width / 2;
    const below = box.bottom + LABEL_GAP;
    const above = box.top - LABEL_GAP - size.height;
    const visibleBottom = stageHeight - obscured.bottom - LABEL_EDGE_MARGIN;
    const fitsBelow = below + size.height <= visibleBottom;

    return {
      left: clampWorklet(
        centeredLeft,
        LABEL_EDGE_MARGIN,
        stageWidth - size.width - LABEL_EDGE_MARGIN
      ),
      top: clampWorklet(
        fitsBelow ? below : above,
        obscured.top + LABEL_EDGE_MARGIN,
        visibleBottom - size.height
      ),
    };
  });

  const handleLabelLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    labelSize.set({ width, height });
  };

  return (
    <Animated.View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      entering={FadeIn}
      exiting={FadeOut}
    >
      <Animated.View style={[styles.scrim, scrimTopStyle]} />
      <Animated.View style={[styles.scrim, scrimBottomStyle]} />
      <Animated.View style={[styles.scrim, scrimLeftStyle]} />
      <Animated.View style={[styles.scrim, scrimRightStyle]} />
      <Animated.View style={[styles.outline, outlineStyle]} />
      <Animated.View style={[styles.label, labelStyle]} onLayout={handleLabelLayout}>
        <Text style={styles.labelTitle} numberOfLines={1}>
          {target.label}
        </Text>
        <Text style={styles.labelDetail} numberOfLines={1}>
          {target.detail}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const createStyles = (colors: (typeof Colors)['light'], radius: RadiusScale) =>
  StyleSheet.create({
    scrim: {
      position: 'absolute',
      backgroundColor: SCRIM_COLOR,
    },
    outline: {
      position: 'absolute',
      borderWidth: OUTLINE_WIDTH,
      borderColor: colors.primary,
    },
    label: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      maxWidth: 280,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderRadius: radius.pill,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...Elevation.raised,
    },
    labelTitle: {
      ...Type.label,
      fontWeight: FontWeight.bold,
      color: colors.text,
      flexShrink: 1,
    },
    labelDetail: {
      ...Type.caption,
      color: colors.mutedText,
    },
  });
