import '@expo/metro-runtime';
import 'react-native-get-random-values';
import { ExpoRoot } from 'expo-router';
import { ctx } from 'expo-router/_ctx';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';
import { LogBox } from 'react-native';

import { saveWallet } from '@/core/keys/vault';

import { DEMO } from './data';
import { mode } from './mode';
import { PhoneFrame } from './phone-frame';

// 전시 화면에 개발용 경고 상자가 뜨지 않게 한다(개발 모드에서만 나오는 경고다)
LogBox.ignoreAllLogs();

// 웹 스크롤바를 숨긴다. 휴대폰처럼 보이게 하고, 스크롤바가 뒤늦게 생기며 화면 너비가 줄지 않게 한다
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = '*{scrollbar-width:none}*::-webkit-scrollbar{display:none}';
  document.head.appendChild(style);
}

// expo-router/entry 대신 쓰는 데모 진입점. 앱 화면은 그대로 두고 폰 틀만 씌운다.
function App() {
  return <ExpoRoot context={ctx} wrapper={PhoneFrame} />;
}

// 처음부터 지갑이 있는 상태면 예시 문구로 지갑을 만들어 둔 뒤 연다. 실제 vault 코드가 가짜 보안 저장소에 저장한다
const seeded = mode === 'ready' || mode === 'found' ? saveWallet(DEMO.phrase) : Promise.resolve();
void seeded.then(() => renderRootComponent(App));
