export function centeredIndexAt(scrollOffset: number, itemWidth: number, itemCount: number) {
  'worklet';

  const nearestIndex = Math.round(scrollOffset / itemWidth);

  return Math.min(Math.max(nearestIndex, 0), itemCount - 1);
}
