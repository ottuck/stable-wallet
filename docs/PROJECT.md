# Henry Wallet — 프로젝트 명세

개인용 self-custody EVM stablecoin 지갑. 서버가 자산·키를 갖지 않고, mnemonic은 기기 안에만 있고, 서명은 기기에서 한다.
이 문서가 기준(source of truth)이다. 결정이 바뀌면 코드와 같은 커밋에서 고치고, 지금 상태만 적는다.

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
| 비밀 저장 | expo-secure-store                                | iOS Keychain. `requireAuthentication`으로 Face ID                     |
| 로컬 DB   | expo-sqlite                                      | 비민감 데이터만                                                       |
| 상태      | Zustand                                          |                                                                       |
| 검증      | Zod                                              | 설치만 됨. 주소·금액은 `core/address`·`core/amount`가 검증            |
| QR        | react-native-qrcode-svg(생성), expo-camera(스캔) |                                                                       |
| 테스트    | jest-expo                                        | 꼭 필요한 순수 로직만                                                 |

## 보안 모델

- **mnemonic만** secure-store에 저장한다. `keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY`(iCloud/백업으로 안 나감) + `requireAuthentication: true`(읽을 때마다 Face ID).
- private key는 저장하지 않는다. 서명할 때 mnemonic에서 파생해 쓰고 참조를 버린다.
- 주소(공개 정보)는 인증 없이 따로 둔다. 잔액 조회와 재설치 때 지갑 확인에 Face ID가 필요 없다.
- secret 금지 위치: AsyncStorage, SQLite, `.env`, Git, 로그(`console.*`), 에러 메시지, 클립보드.
- 복구 문구 화면은 스크린샷·화면 녹화를 막고(expo-screen-capture) 복사 버튼을 두지 않는다. 새 지갑은 문구를 보여준 뒤 무작위 세 자리의 단어를 4지선다로 확인하고, 문구를 다시 보러 갔다 오면 질문 위치를 새로 뽑는다.
- 암호 primitive(BIP-39, secp256k1, keccak, 키 파생)는 직접 구현하지 않고 ethers를 쓴다.
- 의존성은 정확한 버전으로 고정하고 lockfile을 커밋한다. 서명·키 경로에는 새 패키지를 들이지 않는다.
- 백업은 복구 문구(종이)뿐이다. Face ID 등록 정보가 바뀌어 iOS가 항목을 무효화하면 mnemonic으로 복원한다.

재설치: iOS Keychain은 앱을 지워도 남고 SQLite는 지워진다. SQLite가 새로 만들어졌는데 secure-store에 주소가 있으면 "기존 지갑 계속 쓰기"와 "지우고 새로 시작"을 묻는다. 지우기는 mnemonic과 주소를 모두 삭제한다.

## 언어

한국어·영어. 화면 문구는 모두 `features/i18n/messages.ts`에 둔다(`ko`가 기준, `en`은 같은 모양). 컴포넌트는 `useT()`, 이벤트 핸들러는 `currentMessages()`로 읽는다. `core`에는 문구를 두지 않고 에러는 `WalletError`의 `code`로 고른다. 처음에는 기기 언어를 따르고(한국어가 아니면 영어), 홈·환영 화면의 언어 버튼으로 바꾼 값은 SQLite `meta`에 저장한다.

## 구조

```text
src/
├── app/            # 화면(Expo Router). 로직은 features/core를 부른다
├── features/       # 화면 단위 UI·hook
├── platform/       # 기기·바깥과 닿는 유일한 경계: services.ts(보안 저장소·난수·RPC·저장소·클립보드·공유·링크), ui.ts(카메라·QR·문구 입력란·캡처 차단·safe area), store.ts(SQLite)
└── core/           # React를 모르는 지갑 로직
    ├── config/     # networks.ts, tokens.ts
    ├── keys/       # mnemonic 생성·검증·파생, 보안 저장소 접근 (mnemonic을 만지는 유일한 곳)
    ├── evm/        # provider, 잔액, 수수료, 전송, receipt
    ├── transfer.ts # 거래 흐름: 서명 → 저장 → 전송 → 확인
    ├── db.ts · history.ts  # 설치 표시·설정과 거래 기록의 모양
    └── errors.ts   # WalletError(code)
demo/               # 전시용 웹 데모. 가짜 데이터와 src/platform의 가짜 구현만 둔다
```

