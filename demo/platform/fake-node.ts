import type { NetworkConfig } from '@/core/config/networks';
import { tokensOn } from '@/core/config/tokens';
import {
  Interface,
  Transaction,
  parseEther,
  parseUnits,
  toBeHex,
  type JsonRpcProvider,
} from 'ethers';

import { DEMO } from '../data';
import { sleep } from '../sleep';

const ERC20 = new Interface([
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
]);

type Sent = { confirmAt: number; gasUsed: bigint; gasPrice: bigint };

/**
 * 실제 앱(src/platform/services.ts의 createRpcProvider)은 공개 RPC에 연결한다. 이 가짜 노드는 core가 쓰는 메서드만
 * 흉내 내고, 잔액·nonce·확정 시간을 메모리에서 계산한다. 수수료 계산·서명·전송 로직은 실제 core 코드가 그대로 돈다.
 */
class FakeNode {
  private native = parseEther(DEMO.balances.native);
  private tokens = new Map<string, bigint>();
  private sent = new Map<string, Sent>();
  private baseFee = parseUnits(DEMO.fees.baseGwei, 'gwei');
  private priorityFee = parseUnits(DEMO.fees.priorityGwei, 'gwei');

  constructor(private network: NetworkConfig) {
    for (const t of tokensOn(network.id)) {
      this.tokens.set(
        t.address.toLowerCase(),
        parseUnits(DEMO.balances[t.symbol] ?? '0', t.decimals),
      );
    }
  }

  async send(method: string): Promise<string> {
    await sleep(DEMO.latency.rpc);
    if (method === 'eth_chainId') return toBeHex(this.network.chainId);
    if (method === 'eth_maxPriorityFeePerGas') return toBeHex(this.priorityFee);
    throw new Error(`demo: unsupported ${method}`);
  }

  async getBalance(): Promise<bigint> {
    await sleep(DEMO.latency.rpc);
    return this.native;
  }

  async getTransactionCount(_address: string, tag: string): Promise<number> {
    await sleep(DEMO.latency.rpc);
    if (tag === 'pending') return DEMO.startNonce + this.sent.size;
    const now = Date.now();
    return DEMO.startNonce + [...this.sent.values()].filter((s) => s.confirmAt <= now).length;
  }

  async getBlock(): Promise<{ baseFeePerGas: bigint }> {
    await sleep(DEMO.latency.rpc);
    return { baseFeePerGas: this.baseFee };
  }

  async estimateGas(): Promise<bigint> {
    await sleep(DEMO.latency.rpc);
    return DEMO.fees.gasEstimate;
  }

  async getFeeData(): Promise<{ maxFeePerGas: bigint; gasPrice: bigint }> {
    await sleep(DEMO.latency.rpc);
    return {
      maxFeePerGas: this.baseFee * 2n + this.priorityFee,
      gasPrice: this.baseFee + this.priorityFee,
    };
  }

  /** ethers Contract가 읽기 호출(balanceOf)에 쓴다 */
  async call(tx: { to?: string | null; data?: string | null }): Promise<string> {
    await sleep(DEMO.latency.rpc);
    const balance = this.tokens.get((tx.to ?? '').toLowerCase());
    if (balance === undefined || !tx.data?.startsWith(ERC20.getFunction('balanceOf')!.selector)) {
      throw new Error('demo: unsupported call');
    }
    return ERC20.encodeFunctionResult('balanceOf', [balance]);
  }

  async broadcastTransaction(raw: string): Promise<{ hash: string }> {
    await sleep(DEMO.latency.rpc);
    const tx = Transaction.from(raw);
    const [, amount] = ERC20.decodeFunctionData('transfer', tx.data) as unknown as [string, bigint];
    const key = (tx.to ?? '').toLowerCase();
    const gasPrice = this.baseFee + this.priorityFee;
    const gasUsed = DEMO.fees.gasEstimate;
    this.tokens.set(key, (this.tokens.get(key) ?? 0n) - amount);
    this.native -= gasUsed * gasPrice;
    this.sent.set(tx.hash!, { confirmAt: Date.now() + DEMO.latency.confirm, gasUsed, gasPrice });
    return { hash: tx.hash! };
  }

  async getTransaction(hash: string): Promise<{ hash: string } | null> {
    return this.sent.has(hash) ? { hash } : null;
  }

  async getTransactionReceipt(hash: string) {
    const s = this.sent.get(hash);
    return s && s.confirmAt <= Date.now()
      ? { status: 1, gasUsed: s.gasUsed, gasPrice: s.gasPrice }
      : null;
  }

  async waitForTransaction(hash: string, _confirms: number, timeoutMs: number) {
    const s = this.sent.get(hash);
    if (!s) throw new Error('demo: unknown tx');
    const wait = Math.max(0, s.confirmAt - Date.now());
    if (wait > timeoutMs) throw new Error('demo: timeout');
    await sleep(wait);
    return this.getTransactionReceipt(hash);
  }
}

/** 네트워크마다 하나씩 만들어 core/evm/provider가 캐시한다 */
export function createFakeNode(network: NetworkConfig): JsonRpcProvider {
  return new FakeNode(network) as unknown as JsonRpcProvider;
}
