import { Image } from 'expo-image';
import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, ScrollViewInstance, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { FURN, SCENES, TEX, UI } from '../assets';
import { itemById, Slot } from '../data/shop';
import type { Memory } from '../data/quests';
import { C } from '../theme';
import { Icon, T } from '../ui/kit';
import { Character, charSize } from './Character';
import type { Actor } from './director';
import { GARDEN, GARDEN_W, HOME, HOME_FLOOR, HOME_W, Placed } from './layout';

type Props = {
  actor: Actor;
  tick: number;
  height: number;     // px height of the scene box
  width: number;      // viewport width
  equipped: Partial<Record<Slot, string>>;
  frameMem: Partial<Record<string, string>>;
  memories: Memory[];
  follow: boolean;
  onUserScroll: () => void;
  onTapActor: () => void;
  onTapFrame: (slot: 'frame1' | 'frame2' | 'frame3') => void;
  onTapBubble: () => void;
};

const frameInner: Record<string, [number, number, number, number]> = {
  // inner photo window of each frame, as fractions of the frame art (l, t, r, b)
  frame_wood: [0.13, 0.205, 0.87, 0.915],
  frame_sage: [0.137, 0.145, 0.858, 0.855],
  frame_oval: [0.16, 0.2, 0.84, 0.876],
};

function artFor(p: Placed, equipped: Props['equipped']) {
  if (p.fixed) return { key: p.fixed as string, a: FURN[p.fixed] };
  const id = p.slot ? equipped[p.slot] : undefined;
  if (!id) return null;
  const it = itemById(id);
  if (!it || it.art.kind !== 'furn') return null;
  return { key: it.id, a: FURN[it.art.key] };
}

