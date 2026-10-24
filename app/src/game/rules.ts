// Pure game rules: levels, rewards, streaks, quest rotation. No React here.
import { DAILY_POOL, WEEKLY_POOL, LogEntry, Memory } from '../data/quests';

export const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const weekKey = (t: number) => {
  const d = new Date(t);
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return dayKey(monday.getTime());
};

const dayDiff = (a: string, b: string) => {
  const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
  return Math.round((new Date(pb[0], pb[1] - 1, pb[2]).getTime() - new Date(pa[0], pa[1] - 1, pa[2]).getTime()) / 86400000);
};

// XP needed to go from level n to n+1.
export const needFor = (n: number) => 60 + 40 * (n - 1);

export const levelFromXp = (xp: number) => {
  let lvl = 1, rest = xp;
  while (rest >= needFor(lvl)) { rest -= needFor(lvl); lvl++; }
  return { level: lvl, into: rest, need: needFor(lvl) };
};

export type Streak = { count: number; best: number; lastDay: string; freezes: number };

// Called when an activity is logged. Missing days are forgiven with freezes
// (earned every 7 days); otherwise the streak quietly starts over.
export const bumpStreak = (s: Streak, now: number): { streak: Streak; usedFreeze: boolean; grew: boolean } => {
  const today = dayKey(now);
  if (s.lastDay === today) return { streak: s, usedFreeze: false, grew: false };
  const gap = s.lastDay ? dayDiff(s.lastDay, today) : 1;
  let count = 1, freezes = s.freezes, usedFreeze = false;
  if (gap === 1) count = s.count + 1;
  else if (gap === 2 && freezes > 0) { count = s.count + 1; freezes--; usedFreeze = true; }
  if (count > 0 && count % 7 === 0) freezes = Math.min(3, freezes + 1);
  return { streak: { count, best: Math.max(s.best, count), lastDay: today, freezes }, usedFreeze, grew: true };
};

// Streak is "alive" if last activity was today or yesterday (or the day before with a freeze).
export const liveStreak = (s: Streak, now: number) => {
  if (!s.lastDay) return 0;
  const gap = dayDiff(s.lastDay, dayKey(now));
  if (gap <= 1) return s.count;
  if (gap === 2 && s.freezes > 0) return s.count;
  return 0;
};

const seeded = (seed: string) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
};

const pick = <T,>(pool: T[], n: number, seed: string) => {
  const r = seeded(seed), a = [...pool];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
};

export const dailyQuests = (now: number) => pick(DAILY_POOL, 3, 'd' + dayKey(now));
export const weeklyQuests = (now: number) => pick(WEEKLY_POOL, 2, 'w' + weekKey(now));

export const logToday = (log: LogEntry[], now: number) => log.filter(l => dayKey(l.at) === dayKey(now));
export const logThisWeek = (log: LogEntry[], now: number) => log.filter(l => weekKey(l.at) === weekKey(now));
export const memsToday = (m: Memory[], now: number) => m.filter(x => dayKey(x.at) === dayKey(now));
export const memsThisWeek = (m: Memory[], now: number) => m.filter(x => weekKey(x.at) === weekKey(now));

export type Reward = { coins: number; xp: number; gift: boolean; levelUp: number | null; streak: number; streakGrew: boolean; usedFreeze: boolean };

export const activityReward = (opts: { durCoins: number; durXp: number; streak: number; firstToday: boolean; rand: number }) => {
  const coins = 10 + opts.durCoins + Math.min(10, opts.streak * 2);
  const xp = 20 + opts.durXp;
  // First log of the day always drops a gift; otherwise a 1-in-4 chance.
  const gift = opts.firstToday || opts.rand < 0.25;
  return { coins, xp, gift };
};

export const unlockedPlaces = (level: number, places: { id: string; level: number }[]) =>
  places.filter(p => level >= p.level).map(p => p.id);
