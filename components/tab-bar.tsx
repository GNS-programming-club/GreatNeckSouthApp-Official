import { Colors } from '@/constants/theme';
import { useTabBar } from '@/contexts/tab-bar-context';
import { useTheme } from '@/contexts/theme-context';
import Feather from '@expo/vector-icons/Feather';
import { PlatformPressable } from '@react-navigation/elements';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabBar({ state, descriptors, navigation }: { state: any; descriptors: any; navigation: any }) {
  const insets = useSafeAreaInsets();
  const { isTabBarVisible } = useTabBar();
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];

  const buildHref = (name: string) => (name === 'index' ? './' : `./${name}`);
  const visibleTabs = new Set(['index', 'calendar', 'courses', 'tools', 'settings']);

  if (!isTabBarVisible) {
    return null;
  }

  return (
    <View style = {[styles.bar, { 
      bottom: Math.max(insets.bottom + 8, 16),
      backgroundColor: colors.surface,
      borderColor: colors.border,
      marginBottom: insets.bottom ? 8 : 12,
    }]}>
      {state.routes.map((route: { key: string | number; name: string; params: object | undefined }, index: any) => {
        const { options } = descriptors[route.key];

        if (options?.href === null || !visibleTabs.has(route.name)) {
          return null;
        }

        let label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        if (route.name === "index") label = "Home";
        if (route.name === "calendar") label = "Calendar";
        if (route.name === "courses") label = "Courses";
        if (route.name === "tools") label = "Tools";
        if (route.name === "settings") label = "Settings";

        const isFocused = state.index === index;
        
        return <TabBarButton 
          key={route.key}
          route={route}
          label={label}
          isFocused={isFocused}
          options={options}
          navigation={navigation}
          buildHref={buildHref}
        />;
      })}
    </View>
  );
}

function TabBarButton({ route, label, isFocused, options, navigation, buildHref }: any) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const scale = useSharedValue(isFocused ? 1 : 0.95);
  const opacity = useSharedValue(isFocused ? 1 : 0);
  
  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0.95, {
      damping: 15,
      stiffness: 150,
      mass: 0.5,
    });
    opacity.value = withTiming(isFocused ? 1 : 0, {
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isFocused, opacity, scale]);

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        opacity.value,
        [0, 1],
        ['transparent', colors.primary]
      ),
      transform: [{ scale: scale.value }],
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          scale: interpolate(
            opacity.value,
            [0, 1],
            [1, 1.05]
          ) 
        }
      ],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        opacity.value,
        [0, 0.5, 1],
        [0.6, 0.8, 1]
      ),
    };
  });

  const onPress = () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  const onLongPress = () => {
    navigation.emit({
      type: 'tabLongPress',
      target: route.key,
    });
  };

  const iconColor = isFocused ? colors.background : colors.icon;
  const textColor = isFocused ? colors.background : colors.icon;

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
        <Animated.View style={animatedIconStyle}>
          {getIcon(route.name, iconColor)}
        </Animated.View>
        <Animated.Text style={[styles.barItemFocused, { color: textColor }, animatedTextStyle]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </PlatformPressable>
  );
}

function getIcon(routeName: string, color: string) {
  switch(routeName) {
    case "index":
      return <Feather name="home" size={20} color={color}/>
    case "calendar":
      return <Feather name="calendar" size={20} color={color}/>
    case "courses":
      return <Feather name="book-open" size={20} color={color}/>
    case "tools":
      return <Feather name="tool" size={20} color={color}/>
    case "settings":
      return <Feather name="settings" size={20} color={color}/>
  }
}
const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'visible',
    zIndex: 1000,
  },

  barItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    borderRadius: 10,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },

  barItemFocused: {
    flexDirection: 'column',
    fontWeight: '600',
    fontSize: 11,
    marginTop: 2,
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
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 9,
    minHeight: 42,
  }
});
