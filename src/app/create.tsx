import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { deriveAddress, generateMnemonic } from '@/core/keys/mnemonic';
import { errorMessage } from '@/features/error-message';
import { useT } from '@/features/i18n';
import { Button, Card, Label, type Palette, Screen, useColors, useThemed } from '@/features/ui';
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
  const c = useColors();
  const t = useT();
  const styles = useThemed(makeStyles);
  const [draft, setDraft] = useState(createDraft);
  // 저장 중에 찍힌 스크린샷도 알 수 있게 지금 보이는 문구를 ref로 따라간다
  const currentDraft = useRef(draft);
  const [step, setStep] = useState<'write' | 'verify'>('write');
  // 문구를 다시 보러 갔다 오면 질문 위치를 새로 뽑는다(한 번 외운 답을 재사용하지 못하게)
  const [round, setRound] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const quiz = useMemo(() => makeQuiz(draft.phrase), [draft, round]);
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
    setError(t.create.screenshotRegenerated);
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
            title={t.create.written}
            onPress={() => {
              setPicked({});
              setError(null);
              setStep('verify');
            }}
          />
        }
      >
        <Label style={{ lineHeight: 22 }}>{t.create.writeIntro}</Label>
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
          {t.create.captureNote}
        </Label>
        {__DEV__ && (
          <Label muted size={12}>
            {t.create.derived(draft.elapsedMs)}
          </Label>
        )}
        {error && <Label color={c.danger}>{error}</Label>}
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <>
          {answered && !correct && (
            <Label size={13} color={c.danger}>
              {t.create.wrongWords}
            </Label>
          )}
          {error && (
            <Label size={13} color={c.danger}>
              {error}
            </Label>
          )}
          <Button title={t.create.createWallet} busy={busy} disabled={!correct} onPress={confirm} />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setRound((r) => r + 1);
              setStep('write');
            }}
            style={styles.back}
          >
            <Label bold size={14} color={c.accent}>
              {t.create.showAgain}
            </Label>
          </Pressable>
        </>
      }
    >
      <Label style={{ lineHeight: 22 }}>{t.create.quizIntro}</Label>
      {quiz.map((q) => (
        <Card key={q.position} style={{ gap: 12 }}>
          <Label bold>{t.create.nthWord(q.position + 1)}</Label>
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
                  <Label mono size={15} color={selected ? c.onPrimary : c.text}>
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

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    words: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
    word: { width: '50%', flexDirection: 'row', alignItems: 'baseline' },
    options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    option: {
      width: '48%',
      flexGrow: 1,
      height: 48,
      borderRadius: 12,
      backgroundColor: c.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionSelected: { backgroundColor: c.primary },
    back: { height: 44, alignItems: 'center', justifyContent: 'center' },
  });
