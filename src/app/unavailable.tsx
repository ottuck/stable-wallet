import { Button, Label, Screen } from '@/features/ui';
import { useWallet } from '@/features/wallet/store';

/** secure-store를 읽지 못했을 때. 기존 지갑을 덮어쓰지 않도록 새 지갑 만들기로 보내지 않는다. */
export default function Unavailable() {
  return (
    <Screen>
      <Label>기기 보안 저장소를 읽지 못했습니다. 기기 잠금을 푼 상태에서 다시 시도해 주세요.</Label>
      <Button title="다시 시도" onPress={() => void useWallet.getState().init()} />
    </Screen>
  );
}
