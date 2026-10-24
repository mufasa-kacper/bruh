import { Image } from 'expo-image';
import React, { memo } from 'react';
import { View } from 'react-native';
import { CHARS, UI } from '../assets';
import { itemById } from '../data/shop';
import { PX_TO_U } from './layout';

// Non-Noodle friends only have a handful of poses; map everything onto those.
const FRIEND_POSE: Record<string, string> = {
  idle: 'idle', walk1: 'walk', walk2: 'idle', back: 'walk', happy: 'happy', jump: 'happy', wave: 'happy',
  read: 'read', laptop: 'read', sit: 'read', sofa_relax: 'read', sleep: 'sleep', meditate: 'read',
  stretch: 'happy', jumpjack: 'happy', squat: 'idle', kick: 'happy', cook: 'idle', water: 'idle', broom: 'walk', photo: 'idle', music: 'happy',
};
const HERO_SCALE: Record<string, number> = { noodle: 1, pebble: 0.78, blanket: 0.8 };

// Per-pose tweaks for where a hat sits (dx/dy in fractions of the hat size) or hide it.
const HAT_FIX: Record<string, { dx?: number; dy?: number; hide?: boolean; rot?: number }> = {
  sleep: { hide: true }, stretch: { hide: true }, music: { hide: true },
  squat: { dy: -0.28 }, meditate: { dy: -0.22 }, kick: { dy: -0.18 }, sofa_relax: { rot: -8 },
};

export type CharProps = {
  hero: string;
  pose: string;
  face: 1 | -1;
  rot?: number;
  scale?: number;
  unit: number; // px per scene unit
  tick: number; // drawing counter (7.5/s)
  squash?: boolean;
  hat?: string;
  glasses?: boolean;
  breathe?: boolean;
};

const jit = (tick: number, k: number) => {
  const x = Math.sin(tick * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x) - 0.5;
};

export const charSize = (hero: string, pose: string, unit: number, scale = 1) => {
  const set = CHARS[hero] ?? CHARS.noodle;
  const p = set[hero === 'noodle' ? pose : FRIEND_POSE[pose] ?? 'idle'] ?? set.idle;
  const k = PX_TO_U * unit * (HERO_SCALE[hero] ?? 1) * scale;
  return { p, w: p.w * k, h: p.h * k, k };
};

function CharacterImpl({ hero, pose, face, rot = 0, scale = 1, unit, tick, squash, hat, glasses, breathe }: CharProps) {
  const { p, w, h } = charSize(hero, pose, unit, scale);
  const frame = p.frames[tick % 3];
  // Line boil: tiny positional + rotational jitter on every drawing, stepped (never tweened).
  const jx = jit(tick, 1) * 1.6, jy = jit(tick, 2) * 1.2, jr = jit(tick, 3) * 1.4;
  const sy = squash ? 0.93 : breathe ? 1 + (tick % 8 < 4 ? 0.018 : -0.004) : 1;
  const hatItem = hat ? itemById(hat) : undefined;
  const fix = HAT_FIX[pose] ?? {};
  const hatArt = hatItem && hatItem.art.kind === 'ui' ? UI[hatItem.art.key] : null;
  const hatW = 14 * unit * (HERO_SCALE[hero] ?? 1) * scale * (hero === 'noodle' ? 1 : 1.3);
  const hatH = hatArt ? (hatW * hatArt.h) / hatArt.w : 0;
  const hx = p.head[0] * w - hatW / 2 + (fix.dx ?? 0) * hatW;
  const hy = p.head[1] * h - hatH * 0.78 - (fix.dy ?? 0) * hatH;
  const gl = UI.glasses;
  const glW = hatW * 0.7, glH = (glW * gl.h) / gl.w;
  return (
    <View
      pointerEvents="none"
      style={{
        width: w, height: h,
        transform: [{ translateX: jx }, { translateY: jy - (h * (1 - sy)) / 2 }, { scaleX: face }, { rotate: `${rot + jr}deg` }, { scaleY: sy }],
      }}
    >
      <Image source={frame} style={{ width: w, height: h }} contentFit="contain" cachePolicy="memory" />
      {glasses && hero === 'noodle' && !['back', 'sleep'].includes(pose) ? (
        <Image source={gl.src} style={{ position: 'absolute', width: glW, height: glH, left: p.head[0] * w - glW / 2, top: p.head[1] * h + h * 0.07 }} contentFit="contain" />
      ) : null}
      {hatArt && !fix.hide ? (
        <Image source={hatArt.src} style={{ position: 'absolute', width: hatW, height: hatH, left: hx, top: hy, transform: [{ rotate: `${fix.rot ?? 0}deg` }] }} contentFit="contain" />
      ) : null}
    </View>
  );
}

export const Character = memo(CharacterImpl);
