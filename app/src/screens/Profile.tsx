import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { CHARS } from '../assets';
import { CATEGORIES } from '../data/activities';
import { dayKey } from '../game/rules';
import { useGame } from '../state/store';
import { C, F } from '../theme';
import { Btn, Icon, Progress, Sheet, T, Tabs } from '../ui/kit';

export function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const g = useGame();
  const [name, setName] = useState(g.s.name);
  const days = Array.from({ length: 7 }, (_, i) => {
    const t = Date.now() - (6 - i) * 86400000;
    const k = dayKey(t);
    return { k, label: new Date(t).toLocaleDateString(undefined, { weekday: 'narrow' }), n: g.s.log.filter(l => dayKey(l.at) === k).length };
  });
  const byCat = CATEGORIES.map(c => ({ c, n: g.s.log.filter(l => l.cat === c.id).length }));
  const now = new Date();
  const monthLog = g.s.log.filter(l => { const d = new Date(l.at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const monthMems = g.s.memories.filter(m => { const d = new Date(m.at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const monthTop = CATEGORIES.map(c => ({ c, n: monthLog.filter(l => l.cat === c.id).length })).sort((a, b) => b.n - a.n)[0];
  const monthName = now.toLocaleDateString('en', { month: 'long' });
  const activeDays = new Set(monthLog.map(l => dayKey(l.at))).size;
  const maxCat = Math.max(1, ...byCat.map(x => x.n));
  const confirmReset = () => {
    const go = () => { g.reset(); onClose(); };
    if (Platform.OS === 'web') { go(); return; }
    Alert.alert('Start over?', 'This clears your flat, coins and memories on this phone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Start over', style: 'destructive', onPress: go }]);
  };
  return (
    <Sheet open={open} onClose={onClose} height={0.8} title={g.s.name ? `${g.s.name}'s life` : 'Your little life'}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40, gap: 14 }}>
        <View style={{ backgroundColor: C.sage200, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Image source={CHARS.noodle.happy.frames[0]} style={{ width: 54, height: 98 }} contentFit="contain" />
          <View style={{ flex: 1, gap: 6 }}>
            <T v="display" size={26}>Level {g.level.level}</T>
            <Progress value={g.level.into} max={g.level.need} />
            <T size={12} color={C.sageInk}>{g.level.into} / {g.level.need} xp to level {g.level.level + 1}</T>
          </View>
        </View>
        <View style={{ backgroundColor: C.sage200, borderRadius: 16, padding: 14, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="sun" size={30} />
            <View style={{ flex: 1 }}>
              <T v="hand" size={20}>{g.streakNow} day streak</T>
              <T size={12} color={C.sageInk}>Best {g.s.streak.best} · Cozy days saved: {g.s.streak.freezes}</T>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {days.map(d => (
              <View key={d.k} style={{ alignItems: 'center', gap: 4 }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: d.n ? '#F6E2A8' : C.sage100, alignItems: 'center', justifyContent: 'center' }}>
                  {d.n ? <Icon name="sun" size={24} /> : null}
                </View>
                <T size={11} color={C.sageInk}>{d.label}</T>
              </View>
            ))}
          </View>
          <T v="note" size={15} color={C.inkSoft}>Every 7 days in a row earns a cozy day: miss one day and the streak waits for you.</T>
        </View>
        <View style={{ backgroundColor: '#F4EDE0', borderRadius: 16, padding: 16, gap: 8, transform: [{ rotate: '-0.6deg' }] }}>
          <T v="display" size={24}>Your {monthName} in Little Life</T>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {monthMems.slice(0, 3).map(m => m.photo ? <Image key={m.id} source={{ uri: m.photo }} style={{ width: 70, height: 84, borderRadius: 4, transform: [{ rotate: `${(m.at % 7) - 3}deg` }] }} contentFit="cover" /> : null)}
          </View>
          <T v="note" size={18}>{monthLog.length ? `${monthLog.length} things done on ${activeDays} days. Mostly ${monthTop.c.label.toLowerCase()}${monthMems.length ? `, and ${monthMems.length} ${monthMems.length === 1 ? 'memory' : 'memories'} kept` : ''}.` : `${monthName} is just getting started. Noodle is waiting with a notebook.`}</T>
        </View>
        <View style={{ backgroundColor: C.sage200, borderRadius: 16, padding: 14, gap: 8 }}>
          <T v="uiBold" size={12} color={C.sageInk} style={{ letterSpacing: 0.6 }}>ALL TIME · {g.s.log.length} THINGS DONE</T>
          {byCat.map(({ c, n }) => (
            <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name={c.icon} size={22} />
              <T v="hand" size={15} style={{ width: 70 }}>{c.label}</T>
              <View style={{ flex: 1 }}><Progress value={n} max={maxCat} color={c.tint} track={C.sage100} height={10} /></View>
              <T size={12} color={C.sageInk} style={{ width: 24, textAlign: 'right' }}>{n}</T>
            </View>
          ))}
        </View>
        <View style={{ backgroundColor: C.sage200, borderRadius: 16, padding: 14, gap: 8 }}>
          <T v="uiBold" size={12} color={C.sageInk} style={{ letterSpacing: 0.6 }}>SETTINGS</T>
          <T size={13} color={C.inkSoft}>How Noodle is drawn</T>
          <Tabs tabs={[{ id: 'gouache', label: 'Soft paint' }, { id: 'crayon', label: 'Crayon' }]} value={g.s.style} onChange={v => g.set(s => ({ ...s, style: v }))} />
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={C.inkFaint} maxLength={20}
              style={{ flex: 1, backgroundColor: C.sage100, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: F.hand, fontSize: 18, color: C.ink }} />
            <Btn small label="Save" onPress={() => g.set(s => ({ ...s, name: name.trim() }))} />
          </View>
          <Pressable onPress={confirmReset} style={{ paddingVertical: 8 }}><T size={13} color={C.rust}>Start over (clear all progress)</T></Pressable>
        </View>
        <View style={{ backgroundColor: C.sage200, borderRadius: 16, padding: 14, gap: 8 }}>
          <T v="uiBold" size={12} color={C.sageInk} style={{ letterSpacing: 0.6 }}>TESTER TOOLS</T>
          <T size={12} color={C.inkSoft}>For trying the app quickly. Remove before release.</T>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn small label="+1 level" onPress={() => g.set(s => ({ ...s, xp: s.xp + (g.level.need - g.level.into), gifts: s.gifts + 1 }))} />
            <Btn small label="+200 coins" onPress={() => g.set(s => ({ ...s, coins: s.coins + 200 }))} />
            <Btn small label="+gift" ghost onPress={() => g.set(s => ({ ...s, gifts: s.gifts + 1 }))} />
          </View>
        </View>
      </ScrollView>
    </Sheet>
  );
}

export function Onboarding({ onDone }: { onDone: (name: string, focus: string[]) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [focus, setFocus] = useState<string[]>([]);
  const toggle = (id: string) => setFocus(f => (f.includes(id) ? f.filter(x => x !== id) : [...f, id]));
  const pose = step === 0 ? CHARS.noodle.wave : step === 1 ? CHARS.noodle.sit : CHARS.noodle.happy;
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 16 }}>
      <Image source={pose.frames[0]} style={{ alignSelf: 'center', width: 150 * (pose.w / pose.h) * 1.4, height: 210 }} contentFit="contain" />
      {step === 0 ? (
        <>
          <T v="display" size={34} style={{ textAlign: 'center' }}>Hi. I'm Noodle.</T>
          <T v="note" size={20} style={{ textAlign: 'center' }} color={C.inkSoft}>I live in your phone now. Whatever you do out there, I'll try to do in here. Badly, but with feeling.</T>
          <Btn label="Nice to meet you" onPress={() => setStep(1)} />
        </>
      ) : step === 1 ? (
        <>
          <T v="display" size={30} style={{ textAlign: 'center' }}>What should I call you?</T>
          <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={C.inkFaint} maxLength={20} autoFocus
            style={{ backgroundColor: C.sage100, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontFamily: F.display, fontSize: 26, color: C.ink, textAlign: 'center' }} />
          <Btn label="That's me" disabled={!name.trim()} onPress={() => setStep(2)} />
        </>
      ) : (
        <>
          <T v="display" size={28} style={{ textAlign: 'center' }}>What do you want more of, {name.trim()}?</T>
          <T v="note" size={17} style={{ textAlign: 'center' }} color={C.inkSoft}>Pick a few. No pressure. Rest counts too.</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {CATEGORIES.map(c => {
              const on = focus.includes(c.id);
              return (
                <Pressable key={c.id} onPress={() => toggle(c.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99, backgroundColor: on ? C.sage300 : C.sage100, borderWidth: 1.5, borderColor: on ? C.leafBtn : 'transparent' }}>
                  <Icon name={c.icon} size={26} />
                  <T v="hand" size={18}>{c.label}</T>
                </Pressable>
              );
            })}
          </View>
          <Btn label="Let's live a little" onPress={() => onDone(name.trim(), focus)} />
        </>
      )}
    </View>
  );
}
