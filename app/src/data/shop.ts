import type { FurnName, UIName } from '../assets';

export type Slot =
  | 'wall' | 'floor' | 'seat' | 'rug' | 'plantA' | 'plantB' | 'lamp' | 'music' | 'clock'
  | 'frame1' | 'frame2' | 'frame3'
  | 'gBench' | 'gPond' | 'gBird' | 'gSwing' | 'gFlowers'
  | 'hat' | 'glasses' | 'hero';

export type ShopTab = 'autumn' | 'furniture' | 'decor' | 'plants' | 'walls' | 'garden' | 'wardrobe' | 'friends';

export type Item = {
  id: string;
  name: string;
  slot: Slot;
  tab: ShopTab;
  art: { kind: 'furn'; key: FurnName } | { kind: 'ui'; key: UIName } | { kind: 'tex'; key: string } | { kind: 'hero'; key: string };
  price: number;
  level: number;
  note: string; // flavour line
  rarity?: 'common' | 'rare' | 'epic';
};

const f = (key: FurnName) => ({ kind: 'furn' as const, key });
const u = (key: UIName) => ({ kind: 'ui' as const, key });
const t = (key: string) => ({ kind: 'tex' as const, key });

export const ITEMS: Item[] = [
  // seats
  { id: 'sofa', name: 'Sage Snoozer', slot: 'seat', tab: 'furniture', art: f('sofa'), price: 0, level: 1, note: 'Fits one noodle and three crumbs.' },
  { id: 'armchair', name: 'Mustard Hug', slot: 'seat', tab: 'furniture', art: f('armchair'), price: 140, level: 2, note: 'It hugs back. A little too hard.' },
  { id: 'beanbag', name: 'Lilac Blob', slot: 'seat', tab: 'furniture', art: f('beanbag'), price: 110, level: 3, note: 'Sit once, stay forever.', rarity: 'rare' },
  // rugs
  { id: 'rug_rust', name: 'Rusty Ring', slot: 'rug', tab: 'decor', art: f('rug_rust'), price: 0, level: 1, note: 'Round, like a pancake.' },
  { id: 'rug_stripe', name: 'Stripe Stripe', slot: 'rug', tab: 'decor', art: f('rug_stripe'), price: 70, level: 1, note: 'Stripes make you 5% faster.' },
  // lights & things
  { id: 'lamp', name: 'Peach Glow', slot: 'lamp', tab: 'decor', art: f('lamp'), price: 0, level: 1, note: 'Bendy, like its owner.' },
  { id: 'record', name: 'Crackle Box', slot: 'music', tab: 'decor', art: f('record'), price: 90, level: 2, note: 'Plays one song. It is a good song.' },
  { id: 'fishbowl', name: 'Sir Bubbles', slot: 'music', tab: 'decor', art: f('fishbowl'), price: 120, level: 4, note: 'A fish with opinions.', rarity: 'rare' },
  { id: 'clock', name: 'Tick Tock', slot: 'clock', tab: 'decor', art: f('clock'), price: 40, level: 1, note: 'Always says "later".' },
  // frames for memories
  { id: 'frame_wood', name: 'Honey Frame', slot: 'frame1', tab: 'decor', art: f('frame_wood'), price: 0, level: 1, note: 'Holds one good memory.' },
  { id: 'frame_sage', name: 'Sage Square', slot: 'frame2', tab: 'decor', art: f('frame_sage'), price: 60, level: 1, note: 'For memories with corners.' },
  { id: 'frame_oval', name: 'Fancy Oval', slot: 'frame3', tab: 'decor', art: f('frame_oval'), price: 90, level: 3, note: 'Makes any photo look like a grandma.', rarity: 'rare' },
  // plants
  { id: 'monstera', name: 'Big Leafy', slot: 'plantA', tab: 'plants', art: f('monstera'), price: 0, level: 1, note: 'Has holes on purpose.' },
  { id: 'snakeplant', name: 'Tall Steve', slot: 'plantA', tab: 'plants', art: f('snakeplant'), price: 60, level: 1, note: 'Cannot be killed. Has tried.' },
  { id: 'cactus', name: 'Pokey Pal', slot: 'plantB', tab: 'plants', art: f('cactus'), price: 50, level: 1, note: 'Do not hug. Admire.' },
  // walls & floors
  { id: 'wall_sprig', name: 'Little Sprigs', slot: 'wall', tab: 'walls', art: t('wall_sprig'), price: 0, level: 1, note: 'Fresh and leafy.' },
  { id: 'wall_stars', name: 'Lilac Night', slot: 'wall', tab: 'walls', art: t('wall_stars'), price: 150, level: 3, note: 'Stars, but indoors.', rarity: 'rare' },
  { id: 'wall_stripes', name: 'Mint Stripes', slot: 'wall', tab: 'walls', art: t('wall_stripes'), price: 120, level: 2, note: 'Very vertical. Very calm.' },
  { id: 'floor_wood', name: 'Honey Planks', slot: 'floor', tab: 'walls', art: t('floor_wood'), price: 0, level: 1, note: 'Creaks politely.' },
  { id: 'floor_check', name: 'Blue Checks', slot: 'floor', tab: 'walls', art: t('floor_check'), price: 130, level: 2, note: 'A chess board for feet.' },
  // garden
  { id: 'bench', name: 'Gossip Bench', slot: 'gBench', tab: 'garden', art: f('bench'), price: 0, level: 1, note: 'Hears everything. Tells no one.' },
  { id: 'flowerbed', name: 'Petal Box', slot: 'gFlowers', tab: 'garden', art: f('flowerbed'), price: 0, level: 1, note: 'Flowers that like you back.' },
  { id: 'pond', name: 'Tiny Pond', slot: 'gPond', tab: 'garden', art: f('pond'), price: 160, level: 3, note: 'Big enough for one frog dream.', rarity: 'rare' },
  { id: 'birdhouse', name: 'Tweet Hotel', slot: 'gBird', tab: 'garden', art: f('birdhouse'), price: 80, level: 2, note: 'Five stars from a sparrow.' },
  { id: 'swing', name: 'Wheee Seat', slot: 'gSwing', tab: 'garden', art: f('swing'), price: 120, level: 4, note: 'Hangs from the apple tree.', rarity: 'rare' },
  // wardrobe
  { id: 'hat_beanie', name: 'Pom Beanie', slot: 'hat', tab: 'wardrobe', art: u('hat_beanie'), price: 60, level: 1, note: 'Keeps the curl warm.' },
  { id: 'hat_bucket', name: 'Daisy Bucket', slot: 'hat', tab: 'wardrobe', art: u('hat_bucket'), price: 70, level: 1, note: 'For fishing. Or not.' },
  { id: 'hat_straw', name: 'Sun Brim', slot: 'hat', tab: 'wardrobe', art: u('hat_straw'), price: 90, level: 2, note: 'Summer is a state of mind.' },
  { id: 'hat_flowers', name: 'Flower Crown', slot: 'hat', tab: 'wardrobe', art: u('hat_flowers'), price: 110, level: 3, note: 'Royalty of the meadow.', rarity: 'rare' },
  { id: 'hat_party', name: 'Party Cone', slot: 'hat', tab: 'wardrobe', art: u('hat_party'), price: 80, level: 2, note: 'Every day is a little party.' },
  { id: 'hat_crown', name: 'Wonky Crown', slot: 'hat', tab: 'wardrobe', art: u('hat_crown'), price: 300, level: 6, note: 'For the ruler of small habits.', rarity: 'epic' },
  { id: 'glasses', name: 'Smart Specs', slot: 'glasses', tab: 'wardrobe', art: u('glasses'), price: 75, level: 2, note: '+10 intelligence (visually).' },
  // seasonal: autumn (limited, see SEASON_UNTIL)
  { id: 'pumpkin', name: 'Round Boy', slot: 'plantB', tab: 'autumn', art: f('pumpkin'), price: 45, level: 1, note: 'Not for soup. He has a name.', rarity: 'rare' },
  { id: 'wreath', name: 'Leaf Wreath', slot: 'clock', tab: 'autumn', art: f('wreath'), price: 70, level: 1, note: 'Smells like crunchy walks.', rarity: 'rare' },
  { id: 'rug_leaves', name: 'Leaf Pile', slot: 'rug', tab: 'autumn', art: f('rug_leaves'), price: 90, level: 1, note: 'A rug you are allowed to jump in.', rarity: 'rare' },
  // friends (heroes)
  { id: 'noodle', name: 'Noodle', slot: 'hero', tab: 'friends', art: { kind: 'hero', key: 'noodle' }, price: 0, level: 1, note: 'Tired but trying. Like you.' },
  { id: 'pebble', name: 'Mossy', slot: 'hero', tab: 'friends', art: { kind: 'hero', key: 'pebble' }, price: 400, level: 5, note: 'A rock with a mushroom. Very grounded.', rarity: 'epic' },
  { id: 'blanket', name: 'Burrito', slot: 'hero', tab: 'friends', art: { kind: 'hero', key: 'blanket' }, price: 400, level: 5, note: 'Never leaves the blanket. Never.', rarity: 'epic' },
];

