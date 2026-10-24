import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { findActivity, DURATIONS } from '../data/activities';
import { ACHIEVEMENTS, AchStats, LogEntry, Memory } from '../data/quests';
import { ITEMS, itemById, Slot, START_EQUIPPED, START_OWNED } from '../data/shop';
import {
  activityReward, bumpStreak, dailyQuests, dayKey, levelFromXp, liveStreak, logThisWeek, logToday,
  memsThisWeek, memsToday, Reward, Streak, weekKey, weeklyQuests,
} from '../game/rules';

export type Place = 'home' | 'garden';

export type GameState = {
  v: 1;
  onboarded: boolean;
  name: string;
  coins: number;
  xp: number;
  log: LogEntry[];
  memories: Memory[];
  owned: string[];
  equipped: Partial<Record<Slot, string>>;
  frameMem: Partial<Record<'frame1' | 'frame2' | 'frame3', string>>;
  streak: Streak;
  claimed: string[]; // quest claims, keyed by `${questId}@${period}`
  achClaimed: string[];
  gifts: number;
  giftsOpened: number;
  bubbleDay: string;
  focus: string[];
};

const KEY = 'littlelife.v1';

const fresh = (): GameState => ({
  v: 1, onboarded: false, name: '', coins: 50, xp: 0, log: [], memories: [],
  owned: [...START_OWNED], equipped: { ...START_EQUIPPED }, frameMem: {},
  streak: { count: 0, best: 0, lastDay: '', freezes: 0 },
  claimed: [], achClaimed: [], gifts: 1, giftsOpened: 0, bubbleDay: '', focus: [],
});

export type GiftResult = { kind: 'item'; id: string } | { kind: 'coins'; amount: number };

type Ctx = {
  s: GameState;
  ready: boolean;
  level: ReturnType<typeof levelFromXp>;
  streakNow: number;
  set: (fn: (s: GameState) => GameState) => void;
  logActivity: (actId: string, minutes: number, note?: string) => Reward;
  buy: (id: string) => boolean;
  equip: (slot: Slot, id: string | null) => void;
  addMemory: (m: Omit<Memory, 'id' | 'at'>) => Memory;
  deleteMemory: (id: string) => void;
  hang: (memId: string | null, frame: 'frame1' | 'frame2' | 'frame3') => void;
  claimQuest: (key: string, coins: number, gifts: number) => void;
  claimAch: (id: string, coins: number) => void;
  openGift: () => GiftResult | null;
  quests: ReturnType<typeof questView>;
  achStats: AchStats;
  reset: () => void;
};

const C = createContext<Ctx | null>(null);

