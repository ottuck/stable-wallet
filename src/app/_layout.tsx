import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium';
import { IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono/600SemiBold';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { colors } from '@/features/ui';
import { useWallet } from '@/features/wallet/store';

void SplashScreen.preventAutoHideAsync();

// D안은 밝은 테마 하나만 쓴다
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    primary: colors.accent,
  },
};

export default function RootLayout() {
  const status = useWallet((s) => s.status);
  const [fontsLoaded] = useFonts({ IBMPlexMono_500Medium, IBMPlexMono_600SemiBold });
  const ready = status !== 'loading' && fontsLoaded;

  useEffect(() => {
    void useWallet.getState().init();
  }, []);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShadowVisible: false }}>
        <Stack.Protected guard={status === 'ready'}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="send" options={{ title: '보내기' }} />
          <Stack.Screen name="send-review" options={{ title: '서명 전 확인' }} />
          <Stack.Screen
            name="send-status"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen name="receive" options={{ title: '받기' }} />
          <Stack.Screen
            name="scan"
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
        </Stack.Protected>
        <Stack.Protected guard={status === 'empty'}>
          <Stack.Screen name="welcome" options={{ title: 'Stable Wallet' }} />
          <Stack.Screen name="create" options={{ title: '새 지갑' }} />
          <Stack.Screen name="import" options={{ title: '지갑 가져오기' }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'found'}>
          <Stack.Screen name="found" options={{ title: '기존 지갑' }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'error'}>
          <Stack.Screen name="unavailable" options={{ title: 'Stable Wallet' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
