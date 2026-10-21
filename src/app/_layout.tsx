import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { useWallet } from '@/features/wallet/store';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const status = useWallet((s) => s.status);

  useEffect(() => {
    void useWallet.getState().init();
  }, []);

  useEffect(() => {
    if (status !== 'loading') void SplashScreen.hideAsync();
  }, [status]);

  if (status === 'loading') return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Protected guard={status === 'ready'}>
          <Stack.Screen name="index" options={{ title: 'Stable Wallet' }} />
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
