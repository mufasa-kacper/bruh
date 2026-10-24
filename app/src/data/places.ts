// Places on the painted town map. x/y are % of the map image; locked places sit under fog.
export type PlaceId = 'home' | 'garden' | 'cafe' | 'park' | 'field' | 'market' | 'lake';

export type Place = {
  id: PlaceId;
  name: string;
  x: number;
  y: number;
  r: number; // fog radius in % of map width
  level: number;
  blurb: string;
  playable: boolean; // has its own scene in this build
};

export const PLACES: Place[] = [
  { id: 'home', name: 'Home', x: 47, y: 84, r: 0, level: 1, blurb: 'Your little flat. Crumbs included.', playable: true },
  { id: 'garden', name: 'Backyard', x: 64, y: 86, r: 0, level: 1, blurb: 'Grass, a ball and a very nosy bench.', playable: true },
  { id: 'cafe', name: 'Crumb Café', x: 22, y: 53, r: 21, level: 3, blurb: 'Where friends meet and cinnamon buns vanish.', playable: false },
  { id: 'park', name: 'Pond Park', x: 75, y: 61, r: 22, level: 5, blurb: 'Ducks, benches and long thinky walks.', playable: false },
  { id: 'field', name: 'Sports Field', x: 23, y: 23, r: 22, level: 7, blurb: 'Laps, goals and dramatic slow-motion.', playable: false },
  { id: 'market', name: 'Bakery & Market', x: 80, y: 23, r: 22, level: 10, blurb: 'Fresh bread and suspicious vegetables.', playable: false },
  { id: 'lake', name: 'Big Lake', x: 40, y: 8, r: 26, level: 14, blurb: 'The end of the map. Or the start.', playable: false },
];
