import { JsonRpcProvider, Network } from 'ethers';

import type { NetworkConfig, NetworkId } from '../config/networks';

// 네트워크(RPC)에 닿는 유일한 지점. 데모(demo/)는 이 파일만 가짜 provider로 바꾼다.
const providers = new Map<NetworkId, JsonRpcProvider>();

export function getProvider(network: NetworkConfig): JsonRpcProvider {
  let provider = providers.get(network.id);
  if (!provider) {
    // chainId를 고정해 매 요청마다 eth_chainId를 부르지 않는다. 서명 전에는 따로 확인한다.
    provider = new JsonRpcProvider(network.rpcUrl, network.chainId, {
      staticNetwork: Network.from(network.chainId),
    });
    providers.set(network.id, provider);
  }
  return provider;
}
