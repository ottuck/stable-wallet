import { useLocale, type Locale } from '@/features/i18n';

// 데모에만 나오는 문구. 앱 문구(src/features/i18n/messages.ts)와 섞지 않는다.
const ko = {
  bannerLead: '예시 데이터로 보는 데모예요.',
  bannerBody: '실제 돈은 오가지 않으니 보내기·받기·스캔을 마음껏 눌러 보세요.',
  notCopied: '데모에서는 복사하지 않습니다',
  notShared: '데모에서는 주소를 공유하지 않습니다',
  noExplorer: '데모 거래라 탐색기에 기록이 없습니다',
  importNote:
    '데모에서는 복구 문구를 입력할 수 없어 위 예시 문구로 가져옵니다. 실제 복구 문구는 어떤 웹사이트에도 입력하지 마세요.',
};

const en: typeof ko = {
  bannerLead: 'A demo with sample data.',
  bannerBody: 'No real money moves, so try sending, receiving and scanning freely.',
  notCopied: 'Copying is off in the demo',
  notShared: 'Addresses are not shared in the demo',
  noExplorer: 'Demo transactions are not on the block explorer',
  importNote:
    'The demo cannot take a typed recovery phrase, so it imports the example above. Never enter a real recovery phrase on any website.',
};

export type DemoText = typeof ko;
export type DemoNoticeKey = 'notCopied' | 'notShared' | 'noExplorer';

const catalogs: Record<Locale, DemoText> = { ko, en };

export function useDemoText(): DemoText {
  return catalogs[useLocale()];
}
