import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { deriveWallet, generateMnemonic } from '@/core/keys/mnemonic';
import { errorMessage } from '@/features/error-message';
import { Button, Card, Label, Screen } from '@/features/ui';
import { useSecretScreen } from '@/features/use-secret-screen';
import { useWallet } from '@/features/wallet/store';

function createDraft() {
  const started = Date.now();
  const phrase = generateMnemonic();
  const { address } = deriveWallet(phrase);
  return { phrase, address, elapsedMs: Date.now() - started };
}

export default function Create() {
  const [draft, setDraft] = useState(createDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 스크린샷에 찍힌 문구는 쓰지 않는다
  useSecretScreen(() => {
    setDraft(createDraft());
    setError(
      '스크린샷이 감지되어 복구 문구를 새로 만들었습니다. 사진 앱의 스크린샷도 지워 주세요.',
    );
  });

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await useWallet.getState().save(draft.phrase);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Label>
        아래 12단어를 순서대로 종이에 적어 두세요. 이 문구가 있으면 누구나 지갑을 쓸 수 있고,
        잃어버리면 복구할 수 없습니다. 화면을 캡처하지 마세요.
      </Label>
      <Card>
        <View style={styles.words}>
          {draft.phrase.split(' ').map((word, i) => (
            <Label key={i} mono style={styles.word}>
              {`${i + 1}. ${word}`}
            </Label>
          ))}
        </View>
      </Card>
      <Label muted mono>
        {draft.address}
      </Label>
      {__DEV__ && <Label muted>{`생성·파생 ${draft.elapsedMs}ms`}</Label>}
      {error && <Label>{error}</Label>}
      <Button title="적어 두었습니다" busy={busy} onPress={confirm} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  words: { flexDirection: 'row', flexWrap: 'wrap' },
  word: { width: '50%', paddingVertical: 4 },
});
