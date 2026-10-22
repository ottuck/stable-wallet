import { Contract } from 'ethers';

import type { NetworkConfig } from '../config/networks';
import { tokensOn } from '../config/tokens';
import { WalletError } from '../errors';
import { getProvider } from './provider';

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

// ERC-20 transfer 한 번의 대략적인 가스 사용량(홈의 "전송 약 N회" 표시용)
const TYPICAL_TRANSFER_GAS = 65_000n;

/** 지금 수수료로 ERC-20 전송 한 번에 드는 대략적인 native 금액. */
export async function estimateTransferFee(network: NetworkConfig): Promise<bigint> {
  try {
    const fee = await getProvider(network).getFeeData();
    const price = fee.maxFeePerGas ?? fee.gasPrice;
    if (price == null) throw new Error('no fee data');
    return price * TYPICAL_TRANSFER_GAS;
  } catch (cause) {
    throw new WalletError('RpcUnavailable', { cause });
  }
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
