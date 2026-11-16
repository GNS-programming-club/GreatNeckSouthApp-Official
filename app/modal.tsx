import { Link } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radii, type RadiusScale } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

export default function ModalScreen() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const radius = Radii[actualTheme];
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>This is a modal.</Text>
      <Link href="/" dismissTo asChild>
        <Pressable style={styles.link}>
          <Text style={styles.linkText}>Go to home screen</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light, radius: RadiusScale) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
    },
    link: {
      marginTop: 15,
      paddingVertical: 15,
      paddingHorizontal: 20,
      backgroundColor: colors.primaryFill,
      borderRadius: radius.custom(12),
      shadowColor: colors.shadow,
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    linkText: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: '700',
    },
  });
