// The director drives the character at the drawing rate (7.5 fps): walking between spots,
// acting out activities at stations, going through the door to the garden, and idling.
import { useCallback, useEffect, useRef, useState } from 'react';
import { DRAW_FPS } from '../theme';
import type { Perf } from '../data/activities';
import { DOORS, GARDEN_WALK_Y, HOME_WALK_Y, IDLE_SPOTS, Station } from './layout';

export type PlaceId = 'home' | 'garden';

export type Bubble =
  | { kind: 'icon'; icon: string }
  | { kind: 'text'; text: string }
  | { kind: 'photo'; uri: string; text: string; memId: string };

export type Actor = {
  place: PlaceId;
  x: number;
  y: number;
  pose: string;
  face: 1 | -1;
  rot: number;
  scale: number;
  z: number;
  squash: boolean;
  bubble: Bubble | null;
  fading: boolean;  // paper wipe while changing place
  busy: boolean;    // running a user-triggered script
  ball: { x: number; y: number; r: number } | null;
};

type Step =
  | { t: 'walk'; x: number; y: number }
  | { t: 'perf'; perf: Perf; st: Station; ballKick?: boolean; sweep?: boolean }
  | { t: 'pose'; pose: string; n: number; face?: 1 | -1 }
  | { t: 'door' }
  | { t: 'warp'; place: PlaceId }
  | { t: 'bubble'; b: Bubble | null }
  | { t: 'call'; fn: () => void }
  | { t: 'wait'; n: number };

const SPEED = 2.6; // units per drawing

const isNight = () => { const h = new Date().getHours(); return h >= 23 || h < 6; };

