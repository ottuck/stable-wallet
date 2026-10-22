import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { useT } from '@/features/i18n';
import { ArrowLeftIcon } from '@/features/icons';
import { useColors } from '@/features/ui';

/**
 * 되돌아갈 화면이 없을 때(웹에서 새로고침·주소로 바로 들어온 경우) 헤더에 두는 홈 버튼.
 * 보통의 뒤로 가기와 같은 화살표로 보여 화면마다 모양이 달라지지 않게 한다(이 화면들은 모두 홈에서 연다).
 */
export function HomeBack() {
  const c = useColors();
  const t = useT();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.nav.home}
      onPress={() => router.replace('/')}
      hitSlop={10}
      style={({ pressed }) => ({ padding: 4, marginLeft: 10, opacity: pressed ? 0.6 : 1 })}
    >
      <ArrowLeftIcon size={24} color={c.text} strokeWidth={2.2} />
    </Pressable>
  );
}
