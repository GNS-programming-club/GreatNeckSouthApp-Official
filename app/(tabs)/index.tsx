import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import LiveNowCard from '@/components/home/live-now-card';
import TodayLunchCard from '@/components/home/today-lunch-card';
import Card from '@/components/ui/card';
import Pill from '@/components/ui/pill';
import Screen from '@/components/ui/screen';
import Section from '@/components/ui/section';
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

  const [todaySchedule, setTodaySchedule] = useState<(string | null)[] | null>(null);

  const today = useMemo(() => new Date(), []);
  const todayLetter = getDayLetter(today);
  const greeting = useMemo(() => greetingForHour(today.getHours()), [today]);
  const dateLabel = useMemo(() => {
    const weekday = today.toLocaleDateString(undefined, { weekday: 'long' });
    const monthDay = today.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

    return `${weekday}, ${monthDay}`;
  }, [today]);

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

  return (
    <Screen>
      <Stagger>
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Pill label={dateLabel} value={`Day ${todayLetter}`} />
        </View>

        <LiveNowCard todaySchedule={todaySchedule} todayLetter={todayLetter} />

        <TodayLunchCard />

        <Card>
          <Section title="Today's events">
            <Text style={styles.empty}>No events posted</Text>
          </Section>
        </Card>
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
    empty: {
      color: colors.mutedText,
      fontSize: Type.body.fontSize,
      fontWeight: Type.body.fontWeight,
    },
  });
