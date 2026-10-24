import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { findActivity } from '../data/activities';
import type { Memory } from '../data/quests';
import { itemById, ShopTab, Slot } from '../data/shop';
import { dayKey, Reward } from '../game/rules';
import { useDirector } from '../scene/director';
import { STATIONS } from '../scene/layout';
import { World } from '../scene/World';
import { GiftResult, useGame } from '../state/store';
import { C } from '../theme';
import { CoinPill, Icon, Paper, Pressy, Progress, Scribble, T, haptic, useToast } from '../ui/kit';
import { AlbumScreen, MemoryPop, NewMemorySheet } from './Album';
import { LogSheet } from './LogSheet';
import { MapScreen } from './MapScreen';
import { ProfileSheet } from './Profile';
import { QuestsSheet } from './QuestsSheet';
import { GiftPop, RewardPop } from './Rewards';
import { ShopSheet } from './ShopSheet';

type Panel = null | 'log' | 'quests' | 'shop' | 'profile' | 'newMem';

const TAP_LINES = ['hello. yes. it is me.', 'please do not poke the noodle', 'i was thinking about soup', 'boop received', 'i am being productive (resting)', 'do you like my curl', 'we are doing great, probably'];
const MORNING = ['morning. i made toast. (i did not)', 'new day! what are we doing?', 'i dreamed you went for a walk. hint hint', 'good morning to you specifically'];

