// The director drives the character at the drawing rate (7.5 fps): walking between spots,
// acting out activities at stations, travelling between places, and idling.
import { useCallback, useEffect, useRef, useState } from 'react';
import { DRAW_FPS } from '../theme';
import type { Perf } from '../data/activities';
import { PlaceId, PLACES_LAYOUT, Station } from './layout';

export type { PlaceId };

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
  | { t: 'walk'; x: number; y: number; fast?: boolean; run?: boolean }
  | { t: 'perf'; perf: Perf; st: Station; ballKick?: boolean; sweep?: boolean }
  | { t: 'pose'; pose: string; n: number; face?: 1 | -1 }
  | { t: 'exit' }
  | { t: 'warp'; place: PlaceId }
  | { t: 'bubble'; b: Bubble | null }
  | { t: 'call'; fn: () => void };

const SPEED = 3.4; // units per drawing
const FAST = 5.5; // hurrying to the door

const isNight = () => { const h = new Date().getHours(); return h >= 23 || h < 6; };
const L = (p: PlaceId) => PLACES_LAYOUT[p];

export function useDirector(initial: PlaceId, opts: { onPlace: (p: PlaceId) => void; hasBench: boolean }) {
  const [tick, setTick] = useState(0);
  const a = useRef<Actor>({
    place: initial, x: 100, y: L(initial).walkY, pose: 'idle', face: 1, rot: 0, scale: 1, z: 20,
    squash: false, bubble: null, fading: false, busy: false, ball: null,
  });
  const q = useRef<Step[]>([]);
  const cur = useRef<{ step: Step; n: number } | null>(null);
  const idleT = useRef(0);
  const lastPose = useRef('idle');
  const onPlace = useRef(opts.onPlace);
  onPlace.current = opts.onPlace;
  const hasBench = useRef(opts.hasBench);
  hasBench.current = opts.hasBench;

  const setPose = (pose: string) => {
    const A = a.current;
    A.squash = pose !== lastPose.current;
    lastPose.current = pose;
    A.pose = pose;
  };
  const resetBody = () => { const A = a.current; A.rot = 0; A.scale = 1; A.z = 20; };

  // Steps to get from where we are to (place, x, y): walk to this place's exit, warp, walk in.
  const route = useCallback((place: PlaceId, x: number, y: number): Step[] => {
    const A = a.current;
    const steps: Step[] = [];
    const from = A.place;
    if (A.rot !== 0 || A.y < L(from).walkY - 6) steps.push({ t: 'pose', pose: 'jump', n: 2 }); // hop off furniture
    if (place !== from) {
      const ex = L(from).exit;
      if (ex.door) steps.push({ t: 'walk', x: ex.x + (ex.x > 100 ? -6 : 6), y: L(from).walkY, fast: true }, { t: 'walk', x: ex.x, y: ex.y }, { t: 'exit' });
      else steps.push({ t: 'walk', x: ex.x, y: ex.y, fast: true }, { t: 'exit' });
      steps.push({ t: 'warp', place });
    }
    const wy = L(place).walkY;
    steps.push({ t: 'walk', x, y: Math.max(y, wy - 4) });
    if (Math.abs(y - wy) > 3) steps.push({ t: 'walk', x, y });
    return steps;
  }, []);

  const perform = useCallback((st: Station, perf: Perf, extra?: { ballKick?: boolean; sweep?: boolean; bubbleIcon?: string; onDone?: () => void }) => {
    const A = a.current;
    A.busy = true; A.bubble = null; q.current = []; cur.current = null; resetBody();
    const steps: Step[] = [...route(st.place, st.x, st.y)];
    if (extra?.bubbleIcon) steps.push({ t: 'bubble', b: { kind: 'icon', icon: extra.bubbleIcon } });
    if (st.jog) {
      // a few laps back and forth, then the performance itself
      for (let i = 0; i < 2; i++) steps.push({ t: 'walk', x: st.x + st.jog, y: st.y, fast: true, run: true }, { t: 'walk', x: st.x - st.jog, y: st.y, fast: true, run: true });
      steps.push({ t: 'walk', x: st.x, y: st.y, run: true });
    } else {
      steps.push({ t: 'perf', perf, st, ballKick: extra?.ballKick, sweep: extra?.sweep });
    }
    steps.push({ t: 'bubble', b: null });
    steps.push({ t: 'pose', pose: 'jump', n: 3, face: 1 }, { t: 'pose', pose: 'happy', n: 6, face: 1 });
    steps.push({ t: 'call', fn: () => { a.current.busy = false; extra?.onDone?.(); } });
    q.current = steps;
  }, [route]);

  // Instant relocation (map): fade, appear at the place's entrance, walk in.
  const teleport = useCallback((place: PlaceId) => {
    const A = a.current;
    if (A.place === place && !A.busy) return;
    q.current = []; cur.current = null; resetBody(); A.bubble = null; A.busy = false;
    A.place = place;
    const ex = L(place).exit;
    A.x = ex.x; A.y = ex.y; A.face = 1;
    onPlace.current(place);
    const spot = L(place).idle[Math.min(1, L(place).idle.length - 1)];
    q.current = [{ t: 'walk', x: spot.x, y: spot.y }, { t: 'pose', pose: 'wave', n: 5, face: 1 }];
  }, []);

  const say = useCallback((b: Bubble | null) => { a.current.bubble = b; }, []);
  const react = useCallback((pose: string, n = 6) => {
    if (a.current.busy) return;
    q.current = [{ t: 'pose', pose, n }];
    cur.current = null;
  }, []);

  const stay = (st: Station, pose: string, ms: number): Step[] => [...route(st.place, st.x, st.y), { t: 'perf', perf: { poses: [[pose, 8]], ms }, st }];

  // Something to do when idle: wander, sit on the sofa, read, stretch, sleep at night.
  const idleChoice = useCallback(() => {
    const A = a.current;
    const r = Math.random();
    const place = A.place;
    if (place === 'home' && isNight()) { q.current = stay({ place: 'home', x: 29, y: 80, face: 1, rot: -62, z: 11 }, 'sleep', 60000); return; }
    const spots = L(place).idle;
    const s = spots[Math.floor(Math.random() * spots.length)];
    if (place === 'home' && r < 0.25) q.current = stay({ place: 'home', x: 156, y: 84, face: 1, z: 9 }, 'sofa_relax', 9000);
    else if (place === 'home' && r < 0.38) q.current = stay({ place: 'home', x: 71, y: 86, face: 1, z: 10 }, 'read', 8000);
    else if (r < 0.5) q.current = [{ t: 'pose', pose: 'stretch', n: 10 }, { t: 'pose', pose: 'idle', n: 4 }];
    else if (place === 'garden' && r < 0.62 && hasBench.current) q.current = stay({ place: 'garden', x: 97, y: 78, face: 1, z: 6 }, 'sofa_relax', 8000);
    else if (place === 'cafe' && r < 0.75) q.current = stay({ place: 'cafe', x: 94, y: 93, face: 1, z: 9 }, 'sofa_relax', 9000);
    else if (place === 'park' && r < 0.7) q.current = stay({ place: 'park', x: 62, y: 80, face: 1, z: 6 }, 'sofa_relax', 9000);
    else if (place === 'lake' && r < 0.7) q.current = stay({ place: 'lake', x: 84, y: 93, face: 1, z: 20 }, 'meditate', 9000);
    else q.current = [{ t: 'walk', x: s.x, y: s.y }, { t: 'pose', pose: 'idle', n: 6 }];
  }, [route]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = setInterval(() => {
      const A = a.current;
      A.squash = false;
      if (!cur.current) {
        const next = q.current.shift();
        if (next) cur.current = { step: next, n: 0 };
      }
      const c = cur.current;
      if (!c) {
        if (A.pose !== 'idle' && A.rot === 0) setPose('idle');
        idleT.current++;
        if (!A.busy && idleT.current > 40 + Math.random() * 50) { idleT.current = 0; idleChoice(); }
      } else {
        idleT.current = 0;
        const s = c.step;
        if (s.t === 'walk') {
          const dx = s.x - A.x, dy = s.y - A.y, dist = Math.hypot(dx, dy);
          const sp = s.fast ? FAST : SPEED;
          if (A.rot !== 0) resetBody();
          if (dist <= sp) { A.x = s.x; A.y = s.y; cur.current = null; setPose('idle'); }
          else {
            A.x += (dx / dist) * sp; A.y += (dy / dist) * sp;
            if (Math.abs(dx) > 0.5) A.face = dx > 0 ? 1 : -1;
            setPose(dy < -1.5 && Math.abs(dy) > Math.abs(dx) ? 'back' : s.run ? (c.n % 4 < 2 ? 'run' : 'walk1') : c.n % 4 < 2 ? 'walk1' : 'walk2');
            c.n++;
          }
        } else if (s.t === 'pose') {
          if (c.n === 0) { setPose(s.pose); if (s.face) A.face = s.face; }
          c.n++;
          if (c.n >= s.n) cur.current = null;
        } else if (s.t === 'perf') {
          const { perf, st } = s;
          if (c.n === 0) { A.x = st.x; A.y = st.y; A.face = st.face; A.rot = st.rot ?? 0; A.z = st.z ?? 20; A.scale = st.scale ?? 1; }
          let acc = 0, idx = 0;
          const total = perf.poses.reduce((m, p) => m + p[1], 0);
          const k = c.n % total;
          for (let i = 0; i < perf.poses.length; i++) { acc += perf.poses[i][1]; if (k < acc) { idx = i; break; } }
          setPose(perf.poses[idx][0]);
          if (s.ballKick) {
            const flying = perf.poses[idx][0] === 'kick';
            const ph = k - 3;
            A.ball = { x: st.x + 11 + (flying ? ph * 4 : 0), y: st.y - (flying ? Math.sin((ph / 4) * Math.PI) * 10 : 0), r: c.n * 40 };
          }
          if (s.sweep) A.x = st.x + Math.sin(c.n / 3) * 3;
          c.n++;
          if (c.n * (1000 / DRAW_FPS) >= perf.ms) { cur.current = null; resetBody(); A.ball = null; }
        } else if (s.t === 'exit') {
          if (c.n === 0 && L(A.place).exit.door) setPose('back');
          if (c.n === 2) A.fading = true;
          c.n++;
          if (c.n >= 4) cur.current = null;
        } else if (s.t === 'warp') {
          if (c.n === 0) {
            A.place = s.place;
            const ex = L(s.place).exit;
            A.x = ex.x; A.y = ex.y; A.face = ex.x > 100 ? -1 : 1;
            onPlace.current(s.place);
          }
          c.n++;
          if (c.n >= 3) { A.fading = false; cur.current = null; }
        } else if (s.t === 'bubble') { A.bubble = s.b; cur.current = null; }
        else if (s.t === 'call') { cur.current = null; s.fn(); }
      }
      setTick(t => t + 1);
    }, 1000 / DRAW_FPS);
    return () => clearInterval(id);
  }, [idleChoice]);

  return { actor: a.current, tick, perform, teleport, say, react };
}
