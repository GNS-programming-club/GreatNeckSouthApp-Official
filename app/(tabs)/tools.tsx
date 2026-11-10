import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import ToolTile from '@/components/tools/tool-tile';
import Screen from '@/components/ui/screen';
import Stagger from '@/components/ui/stagger';
import { Colors, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

export default function ToolsPage() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const go = (path: string) => () => router.push(path as never);

  return (
    <Screen
      header={
        <View style={styles.header}>
          <Text style={styles.title}>Tools</Text>
        </View>
      }
    >
      <Stagger>
        <ToolTile
          full
          icon="clock"
          label="Daily Schedule"
          meta="Period times and live timeline"
          onPress={go('/tools-routes/schedule')}
        />
        <View style={styles.row}>
          <ToolTile
            icon="map"
            label="School Map"
            meta="Find rooms"
            onPress={go('/tools-routes/school-map')}
          />
          <ToolTile
            icon="navigation"
            label="Bus"
            meta="34 routes"
            onPress={go('/tools-routes/bus')}
          />
        </View>
        <View style={styles.row}>
          <ToolTile
            icon="book-open"
            label="Courses"
            meta="181 courses"
            onPress={go('/tools-routes/courses')}
          />
          <ToolTile
            icon="users"
            label="Clubs"
            meta="76 clubs"
            onPress={go('/tools-routes/clubs')}
          />
        </View>
      </Stagger>
    </Screen>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    title: {
      color: colors.text,
      fontSize: Type.display.fontSize,
      fontWeight: Type.display.fontWeight,
      letterSpacing: Type.display.letterSpacing,
    },
    row: {
      flexDirection: 'row',
      gap: Spacing.lg,
    },
  });
