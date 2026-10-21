import { create } from 'zustand';

import { activeNetworks, type NetworkConfig } from '@/core/config/networks';

/** 홈과 보내기 화면이 같이 쓰는 현재 네트워크. */
export const useNetwork = create<{
  network: NetworkConfig;
  setNetwork: (network: NetworkConfig) => void;
}>((set) => ({
  network: activeNetworks[0],
  setNetwork: (network) => set({ network }),
}));
