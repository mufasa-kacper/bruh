import { Gaegu_400Regular, Gaegu_700Bold } from '@expo-google-fonts/gaegu';
import { GochiHand_400Regular } from '@expo-google-fonts/gochi-hand';
import { PatrickHand_400Regular } from '@expo-google-fonts/patrick-hand';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Home } from './src/screens/Home';
import { Onboarding } from './src/screens/Profile';
import { GameProvider, useGame } from './src/state/store';
import { Paper } from './src/ui/kit';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Root() {
  const g = useGame();
  if (!g.ready) return <View style={{ flex: 1, backgroundColor: '#EAE3E1' }} />;
  if (!g.s.onboarded) {
    return (
      <Paper style={{ flex: 1 }}>
        <Onboarding onDone={(name, focus) => g.set(s => ({ ...s, name, focus, onboarded: true }))} />
      </Paper>
    );
  }
  return <Home />;
}

export default function App() {
  const [loaded] = useFonts({ GochiHand_400Regular, PatrickHand_400Regular, Gaegu_400Regular, Gaegu_700Bold });
  useEffect(() => { if (loaded) SplashScreen.hideAsync().catch(() => {}); }, [loaded]);
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <GameProvider>
        <StatusBar style="dark" />
        <Root />
      </GameProvider>
    </SafeAreaProvider>
  );
}
