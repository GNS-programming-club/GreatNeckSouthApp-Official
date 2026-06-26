import Feather from '@expo/vector-icons/Feather';
import React, { useMemo } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import Screen from '@/components/ui/screen';
import Stagger from '@/components/ui/stagger';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type ThemeMode = 'auto' | 'dark' | 'light';

type ThemeOption = {
  mode: ThemeMode;
  title: string;
  subtitle: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  { mode: 'auto', title: 'Auto', subtitle: 'Match your device setting' },
  { mode: 'dark', title: 'Dark', subtitle: 'Always use dark theme' },
  { mode: 'light', title: 'Light', subtitle: 'Always use light theme' },
];

export default function SettingsPage() {
  const { actualTheme, themeMode, setThemeMode } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>Settings</Text>
    </View>
  );

  return (
    <Screen header={header}>
      <Stagger>
        <View style={styles.section}>
          <SectionHeading icon="moon" title="App Theme" colors={colors} styles={styles} />

          <View style={styles.card}>
            {THEME_OPTIONS.map((option, index) => {
              const selected = themeMode === option.mode;
              const isLast = index === THEME_OPTIONS.length - 1;

              return (
                <TouchableOpacity
                  key={option.mode}
                  style={[styles.row, selected && styles.rowSelected, isLast && styles.rowLast]}
                  onPress={() => setThemeMode(option.mode)}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <Text style={[styles.rowTitle, selected && styles.rowTitleSelected]}>
                      {option.title}
                    </Text>
                    <Text style={styles.rowSubtitle}>{option.subtitle}</Text>
                  </View>

                  {selected ? <Feather name="check" size={20} color={colors.primary} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeading icon="bell" title="Notifications" colors={colors} styles={styles} />

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

            <View style={[styles.row, styles.rowLast]}>
              <Text style={styles.helperText}>Notification settings coming soon</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeading icon="heart" title="Acknowledgements" colors={colors} styles={styles} />

          <View style={styles.card}>
            <View style={[styles.row, styles.rowLast]}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowTitle}>Great Neck South Programming Club</Text>
                <Text style={styles.rowSubtitle}>
                  Built with care, coffee, and love. Have a great day.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Stagger>
    </Screen>
  );
}

type SectionHeadingProps = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  colors: typeof Colors.light;
  styles: ReturnType<typeof createStyles>;
};

function SectionHeading({ icon, title, colors, styles }: SectionHeadingProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Feather name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    title: {
      ...Type.display,
      color: colors.text,
    },
    section: {
      gap: Spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    sectionIcon: {
      width: 34,
      height: 34,
      borderRadius: Radius.md,
      borderCurve: 'continuous',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      ...Type.heading,
      color: colors.text,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: Spacing.md,
    },
    rowSelected: {
      backgroundColor: colors.accentSoft,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowLeft: {
      flex: 1,
      gap: Spacing.xs,
    },
    rowTitle: {
      ...Type.body,
      fontWeight: '700',
      color: colors.text,
    },
    rowTitleSelected: {
      color: colors.primary,
    },
    rowSubtitle: {
      ...Type.label,
      fontWeight: '500',
      color: colors.mutedText,
      lineHeight: 18,
    },
    helperText: {
      ...Type.label,
      fontWeight: '500',
      color: colors.mutedText,
    },
  });
