import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { deriveAddress, generateMnemonic } from '@/core/keys/mnemonic';
import { errorMessage } from '@/features/error-message';
import { Button, Card, colors, Label, Screen } from '@/features/ui';
import { useSecretScreen } from '@/features/use-secret-screen';
import { useWallet } from '@/features/wallet/store';

type Draft = { phrase: string; address: string; elapsedMs: number };

function createDraft(): Draft {
  const started = Date.now();
  const phrase = generateMnemonic();
  const address = deriveAddress(phrase);
  return { phrase, address, elapsedMs: Date.now() - started };
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** 무작위 세 자리의 단어를 고르게 한다. 보기는 같은 문구의 다른 단어(화면 퀴즈라 Math.random으로 충분). */
function makeQuiz(phrase: string) {
  const words = phrase.split(' ');
  const positions = shuffle(words.map((_, i) => i))
    .slice(0, 3)
    .sort((a, b) => a - b);
  return positions.map((i) => {
    const others = shuffle([...new Set(words.filter((w) => w !== words[i]))]).slice(0, 3);
    return { position: i, answer: words[i], options: shuffle([words[i], ...others]) };
  });
}

export default function Create() {
  const [draft, setDraft] = useState(createDraft);
  // 저장 중에 찍힌 스크린샷도 알 수 있게 지금 보이는 문구를 ref로 따라간다
  const currentDraft = useRef(draft);
  const [step, setStep] = useState<'write' | 'verify'>('write');
  const quiz = useMemo(() => makeQuiz(draft.phrase), [draft]);
  const [picked, setPicked] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 스크린샷에 찍힌 문구는 쓰지 않는다
  useSecretScreen(() => {
    const next = createDraft();
    currentDraft.current = next;
    setDraft(next);
    setPicked({});
    setStep('write');
    setError(
      '스크린샷이 감지되어 복구 문구를 새로 만들었습니다. 사진 앱의 스크린샷도 지워 주세요.',
    );
  });

  const answered = quiz.every((q) => picked[q.position] !== undefined);
  const correct = quiz.every((q) => picked[q.position] === q.answer);

  async function confirm() {
    const saving = draft;
    setBusy(true);
    setError(null);
    try {
      const saved = await useWallet
        .getState()
        .save(saving.phrase, () => currentDraft.current === saving);
      if (!saved) setBusy(false);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  if (step === 'write') {
    return (
      <Screen
        footer={
          <Button
            title="적어 두었습니다"
            onPress={() => {
              setPicked({});
              setError(null);
              setStep('verify');
            }}
          />
        }
      >
        <Label style={{ lineHeight: 22 }}>
          아래 12단어를 순서대로 종이에 적어 두세요. 이 문구가 지갑 그 자체입니다. 앱을 지우거나
          기기를 잃어도 이 문구로만 되찾을 수 있습니다.
        </Label>
        <Card>
          <View style={styles.words}>
            {draft.phrase.split(' ').map((word, i) => (
              <View key={i} style={styles.word}>
                <Label mono muted size={12} style={{ width: 22 }}>
                  {i + 1}
                </Label>
                <Label mono size={15}>
                  {word}
                </Label>
              </View>
            ))}
          </View>
        </Card>
        <Label muted size={13} style={{ lineHeight: 20 }}>
          스크린샷·화면 녹화는 막혀 있고, 찍히면 문구를 새로 만듭니다. 문구를 묻는 사람이나 사이트는
          모두 사기입니다.
        </Label>
        {__DEV__ && <Label muted size={12}>{`생성·파생 ${draft.elapsedMs}ms`}</Label>}
        {error && <Label color={colors.danger}>{error}</Label>}
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <>
          {answered && !correct && (
            <Label size={13} color={colors.danger}>
              맞지 않는 단어가 있습니다. 적어 둔 문구를 다시 확인해 주세요.
            </Label>
          )}
          {error && (
            <Label size={13} color={colors.danger}>
              {error}
            </Label>
          )}
          <Button title="지갑 만들기" busy={busy} disabled={!correct} onPress={confirm} />
          <Pressable
            accessibilityRole="button"
            onPress={() => setStep('write')}
            style={styles.back}
          >
            <Label bold size={14} color={colors.accent}>
              문구 다시 보기
            </Label>
          </Pressable>
        </>
      }
    >
      <Label style={{ lineHeight: 22 }}>적어 둔 문구에서 아래 순서의 단어를 고르세요.</Label>
      {quiz.map((q) => (
        <Card key={q.position} style={{ gap: 12 }}>
          <Label bold>{`${q.position + 1}번째 단어`}</Label>
          <View style={styles.options}>
            {q.options.map((option) => {
              const selected = picked[q.position] === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setPicked((p) => ({ ...p, [q.position]: option }))}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <Label mono size={15} color={selected ? '#FFFFFF' : colors.text}>
                    {option}
                  </Label>
                </Pressable>
              );
            })}
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  words: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  word: { width: '50%', flexDirection: 'row', alignItems: 'baseline' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    width: '48%',
    flexGrow: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: { backgroundColor: colors.accent },
  back: { height: 44, alignItems: 'center', justifyContent: 'center' },
});
