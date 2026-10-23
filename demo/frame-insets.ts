import { createContext } from 'react';
import type { EdgeInsets } from 'react-native-safe-area-context';

/** 휴대폰 틀 안에서 앱 화면에 줄 safe area. 틀 밖(좁은 화면의 휴대폰 브라우저)에서는 null이라 실제 값을 쓴다. */
export const FrameInsets = createContext<EdgeInsets | null>(null);
