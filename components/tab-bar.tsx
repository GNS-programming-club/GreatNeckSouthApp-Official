import { baseTiming } from '@/constants/motion';
import { Colors, IconSize, Motion, Spacing, ThemeTraits, Type } from '@/constants/theme';
import { surfaceShapeStyle } from '@/components/ui/surface-shape';
import { tabBarBottomOffset, useTabBar } from '@/contexts/tab-bar-context';
import { useTheme } from '@/contexts/theme-context';
import Feather from '@expo/vector-icons/Feather';
import { BlurView } from 'expo-blur';
import { PlatformPressable } from 'expo-router/react-navigation';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GLASS_BLUR_INTENSITY = 40;
const BAR_PADDING = Spacing.sm;

function tabBarRadii(shapeRadius: number) {
  const barRadius = shapeRadius === 0 ? 0 : shapeRadius + BAR_PADDING;

  return { barRadius, pillRadius: Math.max(0, barRadius - BAR_PADDING) };
}

function useReduceTransparency() {
  const [isReduceTransparencyEnabled, setReduceTransparencyEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparencyEnabled);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparencyEnabled
    );

    return () => subscription.remove();
  }, []);

  return isReduceTransparencyEnabled;
}

export default function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isTabBarVisible, setTabBarHeight } = useTabBar();
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const isReduceTransparencyEnabled = useReduceTransparency();
  const traits = ThemeTraits[actualTheme];
  const glass = isReduceTransparencyEnabled ? null : traits.glass;
  const { barRadius } = tabBarRadii(traits.shape.radius);

  const buildHref = (name: string) => (name === 'index' ? './' : `./${name}`);
  const visibleTabs = new Set(['index', 'calendar', 'tools', 'settings']);

  if (!isTabBarVisible) {
    return null;
  }

  return (
    <View
      onLayout={(event) => setTabBarHeight(event.nativeEvent.layout.height)}
      style={[
        styles.bar,
        surfaceShapeStyle(traits.shape, colors, 'floating', barRadius),
        {
          bottom: tabBarBottomOffset(insets.bottom),
          backgroundColor: glass ? glass.fill : colors.surface,
        },
      ]}
    >
      {glass ? (
        <View style={[styles.glassClip, { borderRadius: barRadius }]} pointerEvents="none">
          <BlurView
            intensity={GLASS_BLUR_INTENSITY}
            tint={glass.tint}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : null}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];

        if (!visibleTabs.has(route.name)) {
          return null;
        }

        let label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        if (route.name === 'index') label = 'Home';
        if (route.name === 'calendar') label = 'Calendar';
        if (route.name === 'tools') label = 'Tools';
        if (route.name === 'settings') label = 'Settings';

        const isFocused = state.index === index;

        return (
          <TabBarButton
            key={route.key}
            route={route}
            label={label}
            isFocused={isFocused}
            options={options}
            emitter={emitter}
            navigateToTab={navigateToTab}
            buildHref={buildHref}
          />
        );
      })}
    </View>
  );
}

function TabBarButton({
  route,
  label,
  isFocused,
  options,
  emitter,
  navigateToTab,
  buildHref,
}: any) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const { pillRadius } = tabBarRadii(ThemeTraits[actualTheme].shape.radius);
  const scale = useSharedValue(isFocused ? 1 : 0.95);
  const opacity = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0.95, Motion.settleSpring);
    opacity.value = withTiming(isFocused ? 1 : 0, baseTiming);
  }, [isFocused, opacity, scale]);

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(opacity.value, [0, 1], ['transparent', colors.primary]),
      transform: [{ scale: scale.value }],
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(opacity.value, [0, 1], [1, 1.05]),
        },
      ],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(opacity.value, [0, 0.5, 1], [0.6, 0.8, 1]),
    };
  });

  const onPress = () => {
    const event = emitter.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigateToTab(route.key);
    }
  };

  const onLongPress = () => {
    emitter.emit({
      type: 'tabLongPress',
      target: route.key,
    });
  };

  const iconColor = isFocused ? colors.background : colors.mutedText;
  const textColor = isFocused ? colors.background : colors.mutedText;

  return (
    <PlatformPressable
      style={styles.importIcon}
      href={buildHref(route.name, route.params)}
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarButtonTestID}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Animated.View style={[styles.tabButton, { borderRadius: pillRadius }, animatedButtonStyle]}>
        <Animated.View style={animatedIconStyle}>{getIcon(route.name, iconColor)}</Animated.View>
        <Animated.Text style={[styles.barItemFocused, { color: textColor }, animatedTextStyle]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </PlatformPressable>
  );
}

function getIcon(routeName: string, color: string) {
  switch (routeName) {
    case 'index':
      return <Feather name="home" size={IconSize.lg} color={color} />;
    case 'calendar':
      return <Feather name="calendar" size={IconSize.lg} color={color} />;
    case 'tools':
      return <Feather name="tool" size={IconSize.lg} color={color} />;
    case 'settings':
      return <Feather name="settings" size={IconSize.lg} color={color} />;
  }
}
const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: BAR_PADDING,
    paddingHorizontal: BAR_PADDING,
    gap: Spacing.xs,
    overflow: 'visible',
    zIndex: 1000,
  },

  glassClip: {
    ...StyleSheet.absoluteFill,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },

  barItemFocused: {
    flexDirection: 'column',
    ...Type.micro,
    marginTop: Spacing.xxs,
  },

  importIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tabButton: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderCurve: 'continuous',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    minHeight: 40,
  },
});
