import { useState } from 'react';
import { Alert } from 'react-native';

import { errorMessage } from '@/features/error-message';
import { Button, Label, Screen } from '@/features/ui';
import { useWallet } from '@/features/wallet/store';

/** 재설치 후 Keychain에 남아 있던 지갑(docs/PROJECT.md 재설치 규칙). */
export default function Found() {
  const address = useWallet((s) => s.address);
  const [error, setError] = useState<string | null>(null);

  function confirmReset() {
    Alert.alert('지갑을 지울까요?', '복구 문구를 적어 두지 않았다면 이 지갑의 자산을 잃습니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '지우기',
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
    <Screen>
      <Label>이 기기에 이전에 쓰던 지갑이 남아 있습니다.</Label>
      <Label mono>{address}</Label>
      {error && <Label>{error}</Label>}
      <Button title="이 지갑 계속 쓰기" onPress={() => useWallet.getState().keepFound()} />
      <Button title="지우고 새로 시작" secondary onPress={confirmReset} />
    </Screen>
  );
}
