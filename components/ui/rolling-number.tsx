import React, { memo, useEffect, useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { easeOut } from '@/constants/motion';
import { Motion } from '@/constants/theme';
import { digitColumns, glyphOffset, nearestRollTarget } from '@/components/ui/rolling-number-math';

type RollingNumberProps = {
  value: number;
  style?: StyleProp<TextStyle>;
};

const GLYPHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const SLIDE_FRACTION = 0.6;
const SCALE_MIN = 0.6;
const DEFAULT_FONT_SIZE = 14;
const LINE_HEIGHT_RATIO = 1.2;

function RollingNumber({ value, style }: RollingNumberProps) {
  const flatStyle = StyleSheet.flatten(style) ?? {};
  const fontSize = flatStyle.fontSize ?? DEFAULT_FONT_SIZE;
  const lineHeight = flatStyle.lineHeight ?? fontSize * LINE_HEIGHT_RATIO;
  const columns = digitColumns(value);
  const isNegative = Number.isFinite(value) && Math.round(value) < 0;
  const label = `${isNegative ? '-' : ''}${columns.map((column) => column.digit).join('')}`;

  return (
    <View style={styles.row} accessible accessibilityRole="text" accessibilityLabel={label}>
      {isNegative ? <Text style={style}>-</Text> : null}
      {columns.map((column) => (
        <DigitColumn
          key={column.place}
          digit={column.digit}
          lineHeight={lineHeight}
          textStyle={style}
        />
      ))}
    </View>
  );
}

type DigitColumnProps = {
  digit: number;
  lineHeight: number;
  textStyle?: StyleProp<TextStyle>;
};

const DigitColumn = memo(function DigitColumn({ digit, lineHeight, textStyle }: DigitColumnProps) {
  const reduceMotion = useReducedMotion();
  const position = useSharedValue(digit);

  useEffect(() => {
    const target = nearestRollTarget(position.value, digit);

    position.value = reduceMotion ? target : withSpring(target, Motion.settleSpring);
  }, [digit, position, reduceMotion]);

  const columnStyle = useMemo(() => ({ height: lineHeight }), [lineHeight]);
  const glyphTextStyle = useMemo(
    () => [textStyle, styles.tabular, { lineHeight }],
    [textStyle, lineHeight]
  );

  return (
    <Animated.View
      style={[styles.column, columnStyle]}
      entering={FadeIn.duration(Motion.duration.quick).easing(easeOut)}
      exiting={FadeOut.duration(Motion.duration.quick).easing(easeOut)}
    >
      <Text style={[glyphTextStyle, styles.sizer]}>0</Text>
      {GLYPHS.map((glyph) => (
        <Glyph
          key={glyph}
          glyph={glyph}
          position={position}
          lineHeight={lineHeight}
          textStyle={glyphTextStyle}
        />
      ))}
    </Animated.View>
  );
});

type GlyphProps = {
  glyph: number;
  position: SharedValue<number>;
  lineHeight: number;
  textStyle: StyleProp<TextStyle>;
};

const Glyph = memo(function Glyph({ glyph, position, lineHeight, textStyle }: GlyphProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const offset = glyphOffset(position.value, glyph);
    const closeness = Math.max(0, 1 - Math.abs(offset));

    return {
      opacity: closeness,
      transform: [
        { translateY: offset * lineHeight * SLIDE_FRACTION },
        { scale: SCALE_MIN + (1 - SCALE_MIN) * closeness },
      ],
    };
  });

  return (
    <Animated.View style={[styles.glyph, animatedStyle]}>
      <Text style={textStyle}>{glyph}</Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  column: {
    overflow: 'hidden',
  },
  sizer: {
    opacity: 0,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
  glyph: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
  },
});

export default memo(RollingNumber);
