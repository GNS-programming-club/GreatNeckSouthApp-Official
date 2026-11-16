import assert from 'node:assert/strict';
import { test } from 'node:test';

import mapData from '../assets/data/map-rooms.json' with { type: 'json' };

type Box = { x: number; y: number; width: number; height: number };
type MapEntry = { id: string; box?: Box };

const imageWidth = 2200;
const imageHeight = 1700;
const entries: MapEntry[] = [...mapData.places, ...mapData.rooms];

test('every room and place has a box', () => {
  const unboxed = entries.filter((entry) => entry.box === undefined).map((entry) => entry.id);
  assert.deepEqual(unboxed, []);
});

test('every box lies inside the map image with positive size', () => {
  const outOfBounds = entries
    .filter(
      (entry) =>
        entry.box !== undefined &&
        !(
          Number.isInteger(entry.box.x) &&
          Number.isInteger(entry.box.y) &&
          Number.isInteger(entry.box.width) &&
          Number.isInteger(entry.box.height) &&
          entry.box.x >= 0 &&
          entry.box.y >= 0 &&
          entry.box.width > 0 &&
          entry.box.height > 0 &&
          entry.box.x + entry.box.width <= imageWidth &&
          entry.box.y + entry.box.height <= imageHeight
        )
    )
    .map((entry) => entry.id);
  assert.deepEqual(outOfBounds, []);
});
