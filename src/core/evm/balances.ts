import { Contract, JsonRpcProvider, Network } from 'ethers';

import type { NetworkConfig, NetworkId } from '../config/networks';
import { tokensOn } from '../config/tokens';
import { WalletError } from '../errors';

export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

export type AssetBalance = {
  symbol: string;
  decimals: number;
  raw: bigint;
  /** native면 없다 */
  tokenAddress?: string;
};

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

export async function getBalances(network: NetworkConfig, owner: string): Promise<AssetBalance[]> {
  const provider = getProvider(network);
  const tokens = tokensOn(network.id);
  try {
    const [native, ...tokenRaws] = await Promise.all([
      provider.getBalance(owner),
      ...tokens.map(
        (t) => new Contract(t.address, ERC20_ABI, provider).balanceOf(owner) as Promise<bigint>,
      ),
    ]);
    return [
      { symbol: network.native.symbol, decimals: network.native.decimals, raw: native },
      ...tokens.map((t, i) => ({
        symbol: t.symbol,
        decimals: t.decimals,
        raw: tokenRaws[i],
        tokenAddress: t.address,
      })),
    ];
  } catch (cause) {
    throw new WalletError('RpcUnavailable', { cause });
  }
}
