import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia';
import React, { useEffect, useMemo, useState } from 'react';
import {
  AppState,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

import { METAL_RIM_SHADER, METAL_RIM_STOP_LIMIT } from '@/components/ui/metal-rim-shader';
import { parseColor } from '@/lib/color';

const rimShader = Skia.RuntimeEffect.Make(METAL_RIM_SHADER);

const RIM_LOOK = {
  softness: 1,
  opacity: 1,
  glow: 0.35,
  sheen: 0.45,
  speed: 0.6,
  bands: 3,
  sharpness: 2.2,
  distortion: 0.35,
  noiseScale: 0.9,
  bevel: 0.6,
  contrast: 1.2,
  direction: 0,
} as const;

const MINIMUM_GLOW_ROOM = 8;
const GLOW_ROOM_PER_BORDER_PIXEL = 4;

function flattenStops(colors: readonly string[]) {
  const stops = colors.slice(0, METAL_RIM_STOP_LIMIT);
  const lastStop = stops[stops.length - 1];

  return Array.from({ length: METAL_RIM_STOP_LIMIT }, (_, index) => {
    const { red, green, blue } = parseColor(stops[index] ?? lastStop);

    return [red / 255, green / 255, blue / 255, 1];
  }).flat();
}

type MetalRimProps = {
  children: React.ReactNode;
  colors: readonly string[];
  borderWidth: number;
  borderRadius: number;
  style?: StyleProp<ViewStyle>;
};

export default function MetalRim({
  children,
  colors,
  borderWidth,
  borderRadius,
  style,
}: MetalRimProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isAppActive, setIsAppActive] = useState(true);
  const isReducedMotion = useReducedMotion();
  const elapsedSeconds = useSharedValue(0);

  const frameCallback = useFrameCallback((frame) => {
    if (frame.timeSincePreviousFrame !== null) {
      elapsedSeconds.set(
        elapsedSeconds.get() + (frame.timeSincePreviousFrame / 1000) * RIM_LOOK.speed
      );
    }
  }, false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      setIsAppActive(status === 'active');
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    frameCallback.setActive(isAppActive && !isReducedMotion);
  }, [frameCallback, isAppActive, isReducedMotion]);

  const flatStops = useMemo(() => flattenStops(colors), [colors]);
  const stopCount = Math.min(Math.max(colors.length, 2), METAL_RIM_STOP_LIMIT);
  const glowRoom = Math.max(borderWidth * GLOW_ROOM_PER_BORDER_PIXEL, MINIMUM_GLOW_ROOM);
  const clampedRadius = Math.max(0, Math.min(borderRadius, Math.min(size.width, size.height) / 2));
  const canvasWidth = size.width + glowRoom * 2;
  const canvasHeight = size.height + glowRoom * 2;

  const uniforms = useDerivedValue(() => ({
    u_resolution: [canvasWidth, canvasHeight],
    u_time: elapsedSeconds.get(),
    u_colors: flatStops,
    u_shape: [borderWidth, clampedRadius, RIM_LOOK.softness, RIM_LOOK.opacity],
    u_pattern: [stopCount, RIM_LOOK.bands, RIM_LOOK.sharpness, RIM_LOOK.direction],
    u_surface: [RIM_LOOK.distortion, RIM_LOOK.noiseScale, RIM_LOOK.bevel, RIM_LOOK.contrast],
    u_light: [RIM_LOOK.sheen, RIM_LOOK.glow, glowRoom],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    setSize((previous) =>
      previous.width === width && previous.height === height ? previous : { width, height }
    );
  };

  return (
    <View style={style} onLayout={handleLayout}>
      {children}
      {rimShader && size.width > 0 && size.height > 0 ? (
        <View pointerEvents="none" style={[styles.overlay, { top: -glowRoom, left: -glowRoom }]}>
          <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
            <Fill>
              <Shader source={rimShader} uniforms={uniforms} />
            </Fill>
          </Canvas>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
  },
});
