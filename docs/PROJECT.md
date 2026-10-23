# Henry Wallet — 프로젝트 명세

개인용 self-custody EVM stablecoin 지갑. 서버가 자산·키를 갖지 않고, mnemonic은 기기 안에만 있고, 서명은 기기에서 한다.
이 문서가 기준(source of truth)이다. 결정이 바뀌면 코드와 같은 커밋에서 고친다. 지금 상태만 적는다.

## 범위

- 네트워크: Polygon, Ethereum, Avalanche C-Chain (테스트넷: Polygon Amoy, Ethereum Sepolia, Avalanche Fuji)
- 자산: USDC, JPYC (ERC-20) + 가스용 native(POL, ETH)
- 기능: Create, Import(mnemonic), Balance, Send, Receive(주소·QR), QR 스캔, History(앱이 보낸 tx)
- 계정: mnemonic 하나, 계정 하나(`m/44'/60'/0'/0/0`, MetaMask 첫 계정과 같은 주소)
- 하지 않는 것: 백엔드, dApp 연결/WalletConnect, swap, approve, 다중 계정, private key import, 들어온 tx 목록, 푸시, Bitcoin

## 기술 스택

| 영역      | 선택                                             | 메모                                                                  |
| --------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| 앱        | Expo SDK 58 (RN 0.88) + TypeScript + Expo Router | 개발용 빌드(`expo-dev-client`), iPhone 기준                           |
| EVM       | ethers v6                                        | 버전 고정. `react-native-get-random-values`를 엔트리 맨 앞에서 import |
| 비밀 저장 | expo-secure-store                                | iOS Keychain / Android Keystore                                       |
| 로컬 DB   | expo-sqlite                                      | 비민감 데이터만                                                       |
| 상태      | Zustand                                          |                                                                       |
| 검증      | Zod(설치만 됨)                                   | 아직 쓰는 곳 없음. 주소·금액은 `core/address`·`core/amount`가 검증    |
| QR        | react-native-qrcode-svg(생성), expo-camera(스캔) |                                                                       |
| 인증      | expo-secure-store `requireAuthentication`        | Face ID. 별도 인증 라이브러리 없음                                    |
| 테스트    | jest-expo                                        | 꼭 필요한 순수 로직만                                                 |

`react-native-keychain` 대신 `expo-secure-store`를 쓴다: keychain 라이브러리는 2025-03 이후 릴리스가 없고, secure-store는 SDK와 같이 유지되며 필요한 옵션(this-device-only, 생체 인증)이 다 있다.

## 보안 모델

- **mnemonic만** secure-store에 저장한다. 옵션은 `keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY`(iCloud/백업으로 안 나감) + `requireAuthentication: true`(읽을 때마다 Face ID).
- private key는 저장하지 않는다. 서명할 때 mnemonic에서 파생해 쓰고 참조를 버린다.
- 주소(공개 정보)는 secure-store에 인증 없이 따로 둔다. 잔액 조회에 Face ID가 필요 없고, 재설치 때 지갑이 남아 있는지 Face ID 없이 알 수 있다.
- secret 금지 위치: AsyncStorage, SQLite, `.env`, Git, 로그(`console.*`), 에러 메시지, 클립보드.
- 복구 문구 화면은 스크린샷·화면 녹화를 막는다(expo-screen-capture). 문구 복사 버튼은 두지 않는다.
- 새 지갑은 문구를 보여준 뒤 무작위 세 자리의 단어를 4지선다로 확인한다. 문구를 다시 보러 갔다 오면 질문 위치를 새로 뽑는다(화면을 보고 외워 재사용하지 못하게, 종이를 보고 답하게 하는 마찰).
- 암호 primitive(BIP-39, secp256k1, keccak, 키 파생)는 직접 구현하지 않고 ethers를 쓴다.
- 의존성은 정확한 버전으로 고정하고 lockfile을 커밋한다. 서명·키 경로에는 새 패키지를 들이지 않는다.
- Face ID 등록 정보가 바뀌면 iOS가 항목을 무효화할 수 있다 → 그때는 mnemonic으로 복원한다(백업이 유일한 복구 수단).

