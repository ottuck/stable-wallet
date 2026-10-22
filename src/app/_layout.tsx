import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium';
import { IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono/600SemiBold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { HomeBack } from '@/features/home-back';
import { useT } from '@/features/i18n';
import { useColors } from '@/features/ui';
import { useWallet } from '@/features/wallet/store';

void SplashScreen.preventAutoHideAsync();

/** 앞 화면이 없으면(웹 새로고침 등) 뒤로 가기 대신 홈으로 가는 버튼을 보인다 */
const withHomeBack =
  (title: string) =>
  ({ navigation }: { navigation: { canGoBack: () => boolean } }) => ({
    title,
    headerLeft: navigation.canGoBack() ? undefined : () => <HomeBack />,
  });

export default function RootLayout() {
  const c = useColors();
  const t = useT();
  const base = useColorScheme() === 'dark' ? DarkTheme : DefaultTheme;
  // 헤더·배경은 앱 팔레트를 쓴다
  const theme = {
    ...base,
    colors: { ...base.colors, background: c.bg, card: c.bg, text: c.text, primary: c.accent },
  };
  const status = useWallet((s) => s.status);
  const [fontsLoaded, fontError] = useFonts({ IBMPlexMono_500Medium, IBMPlexMono_600SemiBold });
  // 글꼴을 못 읽어도 시스템 글꼴로 연다(스플래시에 갇히지 않게)
  const ready = status !== 'loading' && (fontsLoaded || fontError != null);

  useEffect(() => {
    void useWallet.getState().init();
  }, []);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShadowVisible: false }}>
        <Stack.Protected guard={status === 'ready'}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="send" options={withHomeBack(t.nav.send)} />
          <Stack.Screen name="send-review" options={withHomeBack(t.nav.review)} />
          <Stack.Screen
            name="send-status"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen name="receive" options={withHomeBack(t.nav.receive)} />
          <Stack.Screen
            name="scan"
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
        </Stack.Protected>
        <Stack.Protected guard={status === 'empty'}>
          <Stack.Screen name="welcome" options={{ title: 'Henry Wallet' }} />
          <Stack.Screen name="create" options={{ title: t.nav.create }} />
          <Stack.Screen name="import" options={{ title: t.nav.import }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'found'}>
          <Stack.Screen name="found" options={{ title: t.nav.found }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'error'}>
          <Stack.Screen name="unavailable" options={{ title: 'Henry Wallet' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
