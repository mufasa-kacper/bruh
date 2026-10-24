# Little Life

A cozy, hand-drawn life sim: log what you really did, and **Noodle** acts it out in a little painted world.
Earn coins, decorate the flat, unlock places on the town map, hang your real photos on the wall.

## Try it on your phone (Expo Go)

1. Install **Expo Go** from the App Store / Play Store (it must support Expo SDK 58).
2. On your computer (Node 20+):
   ```bash
   git clone <this repo> && cd bruh/app
   npm install
   npx expo start
   ```
3. Scan the QR code with the iPhone camera (or from Expo Go on Android). Phone and computer on the same Wi-Fi;
   if that is a problem use `npx expo start --tunnel`.

## TestFlight

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p ios --profile production
npx eas-cli@latest submit -p ios
```
(Bundle id `app.littlelife.noodle` in `app.json`; change it to your own if needed.)

## Testing shortcuts

Profile (tap **Lv ›** top-left) → **Tester tools**: `+1 level` (unlocks places on the map: Café Lv3,
Park Lv5, Field Lv7, Market Lv10, Lake Lv14), `+200 coins`, `+gift`. Remove before release.
Also in Profile: **How Noodle is drawn** → *Soft paint* or *Crayon*.

## How it is built

- Expo SDK 58 / React Native, Reanimated, expo-image, AsyncStorage (all local, no account).
- `src/scene/` — the painted scene: `layout.ts` (where every object and station is, per place),
  `director.ts` (Noodle's brain: walking, travelling, acting out activities at 7.5 drawings/s),
  `Character.tsx` (frame-by-frame poses with 3 "line boil" variants, hats, glasses), `World.tsx`.
- `src/data/` — activities, shop items, quests & badges, map places.
- `src/game/rules.ts` — XP curve, rewards, forgiving streaks (cozy days), quest rotation.
- `assets/img/` — all illustrations, generated one object at a time with Picsart (gpt-image-2.5-flare),
  trimmed/tone-unified and given boil variants by a script. `scripts/gen_assets.py` rebuilds `src/assets.ts`.
