import Feather from '@expo/vector-icons/Feather';
import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { baseTiming } from '@/constants/motion';
import { Colors, IconSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type AccordionProps = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
};

export default function Accordion({ trigger, children, defaultExpanded = false }: AccordionProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const openness = useSharedValue(defaultExpanded ? 1 : 0);
  const contentHeight = useSharedValue(0);

  useEffect(() => {
    const target = expanded ? 1 : 0;

    openness.value = reduceMotion ? target : withTiming(target, baseTiming);
  }, [expanded, openness, reduceMotion]);

  const onContentLayout = (event: LayoutChangeEvent) => {
    contentHeight.value = event.nativeEvent.layout.height;
  };

  const panelStyle = useAnimatedStyle(() => ({
    height: contentHeight.value * openness.value,
    opacity: openness.value,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${openness.value * 180}deg` }],
  }));

  return (
    <View>
      <Pressable
        style={styles.trigger}
        onPress={() => setExpanded((current) => !current)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.triggerContent}>{trigger}</View>
        <Animated.View style={chevronStyle}>
          <Feather name="chevron-down" size={IconSize.lg} color={colors.mutedText} />
        </Animated.View>
      </Pressable>
      <Animated.View
        style={[styles.panel, panelStyle]}
        accessibilityElementsHidden={!expanded}
        importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
      >
        <View style={styles.measured} onLayout={onContentLayout}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  triggerContent: {
    flex: 1,
    gap: Spacing.sm,
  },
  panel: {
    overflow: 'hidden',
  },
  measured: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
