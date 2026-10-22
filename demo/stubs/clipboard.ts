import { DEMO } from '../data';
import { showNotice } from '../notice';

// expo-clipboard 대신. 방문자의 실제 클립보드는 읽지도 쓰지도 않는다.
// 붙여넣기는 예시 받는 주소를 돌려주고, 복사는 데모 주소가 밖으로 나가지 않게 안내만 띄운다.

export async function getStringAsync(): Promise<string> {
  return DEMO.recipient;
}

export async function setStringAsync(_text: string): Promise<boolean> {
  showNotice('notCopied');
  return true;
}
