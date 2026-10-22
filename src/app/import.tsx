import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { errorMessage } from '@/features/error-message';
import { Button, Label, type Palette, Screen, useColors, useThemed } from '@/features/ui';
import { useSecretScreen } from '@/features/use-secret-screen';
import { useWallet } from '@/features/wallet/store';

export default function Import() {
  const styles = useThemed(makeStyles);
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
    <Screen
      footer={
        <>
          {error && (
            <Label size={13} color={c.danger}>
              {error}
            </Label>
          )}
          <Button title="가져오기" busy={busy} disabled={phrase.trim() === ''} onPress={submit} />
        </>
      }
    >
      <Label style={{ lineHeight: 22 }}>복구 문구 12단어를 띄어쓰기로 구분해 입력하세요.</Label>
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
        accessibilityLabel="복구 문구"
        placeholder="word1 word2 word3 …"
        placeholderTextColor={c.placeholder}
        style={[styles.input, { color: c.text, backgroundColor: c.card }]}
      />
      <Label muted size={13} style={{ lineHeight: 20 }}>
        이 문구는 이 기기 밖으로 나가지 않습니다. 앱이나 사이트가 문구를 요구하면 사기입니다.
      </Label>
    </Screen>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    input: {
      minHeight: 120,
      borderRadius: 12,
      padding: 12,
      fontSize: 16,
      textAlignVertical: 'top',
    },
  });