백업은 복구 문구(종이)만 쓴다. 암호화 클라우드 백업·패스키 스마트 계정·MPC는 MetaMask 호환과 "니모닉 → 키 → 서명" 학습 흐름을 바꾸거나 외부 서버가 필요해 하지 않는다.

MetaMask와의 차이: MetaMask는 앱 비밀번호로 암호화한 vault를 저장하고 그 비밀번호를 Keychain에 둔다(2중). 이 앱은 단일 기기 개인용이라 앱 비밀번호 없이 OS Keychain + Face ID에 맡긴다. 접근 옵션(this-device-only, 생체/기기 암호)과 스크린샷 차단은 MetaMask와 같다.

### 재설치 규칙

iOS Keychain은 앱을 지워도 남고 SQLite는 지워진다. SQLite가 새로 만들어졌는데(설치 표시 없음) secure-store에 주소가 있으면 "기존 지갑 계속 쓰기"와 "지우고 새로 시작"을 묻는다. 지우기는 mnemonic과 주소를 모두 삭제한다.

## 언어

한국어·영어를 지원한다. 화면에 보이는 문구는 모두 `features/i18n/messages.ts`에 있다: `ko`가 기준이고 `en`은 같은 모양이어야 한다(빠뜨리면 typecheck가 알려준다). 컴포넌트는 `useT()`, 이벤트 핸들러는 `currentMessages()`로 읽는다. `core`에는 문구를 두지 않고 에러는 `WalletError`의 `code`로 `messages.errors`에서 고른다. 처음에는 기기 언어를 따른다(한국어면 한국어, 그 밖에는 영어). 홈과 환영 화면 오른쪽 위의 동그란 언어 버튼(지구 아이콘만)으로 바꾸며(네트워크 버튼과 같이 iOS는 액션 시트, 웹·Android는 아래로 펼쳐지는 목록에서 한국어 · English), 고른 언어는 SQLite `meta`에 저장한다. 토큰 금액·주소·hash 표기는 언어와 무관하다.

## 구조

```text
src/
├── app/            # 화면(Expo Router). 로직은 features/core를 부른다
├── features/       # 화면 단위 UI·hook: wallet, home, send, history, i18n(문구·언어), theme(색·글꼴)
├── platform/       # 기기와 닿는 경계. ui.ts: 카메라·QR·복구 문구 입력란·화면 캡처 차단·safe area
└── core/           # React를 모르는 지갑 로직
    ├── config/     # networks.ts, tokens.ts
    ├── keys/       # mnemonic 생성·검증·파생, secure-store 접근 (mnemonic을 만지는 유일한 곳)
    ├── evm/        # provider(RPC 연결 지점), 잔액, 수수료, 전송, receipt
    ├── transfer.ts # 거래 흐름: 서명 → 저장 → 전송 → 확인(서버가 없어 앱 안에서 이어 붙이는 지점)
    ├── db.ts · history.ts  # SQLite tx 저장소
    └── errors.ts   # WalletError(code)

demo/               # 전시용 웹 데모(pnpm demo). 가짜 데이터와 가짜 경계만 둔다
├── data.ts         # 가짜 값은 모두 여기(잔액, 거래 내역, 수수료, 대기 시간)
├── platform/       # src/platform 대신 쓰는 가짜(ui.tsx, 가짜 카메라 camera.tsx)
├── stubs/          # 저장소(db·history)·키 보관(vault)·RPC(provider)를 메모리로 바꾼 파일
├── overrides.js    # Metro가 실제 파일 대신 stubs를 쓰게 하는 목록
└── entry.tsx · phone-frame.tsx  # 웹 진입점과 휴대폰 틀
```

