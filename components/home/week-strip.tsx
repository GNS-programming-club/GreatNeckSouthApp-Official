import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Card from '@/components/ui/card';
import { dayLetterFor } from '@/constants/schedule';
import { Colors, Radius, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay());

  return result;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function WeekStrip() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);

    return value;
  }, []);

  const weekDays = useMemo(() => {
    const base = startOfWeek(today);
    base.setDate(base.getDate() + weekOffset * 7);

    return Array.from({ length: 7 }, (_, index) => new Date(base.getTime() + index * MS_PER_DAY));
  }, [today, weekOffset]);

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
          <Feather name="chevron-left" size={18} color={colors.mutedText} />
        </TouchableOpacity>

        <Text style={styles.monthLabel}>{monthLabel}</Text>

        <TouchableOpacity
          onPress={() => setWeekOffset((value) => value + 1)}
          hitSlop={10}
          style={styles.navButton}
        >
          <Feather name="chevron-right" size={18} color={colors.mutedText} />
        </TouchableOpacity>
      </View>

      <View style={styles.week}>
        {weekDays.map((day, index) => {
          const todayMarked = isSameDay(day, today);
          const weekday = day.getDay();
          const isSchoolDay = weekday >= 1 && weekday <= 5;
          const letter = isSchoolDay ? dayLetterFor(day) : null;

          return (
            <TouchableOpacity
              key={day.toISOString()}
              style={styles.day}
              activeOpacity={0.7}
              onPress={() => router.push('/calendar')}
            >
              <Text style={styles.weekdayLabel}>{WEEKDAY_LABELS[index]}</Text>

              <View style={[styles.dateCircle, todayMarked && styles.dateCircleToday]}>
                <Text style={[styles.dateText, todayMarked && styles.dateTextToday]}>
                  {day.getDate()}
                </Text>
              </View>

              <Text style={[styles.letter, todayMarked && styles.letterToday]}>
                {letter ?? ' '}
              </Text>
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
      gap: 14,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    navButton: {
      padding: 4,
    },
    monthLabel: {
      color: colors.text,
      fontSize: Type.label.fontSize,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    week: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    day: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    weekdayLabel: {
      color: colors.mutedText,
      fontSize: 11,
      fontWeight: '600',
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
      backgroundColor: colors.primary,
    },
    dateText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    dateTextToday: {
      color: colors.primaryText,
    },
    letter: {
      color: colors.mutedText,
      fontSize: 10,
      fontWeight: '700',
    },
    letterToday: {
      color: colors.primary,
    },
  });
