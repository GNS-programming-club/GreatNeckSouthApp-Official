import Feather from '@expo/vector-icons/Feather';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors, IconSize, Radii, type RadiusScale, Spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

type IconBadgeProps = {
  icon: React.ComponentProps<typeof Feather>['name'];
};

export default function IconBadge({ icon }: IconBadgeProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const radius = Radii[actualTheme];
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);

  return (
    <View style={styles.badge}>
      <Feather name={icon} size={IconSize.lg} color={colors.primary} />
    </View>
  );
}

const createStyles = (colors: (typeof Colors)['light'], radius: RadiusScale) =>
  StyleSheet.create({
    badge: {
      width: IconSize.lg + Spacing.xl,
      height: IconSize.lg + Spacing.xl,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