export function useDirector(initial: PlaceId, opts: { onPlace: (p: PlaceId) => void; hasBench: boolean }) {
  const [tick, setTick] = useState(0);
  const a = useRef<Actor>({
    place: initial, x: 100, y: initial === 'home' ? HOME_WALK_Y : GARDEN_WALK_Y, pose: 'idle', face: 1, rot: 0, scale: 1, z: 20,
    squash: false, bubble: null, fading: false, busy: false, ball: null,
  });
  const q = useRef<Step[]>([]);
  const cur = useRef<{ step: Step; n: number; i: number } | null>(null);
  const idleT = useRef(0);
  const lastPose = useRef('idle');
  const onPlace = useRef(opts.onPlace);
  onPlace.current = opts.onPlace;

  const setPose = (pose: string) => {
    const A = a.current;
    A.squash = pose !== lastPose.current;
    lastPose.current = pose;
    A.pose = pose;
  };

  const resetBody = () => { const A = a.current; A.rot = 0; A.scale = 1; A.z = 20; };

  const walkY = (p: PlaceId) => (p === 'home' ? HOME_WALK_Y : GARDEN_WALK_Y);

  // Build the steps needed to get from where we are to (place, x, y).
  const route = useCallback((place: PlaceId, x: number, y: number): Step[] => {
    const A = a.current;
    const steps: Step[] = [];
    let from = A.place;
    if (A.rot !== 0 || A.y < walkY(from) - 6) steps.push({ t: 'pose', pose: 'jump', n: 2 }); // hop off furniture
    if (place !== from) {
      const d = DOORS[from];
      steps.push({ t: 'walk', x: d.x - (from === 'home' ? 6 : -6), y: walkY(from) }, { t: 'walk', x: d.x, y: d.y }, { t: 'door' }, { t: 'warp', place });
      from = place;
    }
    steps.push({ t: 'walk', x, y: Math.max(y, walkY(place) - 4) });
    if (Math.abs(y - walkY(place)) > 3) steps.push({ t: 'walk', x, y });
    return steps;
  }, []);

  const perform = useCallback((st: Station, perf: Perf, extra?: { ballKick?: boolean; sweep?: boolean; bubbleIcon?: string; onDone?: () => void }) => {
    const A = a.current;
    A.busy = true;
    A.bubble = null;
    q.current = [];
    cur.current = null;
    resetBody();
    const steps: Step[] = [...route(st.place, st.x, st.y)];
    if (extra?.bubbleIcon) steps.push({ t: 'bubble', b: { kind: 'icon', icon: extra.bubbleIcon } });
    steps.push({ t: 'perf', perf, st, ballKick: extra?.ballKick, sweep: extra?.sweep });
    steps.push({ t: 'bubble', b: null });
    steps.push({ t: 'pose', pose: 'jump', n: 3, face: 1 }, { t: 'pose', pose: 'happy', n: 6, face: 1 });
    steps.push({ t: 'call', fn: () => { a.current.busy = false; extra?.onDone?.(); } });
    q.current = steps;
  }, [route]);

  const goPlace = useCallback((place: PlaceId) => {
    const A = a.current;
    if (A.place === place) return;
    A.busy = true; A.bubble = null; q.current = []; cur.current = null; resetBody();
    const spot = IDLE_SPOTS[place][1];
    q.current = [...route(place, spot.x, spot.y), { t: 'pose', pose: 'wave', n: 6, face: 1 }, { t: 'call', fn: () => { a.current.busy = false; } }];
  }, [route]);

  // Instant relocation (e.g. picking a place on the map): fade, appear at the door, walk in.
  const teleport = useCallback((place: PlaceId) => {
    const A = a.current;
    q.current = []; cur.current = null; resetBody(); A.bubble = null;
    A.place = place;
    const d = DOORS[place];
    A.x = d.x; A.y = d.y;
    onPlace.current(place);
    const spot = IDLE_SPOTS[place][1];
    q.current = [{ t: 'walk', x: spot.x, y: spot.y }, { t: 'pose', pose: 'wave', n: 5, face: 1 }];
  }, []);

  const say = useCallback((b: Bubble | null) => { a.current.bubble = b; }, []);
  const react = useCallback((pose: string, n = 6) => {
    if (a.current.busy) return;
    q.current = [{ t: 'pose', pose, n }];
    cur.current = null;
  }, []);

  // Choose something to do when idle: wander, sit on the sofa, read, stretch, sleep at night.
  const idleChoice = useCallback(() => {
    const A = a.current;
    const r = Math.random();
    const place = A.place;
    if (place === 'home' && isNight()) {
      q.current = [...route('home', 29, 80), { t: 'perf', perf: { poses: [['sleep', 8]], ms: 60000 }, st: { place: 'home', x: 29, y: 80, face: 1, rot: -62, z: 11 } }];
      return;
    }
    const spots = IDLE_SPOTS[place];
    const s = spots[Math.floor(Math.random() * spots.length)];
    if (place === 'home' && r < 0.25) {
      q.current = [...route('home', 156, 84), { t: 'perf', perf: { poses: [['sofa_relax', 8]], ms: 9000 }, st: { place: 'home', x: 156, y: 84, face: 1, z: 9 } }];
    } else if (place === 'home' && r < 0.38) {
      q.current = [...route('home', 71, 87), { t: 'perf', perf: { poses: [['read', 8]], ms: 8000 }, st: { place: 'home', x: 71, y: 87, face: 1, z: 10 } }];
    } else if (r < 0.5) {
      q.current = [{ t: 'pose', pose: 'stretch', n: 10 }, { t: 'pose', pose: 'idle', n: 4 }];
    } else if (place === 'garden' && r < 0.62 && opts.hasBench) {
      q.current = [...route('garden', 97, 78), { t: 'perf', perf: { poses: [['sofa_relax', 8]], ms: 8000 }, st: { place: 'garden', x: 97, y: 78, face: 1, z: 6 } }];
    } else {
      q.current = [{ t: 'walk', x: s.x, y: s.y }, { t: 'pose', pose: 'idle', n: 6 }];
    }
  }, [route, opts.hasBench]);

  useEffect(() => {
    const id = setInterval(() => {
      const A = a.current;
      A.squash = false;
      if (!cur.current) {
        const next = q.current.shift();
        if (next) cur.current = { step: next, n: 0, i: 0 };
      }
      const c = cur.current;
      if (!c) {
        // idle: breathe, sometimes blink to another pose, sometimes wander
        if (A.pose !== 'idle' && A.rot === 0) setPose('idle');
        idleT.current++;
        if (!A.busy && idleT.current > 40 + Math.random() * 50) { idleT.current = 0; idleChoice(); }
      } else {
        idleT.current = 0;
        const s = c.step;
        if (s.t === 'walk') {
          const dx = s.x - A.x, dy = s.y - A.y, dist = Math.hypot(dx, dy);
          if (A.rot !== 0) resetBody();
          if (dist <= SPEED) { A.x = s.x; A.y = s.y; cur.current = null; setPose('idle'); }
          else {
            A.x += (dx / dist) * SPEED; A.y += (dy / dist) * SPEED;
            if (Math.abs(dx) > 0.5) A.face = dx > 0 ? 1 : -1;
            setPose(dy < -1.5 && Math.abs(dy) > Math.abs(dx) ? 'back' : c.n % 4 < 2 ? 'walk1' : 'walk2');
            c.n++;
          }
        } else if (s.t === 'pose') {
          if (c.n === 0) { setPose(s.pose); if (s.face) A.face = s.face; }
          c.n++;
          if (c.n >= s.n) cur.current = null;
        } else if (s.t === 'perf') {
          const { perf, st } = s;
          if (c.n === 0) { A.x = st.x; A.y = st.y; A.face = st.face; A.rot = st.rot ?? 0; A.z = st.z ?? 20; A.scale = st.scale ?? 1; }
          // walk the pose cycle
          let acc = 0, idx = 0;
          const total = perf.poses.reduce((m, p) => m + p[1], 0);
          const k = c.n % total;
          for (let i = 0; i < perf.poses.length; i++) { acc += perf.poses[i][1]; if (k < acc) { idx = i; break; } }
          setPose(perf.poses[idx][0]);
          if (s.ballKick) {
            const phase = c.n % total;
            const flying = perf.poses[idx][0] === 'kick';
            const bx = st.x + 11 + (flying ? (phase - 3) * 4 : 0);
            A.ball = { x: bx, y: st.y - (flying ? Math.sin(((phase - 3) / 4) * Math.PI) * 10 : 0), r: phase * 40 };
          }
          if (s.sweep) A.x = st.x + Math.sin(c.n / 3) * 3;
          c.n++;
          if (c.n * (1000 / DRAW_FPS) >= perf.ms) { cur.current = null; resetBody(); if (A.ball) A.ball = null; }
        } else if (s.t === 'door') {
          if (c.n === 0) { setPose('back'); }
          if (c.n === 3) A.fading = true;
          c.n++;
          if (c.n >= 5) cur.current = null;
        } else if (s.t === 'warp') {
          A.place = s.place;
          const d = DOORS[s.place];
          A.x = d.x; A.y = d.y; A.face = s.place === 'garden' ? 1 : -1;
          onPlace.current(s.place);
          c.n++;
          if (c.n >= 2) { A.fading = false; cur.current = null; }
        } else if (s.t === 'bubble') { A.bubble = s.b; cur.current = null; }
        else if (s.t === 'call') { cur.current = null; s.fn(); }
        else if (s.t === 'wait') { c.n++; if (c.n >= s.n) cur.current = null; }
      }
      setTick(t => t + 1);
    }, 1000 / DRAW_FPS);
    return () => clearInterval(id);
  }, [idleChoice]);

  return { actor: a.current, tick, perform, goPlace, teleport, say, react };
}
