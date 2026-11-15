import { Easing } from 'react-native-reanimated';

import { Motion } from '@/constants/theme';

export const easeOut = Easing.bezier(...Motion.easeOutCurve);

export const quickTiming = { duration: Motion.duration.quick, easing: easeOut };

export const baseTiming = { duration: Motion.duration.base, easing: easeOut };
