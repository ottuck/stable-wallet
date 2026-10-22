import * as Real from '@/features/format';

import { showNotice } from '../notice';

// 실제 파일(src/features/format.ts)의 openExplorer는 블록 탐색기를 연다.
// 데모 거래의 hash는 가짜라 탐색기에 없으므로 안내만 띄운다. 토큰 컨트랙트는 실제 주소라 그대로 연다.
export * from '@/features/format';

export const openExplorer: typeof Real.openExplorer = (network, path) => {
  if (path.startsWith('token/')) Real.openExplorer(network, path);
  else showNotice('noExplorer');
};
