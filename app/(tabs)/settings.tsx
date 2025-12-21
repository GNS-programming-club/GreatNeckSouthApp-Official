import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";

import { Colors } from "@/constants/theme";
import { useTheme } from "@/contexts/theme-context";

export default function SettingsPage() {
  const { actualTheme, themeMode, setThemeMode } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const sectionAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  useEffect(() => {
    sectionAnims.forEach((anim) => {
      anim.stopAnimation();
      anim.setValue(0);
    });

    const sequence = Animated.stagger(
      90,
      sectionAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        })
      )
    );

    sequence.start();
    return () => sequence.stop();
  }, [sectionAnims]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <Animated.View
          style={[
            styles.section,
            {
              opacity: sectionAnims[0],
              transform: [
                {
                  translateY: sectionAnims[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Feather name="moon" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>App Theme</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowTitle}>Auto</Text>
                <Text style={styles.rowSubtitle}>Match your device setting</Text>
              </View>
              <Switch
                value={themeMode === "auto"}
                onValueChange={(value) => {
                  if (value) {
                    setThemeMode("auto");
                  }
                }}
                trackColor={{ false: colors.border, true: `${colors.primary}66` }}
                thumbColor={themeMode === "auto" ? colors.primary : colors.mutedText}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowTitle}>Dark Mode</Text>
                <Text style={styles.rowSubtitle}>Always use dark theme</Text>
              </View>
              <Switch
                value={themeMode === "dark"}
                onValueChange={(value) => {
                  if (value) {
                    setThemeMode("dark");
                  }
                }}
                trackColor={{ false: colors.border, true: `${colors.primary}66` }}
                thumbColor={themeMode === "dark" ? colors.primary : colors.mutedText}
              />
            </View>

            <View style={[styles.row, styles.rowLast]}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowTitle}>Light Mode</Text>
                <Text style={styles.rowSubtitle}>Always use light theme</Text>
              </View>
              <Switch
                value={themeMode === "light"}
                onValueChange={(value) => {
                  if (value) {
                    setThemeMode("light");
                  }
                }}
                trackColor={{ false: colors.border, true: `${colors.primary}66` }}
                thumbColor={themeMode === "light" ? colors.primary : colors.mutedText}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.section,
            {
              opacity: sectionAnims[1],
              transform: [
                {
                  translateY: sectionAnims[1].interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Feather name="bell" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowTitle}>Lunch Menu Updates</Text>
                <Text style={styles.rowSubtitle}>Get notified when today’s menu changes</Text>
              </View>
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ false: colors.border, true: `${colors.primary}66` }}
                thumbColor={colors.mutedText}
                disabled
              />
            </View>

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowTitle}>Event Reminders</Text>
                <Text style={styles.rowSubtitle}>Reminders for club events and school events</Text>
              </View>
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ false: colors.border, true: `${colors.primary}66` }}
                thumbColor={colors.mutedText}
                disabled
              />
            </View>

            <Text style={styles.helperText}>Notification settings coming soon!</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.section,
            styles.sectionLast,
            {
              opacity: sectionAnims[2],
              transform: [
                {
                  translateY: sectionAnims[2].interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Feather name="heart" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Acknowledgements</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.ackRow}>
              <Text style={styles.ackTitle}>Great Neck South Programming Club</Text>
              <Text style={styles.ackSubtitle}>Built with care, coffee, and love. Have a great day!</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      paddingBottom: 75,
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: Platform.OS === "ios" ? 50 : 30,
      paddingBottom: 12,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: 0.3,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    section: {
      marginTop: 20,
    },
    sectionLast: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },
    sectionIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowLeft: {
      flex: 1,
    },
    rowTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
    },
    rowSubtitle: {
      color: colors.mutedText,
      fontSize: 13,
      marginTop: 4,
      lineHeight: 18,
    },
    helperText: {
      color: colors.mutedText,
      fontSize: 12,
      fontStyle: 'italic',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    ackRow: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    ackTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
    },
    ackSubtitle: {
      color: colors.mutedText,
      fontSize: 13,
      marginTop: 4,
      lineHeight: 18,
    },
  });
