import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { CHARS, FURN, TEX, UI } from '../assets';
import { PLACES } from '../data/places';
import { Item, itemById } from '../data/shop';
import type { Reward } from '../game/rules';
import type { GiftResult } from '../state/store';
import { C } from '../theme';
import { Btn, Burst, Icon, Pop, T, haptic } from '../ui/kit';

const QUIPS = [
  'I did it too. In spirit. And in pose.',
  'Look at us. Basically athletes of life.',
  'I am putting this on the fridge.',
  'Small steps. My legs are short anyway.',
  'That was very you of you.',
  'I would clap but my arms are noodles.',
  'Nobody saw, but I saw.',
];

export function ItemArt({ item, size }: { item: Item; size: number }) {
  const a = item.art;
  let src: any, w = 1, h = 1;
  if (a.kind === 'furn') { src = FURN[a.key].src; w = FURN[a.key].w; h = FURN[a.key].h; }
  else if (a.kind === 'ui') { src = UI[a.key].src; w = UI[a.key].w; h = UI[a.key].h; }
  else if (a.kind === 'tex') { src = TEX[a.key as keyof typeof TEX].src; }
  else { const p = CHARS[a.key].idle; src = p.frames[0]; w = p.w; h = p.h; }
  if (a.kind === 'tex') return <Image source={src} style={{ width: size, height: size, borderRadius: 12 }} contentFit="cover" />;
  const r = w / h;
  return <Image source={src} style={{ width: r >= 1 ? size : size * r, height: r >= 1 ? size / r : size }} contentFit="contain" />;
}

export function RewardPop({ r, heroName, onClose, onGift }: { r: (Reward & { title: string }) | null; heroName: string; onClose: () => void; onGift: () => void }) {
  const [quip] = useState(() => QUIPS[Math.floor(Math.random() * QUIPS.length)]);
  useEffect(() => { if (r) haptic('success'); }, [r]);
  if (!r) return null;
  const unlocked = r.levelUp ? PLACES.filter(p => p.level === r.levelUp) : [];
  return (
    <Pop open={!!r} onClose={onClose}>
      <T v="display" size={30}>{r.levelUp ? `Level ${r.levelUp}!` : 'Nice one!'}</T>
      <T v="note" size={17} color={C.inkSoft} style={{ marginTop: 2 }}>{r.title}</T>
      <View style={{ width: 200, height: 170, alignItems: 'center', justifyContent: 'center', marginVertical: 4 }}>
        <Burst size={200} />
        <Icon name={r.levelUp ? 'xp' : 'coin'} size={84} />
      </View>
      <View style={{ flexDirection: 'row', gap: 18, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Icon name="coin" size={22} /><T v="hand" size={22} color={C.leaf}>+{r.coins}</T></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Icon name="xp" size={22} /><T v="hand" size={22} color={C.leaf}>+{r.xp} xp</T></View>
      </View>
      {r.streakGrew ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Icon name="sun" size={20} />
          <T size={13} color={C.sageInk}>{r.streak === 1 ? 'A new little sun for today' : `${r.streak} days in a row`}{r.usedFreeze ? ' · a cozy day covered the gap' : ''}</T>
        </View>
      ) : null}
      {unlocked.map(p => (
        <T key={p.id} size={13} color={C.sageInk} style={{ marginBottom: 4 }}>New place on the map: {p.name}</T>
      ))}
      <T v="note" size={17} style={{ textAlign: 'center', marginTop: 6 }}>"{quip}"</T>
      <T v="note" size={15} color={C.inkSoft} style={{ marginBottom: 14 }}>— {heroName}</T>
      <View style={{ width: '100%', gap: 8 }}>
        {r.gift || r.levelUp ? <Btn label="Open the gift sack" onPress={onGift} icon={<Icon name="gift" size={22} />} /> : null}
        <Btn label="Yay" ghost={!!(r.gift || r.levelUp)} onPress={onClose} />
      </View>
    </Pop>
  );
}

export function GiftPop({ open, result, onOpen, onClose, onPlace, giftsLeft }: { open: boolean; result: GiftResult | null; onOpen: () => void; onClose: () => void; onPlace: (id: string) => void; giftsLeft: number }) {
  const shake = useSharedValue(0);
  const st = useAnimatedStyle(() => ({ transform: [{ rotate: `${shake.value}deg` }] }));
  useEffect(() => {
    if (open && !result) shake.value = withSequence(withTiming(-8, { duration: 90 }), withTiming(8, { duration: 90 }), withTiming(-6, { duration: 90 }), withSpring(0));
  }, [open, result]); // eslint-disable-line react-hooks/exhaustive-deps
  const item = result?.kind === 'item' ? itemById(result.id) : undefined;
  return (
    <Pop open={open} onClose={onClose}>
      <T v="display" size={28}>{result ? (item ? 'You got it!' : 'Coins!') : 'A gift sack'}</T>
      <View style={{ width: 210, height: 190, alignItems: 'center', justifyContent: 'center' }}>
        {result ? <Burst size={210} /> : null}
        {!result ? (
          <Animated.View style={st}><Icon name="gift" size={130} /></Animated.View>
        ) : item ? <ItemArt item={item} size={130} /> : <Icon name="coin" size={100} />}
      </View>
      {result ? (
        <>
          <T v="hand" size={22} color={C.leaf}>{item ? item.name : `+${result.kind === 'coins' ? result.amount : 0} coins`}</T>
          {item ? <T v="note" size={16} color={C.inkSoft} style={{ textAlign: 'center', marginBottom: 12 }}>{item.note}</T> : <View style={{ height: 12 }} />}
          <View style={{ width: '100%', gap: 8 }}>
            {item ? <Btn label="Use it now" onPress={() => onPlace(item.id)} /> : null}
            {giftsLeft > 0 ? <Btn label={`Open another (${giftsLeft})`} ghost onPress={onOpen} /> : <Btn label="Lovely" ghost={!!item} onPress={onClose} />}
          </View>
        </>
      ) : (
        <>
          <T v="note" size={17} color={C.inkSoft} style={{ marginBottom: 14, textAlign: 'center' }}>Something lumpy inside. Furniture? Coins? A hat?</T>
          <Btn label="Rip it open" onPress={onOpen} style={{ width: '100%' }} />
        </>
      )}
    </Pop>
  );
}
