import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { formatAmount } from '@/core/amount';
import { activeNetworks } from '@/core/config/networks';
import { withSigner } from '@/core/keys/vault';
import { errorMessage } from '@/features/error-message';
import { useBalances } from '@/features/home/use-balances';
import { Button, Card, Label, Screen, useColors } from '@/features/ui';
import { useWallet } from '@/features/wallet/store';

export default function Home() {
  const address = useWallet((s) => s.address)!;
  const c = useColors();
  const [network, setNetwork] = useState(activeNetworks[0]);
  const { balances, error, loading, refresh } = useBalances(network, address);
  const [check, setCheck] = useState<string | null>(null);

  // PoC: Face ID로 복구 문구를 읽어 같은 주소가 파생되는지 확인한다.
  async function checkSigner() {
    setCheck(null);
    const started = Date.now();
    try {
      const same = await withSigner(async (signer) => signer.address === address);
      setCheck(`${same ? '일치' : '불일치'} · ${Date.now() - started}ms`);
    } catch (e) {
      setCheck(errorMessage(e));
    }
  }

  function confirmDelete() {
    Alert.alert('개발용: 지갑을 지울까요?', '복구 문구가 없으면 되돌릴 수 없습니다.', [
      { text: '취소', style: 'cancel' },
      { text: '지우기', style: 'destructive', onPress: () => void useWallet.getState().reset() },
    ]);
  }

  return (
    <Screen>
      <View style={styles.tabs}>
        {activeNetworks.map((n) => (
          <Pressable
            key={n.id}
            onPress={() => setNetwork(n)}
            style={[styles.tab, { backgroundColor: n.id === network.id ? c.accent : c.card }]}
          >
            <Label style={{ color: n.id === network.id ? '#fff' : c.text }}>{n.name}</Label>
          </Pressable>
        ))}
      </View>

      <Card>
        <Label muted>내 주소</Label>
        <Label mono>{address}</Label>
        <Button
          title="주소 복사"
          secondary
          onPress={() => void Clipboard.setStringAsync(address)}
        />
      </Card>

      <Card>
        {balances?.map((b) => (
          <View key={b.symbol} style={styles.row}>
            <Label>{b.symbol}</Label>
            <Label mono>{formatAmount(b.raw, b.decimals)}</Label>
          </View>
        ))}
        {error != null && <Label>{errorMessage(error)}</Label>}
        <Button title="새로고침" secondary busy={loading} onPress={() => void refresh()} />
      </Card>

      {__DEV__ && (
        <Card>
          <Label muted>개발용</Label>
          <Button title="Face ID로 서명 키 확인" secondary onPress={() => void checkSigner()} />
          {check && <Label>{check}</Label>}
          <Button title="지갑 지우기" secondary onPress={confirmDelete} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
