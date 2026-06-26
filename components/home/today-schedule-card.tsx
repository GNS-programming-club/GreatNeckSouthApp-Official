import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Card from '@/components/ui/card';
import {
  PERIOD_COUNT,
  computePeriodTimes,
  nowMinutesLocal,
  parse24hToMinutes,
} from '@/constants/schedule';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type TodayScheduleCardProps = {
  todaySchedule: (string | null)[] | null;
  todayLetter: string;
};

export function TodayScheduleCard({ todaySchedule, todayLetter }: TodayScheduleCardProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [nowMin, setNowMin] = useState(() => nowMinutesLocal());

  useEffect(() => {
    const interval = setInterval(() => setNowMin(nowMinutesLocal()), 30_000);

    return () => clearInterval(interval);
  }, []);

  const times = useMemo(() => computePeriodTimes(PERIOD_COUNT), []);

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Today&apos;s schedule</Text>
        <Text style={styles.dayTag}>Day {todayLetter}</Text>
      </View>

      <View style={styles.list}>
        {times.map((slot, index) => {
          const start = parse24hToMinutes(slot.start);
          const end = parse24hToMinutes(slot.end);
          const isCurrent = start != null && end != null && nowMin >= start && nowMin < end;
          const course = todaySchedule?.[index];

          return (
            <View
              key={`period-${index}`}
              style={[styles.row, index === 0 && styles.firstRow, isCurrent && styles.currentRow]}
            >
              <View style={styles.rowMain}>
                <Text style={[styles.period, isCurrent && styles.currentText]}>
                  Period {index + 1}
                </Text>
                <Text style={styles.course} numberOfLines={1}>
                  {course ? course : '—'}
                </Text>
              </View>
              <Text style={[styles.time, isCurrent && styles.currentText]}>
                {slot.start}–{slot.end}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderCurve: 'continuous',
    },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      color: colors.text,
      fontSize: Type.heading.fontSize,
      fontWeight: Type.heading.fontWeight,
      letterSpacing: Type.heading.letterSpacing,
    },
    dayTag: {
      color: colors.mutedText,
      fontSize: Type.label.fontSize,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    list: {
      marginTop: Spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      borderLeftWidth: 3,
      borderLeftColor: 'transparent',
    },
    firstRow: {
      borderTopWidth: 0,
    },
    currentRow: {
      backgroundColor: colors.surfaceAlt,
      borderLeftColor: colors.primary,
      borderRadius: Radius.sm,
    },
    rowMain: {
      flex: 1,
      gap: 2,
    },
    period: {
      color: colors.text,
      fontSize: Type.body.fontSize,
      fontWeight: '700',
    },
    course: {
      color: colors.text,
      fontSize: Type.label.fontSize,
      fontWeight: '500',
    },
    time: {
      color: colors.mutedText,
      fontSize: Type.label.fontSize,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
    },
    currentText: {
      color: colors.primary,
    },
  });
