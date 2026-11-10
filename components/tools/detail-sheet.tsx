import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';

export type DetailSheetHandle = {
  present: () => void;
  dismiss: () => void;
};

type DetailSheetProps = {
  children: React.ReactNode;
};

const DetailSheet = forwardRef<DetailSheetHandle, DetailSheetProps>(({ children }, ref) => {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
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

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    background: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
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
