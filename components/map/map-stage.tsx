import { Image } from 'expo-image';
import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Image as RNImage,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import MapSpotlight from '@/components/map/map-spotlight';
import type { MapSpotlightTarget, MapViewportValues, ScaleBound } from '@/components/map/map-types';
import { Colors, Motion, Radii, type RadiusScale } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';
import {
  MAX_SCALE,
  MIN_SCALE,
  clampViewport,
  fitAll,
  fitImage,
  focusOnBox,
  zoomAround,
  zoomStep,
  type Box,
  type Insets,
  type MapFrame,
  type Viewport,
  type ZoomDirection,
} from '@/lib/map-viewport';

const MAP_IMAGE = require('../../assets/images/school-map.png');

const resolvedMapImage = RNImage.resolveAssetSource(MAP_IMAGE);

if (!resolvedMapImage?.width || !resolvedMapImage.height) {
  throw new Error('School map image asset could not be resolved to a known size');
}

const MAP_IMAGE_SIZE = { width: resolvedMapImage.width, height: resolvedMapImage.height };

const DOUBLE_TAP_ZOOM_FACTOR = 2.5;
const SCALE_BOUND_TOLERANCE = 0.001;
const MAP_TAP_MAX_DURATION_MS = 250;
const MAP_TAP_MAX_TRAVEL = 10;

type TouchStart = { x: number; y: number; timestamp: number };

export type MapStageHandle = {
  zoom: (direction: ZoomDirection) => void;
  fit: () => void;
  focus: (box: Box) => void;
};

type MapStageProps = {
  obscured: Insets;
  spotlight: MapSpotlightTarget | null;
  onScaleBoundChange: (bound: ScaleBound) => void;
  onGestureStart: () => void;
  onMapTap: () => void;
};

