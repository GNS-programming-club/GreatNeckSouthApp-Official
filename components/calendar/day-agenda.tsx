import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Card from '@/components/ui/card';
import { dayLetterFor } from '@/constants/schedule';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type DayAgendaProps = {
  date: Date;
  menuItems: string[] | null;
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function DayAgenda({ date, menuItems }: DayAgendaProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const weekdayIndex = date.getDay();
  const isSchoolDay = weekdayIndex >= 1 && weekdayIndex <= 5;
  const headline = `${WEEKDAYS[weekdayIndex]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
  const letter = isSchoolDay ? dayLetterFor(date) : null;

  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.headline}>{headline}</Text>
        {letter ? (
          <View style={styles.letterBadge}>
            <Text style={styles.letterText}>Day {letter}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.group}>
        <Text style={styles.groupLabel}>Lunch</Text>
        {menuItems === null ? (
          <View style={styles.skeletonGroup}>
            <View style={[styles.skeletonLine, styles.skeletonWide]} />
            <View style={[styles.skeletonLine, styles.skeletonMid]} />
            <View style={[styles.skeletonLine, styles.skeletonNarrow]} />
          </View>
        ) : menuItems.length === 0 ? (
          <Text style={styles.emptyText}>No lunch posted</Text>
        ) : (
          <View style={styles.itemList}>
            {menuItems.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.itemRow}>
                <View style={styles.dot} />
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.group}>
        <Text style={styles.groupLabel}>Events</Text>
        <Text style={styles.emptyText}>No events posted</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.group}>
        <Text style={styles.groupLabel}>Holidays</Text>
        <Text style={styles.emptyText}>No holidays</Text>
      </View>
    </Card>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    headline: {
      flex: 1,
      color: colors.text,
      fontSize: Type.heading.fontSize,
      fontWeight: Type.heading.fontWeight,
      letterSpacing: Type.heading.letterSpacing,
    },
    letterBadge: {
      backgroundColor: colors.accentSoft,
      borderRadius: Radius.pill,
      borderCurve: 'continuous',
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
    },
    letterText: {
      color: colors.primary,
      fontSize: Type.caption.fontSize,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    group: {
      gap: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    groupLabel: {
      color: colors.mutedText,
      fontSize: Type.caption.fontSize,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    itemList: {
      gap: Spacing.sm,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 7,
    },
    itemText: {
      flex: 1,
      color: colors.text,
      fontSize: Type.body.fontSize,
      fontWeight: Type.body.fontWeight,
    },
    emptyText: {
      color: colors.mutedText,
      fontSize: Type.body.fontSize,
      fontWeight: '500',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    skeletonGroup: {
      gap: Spacing.sm,
    },
    skeletonLine: {
      height: 12,
      borderRadius: Radius.sm,
      borderCurve: 'continuous',
      backgroundColor: colors.surfaceAlt,
    },
    skeletonWide: {
      width: '82%',
    },
    skeletonMid: {
      width: '64%',
    },
    skeletonNarrow: {
      width: '48%',
    },
  });
