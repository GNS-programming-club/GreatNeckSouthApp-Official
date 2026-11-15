import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { Colors, IconSize, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

export type HeaderCollapse = {
  scrollY: SharedValue<number>;
  titleHeight: SharedValue<number>;
  onScroll: ReturnType<typeof useAnimatedScrollHandler>;
};

type PageHeaderProps = {
  title: string;
  collapse?: HeaderCollapse;
};

type PageLargeTitleProps = {
  title: string;
  collapse: HeaderCollapse;
};

const BACK_BUTTON_SIZE = 36;
const LARGE_TITLE_FADE_FRACTION = 0.6;
const COMPACT_TITLE_START_FRACTION = 0.5;
const COMPACT_TITLE_RISE = 6;

export function useHeaderCollapse(): HeaderCollapse {
  const scrollY = useSharedValue(0);
  const titleHeight = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return { scrollY, titleHeight, onScroll };
}

export function PageLargeTitle({ title, collapse }: PageLargeTitleProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { scrollY, titleHeight } = collapse;

  const onLayout = (event: LayoutChangeEvent) => {
    titleHeight.set(event.nativeEvent.layout.height);
  };

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, Math.max(1, titleHeight.value * LARGE_TITLE_FADE_FRACTION)],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <View style={styles.largeTitleBlock} onLayout={onLayout}>
      <Animated.Text style={[styles.largeTitle, fadeStyle]} accessibilityRole="header">
        {title}
      </Animated.Text>
    </View>
  );
}

export default function PageHeader({ title, collapse }: PageHeaderProps) {
  const router = useRouter();
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const backButton = (
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => router.back()}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Back"
    >
      <Feather name="chevron-left" size={IconSize.xl} color={colors.text} />
    </TouchableOpacity>
  );

  if (!collapse) {
    return (
      <View style={styles.header}>
        {backButton}
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      </View>
    );
  }

  return <CompactBar title={title} collapse={collapse} backButton={backButton} />;
}

function CompactBar({
  title,
  collapse,
  backButton,
}: {
  title: string;
  collapse: HeaderCollapse;
  backButton: React.ReactNode;
}) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { scrollY, titleHeight } = collapse;

  const compactTitleStyle = useAnimatedStyle(() => {
    const collapsed = Math.max(1, titleHeight.value);
    const progress = interpolate(
      scrollY.value,
      [collapsed * COMPACT_TITLE_START_FRACTION, collapsed],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity: progress,
      transform: [{ translateY: (1 - progress) * COMPACT_TITLE_RISE }],
    };
  });

  const hairlineStyle = useAnimatedStyle(() => {
    const collapsed = Math.max(1, titleHeight.value);

    return {
      opacity: interpolate(
        scrollY.value,
        [collapsed - Spacing.sm, collapsed],
        [0, 1],
        Extrapolation.CLAMP
      ),
    };
  });

  return (
    <View style={styles.compactBar}>
      {backButton}
      <Animated.View
        pointerEvents="none"
        style={[styles.compactTitleWrap, compactTitleStyle]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text style={styles.compactTitle} numberOfLines={1}>
          {title}
        </Text>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.hairline, hairlineStyle]} />
    </View>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    backButton: {
      width: BACK_BUTTON_SIZE,
      height: BACK_BUTTON_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
    title: {
      marginTop: Spacing.sm,
      ...Type.display,
      color: colors.text,
    },
    compactBar: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.sm,
      backgroundColor: colors.background,
      zIndex: 1,
    },
    compactTitleWrap: {
      position: 'absolute',
      top: Spacing.xl,
      left: Spacing.lg + BACK_BUTTON_SIZE,
      right: Spacing.lg + BACK_BUTTON_SIZE,
      height: BACK_BUTTON_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    compactTitle: {
      ...Type.heading,
      color: colors.text,
    },
    hairline: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 1,
      backgroundColor: colors.border,
    },
    largeTitleBlock: {
      marginHorizontal: -Spacing.lg,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    largeTitle: {
      ...Type.display,
      color: colors.text,
    },
  });
