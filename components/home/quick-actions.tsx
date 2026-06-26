import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Card from '@/components/ui/card';
import Section from '@/components/ui/section';
import { Colors, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type QuickAction = {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  path: string;
};

const ACTIONS: QuickAction[] = [
  { label: 'School Map', icon: 'map', path: '/tools-routes/school-map' },
  { label: 'Bus', icon: 'navigation', path: '/tools-routes/bus' },
  { label: 'Courses', icon: 'book-open', path: '/tools-routes/courses' },
  { label: 'Clubs', icon: 'users', path: '/tools-routes/clubs' },
];

export function QuickActions() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  return (
    <Section title="Quick actions">
      <View style={styles.grid}>
        {ACTIONS.map((action) => (
          <Card
            key={action.label}
            onPress={() => router.push(action.path as any)}
            style={styles.tile}
          >
            <Feather name={action.icon} size={22} color={colors.primary} />
            <Text style={styles.label}>{action.label}</Text>
          </Card>
        ))}
      </View>
    </Section>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    tile: {
      flexGrow: 1,
      flexBasis: '48%',
      minWidth: 140,
      alignItems: 'flex-start',
      gap: Spacing.sm,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    label: {
      color: colors.text,
      fontSize: Type.label.fontSize,
      fontWeight: Type.label.fontWeight,
      letterSpacing: Type.label.letterSpacing,
    },
  });
