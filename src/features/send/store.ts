import { create } from 'zustand';

import type { SendPreview } from '@/core/evm/send';

/** 보내기 입력 → 서명 전 확인 → 전송 상태로 넘기는 값. bigint라 라우트 파라미터 대신 쓴다. */
type SendFlow = {
  preview: SendPreview | null;
  /** uncertain: 전송 응답을 못 받아 노드에 올라갔는지 모른다 */
  sent: { hash: string; sentAt: number; uncertain: boolean } | null;
  setPreview: (preview: SendPreview) => void;
  setSent: (hash: string, uncertain: boolean) => void;
  reset: () => void;
};

export const useSendFlow = create<SendFlow>((set) => ({
  preview: null,
  sent: null,
  setPreview: (preview) => set({ preview, sent: null }),
  setSent: (hash, uncertain) => set({ sent: { hash, sentAt: Date.now(), uncertain } }),
  reset: () => set({ preview: null, sent: null }),
}));
