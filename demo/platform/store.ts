import type { NetworkId } from '@/core/config/networks';
import { tokensOn } from '@/core/config/tokens';
import type * as RealDb from '@/core/db';
import type * as Real from '@/core/history';
import { parseUnits } from 'ethers';

import { DEMO, fakeHash } from '../data';
import { mode } from '../mode';

// 실제 앱(src/platform/store.ts)은 기기 SQLite에 저장한다. 데모는 메모리이고 새로고침하면 처음으로 돌아간다.
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

// 실제(SQLite)처럼 읽을 때마다 새 객체를 돌려준다. 같은 객체면 상태가 바뀌어도 화면이 다시 그려지지 않는다
export const getTx: typeof Real.getTx = (hash) => {
  const tx = txs.find((t) => t.hash === hash);
  return tx ? { ...tx } : null;
};

export const hasSentTo: typeof Real.hasSentTo = (fromAddress, toAddress) =>
  txs.some(
    (t) => t.fromAddress === fromAddress && t.toAddress.toLowerCase() === toAddress.toLowerCase(),
  );

export const listPendingTxs: typeof Real.listPendingTxs = () =>
  txs.filter((t) => t.status === 'pending');

// 이 설치에서 연 적이 있는지(?state=found면 재설치 직후처럼 없다고 답한다)와 앱 설정
let installed = mode !== 'found';

export const isInstalled: typeof RealDb.isInstalled = () => installed;

export const markInstalled: typeof RealDb.markInstalled = () => {
  installed = true;
};

const meta = new Map<string, string>();

export const getMeta: typeof RealDb.getMeta = (key) => meta.get(key) ?? null;

export const setMeta: typeof RealDb.setMeta = (key, value) => {
  meta.set(key, value);
};
