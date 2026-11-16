import Feather from '@expo/vector-icons/Feather';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { easeOut } from '@/constants/motion';
import {
  Colors,
  Elevation,
  FontWeight,
  IconSize,
  Motion,
  Radii,
  type RadiusScale,
  Spacing,
  Type,
} from '@/constants/theme';
import { tabBarBottomOffset } from '@/contexts/tab-bar-context';
import { useTheme } from '@/contexts/theme-context';
import { confirmSuccess } from '@/lib/haptics';

const VISIBLE_DURATION_MS = 2500;
const TAB_BAR_HEIGHT_ESTIMATE = 72;

const ENTER_ANIMATION = FadeInDown.springify()
  .damping(Motion.settleSpring.damping)
  .stiffness(Motion.settleSpring.stiffness)
  .mass(Motion.settleSpring.mass)
  .reduceMotion(ReduceMotion.System);
const EXIT_ANIMATION = FadeOutDown.duration(Motion.duration.quick)
  .easing(easeOut)
  .reduceMotion(ReduceMotion.System);

type FeatherName = React.ComponentProps<typeof Feather>['name'];

type ToastMessage = {
  id: number;
  message: string;
  icon?: FeatherName;
};

type ToastValue = {
  show: (message: string, icon?: FeatherName) => void;
};

const ToastContext = createContext<ToastValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const show = useCallback((message: string, icon?: FeatherName) => {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, message, icon }));
    confirmSuccess();

    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const dismissTimer = setTimeout(() => setToast(null), VISIBLE_DURATION_MS);

    return () => clearTimeout(dismissTimer);
  }, [toast]);

  const value = useMemo<ToastValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toast={toast} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toast }: { toast: ToastMessage | null }) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const radius = Radii[actualTheme];
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);
  const insets = useSafeAreaInsets();
  const bottom = tabBarBottomOffset(insets.bottom) + TAB_BAR_HEIGHT_ESTIMATE + Spacing.md;

  return (
    <View pointerEvents="none" style={[styles.viewport, { bottom }]}>
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={ENTER_ANIMATION}
          exiting={EXIT_ANIMATION}
          accessibilityLiveRegion="polite"
          style={styles.toast}
        >
          {toast.icon ? (
            <Feather name={toast.icon} size={IconSize.md} color={colors.primary} />
          ) : null}
          <Text style={styles.message}>{toast.message}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

export function useToast(): ToastValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

const createStyles = (colors: (typeof Colors)['light'], radius: RadiusScale) =>
  StyleSheet.create({
    viewport: {
      position: 'absolute',
      left: Spacing.lg,
      right: Spacing.lg,
      alignItems: 'center',
    },
    toast: {
      ...Elevation.floating,
      shadowColor: colors.shadow,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      maxWidth: '100%',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      borderCurve: 'continuous',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
    },
    message: {
      flexShrink: 1,
      color: colors.text,
      fontSize: Type.body.fontSize,
      fontWeight: FontWeight.semibold,
    },
  });
