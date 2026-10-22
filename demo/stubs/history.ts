import type { NetworkId } from '@/core/config/networks';
import { tokensOn } from '@/core/config/tokens';
import type * as Real from '@/core/history';
import { parseUnits } from 'ethers';

import { DEMO, fakeHash } from '../data';

export type { TxStatus, WalletTx } from '@/core/history';

// 실제 파일(src/core/history.ts)은 SQLite에 저장한다. 데모는 메모리 배열이고 새로고침하면 처음으로 돌아간다.
const txs: Real.WalletTx[] = [];
const seeded = new Set<string>();

function seed(fromAddress: string, networkId: NetworkId) {
  const key = `${fromAddress}:${networkId}`;
  if (seeded.has(key)) return;
  seeded.add(key);
  const now = Date.now();
  DEMO.history.forEach((item, i) => {
    const token = tokensOn(networkId).find((t) => t.symbol === item.symbol);
    if (!token) return;
    txs.push({
      hash: fakeHash(i + networkId.length * 100),
      networkId,
      symbol: token.symbol,
      decimals: token.decimals,
      fromAddress,
      toAddress: item.to,
      amount: parseUnits(item.amount, token.decimals).toString(),
      nonce: DEMO.startNonce - 1 - i,
      status: item.status,
      createdAt: now - item.daysAgo * 86_400_000,
    });
  });
}

export const saveTx: typeof Real.saveTx = (tx) => {
  const i = txs.findIndex((t) => t.hash === tx.hash);
  if (i >= 0) txs[i] = tx;
  else txs.push(tx);
};

export const updateTxStatus: typeof Real.updateTxStatus = (hash, status) => {
  const tx = txs.find((t) => t.hash === hash);
  if (tx) tx.status = status;
};

export const listTxs: typeof Real.listTxs = (fromAddress, networkId, limit = 20) => {
  seed(fromAddress, networkId);
  return txs
    .filter((t) => t.fromAddress === fromAddress && t.networkId === networkId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
};

export const hasSentTo: typeof Real.hasSentTo = (fromAddress, toAddress) =>
  txs.some(
    (t) => t.fromAddress === fromAddress && t.toAddress.toLowerCase() === toAddress.toLowerCase(),
  );

export const listPendingTxs: typeof Real.listPendingTxs = () =>
  txs.filter((t) => t.status === 'pending');
