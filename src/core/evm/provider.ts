import type { JsonRpcProvider } from 'ethers';

import { createRpcProvider } from '../../platform/services';
import type { NetworkConfig, NetworkId } from '../config/networks';

// 네트워크마다 RPC 연결 하나를 만들어 같이 쓴다. 연결 자체는 platform이 만든다(웹 데모는 가짜 노드).
const providers = new Map<NetworkId, JsonRpcProvider>();

export function getProvider(network: NetworkConfig): JsonRpcProvider {
  let provider = providers.get(network.id);
  if (!provider) {
    provider = createRpcProvider(network);
    providers.set(network.id, provider);
  }
  return provider;
}
