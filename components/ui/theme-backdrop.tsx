import { Canvas, Path, RadialGradient, Rect, Skia } from '@shopify/react-native-skia';
import { useIsFocused } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  type SharedValue,
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

import { ThemeTraits } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';
import { withAlpha } from '@/lib/color';
import {
  type Backdrop,
  type BackdropPatternKind,
  THEME_IDS,
  THEMES,
  type ThemeId,
} from '@/lib/theme-catalog';
import { meshColorsFor, type MeshColors } from '@/lib/theme-mesh';

const LINE_WIDTH = 1;
const DOT_RADIUS = 1;
const MAXIMUM_FRAMES_PER_SECOND = 30;
const DRIFT_RADIANS_PER_SECOND = (Math.PI * 2) / 28;
const DRIFT_SHARE = 0.09;

type Size = { width: number; height: number };

type Blob = {
  colorIndex: 1 | 2 | 3;
  centerX: number;
  centerY: number;
  reach: number;
  phase: number;
};

const BLOBS: Blob[] = [
  { colorIndex: 1, centerX: 0.1, centerY: 0.06, reach: 0.85, phase: 0 },
  { colorIndex: 2, centerX: 0.95, centerY: 0.5, reach: 0.75, phase: 2.1 },
  { colorIndex: 3, centerX: 0.2, centerY: 1, reach: 0.8, phase: 4.2 },
];

const SCREEN_MESH_COLORS = Object.fromEntries(
  THEME_IDS.map((id) => [id, meshColorsFor(THEMES[id])])
) as Record<ThemeId, MeshColors>;

function buildPattern(pattern: BackdropPatternKind, spacing: number, { width, height }: Size) {
  const builder = Skia.PathBuilder.Make();

  if (pattern === 'stripes' || pattern === 'grid') {
    for (let left = 0; left < width; left += spacing) {
      builder.addRect(Skia.XYWHRect(left, 0, LINE_WIDTH, height));
    }
  }

  if (pattern === 'scanlines' || pattern === 'grid') {
    for (let top = 0; top < height; top += spacing) {
      builder.addRect(Skia.XYWHRect(0, top, width, LINE_WIDTH));
    }
  }

  if (pattern === 'dots') {
    for (let top = spacing / 2; top < height; top += spacing) {
      for (let left = spacing / 2; left < width; left += spacing) {
        builder.addCircle(left, top, DOT_RADIUS);
      }
    }
  }

  return builder.build();
}

export default function ScreenBackdrop() {
  const { actualTheme } = useTheme();
  const { width, height } = useWindowDimensions();
  const size = useMemo<Size>(() => ({ width, height }), [width, height]);
  const isFocused = useIsFocused();
  const isReducedMotion = useReducedMotion();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <MeshBackdrop
        colors={SCREEN_MESH_COLORS[actualTheme]}
        pattern={ThemeTraits[actualTheme].backdrop?.pattern}
        size={size}
        isAnimated={isFocused && !isReducedMotion}
      />
    </View>
  );
}

type MeshBackdropProps = {
  colors: MeshColors;
  size: Size;
  isAnimated: boolean;
  pattern?: Backdrop['pattern'];
};

export function MeshBackdrop({ colors, size, isAnimated, pattern }: MeshBackdropProps) {
  const elapsedSeconds = useSharedValue(0);
  const millisecondsSinceDraw = useSharedValue(0);
  const patternPath = useMemo(
    () => (pattern ? buildPattern(pattern.kind, pattern.spacing, size) : null),
    [pattern, size]
  );

  const drift = useFrameCallback((frame) => {
    if (frame.timeSincePreviousFrame === null) {
      return;
    }

    const pending = millisecondsSinceDraw.get() + frame.timeSincePreviousFrame;

    if (pending < 1000 / MAXIMUM_FRAMES_PER_SECOND) {
      millisecondsSinceDraw.set(pending);

      return;
    }

    elapsedSeconds.set(elapsedSeconds.get() + pending / 1000);
    millisecondsSinceDraw.set(0);
  }, false);

  useEffect(() => {
    drift.setActive(isAnimated);
  }, [drift, isAnimated]);

  return (
    <Canvas style={{ width: size.width, height: size.height }}>
      <Rect x={0} y={0} width={size.width} height={size.height} color={colors[0]} />
      {BLOBS.map((blob) => (
        <SoftBlob
          key={blob.colorIndex}
          blob={blob}
          color={colors[blob.colorIndex]}
          size={size}
          elapsedSeconds={elapsedSeconds}
        />
      ))}
      {pattern && patternPath ? <Path path={patternPath} color={pattern.color} /> : null}
    </Canvas>
  );
}

type SoftBlobProps = {
  blob: Blob;
  color: string;
  size: Size;
  elapsedSeconds: SharedValue<number>;
};

function SoftBlob({ blob, color, size, elapsedSeconds }: SoftBlobProps) {
  const { centerX, centerY, phase } = blob;
  const { width, height } = size;
  const fadeColors = useMemo(() => [color, withAlpha(color, 0)], [color]);

  const center = useDerivedValue(() => {
    const angle = elapsedSeconds.get() * DRIFT_RADIANS_PER_SECOND + phase;

    return {
      x: (centerX + Math.cos(angle) * DRIFT_SHARE) * width,
      y: (centerY + Math.sin(angle) * DRIFT_SHARE) * height,
    };
  });

  return (
    <Rect x={0} y={0} width={width} height={height}>
      <RadialGradient c={center} r={blob.reach * Math.max(width, height)} colors={fadeColors} />
    </Rect>
  );
}
