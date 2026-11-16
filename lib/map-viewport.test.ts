import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MAX_SCALE,
  MIN_SCALE,
  clampViewport,
  fitAll,
  fitImage,
  focusOnBox,
  parseBox,
  projectBox,
  zoomAround,
  zoomStep,
  type MapFrame,
} from './map-viewport.ts';

const frame: MapFrame = {
  stage: { width: 400, height: 400 },
  fitted: { width: 400, height: 200 },
  image: { width: 2000, height: 1000 },
};

const unobscured = { top: 0, right: 0, bottom: 0, left: 0 };

test('fitting a wide image into a square stage keeps its aspect ratio', () => {
  assert.deepEqual(fitImage({ width: 400, height: 400 }, { width: 2000, height: 1000 }), {
    width: 400,
    height: 200,
  });
});

test('fitting before the stage has been measured yields no size', () => {
  assert.equal(fitImage({ width: 0, height: 0 }, { width: 2000, height: 1000 }), null);
});

test('fit-all shows the whole map at the minimum scale', () => {
  assert.equal(fitAll(frame, unobscured).scale, MIN_SCALE);
});

test('fit-all centers the map in the part of the stage not covered by overlays', () => {
  const viewport = fitAll(frame, { top: 100, right: 0, bottom: 0, left: 0 });

  assert.equal(viewport.translateY, 50);
});

test('focusing on a small box zooms in no further than the maximum scale', () => {
  const box = { x: 900, y: 450, width: 200, height: 100 };

  assert.equal(focusOnBox(box, frame, unobscured, 0).scale, MAX_SCALE);
});

test('focusing on a box larger than the stage never zooms out past the full map', () => {
  const box = { x: 0, y: 0, width: 2000, height: 1000 };

  assert.equal(focusOnBox(box, frame, unobscured, 0).scale, MIN_SCALE);
});

test('focusing leaves padding around the box', () => {
  const box = { x: 500, y: 250, width: 1000, height: 500 };

  assert.equal(focusOnBox(box, frame, unobscured, 50).scale, 1.5);
});

test('focusing on an off-center box moves it to the middle of the stage', () => {
  const box = { x: 1400, y: 450, width: 200, height: 100 };

  assert.equal(focusOnBox(box, frame, unobscured, 0).translateX, -600);
});

test('focusing centers the box in the part of the stage not covered by overlays', () => {
  const box = { x: 900, y: 450, width: 200, height: 100 };
  const overlays = { top: 100, right: 0, bottom: 0, left: 0 };

  assert.equal(focusOnBox(box, frame, overlays, 0).translateY, 50);
});

test('focusing on a box at the image edge stops before the stage shows past the map', () => {
  const box = { x: 1900, y: 450, width: 100, height: 100 };

  assert.equal(focusOnBox(box, frame, unobscured, 0).translateX, -1000);
});

test('zooming in doubles the scale', () => {
  const viewport = zoomStep({ scale: 2, translateX: 100, translateY: 0 }, 'in', frame);

  assert.equal(viewport.scale, 4);
});

test('zooming in keeps the point at the stage center in place', () => {
  const viewport = zoomStep({ scale: 2, translateX: 100, translateY: 0 }, 'in', frame);

  assert.equal(viewport.translateX, 200);
});

test('zooming in stops at the maximum scale', () => {
  const viewport = zoomStep({ scale: 4, translateX: 0, translateY: 0 }, 'in', frame);

  assert.equal(viewport.scale, MAX_SCALE);
});

test('zooming out stops at the minimum scale', () => {
  const viewport = zoomStep({ scale: 1.5, translateX: 0, translateY: 0 }, 'out', frame);

  assert.equal(viewport.scale, MIN_SCALE);
});

test('zooming out to the full map pulls a sideways offset back inside the stage', () => {
  const viewport = zoomStep({ scale: 1.5, translateX: 50, translateY: 0 }, 'out', frame);

  assert.equal(viewport.translateX, 0);
});

test('pinching around a finger keeps the map point under that finger still', () => {
  const viewport = zoomAround(
    { scale: 1, translateX: 0, translateY: 0 },
    2,
    { x: 300, y: 200 },
    frame
  );

  assert.equal(viewport.translateX, -100);
});

test('a zoomed-in map cannot be dragged far enough to show the stage behind it', () => {
  const viewport = clampViewport({ scale: 2, translateX: 900, translateY: 0 }, frame);

  assert.equal(viewport.translateX, 200);
});

test('a map smaller than the stage can slide but stays inside the stage', () => {
  const viewport = clampViewport({ scale: 1, translateX: 0, translateY: -300 }, frame);

  assert.equal(viewport.translateY, -100);
});

test('a box on the full map is projected into stage coordinates', () => {
  const box = { x: 900, y: 450, width: 200, height: 100 };

  assert.deepEqual(projectBox(box, { scale: 1, translateX: 0, translateY: 0 }, frame), {
    x: 180,
    y: 190,
    width: 40,
    height: 20,
  });
});

test('a box on a zoomed and moved map is projected into stage coordinates', () => {
  const box = { x: 900, y: 450, width: 200, height: 100 };

  assert.deepEqual(projectBox(box, { scale: 2, translateX: 30, translateY: -10 }, frame), {
    x: 190,
    y: 170,
    width: 80,
    height: 40,
  });
});

test('a well-formed box is read from the room data', () => {
  assert.deepEqual(parseBox({ x: 10, y: 20, width: 30, height: 40 }), {
    x: 10,
    y: 20,
    width: 30,
    height: 40,
  });
});

test('a room without a box reads as having none', () => {
  assert.equal(parseBox(undefined), null);
});

test('a box missing a dimension reads as having none', () => {
  assert.equal(parseBox({ x: 10, y: 20, width: 30 }), null);
});

test('a box with a zero width reads as having none', () => {
  assert.equal(parseBox({ x: 10, y: 20, width: 0, height: 40 }), null);
});
