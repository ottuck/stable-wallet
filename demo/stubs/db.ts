import type * as Real from '@/core/db';

import { mode } from '../mode';

// 실제 파일(src/core/db.ts)은 SQLite를 쓴다. 데모는 메모리에서 "이 설치에서 연 적 있는지"만 흉내 낸다.
let installed = mode !== 'found';

export const isInstalled: typeof Real.isInstalled = () => installed;

export const markInstalled: typeof Real.markInstalled = () => {
  installed = true;
};

const meta = new Map<string, string>();

export const getMeta: typeof Real.getMeta = (key) => meta.get(key) ?? null;

export const setMeta: typeof Real.setMeta = (key, value) => {
  meta.set(key, value);
};
