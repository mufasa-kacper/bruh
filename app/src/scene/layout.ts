// Scene layouts in "units": scene height = 100u, width per place below.
// Objects are placed by bottom-centre (cx, by) and a width (w) or height (h) in units.
import type { StationId } from '../data/activities';
import type { Slot } from '../data/shop';
import type { FurnName } from '../assets';

export type Placed = {
  key: string;
  slot?: Slot;          // swappable slot; fixed furniture has none
  fixed?: FurnName;     // fixed art
  cx: number;
  by?: number;          // bottom y
  ty?: number;          // or top y (wall things)
  w?: number;
  h?: number;
  z: number;
  rot?: number;
  shadow?: number;      // contact shadow width in units
};

export type Station = { place: 'home' | 'garden'; x: number; y: number; face: 1 | -1; scale?: number; rot?: number; z?: number };

export const CHAR_H = 27; // idle Noodle height in units
export const PX_TO_U = CHAR_H / 520;

export const HOME_W = 252;
export const HOME_FLOOR = 62; // wall/floor seam
export const HOME_WALK_Y = 93;

export const HOME: Placed[] = [
  { key: 'window', fixed: 'window', cx: 160, ty: 6, w: 40, z: 1 },
  { key: 'clock', slot: 'clock', cx: 26, ty: 8, w: 11, z: 1 },
  { key: 'frame1', slot: 'frame1', cx: 46, ty: 9, w: 12, z: 1 },
  { key: 'frame3', slot: 'frame3', cx: 84, ty: 10, w: 10, z: 1 },
  { key: 'frame2', slot: 'frame2', cx: 200, ty: 12, w: 13, z: 1 },
  { key: 'door', fixed: 'door', cx: 241, by: 67, h: 55, z: 2 },
  { key: 'bookshelf', fixed: 'bookshelf', cx: 110, by: 71, h: 34, z: 3, shadow: 22 },
  { key: 'rug', slot: 'rug', cx: 158, by: 100, w: 62, z: 4 },
  { key: 'bed', fixed: 'bed', cx: 28, by: 91, w: 46, z: 10, shadow: 42 },
  { key: 'lamp', slot: 'lamp', cx: 58, by: 79, h: 42, z: 6, shadow: 10 },
  { key: 'desk', fixed: 'desk', cx: 84, by: 82, h: 31, z: 7, shadow: 26 },
  { key: 'chair', fixed: 'chair', cx: 71, by: 89, h: 25, z: 9, shadow: 12 },
  { key: 'music', slot: 'music', cx: 129, by: 79, h: 22, z: 6, shadow: 14 },
  { key: 'seat', slot: 'seat', cx: 160, by: 85, w: 44, z: 8, shadow: 40 },
  { key: 'plantA', slot: 'plantA', cx: 193, by: 81, h: 40, z: 8, shadow: 16 },
  { key: 'stove', fixed: 'stove', cx: 216, by: 81, h: 30, z: 7, shadow: 20 },
  { key: 'plantB', slot: 'plantB', cx: 124, by: 97, w: 10, z: 30, shadow: 8 },
];

export const GARDEN_W = 178;
export const GARDEN_WALK_Y = 88;

export const GARDEN: Placed[] = [
  { key: 'tree', fixed: 'tree', cx: 150, by: 70, h: 54, z: 3, shadow: 26 },
  { key: 'gSwing', slot: 'gSwing', cx: 138, ty: 33, h: 34, z: 4 },
  { key: 'gBird', slot: 'gBird', cx: 171, by: 78, h: 40, z: 4, shadow: 6 },
  { key: 'gBench', slot: 'gBench', cx: 98, by: 74, w: 30, z: 5, shadow: 28 },
  { key: 'gFlowers', slot: 'gFlowers', cx: 44, by: 87, w: 28, z: 6, shadow: 26 },
  { key: 'yogamat', fixed: 'yogamat', cx: 80, by: 97, w: 32, z: 5 },
  { key: 'gPond', slot: 'gPond', cx: 132, by: 99, w: 40, z: 5 },
];

export const DOORS = {
  home: { x: 241, y: 70 },   // apartment door → backyard
  garden: { x: 14, y: 74 },  // back door of the house in the garden painting
};

// Where the character performs each kind of activity.
export const STATIONS: Record<StationId, Station> = {
  bed: { place: 'home', x: 29, y: 80, face: 1, rot: -62, z: 11 },
  desk: { place: 'home', x: 73, y: 86, face: 1, z: 10 },
  deskRead: { place: 'home', x: 71, y: 86, face: 1, z: 10 },
  sofa: { place: 'home', x: 156, y: 84, face: 1, z: 9 },
  stove: { place: 'home', x: 200, y: 93, face: 1, z: 20 },
  plant: { place: 'home', x: 178, y: 93, face: 1, z: 20 },
  rug: { place: 'home', x: 150, y: 96, face: 1, z: 20 },
  rugSweep: { place: 'home', x: 142, y: 95, face: -1, z: 20 },
  record: { place: 'home', x: 136, y: 93, face: -1, z: 20 },
  wall: { place: 'home', x: 60, y: 94, face: 1, z: 20 },
  mat: { place: 'garden', x: 80, y: 94, face: 1, z: 20 },
  matSquat: { place: 'garden', x: 80, y: 94, face: 1, z: 20 },
  matStretch: { place: 'garden', x: 80, y: 94, face: 1, z: 20 },
  ball: { place: 'garden', x: 100, y: 91, face: 1, z: 20 },
  flowerbed: { place: 'garden', x: 26, y: 92, face: 1, z: 20 },
  bench: { place: 'garden', x: 97, y: 78, face: 1, z: 6 },
  gardenRug: { place: 'garden', x: 118, y: 89, face: 1, z: 20 },
};

// Idle spots the character wanders between when nothing is happening.
export const IDLE_SPOTS = {
  home: [{ x: 40, y: 94 }, { x: 100, y: 93 }, { x: 140, y: 95 }, { x: 175, y: 93 }, { x: 205, y: 94 }],
  garden: [{ x: 40, y: 92 }, { x: 70, y: 90 }, { x: 115, y: 90 }, { x: 150, y: 88 }],
};
