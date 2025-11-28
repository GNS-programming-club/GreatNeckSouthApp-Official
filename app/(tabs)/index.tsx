import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

export default function HomeScreen() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Great Neck South!</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.subtitle}>Get Started</Text>
          <Text style={styles.text}>
            This is your home screen. Start building your app here!
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.subtitle}>Next Steps</Text>
          <Text style={styles.text}>
            Add your app&apos;s features, screens, and functionality.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 120,
      gap: 16,
    },
    header: {
      paddingTop: 8,
      paddingBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: 0.3,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
      gap: 8,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    text: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.mutedText,
    },
  });