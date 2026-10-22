import { formatUnits } from 'ethers';
import { Linking } from 'react-native';

import type { NetworkConfig } from '@/core/config/networks';

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function shortHash(hash: string): string {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

/** wei → gwei, 소수 둘째 자리까지 */
export function formatGwei(wei: bigint): string {
  const [whole, fraction = ''] = formatUnits(wei, 'gwei').split('.');
  const shown = fraction.slice(0, 2).replace(/0+$/, '');
  return shown ? `${whole}.${shown}` : whole;
}

export function formatTime(ms: number): string {
  const d = new Date(ms);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

export function openExplorer(network: NetworkConfig, path: `tx/${string}` | `token/${string}`) {
  void Linking.openURL(`${network.explorerUrl}/${path}`);
}
