import type * as Real from '@/core/keys/mnemonic';

import { DEMO } from '../data';

// 실제 파일(src/core/keys/mnemonic.ts)은 새 지갑마다 무작위 문구를 만든다.
// 공개 데모에서 진짜로 쓸 수 있는 문구를 만들지 않도록, 새 지갑은 늘 정해진 예시 문구를 보여준다.
export * from '@/core/keys/mnemonic';

export const generateMnemonic: typeof Real.generateMnemonic = () => DEMO.phrase;
