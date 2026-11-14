import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Card from '@/components/ui/card';
import { Colors, Spacing, FontWeight, IconSize, Radius, Tracking, Type } from '@/constants/theme';
import { useSchoolData } from '@/contexts/school-data-context';
import { useTheme } from '@/contexts/theme-context';
import { useTodayIso } from '@/hooks/use-today-iso';
import { dayStatusFor, fromIsoDate, toIsoDate, weekDates } from '@/lib/day-letters';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function stripLabel(day: Date, dayLetters: ReturnType<typeof useSchoolData>['dayLetters']) {
  const weekday = day.getDay();

  if (weekday === 0 || weekday === 6) {
    return ' ';
  }

  const status = dayStatusFor(toIsoDate(day), dayLetters);

  if (status.kind === 'school') {
    return status.letter;
  }

  return status.kind === 'no-school' ? 'Off' : '—';
}

export function WeekStrip() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const { dayLetters } = useSchoolData();

  const todayIso = useTodayIso();
  const today = useMemo(() => fromIsoDate(todayIso), [todayIso]);

  const weekDays = useMemo(
    () => weekDates(todayIso, weekOffset).map(fromIsoDate),
    [todayIso, weekOffset]
  );

  const monthLabel = useMemo(
    () => weekDays[0].toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    [weekDays]
  );

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setWeekOffset((value) => value - 1)}
          hitSlop={10}
          style={styles.navButton}
        >
          <Feather name="chevron-left" size={IconSize.md} color={colors.mutedText} />
        </TouchableOpacity>

        <Text style={styles.monthLabel}>{monthLabel}</Text>

        <TouchableOpacity
          onPress={() => setWeekOffset((value) => value + 1)}
          hitSlop={10}
          style={styles.navButton}
        >
          <Feather name="chevron-right" size={IconSize.md} color={colors.mutedText} />
        </TouchableOpacity>
      </View>

      <View style={styles.week}>
        {weekDays.map((day, index) => {
          const todayMarked = isSameDay(day, today);
          const letter = stripLabel(day, dayLetters);

          return (
            <TouchableOpacity
              key={day.toISOString()}
              style={styles.day}
              activeOpacity={0.7}
              onPress={() =>
                router.push({ pathname: '/calendar', params: { date: toIsoDate(day) } })
              }
            >
              <Text style={styles.weekdayLabel}>{WEEKDAY_LABELS[index]}</Text>

              <View style={[styles.dateCircle, todayMarked && styles.dateCircleToday]}>
                <Text style={[styles.dateText, todayMarked && styles.dateTextToday]}>
                  {day.getDate()}
                </Text>
              </View>

              <Text style={[styles.letter, todayMarked && styles.letterToday]}>{letter}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Card>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    card: {
      gap: Spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    navButton: {
      padding: Spacing.xs,
    },
    monthLabel: {
      color: colors.text,
      fontSize: Type.label.fontSize,
      fontWeight: FontWeight.bold,
      letterSpacing: Tracking.wide,
    },
    week: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    day: {
      flex: 1,
      alignItems: 'center',
      gap: Spacing.xs,
    },
    weekdayLabel: {
      color: colors.mutedText,
      ...Type.micro,
    },
    dateCircle: {
      width: 40,
      height: 34,
      borderRadius: Radius.md,
      borderCurve: 'continuous',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateCircleToday: {
      backgroundColor: colors.primaryFill,
    },
    dateText: {
      color: colors.text,
      fontSize: Type.body.fontSize,
      fontWeight: FontWeight.semibold,
    },
    dateTextToday: {
      color: colors.primaryText,
    },
    letter: {
      color: colors.mutedText,
      fontSize: Type.micro.fontSize,
      fontWeight: FontWeight.bold,
    },
    letterToday: {
      color: colors.primary,
    },
  });
