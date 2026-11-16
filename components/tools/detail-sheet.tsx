import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radii, type RadiusScale, Spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

export type DetailSheetHandle = {
  present: () => void;
  dismiss: () => void;
};

type DetailSheetProps = {
  children: React.ReactNode;
};

const MAX_SHEET_HEIGHT_RATIO = 0.85;

const DetailSheet = forwardRef<DetailSheetHandle, DetailSheetProps>(({ children }, ref) => {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const radius = Radii[actualTheme];
  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const modalRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => ({
    present: () => modalRef.current?.present(),
    dismiss: () => modalRef.current?.dismiss(),
  }));

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      enableDynamicSizing
      maxDynamicContentSize={windowHeight * MAX_SHEET_HEIGHT_RATIO}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
      >
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

DetailSheet.displayName = 'DetailSheet';

export default DetailSheet;

const createStyles = (colors: (typeof Colors)['light'], radius: RadiusScale) =>
  StyleSheet.create({
    background: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
    },
    handle: {
      backgroundColor: colors.primary,
      width: 40,
    },
    content: {
      padding: Spacing.xl,
      gap: Spacing.md,
    },
  });
