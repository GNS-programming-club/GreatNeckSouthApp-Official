import type Feather from '@expo/vector-icons/Feather';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import IconBadge from '@/components/welcome/icon-badge';
import RiseIn from '@/components/welcome/rise-in';
import { Colors, LineHeight, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type FeaturesPageProps = {
  width: number;
  isActive: boolean;
};

type Feature = {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    icon: 'clock',
    title: 'A/B day and live period',
    description: 'See which day it is and the period you are in right now.',
  },
  {
    icon: 'coffee',
    title: 'Lunch menu',
    description: "Catch a glimpse of today's cafeteria menu.",
  },
  {
    icon: 'calendar',
    title: 'School calendar',
    description: "Receive a morning alert about a day's important events.",
  },
];

export default function FeaturesPage({ width, isActive }: FeaturesPageProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.page, { width }]}>
      <RiseIn isActive={isActive} order={0}>
        <Text style={styles.title} accessibilityRole="header">
          Everything for the school day
        </Text>
      </RiseIn>
      <View style={styles.list}>
        {FEATURES.map((feature, index) => (
          <RiseIn key={feature.title} isActive={isActive} order={index + 1}>
            <View style={styles.row}>
              <IconBadge icon={feature.icon} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{feature.title}</Text>
                <Text style={styles.rowDescription}>{feature.description}</Text>
              </View>
            </View>
          </RiseIn>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    page: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: Spacing.xl,
      gap: Spacing.xl,
    },
    title: {
      ...Type.display,
      color: colors.text,
    },
    list: {
      gap: Spacing.lg,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    rowText: {
      flex: 1,
      gap: Spacing.xxs,
    },
    rowTitle: {
      ...Type.heading,
      color: colors.text,
    },
    rowDescription: {
      ...Type.body,
      lineHeight: LineHeight.relaxed,
      color: colors.text,
    },
  });
