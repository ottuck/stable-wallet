import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';

import { CheckIcon, CopyIcon } from './icons';
import { useT } from './i18n';
import { IconButton, useColors } from './ui';

/** 주소(공개 정보)만 복사한다. 복사하면 잠깐 체크 표시로 바뀐다. */
export function CopyButton({
  value,
  filled,
  color,
}: {
  value: string;
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
      label={copied ? t.common.copied : t.common.copyAddress}
      filled={filled}
      onPress={() => {
        void Clipboard.setStringAsync(value);
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