const MapStage = forwardRef<MapStageHandle, MapStageProps>(
  ({ obscured, spotlight, onScaleBoundChange, onGestureStart, onMapTap }, ref) => {
    const { actualTheme } = useTheme();
    const colors = Colors[actualTheme];
    const radius = Radii[actualTheme];
    const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);
    const reduceMotion = useReducedMotion();

    const [frame, setFrame] = useState<MapFrame | null>(null);
    const tapStart = useRef<TouchStart | null>(null);

    const scale = useSharedValue(MIN_SCALE);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const viewport: MapViewportValues = { scale, translateX, translateY };

    const readViewport = (): Viewport => {
      'worklet';

      return { scale: scale.get(), translateX: translateX.get(), translateY: translateY.get() };
    };

    const applyViewport = (target: Viewport) => {
      'worklet';

      scale.set(target.scale);
      translateX.set(target.translateX);
      translateY.set(target.translateY);
    };

    const animateViewport = (target: Viewport) => {
      'worklet';

      if (reduceMotion) {
        applyViewport(target);

        return;
      }

      scale.set(withSpring(target.scale, Motion.settleSpring));
      translateX.set(withSpring(target.translateX, Motion.settleSpring));
      translateY.set(withSpring(target.translateY, Motion.settleSpring));
    };

    const stopViewportAnimation = () => {
      'worklet';

      cancelAnimation(scale);
      cancelAnimation(translateX);
      cancelAnimation(translateY);
    };

    useImperativeHandle(ref, () => ({
      zoom: (direction) => {
        if (frame) animateViewport(zoomStep(readViewport(), direction, frame));
      },
      fit: () => {
        if (frame) animateViewport(fitAll(frame, obscured));
      },
      focus: (box) => {
        if (frame) animateViewport(focusOnBox(box, frame, obscured));
      },
    }));

    useAnimatedReaction(
      () => {
        const current = scale.get();

        if (current <= MIN_SCALE + SCALE_BOUND_TOLERANCE) return 'min';

        if (current >= MAX_SCALE - SCALE_BOUND_TOLERANCE) return 'max';

        return 'mid';
      },
      (bound, previousBound) => {
        if (bound !== previousBound) {
          scheduleOnRN(onScaleBoundChange, bound);
        }
      }
    );

    const handleLayout = (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      const stage = { width, height };
      const fitted = fitImage(stage, MAP_IMAGE_SIZE);

      if (!fitted) return;

      const nextFrame = { stage, fitted, image: MAP_IMAGE_SIZE };

      if (!frame) {
        applyViewport(fitAll(nextFrame, obscured));
      }

      setFrame(nextFrame);
    };

    const panGesture = Gesture.Pan()
      .onStart(() => {
        stopViewportAnimation();
        scheduleOnRN(onGestureStart);
      })
      .onChange((event) => {
        if (!frame) return;

        const current = readViewport();

        applyViewport(
          clampViewport(
            {
              scale: current.scale,
              translateX: current.translateX + event.changeX,
              translateY: current.translateY + event.changeY,
            },
            frame
          )
        );
      });

    const pinchGesture = Gesture.Pinch()
      .onStart(() => {
        stopViewportAnimation();
        scheduleOnRN(onGestureStart);
      })
      .onChange((event) => {
        if (!frame) return;

        applyViewport(
          zoomAround(readViewport(), event.scaleChange, { x: event.focalX, y: event.focalY }, frame)
        );
      });

    const doubleTapGesture = Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(250)
      .onEnd((event) => {
        if (!frame) return;

        const current = readViewport();

        if (current.scale > MIN_SCALE + SCALE_BOUND_TOLERANCE) {
          animateViewport(fitAll(frame, obscured));

          return;
        }

        animateViewport(
          zoomAround(current, DOUBLE_TAP_ZOOM_FACTOR, { x: event.x, y: event.y }, frame)
        );
      });

    const composedGesture = Gesture.Race(
      doubleTapGesture,
      Gesture.Simultaneous(panGesture, pinchGesture)
    );

    const handleTouchStart = (event: GestureResponderEvent) => {
      const { touches, pageX, pageY, timestamp } = event.nativeEvent;

      tapStart.current = touches.length > 1 ? null : { x: pageX, y: pageY, timestamp };
    };

    const handleTouchEnd = (event: GestureResponderEvent) => {
      const start = tapStart.current;

      tapStart.current = null;

      if (!start) return;

      const { pageX, pageY, timestamp } = event.nativeEvent;
      const travel = Math.hypot(pageX - start.x, pageY - start.y);

      if (timestamp - start.timestamp <= MAP_TAP_MAX_DURATION_MS && travel <= MAP_TAP_MAX_TRAVEL) {
        onMapTap();
      }
    };

    const contentStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.get() },
        { translateY: translateY.get() },
        { scale: scale.get() },
      ],
    }));

    return (
      <View
        style={styles.root}
        onLayout={handleLayout}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => {
          tapStart.current = null;
        }}
      >
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={styles.stage}>
            {frame ? (
              <Animated.View
                style={[
                  styles.mapContent,
                  { width: frame.fitted.width, height: frame.fitted.height },
                  contentStyle,
                ]}
              >
                <Image
                  source={MAP_IMAGE}
                  contentFit="fill"
                  style={styles.mapImage}
                  accessibilityLabel="School floor map"
                />
              </Animated.View>
            ) : null}
          </Animated.View>
        </GestureDetector>

        {frame && spotlight ? (
          <MapSpotlight target={spotlight} frame={frame} obscured={obscured} viewport={viewport} />
        ) : null}
      </View>
    );
  }
);

MapStage.displayName = 'MapStage';

export default MapStage;

const createStyles = (colors: (typeof Colors)['light'], radius: RadiusScale) =>
  StyleSheet.create({
    root: {
      ...StyleSheet.absoluteFill,
      overflow: 'hidden',
      backgroundColor: colors.background,
    },
    stage: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mapContent: {
      borderRadius: radius.sm,
      borderCurve: 'continuous',
      overflow: 'hidden',
    },
    mapImage: {
      width: '100%',
      height: '100%',
    },
  });
