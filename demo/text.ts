import { useLocale, type Locale } from '@/features/i18n';

// 데모에만 나오는 문구. 앱 문구(src/features/i18n/messages.ts)와 섞지 않는다.
const ko = {
  banner: 'DEMO · 가짜 데이터, 실제 자산 아님',
  notCopied: '데모에서는 주소를 복사하지 않습니다',
  notShared: '데모에서는 주소를 공유하지 않습니다',
  noExplorer: '데모 거래라 탐색기에 기록이 없습니다',
  importNote:
    '데모에서는 복구 문구를 입력할 수 없어 위 예시 문구로 가져옵니다. 실제 복구 문구는 어떤 웹사이트에도 입력하지 마세요.',
  scanSample: '데모: 예시 QR 읽기',
  scanNote: '데모에서는 카메라를 켜지 않습니다',
  qrBadge: 'DEMO',
  qrNote: '보내지 마세요',
};

const en: typeof ko = {
  banner: 'DEMO · fake data, no real assets',
  notCopied: 'Addresses are not copied in the demo',
  notShared: 'Addresses are not shared in the demo',
  noExplorer: 'Demo transactions are not on the block explorer',
  importNote:
    'The demo cannot take a typed recovery phrase, so it imports the example above. Never enter a real recovery phrase on any website.',
  scanSample: 'Demo: read a sample QR',
  scanNote: 'The demo never turns on your camera',
  qrBadge: 'DEMO',
  qrNote: 'Do not send',
};

export type DemoText = typeof ko;
export type DemoNoticeKey = 'notCopied' | 'notShared' | 'noExplorer';

const catalogs: Record<Locale, DemoText> = { ko, en };

export function useDemoText(): DemoText {
  return catalogs[useLocale()];
}
