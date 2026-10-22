import { useEffect } from 'react';
import { Text, View, type TextInputProps } from 'react-native';

import { fonts, useColors } from '@/features/ui';

import { DEMO } from '../data';
import { useDemoText } from '../text';

// 가져오기 화면(src/app/import.tsx)이 부르는 react-native. 입력란만 바꾸고 나머지는 그대로다.
// 공개 사이트에 복구 문구 입력란이 있으면 방문자가 진짜 문구를 넣을 수 있고 피싱으로 분류될 수 있어서,
// 입력은 받지 않고 예시 문구를 보여준 뒤 그 문구로 가져온다.
export * from 'react-native';

export function TextInput({ onChangeText, style }: TextInputProps) {
  const c = useColors();
  const d = useDemoText();

  useEffect(() => {
    onChangeText?.(DEMO.phrase);
    // 처음 한 번만 채운다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ gap: 10 }}>
      <View style={[style, { backgroundColor: c.card, borderRadius: 12, padding: 12 }]}>
        <Text style={{ fontFamily: fonts.mono, fontSize: 15, lineHeight: 24, color: c.muted }}>
          {DEMO.phrase}
        </Text>
      </View>
      <Text style={{ fontSize: 13, lineHeight: 20, color: c.warn, fontWeight: '600' }}>
        {d.importNote}
      </Text>
    </View>
  );
}

export default TextInput;
