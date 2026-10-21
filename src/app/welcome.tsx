import { router } from 'expo-router';

import { Button, Label, Screen } from '@/features/ui';

export default function Welcome() {
  return (
    <Screen>
      <Label>
        복구 문구(12단어)는 이 기기에만 저장되고, 서명할 때마다 Face ID로 잠금을 풉니다.
      </Label>
      <Button title="새 지갑 만들기" onPress={() => router.push('/create')} />
      <Button title="복구 문구로 가져오기" secondary onPress={() => router.push('/import')} />
    </Screen>
  );
}