- `core`는 `app`/`features`/React를 import하지 않는다.
- 지갑 로직은 화면에 두지 않는다. 서버가 없어도 앱 안에서 "서비스(core)"와 "화면(app·features)"을 나눈다: 거래를 이어 붙이는 순서·불변식(서명 → 전송 전 pending 저장 → 전송 → receipt 반영)은 `core/transfer.ts`에만 두고, 화면은 그 함수를 부르고 결과를 그리기만 한다. 새 흐름(예: 다른 체인)도 같은 방식으로 core에 둔다.
- 체인 코드는 `core/evm`에만 둔다. Bitcoin을 하게 되면 `core/btc`를 같은 모양(잔액·수수료·전송·주소 검증)으로 더하고, 지금은 공통 인터페이스를 미리 만들지 않는다.
- History는 `core/history` 함수로만 접근한다(나중에 동기화를 붙이더라도 지갑 로직은 모른다).
- 데모: `pnpm demo`는 `demo/overrides.js` 목록에 있는 곳만 `demo/stubs`로 바꿔 웹에서 연다. 앱 바깥과 닿는 경계(`core/db`, `core/history`, `core/keys/vault`, `core/evm/provider`, 웹에 없는 스크린샷 차단과 safe area — 휴대폰 틀 안에서는 iPhone과 같은 아래 여백 34 — `platform/ui`)와, 공개 웹 데모에서 막아야 하는 것들이다: 새 지갑 문구는 무작위가 아니라 공개된 예시 문구(`core/keys/mnemonic`), 가져오기는 입력란 대신 예시 문구(`platform/ui`의 `PhraseInput`), 카메라는 켜지 않고 어두운 뷰파인더에 예시 QR이 비친 모습을 보인 뒤 잠깐 지나 예시 받는 주소를 읽은 것처럼 넘긴다(`platform/ui`의 `CameraView`), 클립보드는 읽지도 쓰지도 않음(붙여넣기는 예시 받는 주소, 복사는 안내 — `expo-clipboard`), 받기·스캔 화면의 QR은 모양은 그대로지만 주소가 아닌 안내 글을 담아 찍어도 송금 주소가 되지 않게(`platform/ui`의 `QRCode`), 받기 공유는 안내(`features/share`), 가짜 거래의 탐색기 링크는 안내(토큰 컨트랙트 링크는 실제로 연다 — `features/format`의 `openExplorer`). 웹 스크롤바는 휴대폰처럼 숨기고(`demo/entry.tsx`), 화면 위에는 늘 회색 안내 줄("예시 데이터로 보는 데모예요…")이 있어 화면 안에는 데모 표시를 따로 두지 않고, 서명할 때 Face ID 장면을 보여준다(`demo/overlay.tsx`). 데모에만 나오는 문구는 `demo/text.ts`에 둔다. 수수료 계산·서명·전송 로직은 실제 코드가 그대로 돈다. `src`는 `demo`를 import하지 않고, 가짜 값은 `demo/data.ts`에만 둔다. 목록의 앱 파일·패키지·가짜 파일이 하나라도 없으면 Metro가 시작할 때 멈춘다(옮긴 뒤 조용히 진짜 모듈이 도는 것을 막는다). `src`에서 `demo`를 import하면 lint 에러다. 바꾸는 단위는 늘 파일이다(Metro는 해석 결과를 같은 폴더끼리 나눠 써서 "이 화면에서 부를 때만" 같은 조건은 옆 화면으로 샌다). 화면 하나의 부품만 바꾸려면 그 부품을 작은 파일로 뺀다. 바꾼 파일의 export가 바뀌면 stub도 같이 고친다(stub이 실제 함수 타입을 따라 typecheck가 알려준다). 주소창 `?state=empty|found|error`로 시작 화면을 고른다. 키는 페이지 메모리에만 있고, 문구가 고정이라 새로고침해도 같은 주소다.
- 공개 데모: `pnpm demo:build`가 같은 데모를 정적 파일(`dist/`)로 만든다. 공개 빌드는 `?state=`를 무시하고 늘 지갑이 있는 홈에서 시작한다(지갑 만들기·가져오기는 보이지 않는다). Cloudflare Pages(프로젝트 `henry-wallet`, 빌드 명령 `pnpm demo:build`, 출력 `dist`, 환경 변수 `NODE_VERSION=24`·`PNPM_VERSION=12.6.0`)가 `main`이 바뀔 때마다 빌드해 `wallet.portfolio-hub.dev`로 내보낸다(빌드 감시 경로에서 `docs/*`·`*.md`를 빼서 문서만 바뀐 커밋·PR은 빌드하지 않는다). 결과에 `404.html`이 없어 Pages가 없는 경로를 `index.html`로 보낸다. Pages는 경로에 `node_modules`가 든 파일을 올리지 않아서, `demo:build`가 패키지 자산(폰트·헤더 아이콘)을 `dist/assets/vendor`로 옮기고 번들 안 경로를 고친다.

