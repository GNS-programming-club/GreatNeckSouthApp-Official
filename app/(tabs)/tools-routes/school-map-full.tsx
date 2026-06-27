import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image as RNImage, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

const MAP_IMAGE = require('../../../assets/images/school-map.png');

const { width: IMG_W, height: IMG_H } = RNImage.resolveAssetSource(MAP_IMAGE);

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const ZOOM_SCALE = 2.5;
const TAB_CLEARANCE = 100;

const clamp = (value: number, min: number, max: number) => {
  'worklet';

  return Math.min(Math.max(value, min), max);
};

export default function SchoolMapFull() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  const fitted = useMemo(() => {
    if (!stageSize.width || !stageSize.height) return null;

    const scale = Math.min(stageSize.width / IMG_W, stageSize.height / IMG_H);

    return { width: IMG_W * scale, height: IMG_H * scale };
  }, [stageSize]);

  const scale = useSharedValue(MIN_SCALE);
  const savedScale = useSharedValue(MIN_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;

      if (scale.value <= MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        savedScale.value = MIN_SCALE;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value <= MIN_SCALE) return;

      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd(() => {
      if (scale.value > MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        savedScale.value = MIN_SCALE;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(ZOOM_SCALE);
        savedScale.value = ZOOM_SCALE;
      }
    });

  const composedGesture = Gesture.Race(
    doubleTapGesture,
    Gesture.Simultaneous(panGesture, pinchGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: withTiming(scale.value > MIN_SCALE ? 0 : 1),
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Feather name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Full Map</Text>
      </View>

      <View
        style={styles.stage}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setStageSize({ width, height });
        }}
      >
        <GestureDetector gesture={composedGesture}>
          <Animated.View
            style={[
              styles.mapContent,
              animatedStyle,
              fitted ? { width: fitted.width, height: fitted.height } : null,
            ]}
          >
            <Image source={MAP_IMAGE} contentFit="fill" style={styles.mapImage} />
          </Animated.View>
        </GestureDetector>

        <Animated.View style={[styles.overlayHint, hintStyle]} pointerEvents="none">
          <Text style={styles.mapHint}>Double tap or pinch to zoom</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    backButton: {
      alignSelf: 'flex-start',
      height: 36,
      width: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      marginTop: Spacing.sm,
      ...Type.display,
      color: colors.text,
    },
    stage: {
      flex: 1,
      overflow: 'hidden',
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.sm,
      paddingTop: Spacing.md,
      paddingBottom: TAB_CLEARANCE,
    },
    mapContent: {
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: Radius.lg,
      borderCurve: 'continuous',
      overflow: 'hidden',
    },
    mapImage: {
      width: '100%',
      height: '100%',
    },
    overlayHint: {
      position: 'absolute',
      bottom: TAB_CLEARANCE + Spacing.md,
      backgroundColor: colors.shadow,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderRadius: 999,
    },
    mapHint: {
      color: colors.primaryText,
      ...Type.caption,
      fontWeight: '600',
    },
  });
