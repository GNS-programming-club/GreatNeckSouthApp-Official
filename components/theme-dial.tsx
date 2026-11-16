import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors, FontWeight, LineHeight, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';
import { centeredIndexAt } from '@/lib/dial-index';
import { tickSelection } from '@/lib/haptics';
import { MeshBackdrop } from '@/components/ui/theme-backdrop';
import { THEME_IDS, THEMES, type ThemeId } from '@/lib/theme-catalog';
import { type MeshColors, swatchColorsFor } from '@/lib/theme-mesh';
import type { ThemeMode } from '@/lib/theme-modes';

type ThemeOption = {
  mode: ThemeMode;
  title: string;
  subtitle: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  { mode: 'auto', title: 'Auto', subtitle: 'Match your device setting' },
  ...THEME_IDS.map((id) => ({ mode: id, title: THEMES[id].title, subtitle: THEMES[id].subtitle })),
];

const SWATCH_COLORS = Object.fromEntries(
  THEME_IDS.map((id) => [id, swatchColorsFor(THEMES[id])])
) as Record<ThemeId, MeshColors>;

const VISIBLE_ITEMS = 4;
const DIAL_HEIGHT_IN_ITEMS = 1.7;
const SWATCH_INSET = Spacing.sm;
const NEIGHBOR_STEPS = [-2, -1, 0, 1, 2];
const OPACITY_BY_STEP = [0.45, 0.8, 1, 0.8, 0.45];
const SCALE_BY_STEP = [0.55, 0.85, 1.15, 0.85, 0.55];
const APPLIED_RING_WIDTH = 2;
const RESTING_VELOCITY = 0.05;

function indexOfMode(mode: ThemeMode) {
  return Math.max(
    THEME_OPTIONS.findIndex((option) => option.mode === mode),
    0
  );
}

type ThemeDialProps = {
  gutter: number;
  isOnWelcomeGlow?: boolean;
};

export default function ThemeDial({ gutter, isOnWelcomeGlow = false }: ThemeDialProps) {
  const { actualTheme, themeMode, setThemeMode } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const itemWidth = width / VISIBLE_ITEMS;
  const reduceMotion = useReducedMotion();
  const listRef = useAnimatedRef<Animated.ScrollView>();
  const requestedModeRef = useRef(themeMode);
  const [initialIndex] = useState(() => indexOfMode(themeMode));
  const [centeredIndex, setCenteredIndex] = useState(initialIndex);
  const contentOffset = useSharedValue(initialIndex * itemWidth);
  const lastCenteredIndex = useSharedValue(initialIndex);
  const optionCount = THEME_OPTIONS.length;
  const centeredOption = THEME_OPTIONS[centeredIndex];

  const applyOptionAt = (index: number) => {
    const { mode } = THEME_OPTIONS[index];

    if (mode === requestedModeRef.current) {
      return;
    }

    requestedModeRef.current = mode;
    setThemeMode(mode);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      contentOffset.value = event.contentOffset.x;
      const index = centeredIndexAt(event.contentOffset.x, itemWidth, optionCount);

      if (index !== lastCenteredIndex.value) {
        lastCenteredIndex.value = index;
        scheduleOnRN(setCenteredIndex, index);
        scheduleOnRN(tickSelection);
      }
    },
    onEndDrag: (event) => {
      if (Math.abs(event.velocity?.x ?? 0) < RESTING_VELOCITY) {
        scheduleOnRN(applyOptionAt, centeredIndexAt(event.contentOffset.x, itemWidth, optionCount));
      }
    },
    onMomentumEnd: (event) => {
      scheduleOnRN(applyOptionAt, centeredIndexAt(event.contentOffset.x, itemWidth, optionCount));
    },
  });

  const handleOptionPress = (index: number) => {
    listRef.current?.scrollTo({ x: index * itemWidth, animated: !reduceMotion });
    applyOptionAt(index);
  };

  return (
    <View style={styles.container}>
      <View style={{ marginHorizontal: -gutter }}>
        <Animated.ScrollView
          ref={listRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={itemWidth}
          decelerationRate="fast"
          contentOffset={{ x: initialIndex * itemWidth, y: 0 }}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          style={{ height: itemWidth * DIAL_HEIGHT_IN_ITEMS }}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: (width - itemWidth) / 2 },
          ]}
        >
          {THEME_OPTIONS.map((option, index) => (
            <DialItem
              key={option.mode}
              option={option}
              index={index}
              itemWidth={itemWidth}
              contentOffset={contentOffset}
              isApplied={option.mode === themeMode}
              ringColor={option.mode === themeMode ? colors.primary : colors.border}
              onPress={() => handleOptionPress(index)}
            />
          ))}
        </Animated.ScrollView>
      </View>
      <View style={styles.caption} accessibilityLiveRegion="polite">
        <Text style={styles.captionTitle}>{centeredOption.title}</Text>
        <Text style={[styles.captionSubtitle, isOnWelcomeGlow && { color: colors.text }]}>
          {centeredOption.subtitle}
        </Text>
      </View>
    </View>
  );
}

