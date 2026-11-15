import { baseTiming } from '@/constants/motion';
import { Colors, Elevation, IconSize, Motion, Radius, Spacing, Type } from '@/constants/theme';
import { useTabBar } from '@/contexts/tab-bar-context';
import { useTheme } from '@/contexts/theme-context';
import Feather from '@expo/vector-icons/Feather';
import { PlatformPressable } from 'expo-router/react-navigation';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isTabBarVisible, setTabBarHeight } = useTabBar();
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];

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
        {
          bottom: Math.max(insets.bottom + Spacing.sm, Spacing.lg),
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          marginBottom: insets.bottom ? Spacing.sm : Spacing.md,
        },
      ]}
    >
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
      <Animated.View style={[styles.tabButton, animatedButtonStyle]}>
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
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.xxl,
    borderCurve: 'continuous',
    borderWidth: 1,
    gap: Spacing.xs,
    ...Elevation.floating,
    overflow: 'visible',
    zIndex: 1000,
  },

  barItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    borderRadius: Radius.sm,
    paddingVertical: 0,
    paddingHorizontal: 0,
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
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    minHeight: 40,
  },
});
