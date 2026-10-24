// Scene layouts in "units": scene height = 100u, width per place below.
// Objects are placed by bottom-centre (cx, by) and a width (w) or height (h) in units.
import type { StationId } from '../data/activities';
import type { Slot } from '../data/shop';

export type PlaceId = 'home' | 'garden' | 'cafe' | 'park' | 'field' | 'market' | 'lake';

export type Placed = {
  key: string;
  slot?: Slot;          // swappable slot; fixed furniture has none
  fixed?: string;       // fixed art (FURN key)
  cx: number;
  by?: number;          // bottom y
  ty?: number;          // or top y (wall things)
  w?: number;
  h?: number;
  z: number;
  rot?: number;
  flip?: boolean;
  shadow?: number;      // contact shadow width in units
  alive?: boolean;      // jitters at the drawing rate like the character (NPCs, ducks)
};

// A friend character standing around in a place (uses the friend pose sets).
export type Npc = { key: string; hero: string; pose: string; x: number; y: number; face: 1 | -1; z: number; scale?: number };

export type Station = { place: PlaceId; x: number; y: number; face: 1 | -1; scale?: number; rot?: number; z?: number; jog?: number };

export const CHAR_H = 27; // idle Noodle height in units
export const PX_TO_U = CHAR_H / 520;

export const HOME_FLOOR = 62; // wall/floor seam in the flat

export type PlaceLayout = {
  w: number;
  walkY: number;
  bg: 'room' | string; // 'room' = painted wallpaper + floor; else a SCENES key
  items: Placed[];
  npcs: Npc[];
  exit: { x: number; y: number; door: boolean }; // where you leave (and arrive)
  idle: { x: number; y: number }[];
};

