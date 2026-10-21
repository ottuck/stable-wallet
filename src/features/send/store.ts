import { create } from 'zustand';

import type { SendPreview } from '@/core/evm/send';

/** 보내기 입력 → 서명 전 확인 → 전송 상태로 넘기는 값. bigint라 라우트 파라미터 대신 쓴다. */
type SendFlow = {
  preview: SendPreview | null;
  sent: { hash: string; sentAt: number } | null;
  setPreview: (preview: SendPreview) => void;
  setSent: (hash: string) => void;
  reset: () => void;
};

export const useSendFlow = create<SendFlow>((set) => ({
  preview: null,
  sent: null,
  setPreview: (preview) => set({ preview, sent: null }),
  setSent: (hash) => set({ sent: { hash, sentAt: Date.now() } }),
  reset: () => set({ preview: null, sent: null }),
}));