export const itemById = (id: string) => ITEMS.find(i => i.id === id);

export const SEASON_UNTIL = new Date(2026, 11, 1).getTime(); // autumn items leave the shop on 1 Dec

export const TABS: { id: ShopTab; label: string }[] = [
  { id: 'autumn', label: 'Autumn ✦' },
  { id: 'furniture', label: 'Seats' },
  { id: 'decor', label: 'Decor' },
  { id: 'plants', label: 'Plants' },
  { id: 'walls', label: 'Walls' },
  { id: 'garden', label: 'Garden' },
  { id: 'wardrobe', label: 'Hats' },
  { id: 'friends', label: 'Friends' },
];

// Slots that can be left empty (tap "Remove" in the shop).
export const OPTIONAL_SLOTS: Slot[] = ['rug', 'plantB', 'lamp', 'music', 'clock', 'frame2', 'frame3', 'gPond', 'gBird', 'gSwing', 'hat', 'glasses'];

export const START_OWNED = ['sofa', 'rug_rust', 'lamp', 'frame_wood', 'monstera', 'wall_sprig', 'floor_wood', 'bench', 'flowerbed', 'noodle'];
export const START_EQUIPPED: Partial<Record<Slot, string>> = {
  wall: 'wall_sprig', floor: 'floor_wood', seat: 'sofa', rug: 'rug_rust', plantA: 'monstera', lamp: 'lamp',
  frame1: 'frame_wood', gBench: 'bench', gFlowers: 'flowerbed', hero: 'noodle',
};