export const PLACES_LAYOUT: Record<PlaceId, PlaceLayout> = {
  home: {
    w: 252, walkY: 93, bg: 'room',
    exit: { x: 241, y: 70, door: true },
    idle: [{ x: 40, y: 94 }, { x: 100, y: 93 }, { x: 140, y: 95 }, { x: 175, y: 93 }, { x: 205, y: 94 }],
    npcs: [],
    items: [
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
    ],
  },
  garden: {
    w: 178, walkY: 88, bg: 'garden_bg',
    exit: { x: 14, y: 74, door: true },
    idle: [{ x: 40, y: 92 }, { x: 70, y: 90 }, { x: 115, y: 90 }, { x: 150, y: 88 }],
    npcs: [],
    items: [
      { key: 'tree', fixed: 'tree', cx: 150, by: 70, h: 54, z: 3, shadow: 26 },
      { key: 'gSwing', slot: 'gSwing', cx: 138, ty: 33, h: 34, z: 4 },
      { key: 'gBird', slot: 'gBird', cx: 171, by: 78, h: 40, z: 4, shadow: 6 },
      { key: 'gBench', slot: 'gBench', cx: 98, by: 74, w: 30, z: 5, shadow: 28 },
      { key: 'gFlowers', slot: 'gFlowers', cx: 44, by: 87, w: 28, z: 6, shadow: 26 },
      { key: 'yogamat', fixed: 'yogamat', cx: 80, by: 97, w: 32, z: 5 },
      { key: 'gPond', slot: 'gPond', cx: 132, by: 99, w: 40, z: 5 },
    ],
  },
  cafe: {
    w: 178, walkY: 92, bg: 'cafe_bg',
    exit: { x: -10, y: 92, door: false },
    idle: [{ x: 60, y: 92 }, { x: 90, y: 94 }, { x: 140, y: 93 }],
    npcs: [{ key: 'mossy', hero: 'pebble', pose: 'read', x: 128, y: 92, face: -1, z: 9, scale: 0.95 }],
    items: [
      { key: 'barista', fixed: 'npc_teapot', cx: 46, by: 74, h: 22, z: 3, alive: true },
      { key: 'table', fixed: 'cafe_table', cx: 110, by: 94, w: 26, z: 8, shadow: 22 },
    ],
  },
  park: {
    w: 178, walkY: 92, bg: 'park_bg',
    exit: { x: -10, y: 92, door: false },
    idle: [{ x: 40, y: 92 }, { x: 90, y: 93 }, { x: 150, y: 92 }],
    npcs: [{ key: 'burrito', hero: 'blanket', pose: 'idle', x: 150, y: 90, face: -1, z: 9, scale: 0.9 }],
    items: [
      { key: 'bench', fixed: 'park_bench', cx: 64, by: 82, w: 34, z: 5, shadow: 30 },
      { key: 'duck1', fixed: 'duck', cx: 140, by: 58, h: 7, z: 2, alive: true },
      { key: 'duck2', fixed: 'duck', cx: 156, by: 61, h: 6, z: 2, alive: true, flip: true },
    ],
  },
  field: {
    w: 178, walkY: 93, bg: 'field_bg',
    exit: { x: -10, y: 93, door: false },
    idle: [{ x: 50, y: 93 }, { x: 110, y: 92 }],
    npcs: [{ key: 'mossy', hero: 'pebble', pose: 'happy', x: 150, y: 80, face: -1, z: 4, scale: 0.8 }],
    items: [],
  },
  market: {
    w: 178, walkY: 93, bg: 'market_bg',
    exit: { x: -10, y: 93, door: false },
    idle: [{ x: 60, y: 93 }, { x: 100, y: 94 }, { x: 140, y: 93 }],
    npcs: [],
    items: [{ key: 'baker', fixed: 'npc_bread', cx: 118, by: 84, h: 20, z: 4, alive: true, shadow: 12 }],
  },
  lake: {
    w: 178, walkY: 93, bg: 'lake_bg',
    exit: { x: -10, y: 93, door: false },
    idle: [{ x: 50, y: 93 }, { x: 100, y: 92 }],
    npcs: [{ key: 'burrito', hero: 'blanket', pose: 'read', x: 130, y: 92, face: -1, z: 9, scale: 0.85 }],
    items: [{ key: 'duck', fixed: 'duck', cx: 70, by: 66, h: 6, z: 2, alive: true }],
  },
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

// Better stations that become available once a place on the map is unlocked.
export const UPGRADES: Record<string, Station> = {
  // café
  friends: { place: 'cafe', x: 94, y: 93, face: 1, z: 9 },
  date: { place: 'cafe', x: 94, y: 93, face: 1, z: 9 },
  study: { place: 'cafe', x: 94, y: 93, face: 1, z: 9 },
  write: { place: 'cafe', x: 94, y: 93, face: 1, z: 9 },
  // park
  run: { place: 'park', x: 100, y: 93, face: 1, z: 20, jog: 34 },
  chill: { place: 'park', x: 62, y: 80, face: 1, z: 6 },
  outside: { place: 'park', x: 110, y: 92, face: 1, z: 20 },
  // field
  sport: { place: 'field', x: 96, y: 92, face: 1, z: 20 },
  workout: { place: 'field', x: 70, y: 93, face: 1, z: 20 },
  // market
  cook: { place: 'market', x: 98, y: 94, face: 1, z: 20 },
  // lake
  meditate: { place: 'lake', x: 84, y: 93, face: 1, z: 20 },
  journal: { place: 'lake', x: 84, y: 93, face: 1, z: 20 },
};

// Café/park seated poses look better as sitting-with-mug or reading.
export const UPGRADE_POSES: Record<string, [string, number][]> = {
  friends: [['sofa_relax', 6], ['happy', 3]],
  date: [['sofa_relax', 6], ['happy', 3]],
  study: [['laptop', 8]],
  write: [['laptop', 8]],
  chill: [['sofa_relax', 8]],
  cook: [['happy', 4], ['wave', 4]],
};

export const UPGRADE_DOING: Record<string, string> = {
  friends: 'gossiping over cinnamon buns at the café',
  date: 'sharing one bun at the café (romantic)',
  study: 'studying at the café, sipping slowly',
  write: 'writing at the café like a real author',
  run: 'jogging round the pond. the ducks are judging',
  chill: 'sitting on a park bench, watching ducks',
  outside: 'taking a big breath of park air',
  sport: 'kicking the ball at the sports field',
  workout: 'training on the field. very athletic',
  cook: 'buying suspicious vegetables at the market',
  meditate: 'meditating by the lake. very deep',
  journal: 'writing by the lake. the water listens',
};
