import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CHARS, SCENES, UI } from '../assets';
import { Place, PLACES } from '../data/places';
import { useGame } from '../state/store';
import { C } from '../theme';
import { Btn, Icon, Pop, T } from '../ui/kit';

export function MapScreen({ open, onClose, here, onGo, hero }: { open: boolean; onClose: () => void; here: 'home' | 'garden'; onGo: (p: 'home' | 'garden') => void; hero: string }) {
  const { width } = useWindowDimensions();
  const ins = useSafeAreaInsets();
  const g = useGame();
  const [info, setInfo] = useState<Place | null>(null);
  const H = width * (SCENES.map.h / SCENES.map.w);
  const lvl = g.level.level;
  const pin = CHARS[hero]?.wave ?? CHARS[hero]?.happy ?? CHARS.noodle.idle;

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.paper }}>
        <ScrollView contentOffset={{ x: 0, y: H * 0.45 }} contentContainerStyle={{ width, height: H }}>
          <Image source={SCENES.map.src} style={{ width, height: H }} contentFit="cover" />
          {PLACES.map(p => {
            const locked = lvl < p.level;
            const cx = (p.x / 100) * width, cy = (p.y / 100) * H;
            if (!locked) return null;
            const r = (p.r / 100) * width;
            return (
              <View key={p.id + 'fog'} pointerEvents="none" style={{ position: 'absolute', left: cx - r * 1.3, top: cy - r * 0.95, width: r * 2.6, height: r * 1.9 }}>
                <Image source={UI.fog.src} style={{ position: 'absolute', left: 0, top: r * 0.2, width: r * 1.7, height: r * 0.95 }} contentFit="contain" />
                <Image source={UI.fog.src} style={{ position: 'absolute', left: r * 0.8, top: r * 0.05, width: r * 1.8, height: r * 1.0 }} contentFit="contain" />
                <Image source={UI.fog.src} style={{ position: 'absolute', left: r * 0.25, top: r * 0.7, width: r * 2.1, height: r * 1.15 }} contentFit="contain" />
                <Image source={UI.fog.src} style={{ position: 'absolute', left: r * 0.5, top: r * 0.35, width: r * 1.6, height: r * 0.9, opacity: 0.9 }} contentFit="contain" />
              </View>
            );
          })}
          {PLACES.map(p => {
            const locked = lvl < p.level;
            const cx = (p.x / 100) * width, cy = (p.y / 100) * H;
            const isHere = p.id === here;
            return (
              <Pressable key={p.id} onPress={() => setInfo(p)} style={{ position: 'absolute', left: cx - 70, top: cy - 22, width: 140, alignItems: 'center' }}>
                {isHere ? (
                  <Image source={pin.frames[0]} style={{ width: 34, height: 34 * (pin.h / pin.w), position: 'absolute', bottom: 34 }} contentFit="contain" />
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: locked ? 'rgba(234,227,225,0.9)' : C.sage50, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1.5, borderColor: locked ? '#CFC6BE' : C.leafBtn }}>
                  {locked ? <Icon name="lock" size={15} /> : null}
                  <T v="hand" size={16} color={locked ? C.inkSoft : C.ink}>{p.name}</T>
                  {locked ? <T size={11} color={C.inkSoft}>Lv {p.level}</T> : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={{ position: 'absolute', top: ins.top + 8, left: 16, right: 16, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(238,242,232,0.94)', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 }}>
            <T v="display" size={24}>Little Town</T>
            <T v="note" size={15} color={C.inkSoft}>Level up to clear the fog. You are level {lvl}.</T>
          </View>
          <Pressable onPress={onClose} style={{ marginLeft: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: C.sage50, alignItems: 'center', justifyContent: 'center' }}>
            <T v="hand" size={22}>✕</T>
          </Pressable>
        </View>
      </View>
      <Pop open={!!info} onClose={() => setInfo(null)}>
        {info ? (
          <>
            <T v="display" size={28}>{info.name}</T>
            <T v="note" size={17} color={C.inkSoft} style={{ textAlign: 'center', marginVertical: 8 }}>{info.blurb}</T>
            {lvl < info.level ? (
              <>
                <Icon name="lock" size={48} />
                <T size={13} color={C.sageInk} style={{ marginVertical: 10 }}>Reach level {info.level} to explore. ({info.level - lvl} to go)</T>
                <Btn label="Okay" ghost onPress={() => setInfo(null)} style={{ width: '100%' }} />
              </>
            ) : info.playable ? (
              <Btn label={info.id === here ? 'You are here' : `Go to ${info.name}`} disabled={info.id === here} style={{ width: '100%' }} onPress={() => { setInfo(null); onGo(info.id as 'home' | 'garden'); onClose(); }} />
            ) : (
              <>
                <T v="note" size={16} style={{ textAlign: 'center', marginBottom: 12 }}>Unlocked! Noodle is still painting the inside. It opens in the next update.</T>
                <Btn label="Can't wait" ghost onPress={() => setInfo(null)} style={{ width: '100%' }} />
              </>
            )}
          </>
        ) : null}
      </Pop>
    </Modal>
  );
}
