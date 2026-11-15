import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import FeaturesPage from '@/components/welcome/features-page';
import IntroPage from '@/components/welcome/intro-page';
import PageDots from '@/components/welcome/page-dots';
import RemindersPage from '@/components/welcome/reminders-page';
import { completeOnboarding } from '@/components/welcome/use-onboarding-status';
import WelcomeBackdrop from '@/components/welcome/welcome-backdrop';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { useReminders } from '@/contexts/reminders-context';
import { useTheme } from '@/contexts/theme-context';
import { describeWelcomeStep } from '@/lib/onboarding';

const PAGE_COUNT = 3;
const PRESSED_SCALE = 0.98;

export default function WelcomeScreen() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const pagerRef = useRef<ScrollViewInstance>(null);
  const { isEventRemindersEnabled, isPermissionDenied, setEventRemindersEnabled } = useReminders();
  const [pageIndex, setPageIndex] = useState(0);
  const [hasAnsweredAlerts, setHasAnsweredAlerts] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const step = describeWelcomeStep({
    pageIndex,
    pageCount: PAGE_COUNT,
    hasAnsweredAlerts,
    isAlertsEnabled: isEventRemindersEnabled,
    isPermissionDenied,
  });

  const goToPage = (index: number) => {
    pagerRef.current?.scrollTo({ x: index * width, animated: !reduceMotion });
    setPageIndex(index);
  };

  const handlePagerSettled = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPageIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const finish = async () => {
    setIsBusy(true);
    await completeOnboarding();
    router.replace('/');
  };

  const turnOnAlerts = async () => {
    setIsBusy(true);
    await setEventRemindersEnabled(true).catch(() => undefined);
    setHasAnsweredAlerts(true);
    setIsBusy(false);
  };

  const handlePrimaryPress = () => {
    switch (step.primaryAction) {
      case 'next':
        goToPage(pageIndex + 1);
        break;

      case 'enable-alerts':
        turnOnAlerts();
        break;

      case 'finish':
        finish();
        break;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <WelcomeBackdrop />
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handlePagerSettled}
        style={styles.pager}
      >
        <IntroPage width={width} isActive={pageIndex === 0} />
        <FeaturesPage width={width} isActive={pageIndex === 1} />
        <RemindersPage
          width={width}
          isActive={pageIndex === 2}
          statusMessage={step.statusMessage}
        />
      </ScrollView>
      <View style={styles.footer}>
        <PageDots pageCount={PAGE_COUNT} activeIndex={pageIndex} />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isBusy, busy: isBusy }}
          disabled={isBusy}
          onPress={handlePrimaryPress}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        >
          <Text style={styles.primaryLabel}>{step.primaryLabel}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityElementsHidden={!step.canSkip}
          importantForAccessibility={step.canSkip ? 'auto' : 'no-hide-descendants'}
          disabled={!step.canSkip || isBusy}
          onPress={finish}
          style={[styles.secondaryButton, !step.canSkip && styles.hidden]}
        >
          <Text style={styles.secondaryLabel}>Not now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    pager: {
      flex: 1,
    },
    footer: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xl,
      gap: Spacing.lg,
    },
    primaryButton: {
      minHeight: Spacing.xxl + Spacing.lg,
      borderRadius: Radius.md,
      borderCurve: 'continuous',
      backgroundColor: colors.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonPressed: {
      transform: [{ scale: PRESSED_SCALE }],
    },
    primaryLabel: {
      ...Type.heading,
      color: colors.background,
    },
    secondaryButton: {
      alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    hidden: {
      opacity: 0,
    },
    secondaryLabel: {
      ...Type.label,
      color: colors.text,
    },
  });
