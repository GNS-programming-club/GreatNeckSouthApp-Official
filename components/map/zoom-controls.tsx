import Feather from '@expo/vector-icons/Feather';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { ScaleBound } from '@/components/map/map-types';
import { Colors, Elevation, IconSize, Opacity, Radius } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

const BUTTON_SIZE = 44;

type ZoomControlsProps = {
  scaleBound: ScaleBound;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
};

type ZoomButtonProps = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  disabled: boolean;
  position: 'first' | 'middle' | 'last';
  onPress: () => void;
};

function ZoomButton({ icon, label, disabled, position, onPress }: ZoomButtonProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        position === 'first' ? styles.firstButton : null,
        position === 'last' ? styles.lastButton : null,
        pressed ? styles.buttonPressed : null,
        disabled ? styles.buttonDisabled : null,
      ]}
    >
      <Feather name={icon} size={IconSize.md} color={colors.text} />
    </Pressable>
  );
}

export default function ZoomControls({
  scaleBound,
  onZoomIn,
  onZoomOut,
  onFit,
}: ZoomControlsProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <ZoomButton
        icon="plus"
        label="Zoom in"
        disabled={scaleBound === 'max'}
        position="first"
        onPress={onZoomIn}
      />
      <View style={styles.divider} />
      <ZoomButton
        icon="minus"
        label="Zoom out"
        disabled={scaleBound === 'min'}
        position="middle"
        onPress={onZoomOut}
      />
      <View style={styles.divider} />
      <ZoomButton
        icon="maximize"
        label="Show the whole map"
        disabled={false}
        position="last"
        onPress={onFit}
      />
    </View>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    card: {
      width: BUTTON_SIZE + 2,
      borderRadius: Radius.md,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...Elevation.raised,
    },
    button: {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    firstButton: {
      borderTopLeftRadius: Radius.md - 1,
      borderTopRightRadius: Radius.md - 1,
    },
    lastButton: {
      borderBottomLeftRadius: Radius.md - 1,
      borderBottomRightRadius: Radius.md - 1,
    },
    buttonPressed: {
      backgroundColor: colors.surfaceAlt,
    },
    buttonDisabled: {
      opacity: Opacity.dim,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
  });
