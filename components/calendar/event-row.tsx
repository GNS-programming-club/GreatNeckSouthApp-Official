import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, FontWeight, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';
import { formatEventTime, type CalendarEvent } from '@/lib/school-data';

export default function EventRow({ event }: { event: CalendarEvent }) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <Text style={styles.time}>{formatEventTime(event)}</Text>
      <View style={styles.details}>
        <Text style={styles.title}>{event.title}</Text>
        {event.location ? <Text style={styles.location}>{event.location}</Text> : null}
      </View>
    </View>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
    },
    time: {
      width: 64,
      color: colors.primary,
      fontSize: Type.caption.fontSize,
      fontWeight: FontWeight.bold,
      marginTop: Spacing.xxs,
    },
    details: {
      flex: 1,
      gap: Spacing.xxs,
    },
    title: {
      color: colors.text,
      fontSize: Type.body.fontSize,
      fontWeight: FontWeight.semibold,
    },
    location: {
      color: colors.mutedText,
      fontSize: Type.caption.fontSize,
      fontWeight: FontWeight.medium,
    },
  });