export function Home() {
  const g = useGame();
  const ins = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [panel, setPanel] = useState<Panel>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [memOpen, setMemOpen] = useState<Memory | null>(null);
  const [reward, setReward] = useState<(Reward & { title: string }) | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftRes, setGiftRes] = useState<GiftResult | null>(null);
  const [preview, setPreview] = useState<{ slot: Slot; id: string } | null>(null);
  const [follow, setFollow] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const pendingReward = useRef<(Reward & { title: string }) | null>(null);
  const { toast, toastNode } = useToast();
  const hero = g.s.equipped.hero ?? 'noodle';
  const heroName = hero === 'pebble' ? 'Mossy' : hero === 'blanket' ? 'Burrito' : 'Noodle';

  const [place, setPlace] = useState<'home' | 'garden'>('home');
  const d = useDirector('home', { onPlace: setPlace, hasBench: !!g.s.equipped.gBench });

  // Morning greeting / memory flashback once a day.
  useEffect(() => {
    const today = dayKey(Date.now());
    if (!g.ready || !g.s.onboarded || g.s.bubbleDay === today) return;
    const withPhoto = g.s.memories.filter(m => m.photo);
    const t = setTimeout(() => {
      if (withPhoto.length && Math.random() < 0.7) {
        const m = withPhoto[Math.floor(Math.random() * withPhoto.length)];
        d.say({ kind: 'photo', uri: m.photo!, text: 'remember this?', memId: m.id });
      } else d.say({ kind: 'text', text: MORNING[Math.floor(Math.random() * MORNING.length)] });
      g.set(s => ({ ...s, bubbleDay: today }));
      setTimeout(() => d.say(null), 9000);
    }, 1500);
    return () => clearTimeout(t);
  }, [g.ready, g.s.onboarded]); // eslint-disable-line react-hooks/exhaustive-deps

  const equipped = useMemo(() => {
    if (!preview) return g.s.equipped;
    const e = { ...g.s.equipped };
    if (preview.id === '__none') delete e[preview.slot]; else e[preview.slot] = preview.id;
    return e;
  }, [g.s.equipped, preview]);

  const logIt = useCallback((actId: string, min: number, note?: string) => {
    const f = findActivity(actId)!;
    setPanel(null);
    const r = g.logActivity(actId, min, note);
    pendingReward.current = { ...r, title: `${f.cat.label} · ${f.act.label}` };
    setFollow(true);
    setStatus(`${heroName} is ${f.act.doing}`);
    const st = STATIONS[f.act.station];
    d.perform(st, f.act.perf, {
      bubbleIcon: f.cat.icon,
      ballKick: f.act.station === 'ball',
      sweep: f.act.station === 'rugSweep',
      onDone: () => { setStatus(null); setReward(pendingReward.current); pendingReward.current = null; },
    });
  }, [g, d, heroName]);

  const openGift = () => { const r = g.openGift(); setGiftRes(r); if (r) haptic('success'); };

  const onShopTab = (t: ShopTab) => {
    if (d.actor.busy) return;
    if (t === 'garden' && place !== 'garden') d.teleport('garden');
    if (t !== 'garden' && t !== 'wardrobe' && t !== 'friends' && place !== 'home') d.teleport('home');
  };

  const [sceneBox, setSceneBox] = useState(0);
  const sceneH = Math.min(sceneBox, width * 1.25);
  const hour = new Date().getHours();
  const greet = hour < 5 ? 'Up late' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const doneToday = g.s.log.filter(l => dayKey(l.at) === dayKey(Date.now())).length;
  const questDots = [...g.quests.daily, ...g.quests.weekly].some(q => q.value >= q.q.goal && !q.claimed);
  const idleLine = d.actor.place === 'garden' ? `${heroName} is out in the backyard` : d.actor.pose === 'sleep' ? `${heroName} is asleep. shh` : d.actor.pose === 'sofa_relax' ? `${heroName} is lounging on the sofa` : d.actor.pose === 'read' ? `${heroName} is reading something` : `${heroName} is pottering around the flat`;

  return (
    <Paper style={{ flex: 1 }}>
      <View style={{ paddingTop: ins.top + 6, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => setPanel('profile')} style={{ flex: 1 }}>
          <T v="hand" size={18}>Lv {g.level.level} ›</T>
          <View style={{ width: 90, marginTop: 3 }}><Progress value={g.level.into} max={g.level.need} height={5} /></View>
        </Pressable>
        <Pressable onPress={() => setPanel('quests')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 14 }}>
          <Icon name="sun" size={22} />
          <T v="hand" size={18}>{g.streakNow}</T>
        </Pressable>
        <Pressable onPress={() => setPanel('shop')}><CoinPill value={g.s.coins} /></Pressable>
      </View>

      <View style={{ paddingHorizontal: 22, marginTop: 10 }}>
        <T v="display" size={30}>{greet}{g.s.name ? `, ${g.s.name}` : ''}.</T>
        <T v="note" size={18} color={C.inkSoft} numberOfLines={2}>{status ?? (doneToday === 0 ? `${idleLine}. nothing logged yet today, and that's okay` : idleLine)}.</T>
      </View>

      <View style={{ height: 84, marginTop: 6, alignItems: 'center', justifyContent: 'center' }}>
        <Pressy onPress={() => setPanel('log')} disabled={d.actor.busy} style={{ width: 230, height: 72, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 230, height: 72, transform: [{ rotate: '-4deg' }] }}><Scribble w={230} h={72} color={C.sky} seed={4} strokeWidth={3.2} /></View>
          <T v="display" size={30}>{d.actor.busy ? 'watching…' : 'I did a thing!'}</T>
        </Pressy>
        <View style={{ position: 'absolute', left: 18, top: 10, transform: [{ rotate: '-5deg' }] }}>
          <Pressy onPress={() => setMapOpen(true)} style={{ alignItems: 'center' }}>
            <Icon name="mapicon" size={40} />
            <T v="hand" size={13} color={C.sageInk}>{place === 'home' ? 'flat' : 'yard'}</T>
          </Pressy>
        </View>
        {g.s.gifts > 0 ? (
          <View style={{ position: 'absolute', right: 20, top: 10, transform: [{ rotate: '6deg' }] }}>
            <Pressy onPress={() => { setGiftRes(null); setGiftOpen(true); }} style={{ alignItems: 'center' }}>
              <Icon name="gift" size={46} />
              <View style={{ position: 'absolute', top: -2, right: -6, backgroundColor: C.leafBtn, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                <T v="uiBold" size={11} color="#fff">{g.s.gifts}</T>
              </View>
            </Pressy>
          </View>
        ) : null}
      </View>

      <View style={{ flex: 1, justifyContent: 'flex-end' }} onLayout={e => setSceneBox(e.nativeEvent.layout.height)}>
        {sceneBox > 0 ? <World
          actor={d.actor}
          tick={d.tick}
          height={sceneH}
          width={width}
          equipped={equipped}
          frameMem={g.s.frameMem}
          memories={g.s.memories}
          follow={follow}
          onUserScroll={() => setFollow(false)}
          onTapActor={() => { setFollow(true); if (!d.actor.busy) { d.react(['wave', 'happy', 'jump'][Math.floor(Math.random() * 3)], 6); d.say({ kind: 'text', text: TAP_LINES[Math.floor(Math.random() * TAP_LINES.length)] }); setTimeout(() => d.say(null), 2600); } }}
          onTapFrame={slot => {
            const m = g.s.memories.find(x => x.id === g.s.frameMem[slot]);
            if (m) setMemOpen(m); else { toast(g.s.memories.length ? 'Open a memory in the album to hang it here' : 'Add a memory to fill this frame'); }
          }}
          onTapBubble={() => {
            const b = d.actor.bubble;
            if (b?.kind === 'photo') { const m = g.s.memories.find(x => x.id === b.memId); if (m) setMemOpen(m); }
            d.say(null);
          }}
        /> : null}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, paddingBottom: ins.bottom + 10, paddingHorizontal: 10, backgroundColor: 'transparent' }}>
        {[
          { k: 'Quests', on: () => setPanel('quests'), dot: questDots },
          { k: 'Album', on: () => setAlbumOpen(true) },
          { k: 'Map', on: () => setMapOpen(true) },
          { k: 'Shop', on: () => setPanel('shop') },
        ].map(b => (
          <Pressable key={b.k} onPress={() => { haptic(); b.on(); }} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
            <T v="hand" size={20}>{b.k}</T>
            {b.dot ? <View style={{ position: 'absolute', top: 4, right: 2, width: 7, height: 7, borderRadius: 4, backgroundColor: C.leaf }} /> : null}
          </Pressable>
        ))}
      </View>

      <LogSheet open={panel === 'log'} onClose={() => setPanel(null)} onLog={logIt} focus={g.s.focus} heroName={heroName} />
      <QuestsSheet open={panel === 'quests'} onClose={() => setPanel(null)} onClaimed={m => { haptic('success'); toast(m); }} />
      <ShopSheet open={panel === 'shop'} onClose={() => setPanel(null)} onPreview={(slot, id) => setPreview(slot && id ? { slot, id } : null)} onTab={onShopTab} toast={toast} />
      <ProfileSheet open={panel === 'profile'} onClose={() => setPanel(null)} />
      <NewMemorySheet open={panel === 'newMem'} onClose={() => setPanel(null)} onSaved={m => {
        setPanel(null);
        toast('Memory kept. +10 xp');
        setFollow(true);
        d.perform(STATIONS.wall, { poses: [['photo', 8]], ms: 3200 }, { bubbleIcon: 'album', onDone: () => { if (m.photo) setMemOpen(m); } });
      }} />

      <MapScreen open={mapOpen} onClose={() => setMapOpen(false)} here={place} hero={hero} onGo={p => { setFollow(true); d.teleport(p); }} />
      <AlbumScreen open={albumOpen} onClose={() => setAlbumOpen(false)} onNew={() => { setAlbumOpen(false); setTimeout(() => setPanel('newMem'), 350); }} onOpenMem={m => { setAlbumOpen(false); setTimeout(() => setMemOpen(m), 350); }} />
      <MemoryPop mem={memOpen} onClose={() => setMemOpen(null)} onHang={(m, slot) => {
        g.hang(m.id, slot); setMemOpen(null);
        if (place !== 'home') d.teleport('home');
        setFollow(true);
        d.perform(STATIONS.wall, { poses: [['photo', 6], ['happy', 4]], ms: 2600 }, {});
        toast('Hung on the wall');
      }} />

      <RewardPop r={reward} heroName={heroName} onClose={() => setReward(null)} onGift={() => { setReward(null); setGiftRes(null); setTimeout(() => setGiftOpen(true), 250); }} />
      <GiftPop open={giftOpen} result={giftRes} giftsLeft={g.s.gifts} onOpen={() => { setGiftRes(null); setTimeout(openGift, 350); }}
        onClose={() => { setGiftOpen(false); setGiftRes(null); }}
        onPlace={id => {
          const it = itemById(id);
          if (it) g.equip(it.slot, id);
          setGiftOpen(false); setGiftRes(null);
          if (it?.tab === 'garden' && place !== 'garden') d.teleport('garden');
          if (it && ['furniture', 'decor', 'plants', 'walls'].includes(it.tab) && place !== 'home') d.teleport('home');
        }} />
      {toastNode}
    </Paper>
  );
}
