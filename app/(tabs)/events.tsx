import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

const Events = () => {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.emptyText}>No events scheduled at this time.</Text>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: 0.3,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingBottom: 120,
    },
    emptyText: {
      color: colors.mutedText,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 40,
    },
  });

export default Events;