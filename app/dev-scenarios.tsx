import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from '@expo/vector-icons/Feather';
import { Redirect, Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PageHeader from '@/components/tools/page-header';
import Card from '@/components/ui/card';
import Section from '@/components/ui/section';
import SegmentedControl, { type SegmentOption } from '@/components/ui/segmented-control';
import { useToast } from '@/components/ui/toast';
import { Colors, FontWeight, IconSize, Spacing, Tracking, Type } from '@/constants/theme';
import { useSchoolData } from '@/contexts/school-data-context';
import { useTheme } from '@/contexts/theme-context';
import { useClockVersion } from '@/hooks/use-clock-version';
import { parseClockToSeconds } from '@/hooks/use-live-period';
import { appClock } from '@/lib/clock';
import { toIsoDate } from '@/lib/day-letters';
import {
  buildScenarios,
  easternWallTimeToDate,
  nextSaturday,
  upcomingSchoolDay,
  type PeriodBounds,
  type Scenario,
} from '@/lib/dev-scenarios';
import { ONBOARDING_STORAGE_KEY } from '@/lib/onboarding';

import scheduleData from '@/assets/data/schedule.json';

type SpeedValue = '1' | '10' | '60';

const SPEED_OPTIONS: SegmentOption<SpeedValue>[] = [
  { value: '1', label: '1×' },
  { value: '10', label: '10×' },
  { value: '60', label: '60×' },
];

const periodBounds: PeriodBounds[] = scheduleData.periods.flatMap((period) => {
  const startSeconds = parseClockToSeconds(period.start);
  const endSeconds = parseClockToSeconds(period.end);

  return startSeconds == null || endSeconds == null ? [] : [{ startSeconds, endSeconds }];
});

const scenarios = buildScenarios(periodBounds);

const MANUAL_CHECKS = [
  'Empty search: type "zzz" into Bus, Clubs or Courses.',
  'Accordion: tap any course card in Courses.',
  'Sliding switch: Courses filter sheet, Sort By row.',
  'Press scale: hold any card on Home.',
  'Loading pulse: open Home with the network off, then turn it on.',
];

function useLiveClockLabel(): string {
  const [label, setLabel] = useState(() => describeClock());

  useEffect(() => {
    const syncLabel = () => setLabel(describeClock());
    const interval = setInterval(syncLabel, 1000);
    const unsubscribeFromClock = appClock.subscribe(syncLabel);

    return () => {
      clearInterval(interval);
      unsubscribeFromClock();
    };
  }, []);

  return label;
}

function describeClock(): string {
  if (!appClock.isOverridden()) {
    return 'Real time';
  }

  const fakeNow = appClock.now().toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });

  return `${fakeNow} at ${appClock.speed()}×`;
}

export default function DevScenarios() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const toast = useToast();
  const { dayLetters } = useSchoolData();
  const clockLabel = useLiveClockLabel();
  useClockVersion();
  const isOverridden = appClock.isOverridden();

  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  const startScenario = (scenario: Scenario) => {
    const realTodayIso = toIsoDate(new Date());
    const scenarioDate =
      scenario.day === 'weekend'
        ? nextSaturday(realTodayIso)
        : upcomingSchoolDay(realTodayIso, dayLetters);

    appClock.override(easternWallTimeToDate(scenarioDate, scenario.secondsOfDay), scenario.speed);
    router.navigate('/');
  };

  const replayFirstLaunch = async () => {
    await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
    router.replace('/welcome');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <PageHeader title="Test Scenarios" />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.statusCard}>
          <Text style={styles.label}>CLOCK</Text>
          <Text style={styles.statusValue}>{clockLabel}</Text>
          {isOverridden ? (
            <>
              <SegmentedControl
                options={SPEED_OPTIONS}
                value={String(appClock.speed()) as SpeedValue}
                onChange={(speed) => appClock.setSpeed(Number(speed))}
              />
              <ActionRow
                icon="rotate-ccw"
                title="Back to real time"
                onPress={() => appClock.clear()}
                styles={styles}
                colors={colors}
              />
            </>
          ) : null}
        </Card>

        <Section title="Time of day">
          <View style={styles.list}>
            {scenarios.map((scenario) => (
              <ActionRow
                key={scenario.id}
                icon={scenario.day === 'weekend' ? 'sun' : 'clock'}
                title={scenario.title}
                subtitle={scenario.description}
                onPress={() => startScenario(scenario)}
                styles={styles}
                colors={colors}
              />
            ))}
          </View>
        </Section>

        <Section title="Situations">
          <View style={styles.list}>
            <ActionRow
              icon="star"
              title="First launch"
              subtitle="Clears the welcome flag and opens the welcome flow."
              onPress={replayFirstLaunch}
              styles={styles}
              colors={colors}
            />
            <ActionRow
              icon="bell"
              title="Show toast"
              subtitle="Fires the reminder confirmation above the tab bar."
              onPress={() => toast.show('Event reminders on', 'bell')}
              styles={styles}
              colors={colors}
            />
          </View>
        </Section>

        <Section title="Check by hand">
          <Card style={styles.list}>
            {MANUAL_CHECKS.map((check) => (
              <Text key={check} style={styles.manualCheck}>
                {check}
              </Text>
            ))}
          </Card>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

type ActionRowProps = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: typeof Colors.light;
};

function ActionRow({ icon, title, subtitle, onPress, styles, colors }: ActionRowProps) {
  return (
    <Card onPress={onPress} accessibilityLabel={title} style={styles.row}>
      <Feather name={icon} size={IconSize.md} color={colors.primary} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <Feather name="chevron-right" size={IconSize.md} color={colors.mutedText} />
    </Card>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: Spacing.lg,
      gap: Spacing.xl,
      paddingBottom: Spacing.xxl,
    },
    statusCard: {
      gap: Spacing.sm,
    },
    label: {
      ...Type.label,
      letterSpacing: Tracking.uppercase,
      color: colors.mutedText,
    },
    statusValue: {
      ...Type.heading,
      color: colors.text,
    },
    list: {
      gap: Spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    rowText: {
      flex: 1,
      gap: Spacing.xxs,
    },
    rowTitle: {
      fontSize: Type.body.fontSize,
      fontWeight: FontWeight.bold,
      color: colors.text,
    },
    rowSubtitle: {
      ...Type.caption,
      color: colors.mutedText,
    },
    manualCheck: {
      ...Type.body,
      color: colors.text,
    },
  });
