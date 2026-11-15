import { Canvas, Image, makeImageFromView, type SkImage } from '@shopify/react-native-skia';
import React, { ReactNode, Ref, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { easeOut } from '@/constants/motion';
import { Motion } from '@/constants/theme';

export type ThemeCrossfadeHandle = {
  crossfadeInto: (applyThemeChange: () => void) => Promise<void>;
};

type RootViewInstance = React.ComponentRef<typeof View>;

type SkiaSnapshotTarget = React.RefObject<React.Component<unknown, unknown> | null>;

type ThemeCrossfadeProps = {
  ref: Ref<ThemeCrossfadeHandle>;
  children: ReactNode;
};

const crossfadeDuration = Motion.duration.base * 1.5;

const waitForNextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

const captureSnapshot = async (viewRef: React.RefObject<RootViewInstance | null>) => {
  try {
    return await makeImageFromView(viewRef as unknown as SkiaSnapshotTarget);
  } catch {
    return null;
  }
};

export function ThemeCrossfade({ ref, children }: ThemeCrossfadeProps) {
  const rootViewRef = useRef<RootViewInstance>(null);
  const [snapshot, setSnapshot] = useState<SkImage | null>(null);
  const overlayOpacity = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const pixelRatio = PixelRatio.get();

  useEffect(() => () => snapshot?.dispose(), [snapshot]);

  useImperativeHandle(ref, () => ({
    crossfadeInto: async (applyThemeChange) => {
      if (reduceMotion) {
        applyThemeChange();

        return;
      }

      const capturedSnapshot = await captureSnapshot(rootViewRef);

      if (!capturedSnapshot) {
        applyThemeChange();

        return;
      }

      overlayOpacity.value = 1;
      setSnapshot(capturedSnapshot);
      await waitForNextFrame();
      await waitForNextFrame();
      applyThemeChange();
      overlayOpacity.value = withTiming(
        0,
        { duration: crossfadeDuration, easing: easeOut },
        (finished) => {
          if (finished) {
            scheduleOnRN(setSnapshot, null);
          }
        }
      );
    },
  }));

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  return (
    <View style={styles.container}>
      <View ref={rootViewRef} collapsable={false} style={styles.container}>
        {children}
      </View>
      {snapshot ? (
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Image
              image={snapshot}
              x={0}
              y={0}
              width={snapshot.width() / pixelRatio}
              height={snapshot.height() / pixelRatio}
            />
          </Canvas>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'none',
  },
});
