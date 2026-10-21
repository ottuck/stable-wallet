import { formatUnits, parseUnits } from 'ethers';

import { WalletError } from './errors';

const DECIMAL = /^\d+(\.\d+)?$/;

/** 사용자가 입력한 금액 문자열을 raw 단위 bigint로 바꾼다. 0 이하·형식 오류·자릿수 초과는 거부한다. */
export function parseAmount(input: string, decimals: number): bigint {
  const value = input.trim();
  if (!DECIMAL.test(value)) throw new WalletError('InvalidAmount');
  const fraction = value.split('.')[1] ?? '';
  if (fraction.length > decimals) throw new WalletError('InvalidAmount');
  const raw = parseUnits(value, decimals);
  if (raw <= 0n) throw new WalletError('InvalidAmount');
  return raw;
}

/** 표시용. 소수점 아래는 maxFraction 자리에서 버린다(반올림하지 않는다). */
export function formatAmount(raw: bigint, decimals: number, maxFraction = 6): string {
  const [whole, fraction = ''] = formatUnits(raw, decimals).split('.');
  const shown = fraction.slice(0, maxFraction).replace(/0+$/, '');
  return shown ? `${whole}.${shown}` : whole;
}