const questView = (s: GameState, now: number) => {
  const dKey = dayKey(now);
  const dl = logToday(s.log, now), wl = logThisWeek(s.log, now);
  const dm = memsToday(s.memories, now), wm = memsThisWeek(s.memories, now);
  const daily = dailyQuests(now).map(q => {
    const key = `${q.id}@${dKey}`;
    return { q, key, value: Math.min(q.goal, q.count(dl, dm)), claimed: s.claimed.includes(key) };
  });
  const wKey = 'w' + weekKey(now);
  const weekly = weeklyQuests(now).map(q => {
    const key = `${q.id}@${wKey}`;
    return { q, key, value: Math.min(q.goal, q.count(wl, wm)), claimed: s.claimed.includes(key) };
  });
  return { daily, weekly };
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<GameState>(fresh);
  const [ready, setReady] = useState(false);
  const saveT = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => { if (raw) setS({ ...fresh(), ...JSON.parse(raw) }); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (saveT.current) clearTimeout(saveT.current);
    saveT.current = setTimeout(() => { AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {}); }, 300);
  }, [s, ready]);

  const set = useCallback((fn: (s: GameState) => GameState) => setS(fn), []);

  // Reward computation is done against the latest committed state via a ref so callers get it synchronously.
  const ref = useRef(s);
  ref.current = s;

  const logActivity = useCallback((actId: string, minutes: number, note?: string): Reward => {
    const cur = ref.current;
    const now = Date.now();
    const found = findActivity(actId)!;
    const dur = DURATIONS.find(d => d.min === minutes) ?? DURATIONS[0];
    const { streak, usedFreeze, grew } = bumpStreak(cur.streak, now);
    const firstToday = logToday(cur.log, now).length === 0;
    const r = activityReward({ durCoins: dur.coins, durXp: dur.xp, streak: streak.count, firstToday, rand: Math.random() });
    const before = levelFromXp(cur.xp).level;
    const after = levelFromXp(cur.xp + r.xp).level;
    const entry: LogEntry = { id: String(now), at: now, act: actId, cat: found.cat.id, min: minutes, note };
    const next: GameState = {
      ...cur,
      coins: cur.coins + r.coins,
      xp: cur.xp + r.xp,
      log: [entry, ...cur.log].slice(0, 2000),
      streak,
      gifts: cur.gifts + (r.gift ? 1 : 0) + (after > before ? 1 : 0),
    };
    ref.current = next;
    setS(next);
    return { ...r, levelUp: after > before ? after : null, streak: streak.count, streakGrew: grew, usedFreeze };
  }, []);

  const buy = useCallback((id: string) => {
    const it = itemById(id);
    const cur = ref.current;
    if (!it || cur.owned.includes(id) || cur.coins < it.price) return false;
    const next = { ...cur, coins: cur.coins - it.price, owned: [...cur.owned, id], equipped: { ...cur.equipped, [it.slot]: id } };
    ref.current = next;
    setS(next);
    return true;
  }, []);

  const equip = useCallback((slot: Slot, id: string | null) => {
    setS(cur => {
      const eq = { ...cur.equipped };
      if (id) eq[slot] = id; else delete eq[slot];
      return { ...cur, equipped: eq };
    });
  }, []);

  const addMemory = useCallback((m: Omit<Memory, 'id' | 'at'>) => {
    const mem: Memory = { ...m, id: String(Date.now()), at: Date.now() };
    setS(cur => ({ ...cur, memories: [mem, ...cur.memories], xp: cur.xp + 10, coins: cur.coins + 5 }));
    return mem;
  }, []);

  const deleteMemory = useCallback((id: string) => {
    setS(cur => {
      const fm = { ...cur.frameMem };
      (Object.keys(fm) as (keyof typeof fm)[]).forEach(k => { if (fm[k] === id) delete fm[k]; });
      return { ...cur, memories: cur.memories.filter(x => x.id !== id), frameMem: fm };
    });
  }, []);

  const hang = useCallback((memId: string | null, frame: 'frame1' | 'frame2' | 'frame3') => {
    setS(cur => {
      const fm = { ...cur.frameMem };
      (Object.keys(fm) as (keyof typeof fm)[]).forEach(k => { if (memId && fm[k] === memId) delete fm[k]; });
      if (memId) fm[frame] = memId; else delete fm[frame];
      return { ...cur, frameMem: fm };
    });
  }, []);

  const claimQuest = useCallback((key: string, coins: number, gifts: number) => {
    setS(cur => cur.claimed.includes(key) ? cur : { ...cur, claimed: [...cur.claimed, key].slice(-200), coins: cur.coins + coins, gifts: cur.gifts + gifts });
  }, []);

  const claimAch = useCallback((id: string, coins: number) => {
    setS(cur => cur.achClaimed.includes(id) ? cur : { ...cur, achClaimed: [...cur.achClaimed, id], coins: cur.coins + coins, gifts: cur.gifts + 1 });
  }, []);

  const openGift = useCallback((): GiftResult | null => {
    const cur = ref.current;
    if (cur.gifts <= 0) return null;
    const lvl = levelFromXp(cur.xp).level;
    const pool = ITEMS.filter(i => !cur.owned.includes(i.id) && i.price > 0 && i.slot !== 'hero' && i.level <= lvl + 1);
    const roll = Math.random();
    let res: GiftResult;
    if (pool.length && roll < 0.45) {
      const weighted = pool.flatMap(i => Array(i.rarity === 'epic' ? 1 : i.rarity === 'rare' ? 2 : 4).fill(i));
      const it = weighted[Math.floor(Math.random() * weighted.length)];
      res = { kind: 'item', id: it.id };
    } else {
      res = { kind: 'coins', amount: [15, 20, 25, 30, 40, 60][Math.floor(Math.random() * 6)] };
    }
    const next: GameState = {
      ...cur,
      gifts: cur.gifts - 1,
      giftsOpened: cur.giftsOpened + 1,
      owned: res.kind === 'item' ? [...cur.owned, res.id] : cur.owned,
      coins: res.kind === 'coins' ? cur.coins + res.amount : cur.coins,
    };
    ref.current = next;
    setS(next);
    return res;
  }, []);

  const reset = useCallback(() => { const f = fresh(); ref.current = f; setS(f); }, []);

  const now = Date.now();
  const level = useMemo(() => levelFromXp(s.xp), [s.xp]);
  const quests = useMemo(() => questView(s, now), [s.log, s.memories, s.claimed]); // eslint-disable-line react-hooks/exhaustive-deps
  const achStats = useMemo<AchStats>(() => {
    const byCat: Record<string, number> = {};
    s.log.forEach(l => { byCat[l.cat] = (byCat[l.cat] ?? 0) + 1; });
    return { total: s.log.length, byCat, mems: s.memories.length, streakBest: s.streak.best, level: level.level, owned: s.owned.length, gifts: s.giftsOpened };
  }, [s.log, s.memories.length, s.streak.best, level.level, s.owned.length, s.giftsOpened]);

  const value: Ctx = {
    s, ready, level, streakNow: liveStreak(s.streak, now), set, logActivity, buy, equip, addMemory, deleteMemory, hang,
    claimQuest, claimAch, openGift, quests, achStats, reset,
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}

export const useGame = () => {
  const v = useContext(C);
  if (!v) throw new Error('useGame outside provider');
  return v;
};

export const achievementsView = (stats: AchStats, claimed: string[]) =>
  ACHIEVEMENTS.map(a => ({ a, value: Math.min(a.goal, a.value(stats)), done: a.value(stats) >= a.goal, claimed: claimed.includes(a.id) }));