### Config

```ts
type NetworkConfig = {
  id: 'polygon' | 'ethereum' | 'avalanche' | 'polygon-amoy' | 'sepolia' | 'avalanche-fuji';
  chainId: number;
  name: string;
  rpcUrl: string; // 기본은 공개 RPC, EXPO_PUBLIC_RPC_<ID>로 덮어쓴다
  explorerUrl: string;
  native: { symbol: 'POL' | 'ETH' | 'AVAX'; decimals: 18 };
  testnet: boolean;
};

type TokenConfig = {
  networkId: NetworkConfig['id'];
  symbol: 'USDC' | 'JPYC';
  address: string; // 공식 출처에서 확인하고 출처를 주석으로 남긴다
  decimals: number; // USDC 6, JPYC 18 — 조회값과 다르면 거부
};
```

빌드는 테스트넷 모드와 메인넷 모드 중 하나로 동작한다(`EXPO_PUBLIC_NETWORK_MODE=testnet|mainnet`). 한 화면에 테스트넷과 메인넷을 섞지 않는다.

토큰 주의:

- Polygon·Avalanche USDC는 Circle native USDC만 지원한다. 브릿지된 USDC.e는 지원하지 않는다(받기 화면에 안내).
- JPYC는 자금이동업(전자결제수단) JPYC `0xE7C3…3c29`만 쓴다(네 체인 같은 주소, 출처는 `tokens.ts`). 이전 선불식 JPYC `0x431D…7BDB`는 다른 토큰이다.
- 테스트넷 USDC는 Circle faucet, 테스트넷 JPYC는 같은 주소로 JPYC Faucet(faucet.jpyc.co.jp)에서 받는다.

## 송금

순서: 토큰·수신자·금액 입력 → 검증 → 수수료 추정 → 확인 화면(전체 주소, 네트워크, 금액, 예상 수수료) → Face ID → 서명 → 전송 → pending → receipt.

입력 화면 한 장에서 받는 주소와 금액을 모두 받는다. 금액은 앱 안의 숫자 키패드로만 입력하고(`features/send/keypad.tsx`, 입력이 만드는 문자열 규칙은 `core/amount`의 `applyAmountKey`: 소수점 한 번, 소수 6자리까지(토큰 decimals가 더 작으면 그만큼, JPYC도 6자리), 정수 9자리까지, 맨 앞 0 정리), 값으로 바꾸는 것은 늘 `parseAmount`다. 토큰을 바꾸면 금액을 비운다. 받는 주소는 붙여넣기·QR 스캔이 기본이고, 작은 "직접 입력"만 시스템 키보드를 쓴다 — 그 입력 칸에 포커스가 있는 동안에는 키패드를 숨기고, 올바른 주소가 완성되면 키보드를 내려 키패드로 돌아온다. 올바른 주소는 앞뒤 네 글자를 강조해 받는 쪽과 맞춰 보게 한다. 잔액보다 큰 금액은 입력 중에 빨갛게 표시하고 확인 버튼을 막는다.

검증(서명 전에 모두 막는다):

- 주소: `ethers.getAddress`(대소문자 섞이면 EIP-55 체크섬 검사), 0 주소 금지, **토큰 컨트랙트 주소로 보내기 금지**, 내 주소로 보내기 경고
- 금액: 문자열 → `parseUnits(amount, decimals)` → `bigint`. `number` 계산 금지. 0·음수·소수 자릿수 초과 거부
- 토큰 잔액, native 가스 잔액(가스 부족이면 서명 전에 차단)
- 체인: provider의 chainId가 config와 다르면 `NetworkMismatch`

