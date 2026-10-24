import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import Animated, {
  Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Ellipse, G, Path } from 'react-native-svg';
import { TEX, UI, UIName } from '../assets';
import { C, F, R } from '../theme';

export const haptic = (k: 'light' | 'success' | 'warn' = 'light') => {
  if (Platform.OS === 'web') return;
  if (k === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  else Haptics.notificationAsync(k === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
};

type V = 'display' | 'hand' | 'note' | 'ui' | 'uiBold';
export function T({ v = 'ui', size, color = C.ink, style, ...p }: TextProps & { v?: V; size?: number; color?: string }) {
  const base: TextStyle =
    v === 'display' ? { fontFamily: F.display, fontSize: size ?? 26 } :
    v === 'hand' ? { fontFamily: F.hand, fontSize: size ?? 18 } :
    v === 'note' ? { fontFamily: F.note, fontSize: size ?? 18 } :
    v === 'uiBold' ? { fontSize: size ?? 14, fontWeight: '600' } :
    { fontSize: size ?? 14 };
  return <Text {...p} style={[base, { color }, style]} />;
}

// Warm paper behind everything: a scanned paper texture tiled at low contrast.
export function Paper({ style, children }: { style?: ViewStyle; children?: React.ReactNode }) {
  return (
    <View style={[{ backgroundColor: C.paper, overflow: 'hidden' }, style]}>
      <Image source={TEX.paper.src} style={[StyleSheet.absoluteFill, { opacity: 0.55 }]} contentFit="cover" />
      {children}
    </View>
  );
}

export function Icon({ name, size = 24, style }: { name: UIName; size?: number; style?: any }) {
  const a = UI[name];
  const w = a.w >= a.h ? size : (size * a.w) / a.h;
  const h = a.w >= a.h ? (size * a.h) / a.w : size;
  return <Image source={a.src} style={[{ width: w, height: h }, style]} contentFit="contain" />;
}

// A hand-drawn wobbly ellipse/rect outline, used for scribbled CTAs and selected tiles.
export function Scribble({ w, h, color = C.sky, dashed = false, seed = 1, strokeWidth = 3, round = true }: { w: number; h: number; color?: string; dashed?: boolean; seed?: number; strokeWidth?: number; round?: boolean }) {
  const pts: string[] = [];
  const n = 26;
  let r = seed * 9301 + 49297;
  const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  for (let i = 0; i <= n + 2; i++) {
    const t = (i / n) * Math.PI * 2 - 0.3;
    const j = 1 + (rnd() - 0.5) * 0.05;
    let x: number, y: number;
    if (round) { x = w / 2 + Math.cos(t) * (w / 2 - 4) * j; y = h / 2 + Math.sin(t) * (h / 2 - 4) * j; }
    else {
      const k = Math.max(Math.abs(Math.cos(t)), Math.abs(Math.sin(t)));
      const sq = 0.35;
      x = w / 2 + (Math.cos(t) / (k * (1 - sq) + sq)) * (w / 2 - 5) * j * 0.98;
      y = h / 2 + (Math.sin(t) / (k * (1 - sq) + sq)) * (h / 2 - 5) * j * 0.98;
      x = Math.max(3, Math.min(w - 3, x)); y = Math.max(3, Math.min(h - 3, y));
    }
    pts.push(`${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return (
    <Svg width={w} height={h} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      <Path d={pts.join(' ')} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dashed ? '7 6' : undefined} />
    </Svg>
  );
}

const OUTER_KEYS = ['width', 'height', 'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'position', 'left', 'right', 'top', 'bottom', 'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical', 'alignSelf', 'zIndex'];

export function Pressy({ onPress, style, children, disabled, scaleTo = 0.95 }: { onPress?: () => void; style?: any; children: React.ReactNode; disabled?: boolean; scaleTo?: number }) {
  const s = useSharedValue(1);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const flat = StyleSheet.flatten(style) ?? {};
  const outer: any = {}, inner: any = {};
  Object.entries(flat).forEach(([k, v]) => { (OUTER_KEYS.includes(k) ? outer : inner)[k] = v; });
  const sized = outer.width !== undefined || outer.height !== undefined || outer.flex !== undefined;
  return (
    <Pressable
      disabled={disabled}
      style={outer}
      onPressIn={() => { s.value = withSpring(scaleTo, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { s.value = withSpring(1, { damping: 9, stiffness: 260 }); }}
      onPress={() => { haptic(); onPress?.(); }}
    >
      <Animated.View style={[inner, sized && { flex: 1, width: '100%' }, st, disabled && { opacity: 0.45 }]}>{children}</Animated.View>
    </Pressable>
  );
}

// Tile with a wobbly hand-drawn border that sizes itself to the tile.
export function WobbleBox({ mode, seed = 1, radius = 16 }: { mode: 'solid' | 'dashed' | null; seed?: number; radius?: number }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius }]} onLayout={e => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {mode && box.w ? <Scribble w={box.w} h={box.h} color={mode === 'solid' ? C.leaf : C.sageInk} dashed={mode === 'dashed'} round={false} seed={seed} strokeWidth={2.6} /> : null}
    </View>
  );
}

// Primary button with a physical "key" feel: inner bottom edge shrinks on press.
export function Btn({ label, onPress, ghost, disabled, small, icon, style }: { label: string; onPress?: () => void; ghost?: boolean; disabled?: boolean; small?: boolean; icon?: React.ReactNode; style?: ViewStyle }) {
  const [down, setDown] = useState(false);
  const h = small ? 40 : 52;
  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      onPress={() => { haptic(); onPress?.(); }}
      style={[{ opacity: disabled ? 0.45 : 1 }, style]}
    >
      <View style={{
        height: h, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 20,
        backgroundColor: ghost ? 'transparent' : down ? C.leafBtnDn : C.leafBtn,
        borderWidth: ghost ? 1.5 : 0, borderColor: C.sageInk,
        borderBottomWidth: ghost ? 1.5 : down ? 1 : 4, borderBottomColor: ghost ? C.sageInk : C.leafBtnDn,
        transform: [{ translateY: down ? 2 : 0 }],
      }}>
        {icon}
        <T v="uiBold" size={small ? 14 : 16} color={ghost ? C.sageInk : '#F6F4EE'}>{label}</T>
      </View>
    </Pressable>
  );
}

export function Progress({ value, max, color = C.leafBtn, height = 8, track = C.sage300 }: { value: number; max: number; color?: string; height?: number; track?: string }) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

export function Tabs<K extends string>({ tabs, value, onChange, dots }: { tabs: { id: K; label: string }[]; value: K; onChange: (k: K) => void; dots?: Partial<Record<K, boolean>> }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: C.sage300, borderRadius: 12, padding: 3 }}>
      {tabs.map(t => {
        const on = t.id === value;
        return (
          <Pressable key={t.id} onPress={() => { haptic(); onChange(t.id); }} style={{ flex: 1 }}>
            <View style={[{ paddingVertical: 7, borderRadius: 9, alignItems: 'center' }, on && { backgroundColor: C.sage50, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }]}>
              <T v="uiBold" size={13} color={on ? C.ink : C.sageInk}>{t.label}</T>
              {dots?.[t.id] ? <View style={{ position: 'absolute', top: 4, right: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: C.leaf }} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// Bottom sheet: sage, rounded, slides up with a springy overshoot. The scene stays visible above.
export function Sheet({ open, onClose, children, height = 0.62, title, right }: { open: boolean; onClose: () => void; children: React.ReactNode; height?: number; title?: string; right?: React.ReactNode }) {
  const ins = useSafeAreaInsets();
  const y = useSharedValue(800);
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) { setMounted(true); y.value = 800; y.value = withSpring(0, { damping: 17, stiffness: 140, mass: 0.9 }); }
    else if (mounted) { y.value = withTiming(900, { duration: 260, easing: Easing.in(Easing.quad) }); const t = setTimeout(() => setMounted(false), 270); return () => clearTimeout(t); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  if (!mounted) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View style={[{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: `${height * 100}%`, backgroundColor: C.sage50,
        borderTopLeftRadius: R.sheet, borderTopRightRadius: R.sheet, paddingBottom: ins.bottom,
        shadowColor: '#2d2a20', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: -4 }, elevation: 12,
      }, st]}>
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View style={{ width: 38, height: 5, borderRadius: 3, backgroundColor: C.sage300 }} />
        </View>
        {title ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 6, paddingBottom: 6 }}>
            <T v="display" size={26} style={{ flex: 1 }}>{title}</T>
            {right}
          </View>
        ) : null}
        {children}
      </Animated.View>
    </View>
  );
}

// Centered modal card (reward, details). Scale .85 → 1 with spring.
export function Pop({ open, onClose, children, white }: { open: boolean; onClose?: () => void; children: React.ReactNode; white?: boolean }) {
  const s = useSharedValue(0.85);
  useEffect(() => { if (open) { s.value = 0.85; s.value = withSpring(1, { damping: 11, stiffness: 170 }); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(35,30,28,0.35)', alignItems: 'center', justifyContent: 'center', padding: 24 }} onPress={onClose}>
        <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 380 }}>
          <Animated.View style={[{ backgroundColor: white ? '#FFFFFF' : C.sage50, borderRadius: 26, padding: 22, alignItems: 'center' }, st]}>
            {children}
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Rotating sun-ray burst behind prizes (14 s per turn).
export function Burst({ size = 220 }: { size?: number }) {
  const r = useSharedValue(0);
  useEffect(() => { r.value = withRepeat(withTiming(360, { duration: 14000, easing: Easing.linear }), -1, false); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  const rays = 16, c = size / 2, r0 = size * 0.2, r1 = size * 0.49;
  const d = Array.from({ length: rays }, (_, i) => {
    const a = (i / rays) * Math.PI * 2, b = a + 0.12;
    const p = (ang: number, rad: number) => `${(c + Math.cos(ang) * rad).toFixed(1)} ${(c + Math.sin(ang) * rad).toFixed(1)}`;
    return `M${p(a, r0)} L${p(a - 0.02, r1)} L${p(b + 0.03, r1 - 6)} L${p(b, r0)} Z`;
  }).join(' ');
  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size }, st]} pointerEvents="none">
      <Svg width={size} height={size}>
        <G opacity={0.55}><Path d={d} fill={C.sun} /></G>
        <Ellipse cx={c} cy={c} rx={r0 + 6} ry={r0 + 4} fill={C.sun} opacity={0.25} />
      </Svg>
    </Animated.View>
  );
}

// Dark ink pill toast that drops from the top.
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 2600); return () => clearTimeout(t); }, [msg]);
  const node = msg ? (
    <Animated.View entering={FadeIn.springify()} exiting={FadeOut} pointerEvents="none" style={{ position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center', zIndex: 99 }}>
      <View style={{ backgroundColor: C.ink, borderRadius: R.pill, paddingHorizontal: 18, paddingVertical: 10, maxWidth: '86%' }}>
        <T v="hand" size={17} color={C.paper}>{msg}</T>
      </View>
    </Animated.View>
  ) : null;
  return { toast: setMsg, toastNode: node };
}

export function CoinPill({ value, small }: { value: number; small?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon name="coin" size={small ? 16 : 20} />
      <T v="hand" size={small ? 16 : 19}>{value}</T>
    </View>
  );
}
