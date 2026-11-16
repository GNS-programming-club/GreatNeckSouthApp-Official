import type { SharedValue } from 'react-native-reanimated';

import type { Box } from '@/lib/map-viewport';

export type MapViewportValues = {
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
};

export type MapSpotlightTarget = { box: Box; label: string; detail: string };

export type ScaleBound = 'min' | 'mid' | 'max';
