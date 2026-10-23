import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { errorMessage } from '@/features/error-message';
import { useT } from '@/features/i18n';
import { Button, Label, type Palette, Screen, useColors, useThemed } from '@/features/ui';
import { useWallet } from '@/features/wallet/store';
import { PhraseInput, useSecretScreen } from '@/platform/ui';

export default function Import() {
  const t = useT();
  const styles = useThemed(makeStyles);
  const c = useColors();
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useSecretScreen(() => setError(t.import.screenshot));

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
          <Button
            title={t.import.submit}
            busy={busy}
            disabled={phrase.trim() === ''}
            onPress={submit}
          />
        </>
      }
    >
      <Label style={{ lineHeight: 22 }}>{t.import.intro}</Label>
      <PhraseInput
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
        accessibilityLabel={t.import.field}
        placeholder="word1 word2 word3 …"
        placeholderTextColor={c.placeholder}
        style={[styles.input, { color: c.text, backgroundColor: c.card }]}
      />
      <Label muted size={13} style={{ lineHeight: 20 }}>
        {t.import.note}
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
