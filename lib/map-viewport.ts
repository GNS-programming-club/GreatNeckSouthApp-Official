export type Size = { width: number; height: number };

export type Point = { x: number; y: number };

export type Box = { x: number; y: number; width: number; height: number };

export type Insets = { top: number; right: number; bottom: number; left: number };

export type Viewport = { scale: number; translateX: number; translateY: number };

export type MapFrame = { stage: Size; fitted: Size; image: Size };

export type ZoomDirection = 'in' | 'out';

export const MIN_SCALE = 1;

export const MAX_SCALE = 6;

export const ZOOM_STEP_FACTOR = 2;

export const FOCUS_PADDING = 48;

function clamp(value: number, min: number, max: number) {
  'worklet';

  return Math.min(Math.max(value, min), max);
}

function translateLimit(fittedLength: number, scale: number, stageLength: number) {
  'worklet';

  return Math.abs(fittedLength * scale - stageLength) / 2;
}

export function fitImage(stage: Size, image: Size): Size | null {
  if (stage.width <= 0 || stage.height <= 0) {
    return null;
  }

  const scale = Math.min(stage.width / image.width, stage.height / image.height);

  return { width: image.width * scale, height: image.height * scale };
}

export function clampViewport(viewport: Viewport, frame: MapFrame): Viewport {
  'worklet';

  const scale = clamp(viewport.scale, MIN_SCALE, MAX_SCALE);
  const limitX = translateLimit(frame.fitted.width, scale, frame.stage.width);
  const limitY = translateLimit(frame.fitted.height, scale, frame.stage.height);

  return {
    scale,
    translateX: clamp(viewport.translateX, -limitX, limitX),
    translateY: clamp(viewport.translateY, -limitY, limitY),
  };
}

function visibleCenter(frame: MapFrame, obscured: Insets): Point {
  'worklet';

  return {
    x: obscured.left + (frame.stage.width - obscured.left - obscured.right) / 2,
    y: obscured.top + (frame.stage.height - obscured.top - obscured.bottom) / 2,
  };
}

export function fitAll(frame: MapFrame, obscured: Insets): Viewport {
  'worklet';

  const center = visibleCenter(frame, obscured);

  return clampViewport(
    {
      scale: MIN_SCALE,
      translateX: center.x - frame.stage.width / 2,
      translateY: center.y - frame.stage.height / 2,
    },
    frame
  );
}

export function focusOnBox(
  box: Box,
  frame: MapFrame,
  obscured: Insets,
  padding: number = FOCUS_PADDING
): Viewport {
  'worklet';

  const imageToFitted = frame.fitted.width / frame.image.width;
  const availableWidth = frame.stage.width - obscured.left - obscured.right - padding * 2;
  const availableHeight = frame.stage.height - obscured.top - obscured.bottom - padding * 2;
  const scale = clamp(
    Math.min(
      availableWidth / (box.width * imageToFitted),
      availableHeight / (box.height * imageToFitted)
    ),
    MIN_SCALE,
    MAX_SCALE
  );
  const boxCenterX = (box.x + box.width / 2) * imageToFitted;
  const boxCenterY = (box.y + box.height / 2) * imageToFitted;
  const target = visibleCenter(frame, obscured);

  return clampViewport(
    {
      scale,
      translateX: target.x - frame.stage.width / 2 - scale * (boxCenterX - frame.fitted.width / 2),
      translateY:
        target.y - frame.stage.height / 2 - scale * (boxCenterY - frame.fitted.height / 2),
    },
    frame
  );
}

export function zoomAround(
  viewport: Viewport,
  factor: number,
  anchor: Point,
  frame: MapFrame
): Viewport {
  'worklet';

  const scale = clamp(viewport.scale * factor, MIN_SCALE, MAX_SCALE);
  const appliedFactor = scale / viewport.scale;
  const anchorX = anchor.x - frame.stage.width / 2;
  const anchorY = anchor.y - frame.stage.height / 2;

  return clampViewport(
    {
      scale,
      translateX: anchorX - (anchorX - viewport.translateX) * appliedFactor,
      translateY: anchorY - (anchorY - viewport.translateY) * appliedFactor,
    },
    frame
  );
}

export function zoomStep(viewport: Viewport, direction: ZoomDirection, frame: MapFrame): Viewport {
  'worklet';

  const factor = direction === 'in' ? ZOOM_STEP_FACTOR : 1 / ZOOM_STEP_FACTOR;

  return zoomAround(
    viewport,
    factor,
    { x: frame.stage.width / 2, y: frame.stage.height / 2 },
    frame
  );
}

export function projectBox(box: Box, viewport: Viewport, frame: MapFrame): Box {
  'worklet';

  const imageToFitted = frame.fitted.width / frame.image.width;
  const stageScale = imageToFitted * viewport.scale;

  return {
    x:
      frame.stage.width / 2 +
      viewport.translateX +
      viewport.scale * (box.x * imageToFitted - frame.fitted.width / 2),
    y:
      frame.stage.height / 2 +
      viewport.translateY +
      viewport.scale * (box.y * imageToFitted - frame.fitted.height / 2),
    width: box.width * stageScale,
    height: box.height * stageScale,
  };
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function parseBox(value: unknown): Box | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    !isNonNegativeNumber(candidate.x) ||
    !isNonNegativeNumber(candidate.y) ||
    !isPositiveNumber(candidate.width) ||
    !isPositiveNumber(candidate.height)
  ) {
    return null;
  }

  return { x: candidate.x, y: candidate.y, width: candidate.width, height: candidate.height };
}
