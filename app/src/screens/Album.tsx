import { Directory, File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Memory } from '../data/quests';
import { itemById } from '../data/shop';
import { useGame } from '../state/store';
import { C, F } from '../theme';
import { Btn, Icon, Paper, Pop, Pressy, Sheet, T, haptic } from '../ui/kit';

const FRAME_SLOTS = ['frame1', 'frame2', 'frame3'] as const;

const fmt = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

async function keepPhoto(uri: string) {
  if (Platform.OS === 'web') return uri;
  try {
    const dir = new Directory(Paths.document, 'memories');
    dir.create({ idempotent: true, intermediates: true });
    const dest = new File(dir, `m${Date.now()}.jpg`);
    await new File(uri).copy(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}

export function NewMemorySheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (m: Memory) => void }) {
  const g = useGame();
  const [photo, setPhoto] = useState<string | undefined>();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => { if (open) { setPhoto(undefined); setTitle(''); setNote(''); } }, [open]);
  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [4, 5] });
    if (!r.canceled && r.assets?.[0]) setPhoto(await keepPhoto(r.assets[0].uri));
  };
  return (
    <Sheet open={open} onClose={onClose} height={0.8} title="New memory">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40, gap: 14 }} keyboardShouldPersistTaps="handled">
        <Pressy onPress={pick} style={{ alignSelf: 'center', backgroundColor: '#FBF8F2', padding: 10, paddingBottom: 30, borderRadius: 4, transform: [{ rotate: '-2deg' }], shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 }}>
          {photo ? <Image source={{ uri: photo }} style={{ width: 180, height: 220 }} contentFit="cover" /> : (
            <View style={{ width: 180, height: 220, backgroundColor: C.sage200, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="album" size={60} />
              <T v="hand" size={17} color={C.sageInk}>add a photo</T>
              <T size={11} color={C.inkSoft}>(optional)</T>
            </View>
          )}
        </Pressy>
        <TextInput value={title} onChangeText={setTitle} placeholder="What happened?" placeholderTextColor={C.inkFaint} maxLength={40}
          style={{ backgroundColor: C.sage100, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: F.display, fontSize: 22, color: C.ink }} />
        <TextInput value={note} onChangeText={setNote} placeholder="One sentence about this day…" placeholderTextColor={C.inkFaint} multiline maxLength={240}
          style={{ backgroundColor: C.sage100, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: F.note, fontSize: 19, color: C.ink, minHeight: 90, textAlignVertical: 'top' }} />
        <T size={11} color={C.inkSoft}>Photos stay on this phone only. Nothing is uploaded.</T>
        <Btn label="Keep this memory" disabled={!title.trim()} onPress={() => { const m = g.addMemory({ title: title.trim(), note: note.trim(), photo }); haptic('success'); onSaved(m); }} />
      </ScrollView>
    </Sheet>
  );
}

