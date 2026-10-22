import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { useT } from '@/features/i18n';
import { ChevronLeftIcon } from '@/features/icons';
import { Label, useColors } from '@/features/ui';

/** 되돌아갈 화면이 없을 때(웹에서 새로고침·주소로 바로 들어온 경우) 헤더에 두는 홈 버튼 */
export function HomeBack() {
  const c = useColors();
  const t = useT();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.nav.home}
      onPress={() => router.replace('/')}
      hitSlop={10}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <ChevronLeftIcon size={24} color={c.accent} strokeWidth={2.4} />
      <Label size={17} color={c.accent}>
        {t.nav.home}
      </Label>
    </Pressable>
  );
}
