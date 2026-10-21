import {
  Contract,
  getAddress,
  Interface,
  type HDNodeWallet,
  type TransactionReceipt,
} from 'ethers';

import type { NetworkConfig } from '../config/networks';
import type { TokenConfig } from '../config/tokens';
import { WalletError } from '../errors';
import type { TxStatus } from '../history';
import { ERC20_ABI, getProvider } from './balances';

const ERC20 = new Interface(ERC20_ABI);

/** to는 parseRecipient로 검증한 체크섬 주소, amount는 raw 단위. */
export type SendRequest = {
  network: NetworkConfig;
  token: TokenConfig;
  from: string;
  to: string;
  amount: bigint;
};

/** 서명 전 확인 화면에 그대로 보여주는 값. 가스 값은 토큰 잔액이 부족하면 계산하지 않는다(null). */
export type SendPreview = SendRequest & {
  data: string;
  nonce: number;
  tokenBalance: bigint;
  nativeBalance: bigint;
  gasLimit: bigint | null;
  maxFeePerGas: bigint | null;
  maxPriorityFeePerGas: bigint | null;
  estimatedFee: bigint | null;
  maxFee: bigint | null;
};

export function hasTokenBalance(p: SendPreview): boolean {
  return p.tokenBalance >= p.amount;
}

export function hasGasBalance(p: SendPreview): boolean {
  return p.maxFee !== null && p.nativeBalance >= p.maxFee;
}

/** 체인·잔액·nonce·수수료를 조회해 서명할 트랜잭션을 만든다. 서명은 하지 않는다. */
export async function prepareSend(req: SendRequest): Promise<SendPreview> {
  const provider = getProvider(req.network);
  const data = ERC20.encodeFunctionData('transfer', [req.to, req.amount]);
  const token = new Contract(req.token.address, ERC20_ABI, provider);

  let chainId: bigint;
  let tokenBalance: bigint;
  let nativeBalance: bigint;
  let nonce: number;
  let baseFee: bigint | null | undefined;
  let priorityFee: bigint;
  try {
    [chainId, tokenBalance, nativeBalance, nonce, baseFee, priorityFee] = await Promise.all([
      provider.send('eth_chainId', []).then((hex: string) => BigInt(hex)),
      token.balanceOf(req.from) as Promise<bigint>,
      provider.getBalance(req.from),
      provider.getTransactionCount(req.from, 'pending'),
      provider.getBlock('latest').then((b) => b?.baseFeePerGas),
      // priority fee는 노드에 직접 묻는다(Polygon은 최소값이 있어 낮게 잡으면 tx가 멈춘다)
      provider.send('eth_maxPriorityFeePerGas', []).then((hex: string) => BigInt(hex)),
    ]);
  } catch (cause) {
    throw new WalletError('RpcUnavailable', { cause });
  }
  if (chainId !== BigInt(req.network.chainId)) throw new WalletError('NetworkMismatch');
  if (baseFee == null) throw new WalletError('GasEstimationFailed');

  const preview: SendPreview = {
    ...req,
    data,
    nonce,
    tokenBalance,
    nativeBalance,
    gasLimit: null,
    maxFeePerGas: null,
    maxPriorityFeePerGas: null,
    estimatedFee: null,
    maxFee: null,
  };
  // 잔액이 모자라면 estimateGas가 revert로 실패하므로 여기서 멈추고 화면에서 막는다
  if (!hasTokenBalance(preview)) return preview;

  let gasEstimate: bigint;
  try {
    gasEstimate = await provider.estimateGas({ from: req.from, to: req.token.address, data });
  } catch (cause) {
    throw new WalletError('GasEstimationFailed', { cause });
  }
  const gasLimit = (gasEstimate * 120n) / 100n;
  const maxFeePerGas = baseFee * 2n + priorityFee;
  return {
    ...preview,
    gasLimit,
    maxFeePerGas,
    maxPriorityFeePerGas: priorityFee,
    estimatedFee: gasEstimate * (baseFee + priorityFee),
    maxFee: gasLimit * maxFeePerGas,
  };
}

/** withSigner 안에서만 부른다. 서명한 tx를 전송하고 hash를 돌려준다. */
export async function signAndBroadcast(p: SendPreview, signer: HDNodeWallet): Promise<string> {
  if (getAddress(signer.address) !== getAddress(p.from)) throw new WalletError('SigningFailed');
  if (!hasTokenBalance(p)) throw new WalletError('InsufficientTokenBalance');
  if (!hasGasBalance(p)) throw new WalletError('InsufficientGasBalance');

  let signed: string;
  try {
    signed = await signer.signTransaction({
      type: 2,
      chainId: p.network.chainId,
      to: p.token.address,
      data: p.data,
      value: 0n,
      nonce: p.nonce,
      gasLimit: p.gasLimit,
      maxFeePerGas: p.maxFeePerGas,
      maxPriorityFeePerGas: p.maxPriorityFeePerGas,
    });
  } catch (cause) {
    throw new WalletError('SigningFailed', { cause });
  }
  try {
    const response = await getProvider(p.network).broadcastTransaction(signed);
    return response.hash;
  } catch (cause) {
    throw new WalletError('BroadcastFailed', { cause });
  }
}

/** fee는 실제로 낸 수수료(gasUsed × effectiveGasPrice), pending이면 없다. */
export type ReceiptResult = { status: TxStatus; fee?: bigint };

function toResult(receipt: TransactionReceipt | null): ReceiptResult {
  if (!receipt) return { status: 'pending' };
  return {
    status: receipt.status === 1 ? 'confirmed' : 'failed',
    fee: receipt.gasUsed * receipt.gasPrice,
  };
}

/** receipt를 기다린다. 시간 안에 안 오면 pending(다음에 다시 확인). */
export async function waitForReceipt(
  network: NetworkConfig,
  hash: string,
  timeoutMs = 120_000,
): Promise<ReceiptResult> {
  try {
    return toResult(await getProvider(network).waitForTransaction(hash, 1, timeoutMs));
  } catch {
    return { status: 'pending' };
  }
}

export async function checkReceipt(network: NetworkConfig, hash: string): Promise<ReceiptResult> {
  try {
    return toResult(await getProvider(network).getTransactionReceipt(hash));
  } catch {
    return { status: 'pending' };
  }
}
