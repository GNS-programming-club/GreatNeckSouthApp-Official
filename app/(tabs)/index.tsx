import ScheduleCard from '@/components/ScheduleCard';
import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

export default function HomeScreen() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const getDayLetter = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysDifference = Math.round((targetDate.getTime() - today.getTime()) / msPerDay);

    const dayCycle = ['B', 'A'];
    const dayIndex = ((daysDifference % dayCycle.length) + dayCycle.length) % dayCycle.length;

    return dayCycle[dayIndex];
  };

  const todayLetter = getDayLetter(new Date());

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image source={require('../../assets/images/SHSRebelPatriot1.png')} style={styles.logo} />
          <Text style={styles.title}>Welcome to Great Neck South!</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.subtitle}>Home page in development</Text>
          <Text style={styles.text}>
            Come back later...  
          </Text>
        </View>

        <View style={styles.scheduleRow}>
          <View style={{ width: '50%', alignSelf: 'flex-end' }}>
            <ScheduleCard day={todayLetter as 'A' | 'B'} style={{ width: '100%' }} />
          </View>
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
    scheduleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'flex-end',
      width: '100%',
      gap: 8,
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
    logo: {
      width: 60,
      height: 60,
      borderRadius: 16
    }
  });