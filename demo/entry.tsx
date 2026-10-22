import '@expo/metro-runtime';
import 'react-native-get-random-values';
import { ExpoRoot } from 'expo-router';
import { ctx } from 'expo-router/_ctx';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

import { PhoneFrame } from './phone-frame';

// expo-router/entry 대신 쓰는 데모 진입점. 앱 화면은 그대로 두고 폰 틀만 씌운다.
function App() {
  return <ExpoRoot context={ctx} wrapper={PhoneFrame} />;
}

renderRootComponent(App);
