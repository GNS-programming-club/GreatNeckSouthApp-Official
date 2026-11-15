import { Canvas, Fill, Shader, Skia, vec } from '@shopify/react-native-skia';
import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

import { MESH_GRADIENT_SHADER } from '@/components/welcome/mesh-gradient-shader';
import { useTheme } from '@/contexts/theme-context';

type RgbFraction = [number, number, number, number];

const meshShader = Skia.RuntimeEffect.Make(MESH_GRADIENT_SHADER);

const RENDER_SCALE = 0.3;
const MAXIMUM_FRAMES_PER_SECOND = 30;
const DRIFT_SPEED = 3;
const NOISE = 0.15;
const BLUR = 0.4;
const CONTRAST = 1;

const GRADIENT_HEX = {
  light: ['#FFFFFF', '#306BEC', '#F4F6F9', '#83A6F4'],
  dark: ['#0A0B0D', '#1F51BC', '#14161A', '#173576'],
} as const;

function hexToRgbFraction(hex: string): RgbFraction {
  const channel = (offset: number) => parseInt(hex.slice(offset, offset + 2), 16) / 255;

  return [channel(1), channel(3), channel(5), 1];
}

const GRADIENT_COLORS = {
  light: GRADIENT_HEX.light.map(hexToRgbFraction),
  dark: GRADIENT_HEX.dark.map(hexToRgbFraction),
};

export default function WelcomeBackdrop() {
  const { actualTheme } = useTheme();
  const { width, height } = useWindowDimensions();
  const isReducedMotion = useReducedMotion();
  const elapsedSeconds = useSharedValue(0);
  const millisecondsSinceDraw = useSharedValue(0);
  const colors = GRADIENT_COLORS[actualTheme];
  const renderWidth = Math.round(width * RENDER_SCALE);
  const renderHeight = Math.round(height * RENDER_SCALE);

  useFrameCallback((frame) => {
    if (frame.timeSincePreviousFrame === null) {
      return;
    }

    const pending = millisecondsSinceDraw.get() + frame.timeSincePreviousFrame;

    if (pending < 1000 / MAXIMUM_FRAMES_PER_SECOND) {
      millisecondsSinceDraw.set(pending);

      return;
    }

    elapsedSeconds.set(elapsedSeconds.get() + (pending / 1000) * DRIFT_SPEED);
    millisecondsSinceDraw.set(0);
  }, !isReducedMotion);

  const uniforms = useDerivedValue(() => ({
    resolution: vec(renderWidth, renderHeight),
    time: elapsedSeconds.get(),
    noise: NOISE,
    blur: BLUR,
    contrast: CONTRAST,
    color1: colors[0],
    color2: colors[1],
    color3: colors[2],
    color4: colors[3],
  }));

  if (!meshShader) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.clip}>
      <View
        style={[
          styles.scaledCanvas,
          {
            width: renderWidth,
            height: renderHeight,
            transform: [{ scale: 1 / RENDER_SCALE }],
          },
        ]}
      >
        <Canvas style={StyleSheet.absoluteFill}>
          <Fill>
            <Shader source={meshShader} uniforms={uniforms} />
          </Fill>
        </Canvas>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  scaledCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    transformOrigin: 'left top',
  },
});
