import { useEffect, useState } from 'react';

import { writeClipboard } from '@/platform/services';

import { CheckIcon, CopyIcon } from './icons';
import { useT } from './i18n';
import { IconButton, useColors } from './ui';

/** 주소·거래 hash(공개 정보)만 복사한다. 복사하면 잠깐 체크 표시로 바뀐다. label은 스크린리더 이름(기본: 주소 복사) */
export function CopyButton({
  value,
  label,
  filled,
  color,
}: {
  value: string;
  label?: string;
  filled?: boolean;
  color?: string;
}) {
  const c = useColors();
  const t = useT();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <IconButton
      label={copied ? t.common.copied : (label ?? t.common.copyAddress)}
      filled={filled}
      onPress={() => {
        void writeClipboard(value);
        setCopied(true);
      }}
    >
      {copied ? (
        <CheckIcon size={18} color={c.ok} strokeWidth={2.6} />
      ) : (
        <CopyIcon size={18} color={color ?? c.muted} />
      )}
    </IconButton>
  );
}
