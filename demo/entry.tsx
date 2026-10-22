import '@expo/metro-runtime';
import 'react-native-get-random-values';
import { ExpoRoot } from 'expo-router';
import { ctx } from 'expo-router/_ctx';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';
import { LogBox } from 'react-native';

import { PhoneFrame } from './phone-frame';

// 전시 화면에 개발용 경고 상자가 뜨지 않게 한다(개발 모드에서만 나오는 경고다)
LogBox.ignoreAllLogs();

// expo-router/entry 대신 쓰는 데모 진입점. 앱 화면은 그대로 두고 폰 틀만 씌운다.
function App() {
  return <ExpoRoot context={ctx} wrapper={PhoneFrame} />;
}

renderRootComponent(App);
