import {
  Contract,
  getAddress,
  Interface,
  isError,
  Transaction,
  type HDNodeWallet,
  type TransactionReceipt,
} from 'ethers';

import type { NetworkConfig } from '../config/networks';
import type { TokenConfig } from '../config/tokens';
import { WalletError } from '../errors';
import type { TxStatus } from '../history';
import { ERC20_ABI, getProvider } from './balances';

const ERC20 = new Interface(ERC20_ABI);
const MIN_MAX_FEE_PER_GAS = 1_000_000_000n; // 1 gwei

function max(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

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
  // 상한(maxFee)을 올려도 실제로 내는 건 baseFee + tip이라 비용은 같다. baseFee가 몇 wei인 체인
  // (Sepolia·Fuji)에서 상한이 너무 낮아 tx가 멈추지 않도록 최소 1 gwei로 둔다.
  const maxFeePerGas = max(baseFee * 2n + priorityFee, MIN_MAX_FEE_PER_GAS);
  return {
    ...preview,
    gasLimit,
    maxFeePerGas,
    maxPriorityFeePerGas: priorityFee,
    estimatedFee: gasEstimate * (baseFee + priorityFee),
    maxFee: gasLimit * maxFeePerGas,
  };
}

/** 서명된 tx. hash는 전송 전에 raw에서 계산한다(전송 응답을 못 받아도 거래를 추적할 수 있게). */
export type SignedTransfer = { hash: string; raw: string };

/** withSigner 안에서만 부른다. 서명만 하고 전송은 하지 않는다. */
export async function signTransfer(p: SendPreview, signer: HDNodeWallet): Promise<SignedTransfer> {
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
  return { hash: Transaction.from(signed).hash!, raw: signed };
}

/**
 * sent: 노드가 받음 · rejected: 노드가 거절해 체인에 오를 수 없음 ·
 * unknown: 응답을 못 받아 모름(pending으로 두고 receipt·nonce로 나중에 가린다)
 */
export type BroadcastResult = 'sent' | 'rejected' | 'unknown';

export async function broadcast(
  network: NetworkConfig,
  signed: SignedTransfer,
): Promise<BroadcastResult> {
  const provider = getProvider(network);
  try {
    await provider.broadcastTransaction(signed.raw);
    return 'sent';
  } catch (error) {
    if (
      isError(error, 'NONCE_EXPIRED') ||
      isError(error, 'INSUFFICIENT_FUNDS') ||
      isError(error, 'REPLACEMENT_UNDERPRICED')
    ) {
      return 'rejected';
    }
    // 노드는 받았는데 응답만 잃었을 수 있다
    try {
      if (await provider.getTransaction(signed.hash)) return 'sent';
    } catch {
      // 확인도 못 하면 unknown
    }
    return 'unknown';
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

/**
 * 저장된 pending 거래를 다시 확인한다. receipt가 없고 노드도 모르는데 그 nonce가 이미 쓰였으면
 * (다른 tx가 확정됨) 이 거래는 체인에 오를 수 없으므로 dropped.
 */
export async function checkReceipt(
  network: NetworkConfig,
  tx: { hash: string; fromAddress: string; nonce: number },
): Promise<ReceiptResult> {
  const provider = getProvider(network);
  try {
    const receipt = await provider.getTransactionReceipt(tx.hash);
    if (receipt) return toResult(receipt);
    if (await provider.getTransaction(tx.hash)) return { status: 'pending' };
    const confirmedNonce = await provider.getTransactionCount(tx.fromAddress, 'latest');
    return { status: confirmedNonce > tx.nonce ? 'dropped' : 'pending' };
  } catch {
    return { status: 'pending' };
  }
}