- `core`는 `app`/`features`/React를 import하지 않는다.
- 거래 순서·불변식(서명 → 전송 전 pending 저장 → 전송 → receipt 반영)은 `core/transfer.ts`에만 있고, 화면은 부르기만 한다.
- 체인 코드는 `core/evm`에만, History 접근은 `core/history`에만 둔다.
- 기기 패키지·`Share`·`Linking`·`randomBytes`는 `src/platform` 밖에서 import하면 lint 에러다.

### 웹 데모

- `pnpm demo`는 `src/platform/services.ts`·`ui.ts`를 `demo/platform`의 가짜로 바꿔 끼워 웹에서 연다(`metro.config.js`, `demo/overrides.js`). 앱 코드에는 데모 분기가 없고 `src`는 `demo`를 import하지 않는다. 지갑 규칙·화면은 실제 코드가 그대로 돈다.
- 실제 돈과 닿지 않는다: 복구 문구는 공개된 예시 문구, RPC는 메모리의 가짜 노드, 클립보드·카메라는 쓰지 않고, QR에는 주소 대신 안내 글을 담고, 복사·공유·가짜 거래의 탐색기 링크는 안내만 한다. 새 기기 기능을 더하면 `demo/platform`에서 같은 규칙으로 막는다.
- 가짜 값은 `demo/data.ts`, 데모 문구는 `demo/text.ts`. 주소창 `?state=empty|found|error`로 시작 화면을 고른다.
- 공개 사이트 `wallet.portfolio-hub.dev`: Cloudflare Pages(프로젝트 `henry-wallet`, 빌드 명령 `pnpm demo:build`, 출력 `dist`, `NODE_VERSION=24`, `PNPM_VERSION=12.6.0`)가 `main`이 바뀔 때마다 빌드한다(`docs/*`·`*.md`만 바뀌면 건너뜀). 공개 빌드는 `?state=`를 무시하고 늘 지갑이 있는 홈에서 시작한다.

## Config

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

토큰:

- Polygon·Avalanche USDC는 Circle native USDC만 지원한다. 브릿지된 USDC.e는 지원하지 않는다(받기 화면에 안내).
- JPYC는 자금이동업(전자결제수단) JPYC `0xE7C3…3c29`만 쓴다(네 체인 같은 주소, 출처는 `tokens.ts`). 이전 선불식 JPYC `0x431D…7BDB`는 다른 토큰이다.
- 테스트넷 USDC는 Circle faucet, 테스트넷 JPYC는 JPYC Faucet(faucet.jpyc.co.jp)에서 받는다.

## 송금

순서: 토큰·수신자·금액 입력 → 검증 → 수수료 추정 → 확인 화면(전체 주소, 네트워크, 금액, 예상 수수료) → Face ID → 서명 → 전송 → pending → receipt.

- 입력은 화면 한 장. 금액은 앱 안의 숫자 키패드로만 입력하고(`core/amount`의 `applyAmountKey`: 소수점 한 번, 소수 6자리까지, 정수 9자리까지), 값으로 바꾸는 것은 늘 `parseAmount`다.
- 받는 주소는 붙여넣기·QR 스캔이 기본이고 작은 "직접 입력"만 시스템 키보드를 쓴다. 올바른 주소는 앞뒤 네 글자를 강조해 받는 쪽과 맞춰 보게 한다.
- 잔액보다 큰 금액은 입력 중에 빨갛게 표시하고 확인 버튼을 막는다.

검증(서명 전에 모두 막는다):

- 주소: `ethers.getAddress`(대소문자 섞이면 EIP-55 체크섬 검사), 0 주소 금지, **토큰 컨트랙트 주소로 보내기 금지**, 내 주소로 보내기 경고
- 금액: 문자열 → `parseUnits(amount, decimals)` → `bigint`. `number` 계산 금지. 0·음수·소수 자릿수 초과 거부
- 토큰 잔액, native 가스 잔액(가스 부족이면 서명 전에 차단)
- 체인: provider의 chainId가 config와 다르면 `NetworkMismatch`

수수료: EIP-1559. priority fee는 노드의 `eth_maxPriorityFeePerGas`, `maxFeePerGas = max(baseFee × 2 + priority, 1 gwei)`, `gasLimit = estimateGas × 1.2`. 값을 하드코딩하지 않는다. 확인 화면에는 서명할 값(to, data, nonce, gasLimit, maxFee, tip, 예상·최대 수수료)을 그대로 보여준다. Nonce는 `getTransactionCount(address, 'pending')`.

### Tx 상태

```text
submitted(pending) → confirmed | failed(revert)
                   → dropped (같은 nonce가 다른 tx로 확정됨)
```

