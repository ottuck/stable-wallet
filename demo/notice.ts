import { create } from 'zustand';

import type { DemoNoticeKey } from './text';

/** 데모 화면 위에 잠깐 띄우는 안내와 Face ID 연출의 상태. 가짜 파일(stubs)이 켜고 DemoLayer가 그린다. */
export const useDemoOverlay = create<{
  notice: { key: DemoNoticeKey; at: number } | null;
  faceId: boolean;
}>(() => ({ notice: null, faceId: false }));

export function showNotice(key: DemoNoticeKey) {
  useDemoOverlay.setState({ notice: { key, at: Date.now() } });
}

export function setFaceId(on: boolean) {
  useDemoOverlay.setState({ faceId: on });
}
