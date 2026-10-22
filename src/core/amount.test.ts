import { applyAmountKey, formatAmount, parseAmount, type AmountKey } from './amount';

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

describe('applyAmountKey', () => {
  const type = (keys: string, decimals = 6) =>
    [...keys].reduce((text, key) => applyAmountKey(text, key as AmountKey, decimals), '');

  it('입력한 대로 금액 문자열을 만든다', () => {
    expect(type('12.5')).toBe('12.5');
    expect(type('.5')).toBe('0.5');
    expect(type('007')).toBe('7');
    expect(type('0.05')).toBe('0.05');
  });

  it('받을 수 없는 키는 무시한다', () => {
    expect(type('1.2.3')).toBe('1.23');
    expect(type('0.1234567')).toBe('0.123456');
    expect(type('1.1234567', 18)).toBe('1.1234567');
    expect(type('1.5', 0)).toBe('15');
  });

  it('지우면 마지막 글자만 없어진다', () => {
    expect(applyAmountKey('12.5', 'back', 6)).toBe('12.');
    expect(applyAmountKey('', 'back', 6)).toBe('');
  });
});

describe('formatAmount', () => {
  it('뒤의 0을 지우고 소수점 아래를 버린다', () => {
    expect(formatAmount(1_500_000n, 6)).toBe('1.5');
    expect(formatAmount(2_000_000n, 6)).toBe('2');
    expect(formatAmount(1_999_999_999_999_999_999n, 18, 4)).toBe('1.9999');
  });
});
