import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ITEMS, Item, OPTIONAL_SLOTS, SEASON_UNTIL, ShopTab, Slot, TABS } from '../data/shop';
import { useGame } from '../state/store';
import { C } from '../theme';
import { Btn, CoinPill, Pressy, Sheet, T, WobbleBox, haptic } from '../ui/kit';
import { ItemArt } from './Rewards';

export function ShopSheet({ open, onClose, onPreview, onTab, toast }: {
  open: boolean;
  onClose: () => void;
  onPreview: (slot: Slot | null, id: string | null) => void;
  onTab: (t: ShopTab) => void;
  toast: (m: string) => void;
}) {
  const g = useGame();
  const seasonOn = Date.now() < SEASON_UNTIL;
  const tabs = TABS.filter(t => t.id !== 'autumn' || seasonOn);
  const [tab, setTab] = useState<ShopTab>(seasonOn ? 'autumn' : 'furniture');
  const [sel, setSel] = useState<Item | null>(null);
  useEffect(() => { if (!open) { setSel(null); onPreview(null, null); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = ITEMS.filter(i => i.tab === tab);
  const lvl = g.level.level;

  const choose = (it: Item) => {
    haptic();
    setSel(it);
    onPreview(it.slot, it.id);
  };

  const owned = sel ? g.s.owned.includes(sel.id) : false;
  const equipped = sel ? g.s.equipped[sel.slot] === sel.id : false;
  const locked = sel ? lvl < sel.level : false;

  return (
    <Sheet open={open} onClose={onClose} height={0.5} title="Shop" right={<CoinPill value={g.s.coins} />}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 14, gap: 6, paddingBottom: 8 }}>
        {tabs.map(t => (
          <Pressy key={t.id} onPress={() => { setTab(t.id); setSel(null); onPreview(null, null); onTab(t.id); }} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, backgroundColor: tab === t.id ? C.sage300 : 'transparent' }}>
            <T v="uiBold" size={13} color={tab === t.id ? C.ink : C.sageInk}>{t.label}</T>
          </Pressy>
        ))}
      </ScrollView>
      {tab === 'autumn' ? <T v="note" size={15} color={C.inkSoft} style={{ paddingHorizontal: 18, marginBottom: 6 }}>Autumn things, only until the end of November. Crunchy.</T> : null}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 110, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 }}>
        {items.map(it => {
          const own = g.s.owned.includes(it.id);
          const eq = g.s.equipped[it.slot] === it.id;
          const lk = lvl < it.level;
          const isSel = sel?.id === it.id;
          return (
            <Pressy key={it.id} onPress={() => choose(it)} style={{ width: '48.5%', height: 150, backgroundColor: C.sage200, borderRadius: 16, padding: 10, alignItems: 'center', justifyContent: 'space-between' }}>
              <WobbleBox mode={eq ? 'solid' : isSel ? 'dashed' : null} seed={it.id.length} />
              <View style={{ flex: 1, justifyContent: 'center', opacity: lk ? 0.45 : 1 }}><ItemArt item={it} size={74} /></View>
              <T v="hand" size={16} numberOfLines={1}>{it.name}</T>
              <T size={11} color={eq ? C.leaf : C.inkSoft}>{eq ? 'In use ✓' : own ? 'Owned' : lk ? `Level ${it.level}` : it.price ? `◎ ${it.price}` : 'Free'}</T>
              {it.rarity && it.rarity !== 'common' && !own ? (
                <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: it.rarity === 'epic' ? C.gold : C.leafBtn, borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1 }}>
                  <T v="uiBold" size={9} color="#fff">{it.rarity}</T>
                </View>
              ) : null}
            </Pressy>
          );
        })}
      </ScrollView>
      {sel ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 26, backgroundColor: C.sage50, borderTopWidth: 1, borderTopColor: C.sage300, gap: 6 }}>
          <T v="note" size={15} color={C.inkSoft} numberOfLines={1}>{sel.name} — {sel.note}</T>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {!owned ? (
              <Btn
                style={{ flex: 1 }}
                label={locked ? `Unlocks at level ${sel.level}` : g.s.coins < sel.price ? `Need ◎ ${sel.price}` : `Buy for ◎ ${sel.price}`}
                disabled={locked || g.s.coins < sel.price}
                onPress={() => { if (g.buy(sel.id)) { haptic('success'); toast(`${sel.name} is yours!`); } }}
              />
            ) : equipped ? (
              OPTIONAL_SLOTS.includes(sel.slot) ? <Btn style={{ flex: 1 }} ghost label="Take it off" onPress={() => { g.equip(sel.slot, null); onPreview(sel.slot, '__none'); }} /> : <Btn style={{ flex: 1 }} ghost label="In use" disabled />
            ) : (
              <Btn style={{ flex: 1 }} label="Use this" onPress={() => { g.equip(sel.slot, sel.id); haptic('success'); }} />
            )}
          </View>
        </View>
      ) : null}
    </Sheet>
  );
}
