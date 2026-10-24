import type { UIName } from '../assets';

// A "performance" is what the character acts out at a station: a cycle of poses,
// each held for N drawings, looped for the duration of the scene.
export type Perf = { poses: [string, number][]; ms: number };

export type StationId =
  | 'bed' | 'desk' | 'deskRead' | 'sofa' | 'stove' | 'plant' | 'rug' | 'rugSweep' | 'record' | 'wall'
  | 'mat' | 'matSquat' | 'matStretch' | 'ball' | 'flowerbed' | 'bench' | 'gardenRug';

export type Activity = {
  id: string;
  label: string;
  station: StationId;
  perf: Perf;
  doing: string; // status line while acting: "Noodle is …"
};

export type Category = {
  id: string;
  label: string;
  icon: UIName;
  tint: string;
  blurb: string;
  activities: Activity[];
};

const hold = (pose: string, ms = 4200): Perf => ({ poses: [[pose, 4]], ms });

export const CATEGORIES: Category[] = [
  {
    id: 'move', label: 'Move', icon: 'cat_move', tint: '#E9C8B8', blurb: 'Sweat a little',
    activities: [
      { id: 'workout', label: 'Workout', station: 'mat', perf: { poses: [['jumpjack', 2], ['idle', 2]], ms: 4800 }, doing: 'doing very serious jumping jacks' },
      { id: 'run', label: 'Run / walk', station: 'mat', perf: { poses: [['walk1', 2], ['walk2', 2]], ms: 4200 }, doing: 'jogging in place, technically' },
      { id: 'yoga', label: 'Yoga / stretch', station: 'matStretch', perf: { poses: [['stretch', 6], ['meditate', 6]], ms: 5200 }, doing: 'becoming one long noodle' },
      { id: 'sport', label: 'Sport', station: 'ball', perf: { poses: [['idle', 3], ['kick', 4]], ms: 4600 }, doing: 'kicking the ball (mostly air)' },
      { id: 'gym', label: 'Strength', station: 'matSquat', perf: { poses: [['squat', 3], ['idle', 3]], ms: 4800 }, doing: 'squatting with great dignity' },
    ],
  },
  {
    id: 'learn', label: 'Learn', icon: 'cat_learn', tint: '#C6D3E6', blurb: 'Grow the brain',
    activities: [
      { id: 'study', label: 'Study', station: 'desk', perf: hold('laptop'), doing: 'typing furiously' },
      { id: 'read', label: 'Read', station: 'deskRead', perf: hold('read'), doing: 'reading a very good chapter' },
      { id: 'course', label: 'Course / class', station: 'desk', perf: hold('laptop'), doing: 'taking notes nobody will read' },
      { id: 'language', label: 'Language', station: 'deskRead', perf: hold('read'), doing: 'saying "bonjour" to a book' },
    ],
  },
  {
    id: 'work', label: 'Work', icon: 'cat_create', tint: '#E4DDC0', blurb: 'Get things done',
    activities: [
      { id: 'deep', label: 'Deep work', station: 'desk', perf: hold('laptop', 4600), doing: 'in the zone. do not disturb' },
      { id: 'create', label: 'Make art', station: 'deskRead', perf: hold('read'), doing: 'drawing a portrait of a sock' },
      { id: 'write', label: 'Write', station: 'desk', perf: hold('laptop'), doing: 'writing the great noodle novel' },
    ],
  },
  {
    id: 'social', label: 'People', icon: 'cat_social', tint: '#E8C9C2', blurb: 'Time with others',
    activities: [
      { id: 'friends', label: 'Friends', station: 'bench', perf: hold('sofa_relax', 4600), doing: 'gossiping on the bench' },
      { id: 'family', label: 'Family', station: 'sofa', perf: { poses: [['wave', 4], ['sofa_relax', 6]], ms: 4800 }, doing: 'calling grandma back' },
      { id: 'date', label: 'Date', station: 'bench', perf: { poses: [['happy', 4], ['sofa_relax', 6]], ms: 4800 }, doing: 'blushing (yellow-ly)' },
      { id: 'helped', label: 'Helped someone', station: 'wall', perf: { poses: [['wave', 4], ['happy', 4]], ms: 4200 }, doing: 'being a good noodle' },
    ],
  },
  {
    id: 'rest', label: 'Rest', icon: 'cat_rest', tint: '#D5CDE4', blurb: 'Recharge',
    activities: [
      { id: 'nap', label: 'Nap', station: 'bed', perf: hold('sleep', 5200), doing: 'napping. shh' },
      { id: 'chill', label: 'Chill', station: 'sofa', perf: hold('sofa_relax', 4600), doing: 'doing absolutely nothing, beautifully' },
      { id: 'music', label: 'Music', station: 'record', perf: { poses: [['music', 4], ['music', 4]], ms: 4600 }, doing: 'vibing to a scratchy record' },
      { id: 'meditate', label: 'Meditate', station: 'rug', perf: hold('meditate', 5200), doing: 'thinking about nothing (hard)' },
    ],
  },
  {
    id: 'home', label: 'Home', icon: 'cat_home', tint: '#C9D9CF', blurb: 'Nest keeping',
    activities: [
      { id: 'cook', label: 'Cook', station: 'stove', perf: { poses: [['cook', 3], ['idle', 2]], ms: 4600 }, doing: 'flipping a pancake (risky)' },
      { id: 'clean', label: 'Clean', station: 'rugSweep', perf: hold('broom', 4600), doing: 'sweeping crumbs under the rug' },
      { id: 'plants', label: 'Water plants', station: 'plant', perf: hold('water'), doing: 'watering the leafy roommate' },
      { id: 'garden', label: 'Garden', station: 'flowerbed', perf: hold('water'), doing: 'giving the flowers a drink' },
    ],
  },
  {
    id: 'care', label: 'Self-care', icon: 'cat_care', tint: '#CDE1E6', blurb: 'Be kind to you',
    activities: [
      { id: 'water', label: 'Drank water', station: 'rug', perf: { poses: [['happy', 4], ['idle', 4]], ms: 3800 }, doing: 'hydrated and smug about it' },
      { id: 'sleep', label: 'Slept well', station: 'bed', perf: hold('sleep', 4600), doing: 'dreaming of soup' },
      { id: 'journal', label: 'Journaled', station: 'deskRead', perf: hold('read'), doing: 'writing feelings in tiny letters' },
      { id: 'outside', label: 'Got fresh air', station: 'gardenRug', perf: { poses: [['stretch', 5], ['idle', 4]], ms: 4600 }, doing: 'smelling the grass' },
    ],
  },
];

export const findActivity = (id: string) => {
  for (const c of CATEGORIES) {
    const a = c.activities.find(x => x.id === id);
    if (a) return { cat: c, act: a };
  }
  return null;
};

export const DURATIONS = [
  { min: 10, label: 'quick', coins: 0, xp: 0 },
  { min: 30, label: '30 min', coins: 4, xp: 8 },
  { min: 60, label: '1 hour+', coins: 8, xp: 16 },
];
