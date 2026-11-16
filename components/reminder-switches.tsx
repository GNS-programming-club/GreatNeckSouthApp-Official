import React, { useMemo } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import {
  Colors,
  FontWeight,
  LineHeight,
  Radii,
  type RadiusScale,
  Spacing,
  Type,
} from '@/constants/theme';
import { useReminders } from '@/contexts/reminders-context';
import { useTheme } from '@/contexts/theme-context';

export type ReminderKind = 'dayLetter' | 'event';

type ReminderSwitchesProps = {
  onChange?: (kind: ReminderKind, enabled: boolean) => void;
};

const BLOCKED_HINT = 'Turn on notifications for this app in your phone settings';

export default function ReminderSwitches({ onChange }: ReminderSwitchesProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const radius = Radii[actualTheme];
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);
  const reminders = useReminders();
  const trackColor = { false: colors.border, true: colors.primary };

  const handleDayLetterChange = (enabled: boolean) => {
    onChange?.('dayLetter', enabled);
    reminders.setEnabled(enabled);
  };

  const handleEventChange = (enabled: boolean) => {
    onChange?.('event', enabled);
    reminders.setEventRemindersEnabled(enabled);
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Text style={styles.rowTitle}>Day Letter Reminder</Text>
          <Text style={styles.rowSubtitle}>
            {reminders.isPermissionDenied
              ? BLOCKED_HINT
              : 'At 8 PM, get notified on whether tomorrow is an A or B day'}
          </Text>
        </View>
        <Switch
          value={reminders.isEnabled}
          onValueChange={handleDayLetterChange}
          trackColor={trackColor}
          accessibilityLabel="Day letter reminder"
        />
      </View>

      <View style={[styles.row, styles.rowLast]}>
        <View style={styles.rowLeft}>
          <Text style={styles.rowTitle}>Event Reminders</Text>
          <Text style={styles.rowSubtitle}>
            {reminders.isPermissionDenied
              ? BLOCKED_HINT
              : "Before school, get notified about the day's highlight events"}
          </Text>
        </View>
        <Switch
          value={reminders.isEventRemindersEnabled}
          onValueChange={handleEventChange}
          trackColor={trackColor}
          accessibilityLabel="Event reminders"
        />
      </View>
    </View>
  );
}

const createStyles = (colors: (typeof Colors)['light'], radius: RadiusScale) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: Spacing.md,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowLeft: {
      flex: 1,
      gap: Spacing.xs,
    },
    rowTitle: {
      ...Type.body,
      fontWeight: FontWeight.bold,
      color: colors.text,
    },
    rowSubtitle: {
      ...Type.label,
      fontWeight: FontWeight.medium,
      color: colors.mutedText,
      lineHeight: LineHeight.compact,
    },
  });