- 서명한 raw tx에서 hash를 계산해 **전송 전에** SQLite에 `pending`으로 저장한 뒤 전송한다. 노드가 거절하면(nonce·잔액·교체 가격) `dropped`, 응답을 못 받으면 `pending`으로 두고 나중에 가린다.
- 홈을 열 때마다 `pending`인 tx를 다시 확인한다: receipt가 있으면 확정/실패, 노드도 모르는데 그 nonce가 이미 쓰였으면 `dropped`.
- 서명·전송 중에는 확인 화면에서 뒤로 갈 수 없다. 확인은 receipt 1개(`status === 1`)로 보고, speed-up/cancel은 하지 않는다.

History 행: `hash, networkId, asset, from, to, amount(raw 문자열), status, createdAt`. 들어온 tx는 잔액 변화와 explorer 링크로만 확인한다.

## QR

- 받기: 주소만 담은 QR + 네트워크 경고 + 복사·공유.
- 스캔: 주소만 있는 QR과 EIP-681(`ethereum:<주소>@<chainId>`)을 읽는다. ERC-20 결제 URI(`/transfer?address=`)는 앞의 토큰 컨트랙트가 아니라 `address` 파라미터를 받는 주소로 쓴다. chainId가 현재 네트워크와 다르면 거부. 읽은 주소는 보내기 화면에 넣기만 하고 검증은 `parseRecipient`가 한다.

## 에러

`WalletError`의 `code`로 화면 문구를 고른다. raw RPC 에러는 화면에 보여주지 않고, 로그에도 tx 원문·키를 남기지 않는다.

`InvalidAddress`, `InvalidAmount`, `InsufficientTokenBalance`, `InsufficientGasBalance`, `RpcUnavailable`,
`GasEstimationFailed`, `SigningFailed`, `BroadcastFailed`, `TransactionReverted`, `NetworkMismatch`, `UnsupportedAsset`, `AuthCancelled`

## UI

- 이름은 Henry Wallet, 마크는 파란 바탕의 흰 H + 금색 코인.
- 시스템 설정을 따라 밝은/어두운 테마. 색은 `features/ui.tsx`의 `useColors` 토큰만 쓴다(받기 QR은 늘 흰 바탕, 스캔 화면은 늘 검정). 채움색 `primary` `#2F5BEA`, 성공은 `ok`(초록).
- 숫자·주소·tx 값은 IBM Plex Mono. 글자는 12pt 이상, 큰 글씨 설정은 1.3배까지.
- 칩(배지) 대신 아이콘+글자. 복사·공유는 아이콘 버튼, 붙여넣기·QR 스캔은 글자 버튼.
- 홈은 일부러 한 화면이다: 스테이블코인 잔액, 가스용 native 잔액(남은 전송 횟수, 0회면 빨간 "수수료 부족"), 보낸 거래 최근 5건(더 있으면 "전체 보기")을 함께 보여 셋의 관계가 한눈에 보이게 한다.
- 서명 전 확인 화면은 금액·받는 주소·검증·수수료를 먼저 보이고 raw 트랜잭션 필드는 접어 둔다. 보낸 거래 줄을 누르면 앱 안 거래 상세를 연다(블록 탐색기는 링크로만).
- 헨리 코인은 보냄이 확정된 화면·거래 상세의 확정·보낸 거래가 없는 빈 상태에만 쓴다. 대기·실패는 기존 아이콘을 그대로 둔다(성공으로 오해하지 않게).

## 테스트

자동 테스트는 틀리면 돈이 사라지는 순수 로직만 둔다: 금액 파싱/표시(decimals 6·18, 경계값), 주소 검증(체크섬, 토큰 컨트랙트 주소 차단), 키 파생 test vector(알려진 mnemonic → 알려진 주소). 나머지(RPC, 서명, 화면)는 테스트넷에서 `ROADMAP.md`의 체크리스트로 확인한다. 테스트를 늘리지 않는다.

CI(`.github/workflows/ci.yml`의 `check`)는 모든 PR에서 돈다. 문서(`docs/`, `*.md`)만 바뀌었으면 바로 통과하고, 아니면 `pnpm check`를 돌린다.

## RPC

기본은 무료 공개 RPC. 키가 있는 provider를 쓰면 키는 앱에 들어가므로 공개된 값으로 보고, provider 쪽에서 허용 범위를 제한한다. RPC는 잔액을 속일 수는 있어도 키를 훔칠 수는 없다(서명은 기기에서만).
