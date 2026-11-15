import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import IconBadge from '@/components/welcome/icon-badge';
import RiseIn from '@/components/welcome/rise-in';
import { Colors, LineHeight, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type RemindersPageProps = {
  width: number;
  isActive: boolean;
  statusMessage: string | null;
};

export default function RemindersPage({ width, isActive, statusMessage }: RemindersPageProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.page, { width }]}>
      <RiseIn isActive={isActive} order={0}>
        <IconBadge icon="bell" />
      </RiseIn>
      <RiseIn isActive={isActive} order={1}>
        <Text style={styles.title} accessibilityRole="header">
          Morning event alerts
        </Text>
      </RiseIn>
      <RiseIn isActive={isActive} order={2}>
        <Text style={styles.description}>
          On days with a school event, receive one heads-up that morning: you will be alerted at 7
          AM on school days and 10 AM otherwise.
        </Text>
      </RiseIn>
      {statusMessage ? (
        <Text style={styles.status} accessibilityLiveRegion="polite">
          {statusMessage}
        </Text>
      ) : null}
    </View>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    page: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: Spacing.xl,
      gap: Spacing.md,
    },
    title: {
      ...Type.display,
      color: colors.text,
    },
    description: {
      ...Type.body,
      lineHeight: LineHeight.relaxed,
      color: colors.text,
    },
    status: {
      ...Type.label,
      color: colors.text,
    },
  });