export function World({ actor, tick, height, width, equipped, frameMem, memories, follow, onUserScroll, onTapActor, onTapFrame, onTapBubble }: Props) {
  const u = height / 100;
  const place = actor.place;
  const W = (place === 'home' ? HOME_W : GARDEN_W) * u;
  const sv = useRef<ScrollViewInstance>(null);
  const userDragging = useRef(false);

  // Camera follows the character while a script runs.
  useEffect(() => {
    if (!follow || userDragging.current) return;
    const target = Math.max(0, Math.min(W - width, actor.x * u - width / 2));
    sv.current?.scrollTo({ x: target, animated: true });
  }, [Math.round(actor.x / 6), follow, place, width]); // eslint-disable-line react-hooks/exhaustive-deps

  const layout = place === 'home' ? HOME : GARDEN;
  const wall = equipped.wall ? itemById(equipped.wall) : undefined;
  const floor = equipped.floor ? itemById(equipped.floor) : undefined;
  const wallTex = TEX[(wall?.art.key ?? 'wall_sprig') as keyof typeof TEX];
  const floorTex = TEX[(floor?.art.key ?? 'floor_wood') as keyof typeof TEX];

  const items = useMemo(() => layout.map(p => {
    const art = artFor(p, equipped);
    if (!art) return null;
    const w = p.w ? p.w * u : (p.h! * u * art.a.w) / art.a.h;
    const h = p.h ? p.h * u : (p.w! * u * art.a.h) / art.a.w;
    const left = p.cx * u - w / 2;
    const top = p.ty !== undefined ? p.ty * u : p.by! * u - h;
    return { p, art, w, h, left, top };
  }).filter(Boolean) as { p: Placed; art: { key: string; a: { src: number; w: number; h: number } }; w: number; h: number; left: number; top: number }[], [layout, equipped, u]);

  const cs = charSize(equipped.hero ?? 'noodle', actor.pose, u, actor.scale);
  const charLeft = actor.x * u - cs.w / 2;
  const charTop = actor.y * u - cs.h;
  const memById = (id?: string) => memories.find(m => m.id === id);

  const nodes: { z: number; el: React.ReactNode }[] = [];
  items.forEach(({ p, art, w, h, left, top }) => {
    if (p.shadow) {
      const sw = p.shadow * u, sh = sw * 0.22;
      nodes.push({ z: p.z - 0.5, el: <Image key={p.key + 's'} source={UI.shadow.src} style={{ position: 'absolute', left: p.cx * u - sw / 2, top: top + h - sh * 0.6, width: sw, height: sh }} /> });
    }
    const isFrame = p.slot === 'frame1' || p.slot === 'frame2' || p.slot === 'frame3';
    const mem = isFrame ? memById(frameMem[p.slot as string]) : undefined;
    const inner = frameInner[art.key];
    const el = (
      <View key={p.key} style={{ position: 'absolute', left, top, width: w, height: h, transform: [{ rotate: `${p.rot ?? (isFrame ? (p.key === 'frame2' ? 2 : -2) : 0)}deg` }] }}>
        <Image source={art.a.src} style={{ width: w, height: h }} contentFit="contain" />
        {isFrame && inner ? (
          <View style={{ position: 'absolute', left: inner[0] * w, top: inner[1] * h, width: (inner[2] - inner[0]) * w, height: (inner[3] - inner[1]) * h, backgroundColor: '#EFE7D8', overflow: 'hidden', borderRadius: art.key === 'frame_oval' ? 999 : 2 }}>
            {mem?.photo ? <Image source={{ uri: mem.photo }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : null}
          </View>
        ) : null}
        {isFrame ? <Pressable style={StyleSheet.absoluteFill} onPress={() => onTapFrame(p.slot as 'frame1')} /> : null}
      </View>
    );
    nodes.push({ z: p.z, el });
  });

  // character + contact shadow
  const shW = Math.min(cs.w, 18 * u) * 0.9;
  if (actor.rot === 0 && !actor.fading) {
    nodes.push({ z: actor.z - 0.1, el: <Image key="cs" source={UI.shadow.src} style={{ position: 'absolute', left: actor.x * u - shW / 2, top: actor.y * u - shW * 0.12, width: shW, height: shW * 0.24, opacity: 0.8 }} /> });
  }
  nodes.push({
    z: actor.z,
    el: (
      <Pressable key="char" onPress={onTapActor} style={{ position: 'absolute', left: charLeft, top: charTop, opacity: actor.fading ? 0 : 1 }}>
        <Character hero={equipped.hero ?? 'noodle'} pose={actor.pose} face={actor.face} rot={actor.rot} scale={actor.scale} unit={u} tick={tick} squash={actor.squash} hat={equipped.hat} glasses={!!equipped.glasses} breathe={actor.pose === 'idle' || actor.pose === 'sleep'} />
      </Pressable>
    ),
  });
  if (actor.ball) {
    const b = 5 * u;
    nodes.push({ z: 25, el: <Image key="ball" source={FURN.ball.src} style={{ position: 'absolute', left: actor.ball.x * u - b / 2, top: actor.ball.y * u - b, width: b, height: b, transform: [{ rotate: `${actor.ball.r}deg` }] }} /> });
  } else if (place === 'garden') {
    const b = 5 * u;
    nodes.push({ z: 19, el: <Image key="ball" source={FURN.ball.src} style={{ position: 'absolute', left: 111 * u - b / 2, top: 92 * u - b, width: b, height: b }} /> });
  }
  nodes.sort((a, b) => a.z - b.z);

  // thought bubble above the head
  let bubble: React.ReactNode = null;
  if (actor.bubble && !actor.fading) {
    const bx = actor.x * u, by = charTop - 4 * u;
    const B = actor.bubble;
    const bw = B.kind === 'photo' ? 30 * u : B.kind === 'text' ? 36 * u : 13 * u;
    const bh = B.kind === 'photo' ? 30 * u : 12 * u;
    bubble = (
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={{ position: 'absolute', left: Math.max(4, Math.min(W - bw - 4, bx - bw / 2)), top: Math.max(4, by - bh), width: bw, zIndex: 100 }}>
        <Pressable onPress={onTapBubble} style={{ backgroundColor: '#F7F2EA', borderRadius: 18, padding: 6 * (u / 5), alignItems: 'center', borderWidth: 1.5, borderColor: '#D8CFC2' }}>
          {B.kind === 'icon' ? <Icon name={B.icon as any} size={8 * u} /> : null}
          {B.kind === 'text' ? <T v="note" size={Math.max(15, 3.2 * u)} style={{ textAlign: 'center' }}>{B.text}</T> : null}
          {B.kind === 'photo' ? (
            <>
              <Image source={{ uri: B.uri }} style={{ width: bw - 16, height: bh - 34, borderRadius: 10 }} contentFit="cover" />
              <T v="note" size={15} style={{ marginTop: 3 }}>{B.text}</T>
            </>
          ) : null}
        </Pressable>
        <View style={{ alignSelf: 'center', width: 9, height: 9, borderRadius: 5, backgroundColor: '#F7F2EA', marginTop: 3, borderWidth: 1.5, borderColor: '#D8CFC2' }} />
        <View style={{ alignSelf: 'center', width: 5, height: 5, borderRadius: 3, backgroundColor: '#F7F2EA', marginTop: 2, marginLeft: 6, borderWidth: 1, borderColor: '#D8CFC2' }} />
      </Animated.View>
    );
  }

  return (
    <View style={{ height, width }}>
      <ScrollView
        ref={sv}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScrollBeginDrag={() => { userDragging.current = true; onUserScroll(); }}
        onScrollEndDrag={() => { setTimeout(() => { userDragging.current = false; }, 4000); }}
        contentContainerStyle={{ width: W, height }}
      >
        <View style={{ width: W, height }}>
          {place === 'home' ? (
            <>
              <View style={{ position: 'absolute', left: 0, top: 0, width: W, height: HOME_FLOOR * u, overflow: 'hidden' }}>
                {Array.from({ length: Math.ceil(W / (34 * u)) + 1 }).flatMap((_, i) => Array.from({ length: 2 }).map((__, j) => (
                  <Image key={i + '-' + j} source={wallTex.src} style={{ position: 'absolute', left: i * 34 * u, top: j * 34 * u, width: 34 * u, height: 34 * u }} contentFit="cover" />
                )))}
              </View>
              <View style={{ position: 'absolute', left: 0, top: HOME_FLOOR * u, width: W, height: (100 - HOME_FLOOR) * u, overflow: 'hidden' }}>
                {Array.from({ length: Math.ceil(W / (26 * u)) + 1 }).map((_, i) => (
                  <Image key={i} source={floorTex.src} style={{ position: 'absolute', left: i * 26 * u, top: 0, width: 26 * u, height: (100 - HOME_FLOOR) * u }} contentFit="cover" />
                ))}
              </View>
              <View style={{ position: 'absolute', left: 0, top: HOME_FLOOR * u - 2, width: W, height: 2.2 * u, backgroundColor: '#E6DCCB', borderBottomWidth: 2, borderBottomColor: 'rgba(110,90,70,0.25)' }} />
              <View style={{ position: 'absolute', left: 0, top: HOME_FLOOR * u + 2.2 * u, width: W, height: 3 * u, backgroundColor: 'rgba(60,40,30,0.07)' }} />
            </>
          ) : (
            <Image source={SCENES.garden_bg.src} style={{ position: 'absolute', left: 0, top: 0, width: W, height }} contentFit="cover" />
          )}
          {nodes.map(n => n.el)}
          {/* shared paper grain over everything so all layers sit in the same paper */}
          <Image source={TEX.paper.src} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: W, height, opacity: 0.18 }} contentFit="cover" />
          {bubble}
        </View>
      </ScrollView>
      {actor.fading ? <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(350)} style={[StyleSheet.absoluteFill, { backgroundColor: C.paper }]} /> : null}
    </View>
  );
}
