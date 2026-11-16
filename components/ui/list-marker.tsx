import Feather from '@expo/vector-icons/Feather';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import Sparkle from '@/components/ui/sparkle';
import { Colors, ThemeTraits } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';
import type { ListMarkerShape } from '@/lib/theme-catalog';

const MARKER_SIZE = 6;
const GLYPH_SIZE = 12;
const GLYPH_OFFSET = (MARKER_SIZE - GLYPH_SIZE) / 2;
const DASH_WIDTH = 10;
const DASH_HEIGHT = 2;
const RING_SIZE = 8;
const RING_BORDER = 1.5;

const FEATHER_GLYPHS: Partial<Record<ListMarkerShape, keyof typeof Feather.glyphMap>> = {
  chevron: 'chevron-right',
  plus: 'plus',
  heart: 'heart',
  star: 'star',
};

type ListMarkerProps = {
  style?: StyleProp<ViewStyle>;
};

export default function ListMarker({ style }: ListMarkerProps) {
  const { actualTheme } = useTheme();
  const color = Colors[actualTheme].primary;
  const shape = ThemeTraits[actualTheme].listMarker;

  return (
    <View style={[styles.box, style]}>
      <MarkerGlyph shape={shape} color={color} />
    </View>
  );
}

function MarkerGlyph({ shape, color }: { shape: ListMarkerShape; color: string }) {
  const featherName = FEATHER_GLYPHS[shape];

  if (featherName) {
    return <Feather name={featherName} size={GLYPH_SIZE} color={color} style={styles.glyph} />;
  }

  switch (shape) {
    case 'sparkle':
      return <Sparkle size={GLYPH_SIZE} color={color} style={styles.glyph} />;

    case 'square':
      return <View style={[styles.fill, { backgroundColor: color }]} />;

    case 'diamond':
      return <View style={[styles.fill, styles.diamond, { backgroundColor: color }]} />;

    case 'dash':
      return <View style={[styles.dash, { backgroundColor: color }]} />;

    case 'ring':
      return <View style={[styles.ring, { borderColor: color }]} />;

    default:
      return <View style={[styles.fill, styles.dot, { backgroundColor: color }]} />;
  }
}

const styles = StyleSheet.create({
  box: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    overflow: 'visible',
  },
  fill: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
  },
  dot: {
    borderRadius: MARKER_SIZE / 2,
  },
  diamond: {
    transform: [{ rotate: '45deg' }, { scale: 0.85 }],
  },
  dash: {
    position: 'absolute',
    width: DASH_WIDTH,
    height: DASH_HEIGHT,
    top: (MARKER_SIZE - DASH_HEIGHT) / 2,
    left: (MARKER_SIZE - DASH_WIDTH) / 2,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    top: (MARKER_SIZE - RING_SIZE) / 2,
    left: (MARKER_SIZE - RING_SIZE) / 2,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_BORDER,
  },
  glyph: {
    position: 'absolute',
    top: GLYPH_OFFSET,
    left: GLYPH_OFFSET,
  },
});
