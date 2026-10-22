import { useState } from 'react';
import { Alert } from 'react-native';

import { errorMessage } from '@/features/error-message';
import { useT } from '@/features/i18n';
import { Address, Button, Card, Label, Screen, useColors } from '@/features/ui';
import { useWallet } from '@/features/wallet/store';

/** 재설치 후 Keychain에 남아 있던 지갑(docs/PROJECT.md 재설치 규칙). */
export default function Found() {
  const c = useColors();
  const t = useT();
  const address = useWallet((s) => s.address);
  const [error, setError] = useState<string | null>(null);

  function confirmReset() {
    Alert.alert(t.found.confirmTitle, t.found.confirmBody, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: () =>
          useWallet
            .getState()
            .reset()
            .catch((e) => setError(errorMessage(e))),
      },
    ]);
  }

  return (
    <Screen
      footer={
        <>
          <Button title={t.found.keep} onPress={() => useWallet.getState().keepFound()} />
          <Button title={t.found.startOver} secondary onPress={confirmReset} />
        </>
      }
    >
      <Label style={{ lineHeight: 22 }}>{t.found.intro}</Label>
      {address && (
        <Card>
          <Label muted size={12}>
            {t.found.address}
          </Label>
          <Address value={address} />
        </Card>
      )}
      {error && <Label color={c.danger}>{error}</Label>}
    </Screen>
  );
}
