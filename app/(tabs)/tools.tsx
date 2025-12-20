import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

const ToolsPage = () => {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const renderMenuButton = (title: string, subtitle: string, onPress: () => void) => (
    <TouchableOpacity style={styles.navBar} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.navBarLeft}>
        <Text style={styles.navBarTitle}>{title}</Text>
        <Text style={styles.navBarSub}>{subtitle}</Text>
      </View>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tools</Text>
      </View>

      <ScrollView style={styles.content}>
        {renderMenuButton('Daily Schedule', 'View period times and daily timeline', () =>
          router.push({ pathname: '/tools-routes/schedule' })
        )}
      </ScrollView>
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
      paddingTop: Platform.OS === 'ios' ? 50 : 30,
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
    },
    navBar: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    navBarLeft: {
      flex: 1,
    },
    navBarTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    navBarSub: {
      color: colors.mutedText,
      fontSize: 14,
      marginTop: 4,
    },
    arrow: {
      color: colors.mutedText,
      fontSize: 20,
      fontWeight: 'bold',
    },
  });

export default ToolsPage;
