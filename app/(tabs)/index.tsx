import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import LiveNowCard from '@/components/home/live-now-card';
import { QuickActions } from '@/components/home/quick-actions';
import StatTile from '@/components/home/stat-tile';
import { useTodayLunch } from '@/components/home/today-lunch-card';
import { TodayScheduleCard } from '@/components/home/today-schedule-card';
import Card from '@/components/ui/card';
import Pill from '@/components/ui/pill';
import Screen from '@/components/ui/screen';
import Stagger from '@/components/ui/stagger';
import { Colors, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

const STORAGE_KEY = 'userSchedule_v1';

function getDayLetter(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysDifference = Math.round((targetDate.getTime() - today.getTime()) / msPerDay);

  const dayCycle = ['B', 'A'];
  const dayIndex = ((daysDifference % dayCycle.length) + dayCycle.length) % dayCycle.length;

  return dayCycle[dayIndex];
}

function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning';

  if (hour < 18) return 'Good afternoon';

  return 'Good evening';
}

export default function HomeScreen() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const [todaySchedule, setTodaySchedule] = useState<(string | null)[] | null>(null);

  const today = useMemo(() => new Date(), []);
  const todayLetter = getDayLetter(today);
  const greeting = useMemo(() => greetingForHour(today.getHours()), [today]);
  const dateLabel = useMemo(() => {
    const weekday = today.toLocaleDateString(undefined, { weekday: 'long' });
    const monthDay = today.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

    return `${weekday}, ${monthDay}`;
  }, [today]);

  const { items: lunchItems, hasError: lunchError } = useTodayLunch();
  const lunchLines = useMemo(() => (lunchItems ? lunchItems.slice(0, 3) : []), [lunchItems]);

  useEffect(() => {
    const key = `${STORAGE_KEY}_${todayLetter}`;

    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!raw) {
          setTodaySchedule(null);

          return;
        }

        const parsed = JSON.parse(raw) as unknown;

        if (Array.isArray(parsed)) {
          setTodaySchedule(parsed as (string | null)[]);
        } else {
          setTodaySchedule(null);
        }
      })
      .catch(() => setTodaySchedule(null));
  }, [todayLetter]);

  const periodCount = todaySchedule
    ? todaySchedule.filter((entry) => entry != null && entry !== '').length
    : 0;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Pill label={dateLabel} value={`Day ${todayLetter}`} />
      </View>

      <LiveNowCard todaySchedule={todaySchedule} todayLetter={todayLetter} />

      <Stagger>
        <View style={styles.row}>
          <StatTile
            label="Today's lunch"
            icon="coffee"
            onPress={() => router.push('/calendar')}
            style={styles.rowItem}
          >
            {lunchError ? (
              <Text style={styles.tileMuted}>Menu unavailable</Text>
            ) : lunchItems === null ? (
              <Text style={styles.tileMuted}>Loading…</Text>
            ) : lunchLines.length === 0 ? (
              <Text style={styles.tileMuted}>No menu posted</Text>
            ) : (
              <View style={styles.lunchList}>
                {lunchLines.map((name, index) => (
                  <Text key={`${name}-${index}`} style={styles.lunchItem} numberOfLines={1}>
                    {name}
                  </Text>
                ))}
              </View>
            )}
          </StatTile>

          <StatTile
            label="Schedule"
            icon="calendar"
            onPress={() => router.push('/tools-routes/schedule')}
            style={styles.rowItem}
          >
            <Text style={styles.dayGlyph}>{todayLetter}</Text>
            <Text style={styles.daySub}>
              {periodCount > 0 ? `${periodCount} periods` : 'Day type'}
            </Text>
          </StatTile>
        </View>

        <Card style={styles.eventsTile}>
          <Text style={styles.eventsLabel}>Today&apos;s events</Text>
          <Text style={styles.empty}>No events posted</Text>
        </Card>

        <QuickActions />

        <TodayScheduleCard todaySchedule={todaySchedule} todayLetter={todayLetter} />
      </Stagger>
    </Screen>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    header: {
      gap: Spacing.sm,
      alignItems: 'flex-start',
    },
    greeting: {
      color: colors.text,
      fontSize: Type.display.fontSize,
      fontWeight: Type.display.fontWeight,
      letterSpacing: Type.display.letterSpacing,
    },
    row: {
      flexDirection: 'row',
      gap: Spacing.lg,
    },
    rowItem: {
      flex: 1,
    },
    tileMuted: {
      color: colors.mutedText,
      fontSize: Type.body.fontSize,
      fontWeight: '600',
    },
    lunchList: {
      gap: Spacing.xs,
    },
    lunchItem: {
      color: colors.text,
      fontSize: Type.body.fontSize,
      fontWeight: '700',
    },
    dayGlyph: {
      color: colors.text,
      fontSize: 56,
      fontWeight: '800',
      letterSpacing: -1.5,
      lineHeight: 58,
    },
    daySub: {
      color: colors.mutedText,
      fontSize: Type.label.fontSize,
      fontWeight: '700',
    },
    eventsTile: {
      gap: Spacing.sm,
    },
    eventsLabel: {
      color: colors.text,
      fontSize: Type.heading.fontSize,
      fontWeight: Type.heading.fontWeight,
      letterSpacing: Type.heading.letterSpacing,
    },
    empty: {
      color: colors.mutedText,
      fontSize: Type.body.fontSize,
      fontWeight: Type.body.fontWeight,
    },
  });