수수료: EIP-1559. priority fee는 노드의 `eth_maxPriorityFeePerGas`, `maxFeePerGas = max(baseFee × 2 + priority, 1 gwei)`(상한만 올라가고 실제 비용은 baseFee + priority), `gasLimit = estimateGas × 1.2`. 값을 하드코딩하지 않는다. 확인 화면에는 서명할 값(to, data, nonce, gasLimit, maxFee, tip, 예상·최대 수수료)을 그대로 보여준다.
Nonce: `getTransactionCount(address, 'pending')`.

### Tx 상태

MetaMask TransactionController를 줄인 형태:

```text
submitted(pending) → confirmed | failed(revert)
                   → dropped (같은 nonce가 다른 tx로 확정됨)
```

- 서명한 raw tx에서 hash를 계산해 **전송 전에** SQLite에 `pending`으로 저장한 뒤 전송한다. 노드가 거절하면(nonce·잔액·교체 가격) `dropped`, 응답을 못 받으면 `pending`으로 두고 나중에 가린다.
- 홈을 열 때마다 `pending`인 tx를 다시 확인한다: receipt가 있으면 확정/실패, 노드도 모르는데 그 nonce가 이미 쓰였으면 `dropped`.
- 서명·전송 중에는 확인 화면에서 뒤로 갈 수 없다.
- 확인은 receipt 1개(`status === 1`)로 본다. speed-up/cancel은 하지 않는다.

History 행: `hash, networkId, asset, from, to, amount(raw 문자열), status, createdAt`.
들어온 tx는 잔액 변화와 explorer 링크로만 확인한다.

## QR

- 받기: 주소만 담은 QR(react-native-qrcode-svg) + 네트워크 경고 + 복사·공유.
- 스캔(expo-camera): 주소만 있는 QR과 EIP-681(`ethereum:<주소>@<chainId>`)을 읽는다. ERC-20 결제 URI(`/transfer?address=`)는 앞의 토큰 컨트랙트가 아니라 `address` 파라미터를 받는 주소로 쓴다. chainId가 현재 네트워크와 다르면 거부. 읽은 주소는 보내기 화면에 넣기만 하고 검증은 `parseRecipient`가 한다.

## 에러

`WalletError`의 `code`로 화면 문구를 고른다. raw RPC 에러는 화면에 보여주지 않는다(로그에도 tx 원문·키를 남기지 않는다).

`InvalidAddress`, `InvalidAmount`, `InsufficientTokenBalance`, `InsufficientGasBalance`, `RpcUnavailable`,
`GasEstimationFailed`, `SigningFailed`, `BroadcastFailed`, `TransactionReverted`, `NetworkMismatch`, `UnsupportedAsset`, `AuthCancelled`

## UI

