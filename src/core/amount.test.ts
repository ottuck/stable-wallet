import { formatAmount, parseAmount } from './amount';

describe('parseAmount', () => {
  it('USDC(6)와 JPYC(18) 자릿수로 raw 값을 만든다', () => {
    expect(parseAmount('1.5', 6)).toBe(1_500_000n);
    expect(parseAmount(' 1000 ', 18)).toBe(1000n * 10n ** 18n);
    expect(parseAmount('0.000001', 6)).toBe(1n);
  });

  it.each(['', '0', '0.0', '-1', '1e3', '1,000', '.5', '1.', 'abc', '0.0000001'])(
    '%p는 거부한다(USDC)',
    (input) => {
      expect(() => parseAmount(input, 6)).toThrow('InvalidAmount');
    },
  );
});

describe('formatAmount', () => {
  it('뒤의 0을 지우고 소수점 아래를 버린다', () => {
    expect(formatAmount(1_500_000n, 6)).toBe('1.5');
    expect(formatAmount(2_000_000n, 6)).toBe('2');
    expect(formatAmount(1_999_999_999_999_999_999n, 18, 4)).toBe('1.9999');
  });
});
