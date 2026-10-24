import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { achievementsView, useGame } from '../state/store';
import { C } from '../theme';
import { Btn, Icon, Progress, Sheet, T, Tabs } from '../ui/kit';

const untilMidnight = () => {
  const n = new Date(), m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
  const h = Math.floor((m.getTime() - n.getTime()) / 3600000);
  return `${h}h left`;
};
const untilMonday = () => {
  const n = new Date(), d = (8 - n.getDay()) % 7 || 7;
  return `${d}d left`;
};

export function QuestsSheet({ open, onClose, onClaimed }: { open: boolean; onClose: () => void; onClaimed: (msg: string) => void }) {
  const g = useGame();
  const [tab, setTab] = useState<'daily' | 'weekly' | 'badges'>('daily');
  const list = tab === 'daily' ? g.quests.daily : g.quests.weekly;
  const ach = achievementsView(g.achStats, g.s.achClaimed);
  const claimableQ = (q: typeof list) => q.some(x => x.value >= x.q.goal && !x.claimed);
  return (
    <Sheet open={open} onClose={onClose} height={0.72} title="Quests">
      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <Tabs
          tabs={[{ id: 'daily', label: 'Daily' }, { id: 'weekly', label: 'Weekly' }, { id: 'badges', label: 'Badges' }]}
          value={tab}
          onChange={setTab}
          dots={{ daily: claimableQ(g.quests.daily), weekly: claimableQ(g.quests.weekly), badges: ach.some(a => a.done && !a.claimed) }}
        />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30, gap: 10 }}>
        {tab !== 'badges' ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <View style={{ backgroundColor: C.sage200, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                <T size={12} color={C.sageInk}>◷ {tab === 'daily' ? untilMidnight() : untilMonday()}</T>
              </View>
              <T v="note" size={15} color={C.inkSoft}>New ones every {tab === 'daily' ? 'morning' : 'Monday'}. Missing one is fine.</T>
            </View>
            {list.map(({ q, key, value, claimed }) => {
              const done = value >= q.goal;
              return (
                <View key={key} style={{ backgroundColor: C.sage200, borderRadius: 16, padding: 14, gap: 8, opacity: claimed ? 0.6 : 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <T v="display" size={21}>{q.title}</T>
                      <T size={13} color={C.inkSoft}>{q.hint}</T>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Icon name="coin" size={16} /><T v="hand" size={16}>{q.coins}</T></View>
                      {q.gifts ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Icon name="gift" size={18} /><T v="hand" size={15}>×{q.gifts}</T></View> : null}
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ flex: 1 }}><Progress value={value} max={q.goal} /></View>
                    <T size={12} color={C.sageInk}>{value} / {q.goal}</T>
                  </View>
                  {done && !claimed ? <Btn small label="Collect" onPress={() => { g.claimQuest(key, q.coins, q.gifts); onClaimed(`+${q.coins} coins${q.gifts ? ' and a gift sack' : ''}`); }} /> : null}
                  {claimed ? <T v="note" size={15} color={C.leaf}>collected ✓</T> : null}
                </View>
              );
            })}
          </>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 }}>
            {ach.map(({ a, value, done, claimed }) => (
              <View key={a.id} style={{ width: '48.5%', backgroundColor: C.sage200, borderRadius: 16, padding: 12, gap: 6 }}>
                <View style={{ height: 70, borderRadius: 12, borderWidth: 5, borderColor: done ? '#C9A46B' : '#C9C3B9', backgroundColor: done ? '#F3EBD9' : '#E4E0DA', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={a.icon as any} size={44} style={{ opacity: done ? 1 : 0.3 }} />
                </View>
                <T v="hand" size={17}>{a.title}</T>
                <T v="note" size={14} color={C.inkSoft} numberOfLines={2}>{a.joke}</T>
                <T size={11} color={C.sageInk}>{a.req}</T>
                <Progress value={value} max={a.goal} height={6} />
                <T size={11} color={C.sageInk}>{value} / {a.goal}</T>
                {done && !claimed ? <Btn small label="Collect" onPress={() => { g.claimAch(a.id, 30); onClaimed('+30 coins and a gift sack'); }} /> : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Sheet>
  );
}