type DialItemProps = {
  option: ThemeOption;
  index: number;
  itemWidth: number;
  contentOffset: SharedValue<number>;
  isApplied: boolean;
  ringColor: string;
  onPress: () => void;
};

function DialItem({
  option,
  index,
  itemWidth,
  contentOffset,
  isApplied,
  ringColor,
  onPress,
}: DialItemProps) {
  const swatchSize = itemWidth - SWATCH_INSET * 2;

  const arcStyle = useAnimatedStyle(() => {
    const inputRange = NEIGHBOR_STEPS.map((step) => (index + step) * itemWidth);
    const liftByStep = NEIGHBOR_STEPS.map((step) => (Math.abs(step) * itemWidth) / 4);

    return {
      opacity: interpolate(contentOffset.value, inputRange, OPACITY_BY_STEP, Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(contentOffset.value, inputRange, liftByStep, Extrapolation.CLAMP),
        },
        {
          scale: interpolate(contentOffset.value, inputRange, SCALE_BY_STEP, Extrapolation.CLAMP),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[{ width: itemWidth, height: itemWidth, padding: SWATCH_INSET }, arcStyle]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${option.title} theme`}
        accessibilityState={{ selected: isApplied }}
        onPress={onPress}
        style={[
          dialStyles.ring,
          {
            width: swatchSize,
            height: swatchSize,
            borderRadius: swatchSize / 2,
            borderColor: ringColor,
            borderWidth: isApplied ? APPLIED_RING_WIDTH : 1,
          },
        ]}
      >
        <Swatch mode={option.mode} size={swatchSize} />
      </Pressable>
    </Animated.View>
  );
}

function Swatch({ mode, size }: { mode: ThemeMode; size: number }) {
  if (mode !== 'auto') {
    return <MeshSwatch colors={SWATCH_COLORS[mode]} size={size} />;
  }

  return (
    <View style={dialStyles.autoFill}>
      <MeshSwatch colors={SWATCH_COLORS.light} size={size} />
      <View style={[dialStyles.darkHalf, { left: size / 2, width: size / 2 }]}>
        <View style={{ marginLeft: -size / 2, width: size, height: size }}>
          <MeshSwatch colors={SWATCH_COLORS.dark} size={size} />
        </View>
      </View>
    </View>
  );
}

function MeshSwatch({ colors, size }: { colors: MeshColors; size: number }) {
  const swatchSize = useMemo(() => ({ width: size, height: size }), [size]);

  return <MeshBackdrop colors={colors} size={swatchSize} isAnimated={false} />;
}

const dialStyles = StyleSheet.create({
  ring: {
    overflow: 'hidden',
  },
  autoFill: {
    flex: 1,
  },
  darkHalf: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    container: {
      gap: Spacing.sm,
    },
    listContent: {
      alignItems: 'center',
    },
    caption: {
      alignItems: 'center',
      gap: Spacing.xs,
    },
    captionTitle: {
      ...Type.heading,
      color: colors.text,
    },
    captionSubtitle: {
      ...Type.label,
      fontWeight: FontWeight.medium,
      lineHeight: LineHeight.compact,
      color: colors.mutedText,
      textAlign: 'center',
    },
  });
