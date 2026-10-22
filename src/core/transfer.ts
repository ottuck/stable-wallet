import { NETWORKS, type NetworkConfig } from './config/networks';
import { WalletError } from './errors';
import {
  broadcast,
  checkReceipt,
  signTransfer,
  waitForReceipt,
  type ReceiptResult,
  type SendPreview,
} from './evm/send';
import { listPendingTxs, saveTx, updateTxStatus } from './history';
import { withSigner } from './keys/vault';

// 거래 흐름(서명 → 저장 → 전송 → 확인)은 서버가 없어 앱 안에서 직접 이어 붙인다.
// 순서와 불변식은 여기에만 두고, 화면은 이 함수들을 부르기만 한다.

/** uncertain: 전송 응답을 못 받아 노드에 올라갔는지 모른다(pending으로 두고 나중에 가린다). */
export type SubmitResult = { hash: string; uncertain: boolean };

/**
 * Face ID로 서명하고 전송한다. 전송 전에 pending으로 저장하므로 응답을 잃어도 홈의 pending 재확인으로
 * 추적된다. 노드가 거절하면 dropped로 바꾸고 BroadcastFailed를 던진다.
 */
export async function submitTransfer(p: SendPreview): Promise<SubmitResult> {
  const signed = await withSigner((signer) => signTransfer(p, signer));
  saveTx({
    hash: signed.hash,
    networkId: p.network.id,
    symbol: p.token.symbol,
    decimals: p.token.decimals,
    fromAddress: p.from,
    toAddress: p.to,
    amount: p.amount.toString(),
    nonce: p.nonce,
    status: 'pending',
    createdAt: Date.now(),
  });
  const result = await broadcast(p.network, signed);
  if (result === 'rejected') {
    updateTxStatus(signed.hash, 'dropped');
    throw new WalletError('BroadcastFailed');
  }
  return { hash: signed.hash, uncertain: result === 'unknown' };
}

/** receipt를 기다리고, 결과가 정해지면 저장된 거래 상태를 갱신한다. 시간 안에 안 오면 pending. */
export async function waitForTransfer(
  network: NetworkConfig,
  hash: string,
): Promise<ReceiptResult> {
  const result = await waitForReceipt(network, hash);
  if (result.status !== 'pending') updateTxStatus(hash, result.status);
  return result;
}

/** 저장된 pending 거래를 모두 다시 확인해 상태를 갱신한다. 확인한 거래 수를 돌려준다. */
export async function refreshPendingTransfers(): Promise<number> {
  const pending = listPendingTxs();
  await Promise.all(
    pending.map(async (tx) => {
      const { status } = await checkReceipt(NETWORKS[tx.networkId], tx);
      if (status !== 'pending') updateTxStatus(tx.hash, status);
    }),
  );
  return pending.length;
}
