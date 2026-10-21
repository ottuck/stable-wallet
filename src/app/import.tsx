import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { errorMessage } from '@/features/error-message';
import { Button, Label, Screen, useColors } from '@/features/ui';
import { useSecretScreen } from '@/features/use-secret-screen';
import { useWallet } from '@/features/wallet/store';

export default function Import() {
  const c = useColors();
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useSecretScreen(() =>
    setError('스크린샷이 감지되었습니다. 복구 문구가 찍혔다면 사진 앱에서 지워 주세요.'),
  );

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await useWallet.getState().save(phrase);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Label>복구 문구 12단어를 띄어쓰기로 구분해 입력하세요.</Label>
      <TextInput
        value={phrase}
        onChangeText={setPhrase}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        secureTextEntry={false}
        textContentType="none"
        importantForAutofill="no"
        style={[styles.input, { color: c.text, backgroundColor: c.card }]}
      />
      {error && <Label>{error}</Label>}
      <Button title="가져오기" busy={busy} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 120, borderRadius: 12, padding: 12, fontSize: 16, textAlignVertical: 'top' },
});
