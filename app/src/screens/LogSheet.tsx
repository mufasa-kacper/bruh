import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { CATEGORIES, Category, DURATIONS } from '../data/activities';
import { C, F } from '../theme';
import { Btn, Icon, Pressy, Scribble, Sheet, T, Tabs, haptic } from '../ui/kit';

export function LogSheet({ open, onClose, onLog, focus, heroName }: { open: boolean; onClose: () => void; onLog: (actId: string, min: number, note?: string) => void; focus: string[]; heroName: string }) {
  const [cat, setCat] = useState<Category | null>(null);
  const [act, setAct] = useState<string | null>(null);
  const [min, setMin] = useState(10);
  const [note, setNote] = useState('');

  useEffect(() => { if (open) { setCat(null); setAct(null); setMin(10); setNote(''); } }, [open]);

  const cats = [...CATEGORIES].sort((a, b) => Number(focus.includes(b.id)) - Number(focus.includes(a.id)));

  return (
    <Sheet open={open} onClose={onClose} height={0.66} title={cat ? cat.label : 'What did you do?'}
      right={cat ? <Pressable onPress={() => { haptic(); setCat(null); setAct(null); }}><T v="hand" size={18} color={C.sageInk}>‹ back</T></Pressable> : null}>
      {!cat ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <T v="note" size={17} color={C.inkSoft} style={{ width: '100%', paddingHorizontal: 6, marginBottom: 2 }}>Pick a kind of thing. {heroName} will act it out.</T>
          {cats.map(c => (
            <View key={c.id} style={{ width: '48%' }}>
              <Pressy onPress={() => setCat(c)} style={{ backgroundColor: C.sage200, borderRadius: 16, padding: 12, height: 118, justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={c.icon} size={42} />
                  </View>
                  {focus.includes(c.id) ? <View style={{ backgroundColor: C.leafBtn, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 }}><T v="uiBold" size={10} color="#fff">focus</T></View> : null}
                </View>
                <View>
                  <T v="hand" size={20}>{c.label}</T>
                  <T size={12} color={C.inkSoft}>{c.blurb}</T>
                </View>
              </Pressy>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30, gap: 14 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {cat.activities.map(a => {
              const on = act === a.id;
              return (
                <Pressy key={a.id} onPress={() => setAct(a.id)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: on ? C.sage300 : C.sage200 }}>
                  {on ? <Scribble w={a.label.length * 9 + 40} h={44} color={C.leaf} seed={a.id.length} round={false} strokeWidth={2.5} /> : null}
                  <T v="hand" size={18} style={{ minWidth: a.label.length * 9 + 12 }}>{a.label}</T>
                </Pressy>
              );
            })}
          </View>
          <View>
            <T v="uiBold" size={12} color={C.sageInk} style={{ marginBottom: 6, letterSpacing: 0.6 }}>HOW LONG?</T>
            <Tabs tabs={DURATIONS.map(d => ({ id: String(d.min), label: d.label }))} value={String(min)} onChange={v => setMin(Number(v))} />
          </View>
          <View>
            <T v="uiBold" size={12} color={C.sageInk} style={{ marginBottom: 6, letterSpacing: 0.6 }}>A TINY NOTE (OPTIONAL)</T>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. ran to the bakery and back"
              placeholderTextColor={C.inkFaint}
              style={{ backgroundColor: C.sage100, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: F.hand, fontSize: 18, color: C.ink }}
              maxLength={80}
            />
          </View>
          <Btn label={act ? 'Done! Show me' : 'Pick what you did'} disabled={!act} onPress={() => act && onLog(act, min, note.trim() || undefined)} />
        </ScrollView>
      )}
    </Sheet>
  );
}