export function MemoryPop({ mem, onClose, onHang }: { mem: Memory | null; onClose: () => void; onHang: (m: Memory, slot: typeof FRAME_SLOTS[number]) => void }) {
  const g = useGame();
  const [ask, setAsk] = useState(false);
  useEffect(() => { setAsk(false); }, [mem]);
  if (!mem) return null;
  const frames = FRAME_SLOTS.filter(s => g.s.equipped[s]);
  const hungOn = FRAME_SLOTS.find(s => g.s.frameMem[s] === mem.id);
  return (
    <Pop open={!!mem} onClose={onClose}>
      <View style={{ backgroundColor: '#FBF8F2', padding: 8, paddingBottom: 14, transform: [{ rotate: '1.5deg' }], marginBottom: 10 }}>
        {mem.photo ? <Image source={{ uri: mem.photo }} style={{ width: 220, height: 250 }} contentFit="cover" /> : (
          <View style={{ width: 220, height: 150, backgroundColor: C.sage200, alignItems: 'center', justifyContent: 'center' }}><Icon name="album" size={70} /></View>
        )}
      </View>
      <T v="display" size={26} style={{ textAlign: 'center' }}>{mem.title}</T>
      <T size={12} color={C.inkSoft}>{fmt(mem.at)}</T>
      {mem.note ? <T v="note" size={18} style={{ textAlign: 'center', marginTop: 8 }}>{mem.note}</T> : null}
      <View style={{ width: '100%', gap: 8, marginTop: 14 }}>
        {!ask ? (
          <>
            <Btn label={hungOn ? 'Move to another frame' : 'Hang it on the wall'} onPress={() => setAsk(true)} disabled={!frames.length} />
            {!frames.length ? <T size={12} color={C.inkSoft} style={{ textAlign: 'center' }}>Buy a frame in the shop first.</T> : null}
            {hungOn ? <Btn ghost label="Take it down" onPress={() => { g.hang(null, hungOn); onClose(); }} /> : null}
            <Pressable onPress={() => { g.deleteMemory(mem.id); onClose(); }} style={{ alignItems: 'center', padding: 6 }}><T size={13} color={C.rust}>Delete memory</T></Pressable>
          </>
        ) : (
          <>
            <T v="hand" size={18} style={{ textAlign: 'center' }}>Which frame?</T>
            {frames.map(s => {
              const it = itemById(g.s.equipped[s]!);
              const cur = g.s.memories.find(m => m.id === g.s.frameMem[s]);
              return <Btn key={s} ghost label={`${it?.name}${cur ? ` (replaces "${cur.title}")` : ''}`} onPress={() => onHang(mem, s)} />;
            })}
          </>
        )}
      </View>
    </Pop>
  );
}

export function AlbumScreen({ open, onClose, onNew, onOpenMem }: { open: boolean; onClose: () => void; onNew: () => void; onOpenMem: (m: Memory) => void }) {
  const g = useGame();
  const ins = useSafeAreaInsets();
  const mems = g.s.memories;
  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <Paper style={{ flex: 1 }}>
        <View style={{ paddingTop: ins.top + 10, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <T v="display" size={32}>Memories</T>
            <T v="note" size={16} color={C.inkSoft}>{mems.length ? `${mems.length} little moments, kept safe.` : 'Real life, pinned to the wall.'}</T>
          </View>
          <Pressable onPress={onClose} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.sage50, alignItems: 'center', justifyContent: 'center' }}>
            <T v="hand" size={22}>✕</T>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 140, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 18 }}>
          {!mems.length ? (
            <View style={{ width: '100%', alignItems: 'center', marginTop: 40, gap: 10 }}>
              <Icon name="album" size={120} />
              <T v="hand" size={20} style={{ textAlign: 'center' }}>No memories yet.</T>
              <T v="note" size={17} color={C.inkSoft} style={{ textAlign: 'center' }}>Add a photo from a trip, a dinner, a walk. It can hang on the wall and Noodle will bring it up some mornings.</T>
            </View>
          ) : mems.map((m, i) => (
            <Pressy key={m.id} onPress={() => onOpenMem(m)} style={{ width: '47%', backgroundColor: '#FBF8F2', padding: 8, paddingBottom: 10, transform: [{ rotate: `${i % 2 ? 1.6 : -1.4}deg` }], shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
              {m.photo ? <Image source={{ uri: m.photo }} style={{ width: '100%', aspectRatio: 0.85 }} contentFit="cover" /> : (
                <View style={{ width: '100%', aspectRatio: 0.85, backgroundColor: C.sage200, alignItems: 'center', justifyContent: 'center' }}><Icon name="album" size={50} /></View>
              )}
              <T v="hand" size={16} numberOfLines={1} style={{ marginTop: 6 }}>{m.title}</T>
              <T size={11} color={C.inkSoft}>{fmt(m.at)}</T>
            </Pressy>
          ))}
        </ScrollView>
        <View style={{ position: 'absolute', left: 18, right: 18, bottom: ins.bottom + 18 }}>
          <Btn label="+ New memory" onPress={onNew} />
        </View>
      </Paper>
    </Modal>
  );
}
