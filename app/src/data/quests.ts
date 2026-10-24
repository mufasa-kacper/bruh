// Quest and achievement definitions. Progress is computed from the activity log,
// so nothing here needs its own counters.
export type LogEntry = { id: string; at: number; act: string; cat: string; min: number; note?: string };
export type Memory = { id: string; at: number; title: string; note: string; photo?: string; frame?: string };

export type QuestDef = {
  id: string;
  title: string;
  hint: string;
  goal: number;
  coins: number;
  gifts: number;
  count: (log: LogEntry[], mems: Memory[]) => number;
};

const distinctCats = (log: LogEntry[]) => new Set(log.map(l => l.cat)).size;
const ofCat = (c: string) => (log: LogEntry[]) => log.filter(l => l.cat === c).length;

export const DAILY_POOL: QuestDef[] = [
  { id: 'd_two', title: 'Two Good Things', hint: 'Log any 2 activities today', goal: 2, coins: 15, gifts: 0, count: l => l.length },
  { id: 'd_three', title: 'Busy Noodle', hint: 'Log 3 activities today', goal: 3, coins: 25, gifts: 1, count: l => l.length },
  { id: 'd_move', title: 'Wiggle Time', hint: 'Log something in Move', goal: 1, coins: 15, gifts: 0, count: ofCat('move') },
  { id: 'd_rest', title: 'Soft Hour', hint: 'Log something in Rest', goal: 1, coins: 12, gifts: 0, count: ofCat('rest') },
  { id: 'd_learn', title: 'Brain Snack', hint: 'Log something in Learn', goal: 1, coins: 15, gifts: 0, count: ofCat('learn') },
  { id: 'd_care', title: 'Be Nice To You', hint: 'Log something in Self-care', goal: 1, coins: 12, gifts: 0, count: ofCat('care') },
  { id: 'd_home', title: 'Nest Duty', hint: 'Log something in Home', goal: 1, coins: 12, gifts: 0, count: ofCat('home') },
  { id: 'd_mix', title: 'Little Bit of Everything', hint: 'Log 2 different categories', goal: 2, coins: 20, gifts: 1, count: l => distinctCats(l) },
  { id: 'd_memory', title: 'Keep a Moment', hint: 'Save one memory today', goal: 1, coins: 20, gifts: 1, count: (_l, m) => m.length },
];

export const WEEKLY_POOL: QuestDef[] = [
  { id: 'w_ten', title: 'Full Week', hint: 'Log 10 activities this week', goal: 10, coins: 60, gifts: 2, count: l => l.length },
  { id: 'w_move', title: 'Bouncy Week', hint: 'Log Move 4 times this week', goal: 4, coins: 50, gifts: 1, count: ofCat('move') },
  { id: 'w_social', title: 'People Person', hint: 'Log People 2 times this week', goal: 2, coins: 45, gifts: 1, count: ofCat('social') },
  { id: 'w_cats', title: 'Well Rounded', hint: 'Log 5 different categories', goal: 5, coins: 70, gifts: 2, count: l => distinctCats(l) },
  { id: 'w_mem', title: 'Scrapbooker', hint: 'Save 3 memories this week', goal: 3, coins: 50, gifts: 1, count: (_l, m) => m.length },
];

export type AchDef = { id: string; title: string; joke: string; req: string; goal: number; icon: string; value: (s: AchStats) => number };
export type AchStats = { total: number; byCat: Record<string, number>; mems: number; streakBest: number; level: number; owned: number; gifts: number };

export const ACHIEVEMENTS: AchDef[] = [
  { id: 'a_first', title: 'First Wiggle', joke: 'Everyone starts somewhere. Usually the sofa.', req: 'Log your first activity', goal: 1, icon: 'xp', value: s => s.total },
  { id: 'a_ten', title: 'Getting Somewhere', joke: 'Noodle made a little chart. It goes up.', req: 'Log 10 activities', goal: 10, icon: 'xp', value: s => s.total },
  { id: 'a_fifty', title: 'Habit Goblin', joke: 'Fifty! Noodle needs a lie down.', req: 'Log 50 activities', goal: 50, icon: 'sun', value: s => s.total },
  { id: 'a_move', title: 'Bendy Legend', joke: 'Seven workouts. Zero visible muscles.', req: 'Log Move 7 times', goal: 7, icon: 'cat_move', value: s => s.byCat.move ?? 0 },
  { id: 'a_learn', title: 'Big Brain Bean', joke: 'Ten study sessions. The curl got curlier.', req: 'Log Learn 10 times', goal: 10, icon: 'cat_learn', value: s => s.byCat.learn ?? 0 },
  { id: 'a_social', title: 'Social Butterfly', joke: 'Noodle met people. On purpose!', req: 'Log People 5 times', goal: 5, icon: 'cat_social', value: s => s.byCat.social ?? 0 },
  { id: 'a_rest', title: 'Professional Napper', joke: 'Rest is productive. Noodle insists.', req: 'Log Rest 7 times', goal: 7, icon: 'cat_rest', value: s => s.byCat.rest ?? 0 },
  { id: 'a_home', title: 'Tidy Noodle', joke: 'The crumbs have been relocated.', req: 'Log Home 7 times', goal: 7, icon: 'cat_home', value: s => s.byCat.home ?? 0 },
  { id: 'a_mem1', title: 'Shoebox Starter', joke: 'The first memory goes on the wall.', req: 'Save 1 memory', goal: 1, icon: 'album', value: s => s.mems },
  { id: 'a_mem10', title: 'Life Archivist', joke: 'Ten memories! The album is getting chunky.', req: 'Save 10 memories', goal: 10, icon: 'album', value: s => s.mems },
  { id: 'a_streak3', title: 'Three in a Row', joke: 'Three days. Noodle bought a calendar.', req: 'Reach a 3 day streak', goal: 3, icon: 'sun', value: s => s.streakBest },
  { id: 'a_streak14', title: 'Sun Collector', joke: 'Two weeks of tiny suns.', req: 'Reach a 14 day streak', goal: 14, icon: 'sun', value: s => s.streakBest },
  { id: 'a_lvl5', title: 'Town Explorer', joke: 'The map is getting less foggy.', req: 'Reach level 5', goal: 5, icon: 'mapicon', value: s => s.level },
  { id: 'a_shop', title: 'Interior Noodle', joke: 'Ten things! The flat has a vibe now.', req: 'Own 15 items', goal: 15, icon: 'shopbag', value: s => s.owned },
  { id: 'a_gifts', title: 'Sack Opener', joke: 'Rip, rip, rip. Pure joy.', req: 'Open 10 gift sacks', goal: 10, icon: 'gift', value: s => s.gifts },
];
