import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AnnouncementsCard from '@/components/home/announcements-card';
import EventsCard from '@/components/home/events-card';
import LiveNowCard from '@/components/home/live-now-card';
import { QuickActions } from '@/components/home/quick-actions';
import StatTile from '@/components/home/stat-tile';
import { useTodayLunch } from '@/components/home/today-lunch-card';
import { WeekStrip } from '@/components/home/week-strip';
import Screen from '@/components/ui/screen';
import Stagger from '@/components/ui/stagger';
import { Colors, Spacing, Type } from '@/constants/theme';
import { useDayStatus, useSchoolData } from '@/contexts/school-data-context';
import { useTheme } from '@/contexts/theme-context';
import { useTodayIso } from '@/hooks/use-today-iso';
import { fromIsoDate, nextSchoolDay, toIsoDate } from '@/lib/day-letters';

const STORAGE_KEY = 'userSchedule_v1';

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

  const [loadedSchedule, setLoadedSchedule] = useState<{
    letter: string;
    entries: (string | null)[] | null;
  } | null>(null);

  const todayIso = useTodayIso();
  const today = useMemo(() => {
    const now = new Date();

    return todayIso === toIsoDate(now) ? now : fromIsoDate(todayIso);
  }, [todayIso]);
  const todayStatus = useDayStatus(todayIso);
  const { dayLetters } = useSchoolData();
  const upcomingSchoolDay = useMemo(
    () => nextSchoolDay(todayIso, dayLetters),
    [todayIso, dayLetters]
  );
  const todayLetter = todayStatus.kind === 'school' ? todayStatus.letter : null;
  const dayGlyph = todayLetter ?? (todayStatus.kind === 'no-school' ? 'Off' : '—');
  const greeting = useMemo(() => greetingForHour(today.getHours()), [today]);
  const dateLabel = useMemo(() => {
    const weekday = today.toLocaleDateString(undefined, { weekday: 'long' });
    const monthDay = today.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

    return `${weekday}, ${monthDay}`;
  }, [today]);

  const { items: lunchItems, hasError: lunchError } = useTodayLunch();
  const lunchLines = useMemo(() => (lunchItems ? lunchItems.slice(0, 3) : []), [lunchItems]);

  useEffect(() => {
    if (!todayLetter) {
      return;
    }

    AsyncStorage.getItem(`${STORAGE_KEY}_${todayLetter}`)
      .then((raw) => {
        const parsed = raw ? (JSON.parse(raw) as unknown) : null;

        setLoadedSchedule({
          letter: todayLetter,
          entries: Array.isArray(parsed) ? (parsed as (string | null)[]) : null,
        });
      })
      .catch(() => setLoadedSchedule({ letter: todayLetter, entries: null }));
  }, [todayLetter]);

  const todaySchedule =
    todayLetter && loadedSchedule?.letter === todayLetter ? loadedSchedule.entries : null;

  const periodCount = todaySchedule
    ? todaySchedule.filter((entry) => entry != null && entry !== '').length
    : 0;

  return (
    <Screen>
      <Stagger>
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.dateSubtitle}>{dateLabel}</Text>
        </View>

        <WeekStrip />

        <LiveNowCard
          todaySchedule={todaySchedule}
          todayStatus={todayStatus}
          nextSchoolDay={upcomingSchoolDay}
        />

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
            onPress={() => router.push('/tools/schedule')}
            style={styles.rowItem}
          >
            <Text style={styles.dayGlyph}>{dayGlyph}</Text>
            <Text style={styles.daySub}>
              {periodCount > 0
                ? `${periodCount} periods`
                : todayStatus.kind === 'no-school'
                  ? 'No school'
                  : 'Day type'}
            </Text>
          </StatTile>
        </View>

        <EventsCard todayIso={todayIso} />

        <AnnouncementsCard />

        <QuickActions />
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
    dateSubtitle: {
      color: colors.mutedText,
      fontSize: Type.body.fontSize,
      fontWeight: '600',
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
  });
