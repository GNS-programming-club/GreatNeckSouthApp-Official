export type DigitColumn = {
  place: number;
  digit: number;
};

const DIGITS_PER_TURN = 10;

export function digitColumns(value: number): DigitColumn[] {
  const whole = Number.isFinite(value) ? Math.abs(Math.round(value)) : 0;
  const characters = String(whole).split('');

  return characters.map((character, index) => ({
    place: DIGITS_PER_TURN ** (characters.length - index - 1),
    digit: Number(character),
  }));
}

export function nearestRollTarget(current: number, target: number) {
  'worklet';

  return target + Math.round((current - target) / DIGITS_PER_TURN) * DIGITS_PER_TURN;
}

export function glyphOffset(position: number, glyph: number) {
  'worklet';

  const wrappedPosition = ((position % DIGITS_PER_TURN) + DIGITS_PER_TURN) % DIGITS_PER_TURN;
  const forwardDistance = (DIGITS_PER_TURN + glyph - wrappedPosition) % DIGITS_PER_TURN;

  return forwardDistance > DIGITS_PER_TURN / 2
    ? forwardDistance - DIGITS_PER_TURN
    : forwardDistance;
}
