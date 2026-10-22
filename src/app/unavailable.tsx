import { useT } from '@/features/i18n';
import { AlertIcon } from '@/features/icons';
import { Button, Card, Label, Screen, useColors } from '@/features/ui';
import { useWallet } from '@/features/wallet/store';

/** secure-store를 읽지 못했을 때. 기존 지갑을 덮어쓰지 않도록 새 지갑 만들기로 보내지 않는다. */
export default function Unavailable() {
  const c = useColors();
  const t = useT();
  return (
    <Screen
      footer={
        <Button title={t.unavailable.retry} onPress={() => void useWallet.getState().init()} />
      }
    >
      <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
        <AlertIcon size={32} color={c.warn} />
        <Label style={{ textAlign: 'center', lineHeight: 22 }}>{t.unavailable.message}</Label>
      </Card>
    </Screen>
  );
}
