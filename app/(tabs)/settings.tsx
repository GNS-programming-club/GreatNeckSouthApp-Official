import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ReminderSwitches, { type ReminderKind } from '@/components/reminder-switches';
import ThemeDial from '@/components/theme-dial';
import Screen from '@/components/ui/screen';
import Stagger from '@/components/ui/stagger';
import { useToast } from '@/components/ui/toast';
import { DEV_TOOLS_ENABLED } from '@/constants/flags';
import {
  Colors,
  FontWeight,
  IconSize,
  LineHeight,
  Radii,
  type RadiusScale,
  Spacing,
  Type,
} from '@/constants/theme';
import { useReminders } from '@/contexts/reminders-context';
import { useTheme } from '@/contexts/theme-context';

export default function SettingsPage() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const radius = Radii[actualTheme];
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);
  const reminders = useReminders();
  const toast = useToast();
  const router = useRouter();
  const isAwaitingEventRemindersOn = useRef(false);
  const isAwaitingDayLetterRemindersOn = useRef(false);

  useEffect(() => {
    if (reminders.isEventRemindersEnabled && isAwaitingEventRemindersOn.current) {
      isAwaitingEventRemindersOn.current = false;
      toast.show('Event reminders on', 'bell');
    }
  }, [reminders.isEventRemindersEnabled, toast]);

  useEffect(() => {
    if (reminders.isEnabled && isAwaitingDayLetterRemindersOn.current) {
      isAwaitingDayLetterRemindersOn.current = false;
      toast.show('Day letter reminders on', 'bell');
    }
  }, [reminders.isEnabled, toast]);

  const handleReminderChange = (kind: ReminderKind, enabled: boolean) => {
    if (kind === 'dayLetter') {
      isAwaitingDayLetterRemindersOn.current = enabled;
    } else {
      isAwaitingEventRemindersOn.current = enabled;
    }
  };

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>Settings</Text>
    </View>
  );

  return (
    <Screen header={header}>
      <Stagger>
        <View style={styles.section}>
          <SectionHeading icon="moon" title="App Theme" colors={colors} styles={styles} />

          <ThemeDial gutter={Spacing.lg} />
        </View>

        <View style={styles.section}>
          <SectionHeading icon="bell" title="Notifications" colors={colors} styles={styles} />

          <ReminderSwitches onChange={handleReminderChange} />
        </View>

        <View style={styles.section}>
          <SectionHeading icon="heart" title="Acknowledgements" colors={colors} styles={styles} />

          <View style={styles.card}>
            <View style={[styles.row, styles.rowLast]}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowTitle}>Great Neck South Programming Club</Text>
                <Text style={styles.rowSubtitle}>Built with care, coffee, and love &lt;3</Text>
              </View>
            </View>
          </View>
        </View>

        {DEV_TOOLS_ENABLED ? (
          <View style={styles.section}>
            <SectionHeading icon="tool" title="Developer" colors={colors} styles={styles} />

            <View style={styles.card}>
              <TouchableOpacity
                style={[styles.row, styles.rowLast]}
                onPress={() => router.push('/dev-scenarios')}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <View style={styles.rowLeft}>
                  <Text style={styles.rowTitle}>Test Scenarios</Text>
                  <Text style={styles.rowSubtitle}>Fake the time, replay first launch</Text>
                </View>
                <Feather name="chevron-right" size={IconSize.md} color={colors.mutedText} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </Stagger>
    </Screen>
  );
}

type SectionHeadingProps = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  colors: typeof Colors.light;
  styles: ReturnType<typeof createStyles>;
};

function SectionHeading({ icon, title, colors, styles }: SectionHeadingProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Feather name={icon} size={IconSize.md} color={colors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light, radius: RadiusScale) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    title: {
      ...Type.display,
      color: colors.text,
    },
    section: {
      gap: Spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    sectionIcon: {
      width: 34,
      height: 34,
      borderRadius: radius.md,
      borderCurve: 'continuous',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      ...Type.heading,
      color: colors.text,
    },
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
