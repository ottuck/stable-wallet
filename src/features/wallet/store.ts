import { create } from 'zustand';

import { isInstalled, markInstalled } from '@/core/db';
import { deleteWallet, loadAddress, saveWallet } from '@/core/keys/vault';

/**
 * loading: 시작 중 · empty: 지갑 없음 · found: 재설치 후 Keychain에 남은 지갑 발견
 * ready: 사용 중 · error: secure-store를 읽지 못함(새 지갑을 만들게 하지 않는다)
 */
export type WalletStatus = 'loading' | 'empty' | 'found' | 'ready' | 'error';

type WalletState = {
  status: WalletStatus;
  address: string | null;
  init: () => Promise<void>;
  save: (phrase: string) => Promise<void>;
  keepFound: () => void;
  reset: () => Promise<void>;
};

export const useWallet = create<WalletState>((set) => ({
  status: 'loading',
  address: null,

  async init() {
    set({ status: 'loading' });
    try {
      const address = await loadAddress();
      if (!address) {
        markInstalled();
        set({ status: 'empty', address: null });
      } else {
        set({ status: isInstalled() ? 'ready' : 'found', address });
      }
    } catch {
      set({ status: 'error' });
    }
  },

  async save(phrase) {
    const address = await saveWallet(phrase);
    markInstalled();
    set({ status: 'ready', address });
  },

  keepFound() {
    markInstalled();
    set({ status: 'ready' });
  },

  async reset() {
    await deleteWallet();
    markInstalled();
    set({ status: 'empty', address: null });
  },
}));