D안 "투명한 거래"(디자인 캔버스: claude.ai/artifact/N8kxDH1edd99Y2QP3v2TwN). 이름은 Henry Wallet, 마크는 파란 바탕의 흰 H + 금색 코인(`assets/images/icon*.png`, 앱 안은 `features/brand.tsx`). 시스템 설정을 따라 밝은/어두운 테마(토큰은 `features/ui.tsx`의 `useColors`, 화면에서 색을 직접 쓰지 않는다. 받기 QR은 어느 테마에서도 흰 바탕, 스캔 화면은 늘 검정), 흰 카드 + 회색 바탕, 채움색 `primary` `#2F5BEA`, 성공은 `ok`(초록), 숫자·주소·tx 값은 IBM Plex Mono. 글자는 12pt 이상, 큰 글씨 설정은 1.3배까지. 서명 전 확인 화면은 금액·받는 주소·검증·수수료를 먼저 보이고 raw 트랜잭션 필드는 접어 둔다. 헨리 코인(`features/brand.tsx`의 `HenryCoin`, 앱 아이콘의 코인과 같은 그라데이션·고리)은 보냄이 확정된 화면(뒤집히며 나타남, 동작 줄이기를 켜면 바로 표시)과 보낸 거래가 없는 빈 상태에만 쓴다. 대기·실패 화면은 기존 아이콘을 그대로 둔다(성공으로 오해하지 않게). 화면 헤더 제목은 iOS 기본과 같은 가운데·17pt 굵게로 지정해 웹에서도 같은 모양이다. 되돌아갈 화면이 없을 때(웹에서 새로고침·주소로 바로 들어온 경우) 보내기·받기 헤더 왼쪽은 홈으로 가는 버튼이지만 보통의 뒤로 가기와 같은 화살표로 보인다(`features/home-back.tsx`). 홈 왼쪽 위 네트워크 버튼은 iOS에서 시스템 액션 시트로, 웹·Android에서는 버튼 아래로 펼쳐지는 목록(지금 네트워크에 체크, 바깥을 누르면 닫힘)으로 고른다(`features/home/network-picker.tsx`, 펼침 목록은 언어 버튼과 함께 `features/dropdown.tsx`). 보내기 결과 화면(`app/send-status.tsx`)은 서명·전송·블록 포함 단계와 수수료를 보이고, 블록 탐색기는 '네트워크에 전송' 줄의 hash 링크로만 연다(아래 버튼은 "홈으로" 하나). 보낸 거래 줄을 누르면 앱 안 거래 상세(`app/tx.tsx`, `core/history`의 `getTx`)를 연다: 상태(확정은 헨리 코인, 대기·실패는 기존 아이콘, 실패면 수수료만 나갔다는 설명), 금액, 받는 주소 전체(복사), 네트워크·보낸 시각·nonce·거래 hash(복사). 대기 중이면 확정을 기다려 상태를 바꾸고, 블록 탐색기는 맨 아래 링크로만 연다. 수수료는 저장하지 않아 상세에 없다. 칩(배지) 대신 아이콘+글자. 뜻이 분명한 보조 동작(복사·공유)은 아이콘 버튼, 헷갈릴 수 있는 것(붙여넣기·QR 스캔)은 글자 버튼. 토큰 로고는 `assets/tokens/`: USDC·POL·ETH는 Trust Wallet assets(MIT), JPYC는 JPYC 공식 GitHub 조직 프로필 이미지. 토큰은 `src/features/ui.tsx`.

홈은 일부러 한 화면이다. 코인 지식을 익히려는 학습용 프로젝트라, 스테이블코인 잔액·그걸 보내는 데 드는 가스용 native 잔액(남은 전송 횟수)·보낸 거래(hash)를 한 화면에 모아 셋의 관계가 한눈에 보이게 한다. 위에서부터 네트워크·언어 버튼, 잔액 카드(내 주소, 스테이블코인, 맨 아래 가스용 native 한 줄: 잔액·"수수료용"·남은 전송 횟수, 0회면 빨간 "수수료 부족"), 카드 밖의 보내기·받기·스캔 버튼, 보낸 거래 최근 5건 순이다. 보낸 거래가 더 있으면 제목 옆 "전체 보기"로 지금 네트워크의 보낸 거래 전부를 보는 화면(`app/history.tsx`)을 연다. 거래 줄은 두 화면이 같이 쓴다(`features/history/tx-row.tsx`). 서비스용이라면 더 나눈다: 가스용 native는 토큰 목록의 한 줄로 두고 부족할 때만 경고하며, 거래 기록은 따로 된 탭에 둔다.

## 테스트

자동 테스트는 틀리면 돈이 사라지는 순수 로직만 둔다:

- 금액 파싱/표시(decimals 6·18, 경계값)
- 주소 검증(체크섬, 토큰 컨트랙트 주소 차단)
- 키 파생 test vector(알려진 mnemonic → 알려진 주소)

나머지(RPC, 서명, 화면)는 테스트넷에서 `ROADMAP.md`의 체크리스트로 확인한다. 테스트를 늘리지 않는다.

CI(`.github/workflows/ci.yml`의 `check`)는 모든 PR에서 돈다. 문서(`docs/`, `*.md`)만 바뀌었으면 설치·검사를 건너뛰고 바로 통과하고, 아니면 `pnpm check`를 돌린다. 같은 PR에 다시 push하면 앞선 실행은 취소한다.

## RPC

기본은 무료 공개 RPC. 키가 있는 provider를 쓰면 키는 앱에 들어가므로 공개된 값으로 보고, provider 쪽에서 허용 범위를 제한한다. RPC는 잔액을 속일 수는 있어도 키를 훔칠 수는 없다(서명은 기기에서만).
