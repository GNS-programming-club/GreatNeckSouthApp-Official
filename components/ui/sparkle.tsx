import { Canvas, Path } from '@shopify/react-native-skia';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { sparklePath } from '@/lib/sparkle-path';

type SparkleProps = {
  size: number;
  color: string;
  style?: StyleProp<ViewStyle>;
};

export default function Sparkle({ size, color, style }: SparkleProps) {
  return (
    <Canvas style={[{ width: size, height: size }, style]} pointerEvents="none">
      <Path path={sparklePath(size)} color={color} />
    </Canvas>
  );
}
