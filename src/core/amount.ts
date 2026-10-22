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

export type AmountKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'back';

/** 정수 부분은 이 자리수까지만 받는다(화면에 다 보이게) */
const MAX_WHOLE_DIGITS = 12;

/**
 * 숫자 키패드 입력을 금액 문자열에 반영한다. 받을 수 없는 키(두 번째 소수점, decimals 초과 등)는 그대로 돌려준다.
 * 결과는 `0.` 처럼 입력 중인 모양일 수 있어, 값으로 쓰기 전에 parseAmount로 확인한다.
 */
export function applyAmountKey(current: string, key: AmountKey, decimals: number): string {
  if (key === 'back') return current.slice(0, -1);
  if (key === '.') {
    if (decimals === 0 || current.includes('.')) return current;
    return current === '' ? '0.' : `${current}.`;
  }
  const [whole, fraction] = current.split('.');
  if (fraction !== undefined) return fraction.length >= decimals ? current : current + key;
  if (whole === '0') return key;
  return whole.length >= MAX_WHOLE_DIGITS ? current : current + key;
}

/** 표시용. 소수점 아래는 maxFraction 자리에서 버린다(반올림하지 않는다). */
export function formatAmount(raw: bigint, decimals: number, maxFraction = 6): string {
  const [whole, fraction = ''] = formatUnits(raw, decimals).split('.');
  const shown = fraction.slice(0, maxFraction).replace(/0+$/, '');
  return shown ? `${whole}.${shown}` : whole;
}
