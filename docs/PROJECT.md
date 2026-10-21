# Stable Wallet — 프로젝트 명세

개인용 self-custody EVM stablecoin 지갑. 서버가 자산·키를 갖지 않고, mnemonic은 기기 안에만 있고, 서명은 기기에서 한다.
이 문서가 기준(source of truth)이다. 결정이 바뀌면 코드와 같은 커밋에서 고친다. 지금 상태만 적는다.

## 범위

- 네트워크: Polygon, Ethereum (테스트넷: Polygon Amoy, Ethereum Sepolia)
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
| 검증      | Zod                                              | 외부 입력(QR, 주소, 금액) 경계에서만                                  |
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
- 암호 primitive(BIP-39, secp256k1, keccak, 키 파생)는 직접 구현하지 않고 ethers를 쓴다.
- 의존성은 정확한 버전으로 고정하고 lockfile을 커밋한다. 서명·키 경로에는 새 패키지를 들이지 않는다.
- Face ID 등록 정보가 바뀌면 iOS가 항목을 무효화할 수 있다 → 그때는 mnemonic으로 복원한다(백업이 유일한 복구 수단).

백업은 복구 문구(종이)만 쓴다. 암호화 클라우드 백업·패스키 스마트 계정·MPC는 MetaMask 호환과 "니모닉 → 키 → 서명" 학습 흐름을 바꾸거나 외부 서버가 필요해 하지 않는다.

MetaMask와의 차이: MetaMask는 앱 비밀번호로 암호화한 vault를 저장하고 그 비밀번호를 Keychain에 둔다(2중). 이 앱은 단일 기기 개인용이라 앱 비밀번호 없이 OS Keychain + Face ID에 맡긴다. 접근 옵션(this-device-only, 생체/기기 암호)과 스크린샷 차단은 MetaMask와 같다.

### 재설치 규칙

iOS Keychain은 앱을 지워도 남고 SQLite는 지워진다. SQLite가 새로 만들어졌는데(설치 표시 없음) secure-store에 주소가 있으면 "기존 지갑 계속 쓰기"와 "지우고 새로 시작"을 묻는다. 지우기는 mnemonic과 주소를 모두 삭제한다.

## 구조

```text
src/
├── app/            # 화면(Expo Router). 로직은 features/core를 부른다
├── features/       # 화면 단위 UI·hook: onboarding, home, send, receive, history
└── core/           # React를 모르는 지갑 로직
    ├── config/     # networks.ts, tokens.ts
    ├── keys/       # mnemonic 생성·검증·파생, secure-store 접근 (mnemonic을 만지는 유일한 곳)
    ├── evm/        # provider, 잔액, 수수료, 전송, receipt
    ├── history/    # SQLite tx 저장소
    └── errors.ts   # WalletError(code)
```

- `core`는 `app`/`features`/React를 import하지 않는다.
- 체인 코드는 `core/evm`에만 둔다. Bitcoin을 하게 되면 `core/btc`를 같은 모양(잔액·수수료·전송·주소 검증)으로 더하고, 지금은 공통 인터페이스를 미리 만들지 않는다.
- History는 `core/history` 함수로만 접근한다(나중에 동기화를 붙이더라도 지갑 로직은 모른다).

### Config

```ts
type NetworkConfig = {
  id: 'polygon' | 'ethereum' | 'polygon-amoy' | 'sepolia';
  chainId: number;
  name: string;
  rpcUrl: string; // 기본은 공개 RPC, EXPO_PUBLIC_RPC_<ID>로 덮어쓴다
  explorerUrl: string;
  native: { symbol: 'POL' | 'ETH'; decimals: 18 };
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

- Polygon USDC는 Circle native USDC만 지원한다. 브릿지된 USDC.e는 지원하지 않고 잔액이 있으면 경고만 한다.
- JPYC는 신·구 컨트랙트가 있다. JPYC 공식 발표의 현재 컨트랙트만 쓴다.
- 테스트넷 USDC는 Circle 테스트넷 USDC(faucet). JPYC 테스트넷 토큰이 없으면 18 decimals 테스트 ERC-20을 직접 배포해 대신한다.

## 송금

순서: 토큰·수신자·금액 입력 → 검증 → 수수료 추정 → 확인 화면(전체 주소, 네트워크, 금액, 예상 수수료) → Face ID → 서명 → 전송 → pending → receipt.

검증(서명 전에 모두 막는다):

- 주소: `ethers.getAddress`(대소문자 섞이면 EIP-55 체크섬 검사), 0 주소 금지, **토큰 컨트랙트 주소로 보내기 금지**, 내 주소로 보내기 경고
- 금액: 문자열 → `parseUnits(amount, decimals)` → `bigint`. `number` 계산 금지. 0·음수·소수 자릿수 초과 거부
- 토큰 잔액, native 가스 잔액(가스 부족이면 서명 전에 차단)
- 체인: provider의 chainId가 config와 다르면 `NetworkMismatch`

수수료: EIP-1559. priority fee는 노드의 `eth_maxPriorityFeePerGas`, `maxFeePerGas = baseFee × 2 + priority`, `gasLimit = estimateGas × 1.2`. 값을 하드코딩하지 않는다. 확인 화면에는 서명할 값(to, data, nonce, gasLimit, maxFee, tip, 예상·최대 수수료)을 그대로 보여준다.
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

## 에러

`WalletError`의 `code`로 화면 문구를 고른다. raw RPC 에러는 화면에 보여주지 않는다(로그에도 tx 원문·키를 남기지 않는다).

`InvalidAddress`, `InvalidAmount`, `InsufficientTokenBalance`, `InsufficientGasBalance`, `RpcUnavailable`,
`GasEstimationFailed`, `SigningFailed`, `BroadcastFailed`, `TransactionReverted`, `NetworkMismatch`, `UnsupportedAsset`, `AuthCancelled`

## UI

D안 "투명한 거래"(디자인 캔버스: claude.ai/artifact/N8kxDH1edd99Y2QP3v2TwN). 밝은 테마 하나, 흰 카드 + 회색 바탕, 강조색 `#2F5BEA`, 숫자·주소·tx 값은 IBM Plex Mono. 칩(배지) 대신 아이콘+글자, 보조 동작은 아이콘 버튼. 토큰 로고는 Trust Wallet assets(MIT)에서 받은 `assets/tokens/`, JPYC는 공식 로고 확인 전까지 점선 자리 표시. 토큰은 `src/features/ui.tsx`.

## 테스트

자동 테스트는 틀리면 돈이 사라지는 순수 로직만 둔다:

- 금액 파싱/표시(decimals 6·18, 경계값)
- 주소 검증(체크섬, 토큰 컨트랙트 주소 차단)
- 키 파생 test vector(알려진 mnemonic → 알려진 주소)

나머지(RPC, 서명, 화면)는 테스트넷에서 `ROADMAP.md`의 체크리스트로 확인한다. 테스트를 늘리지 않는다.

## RPC

기본은 무료 공개 RPC. 키가 있는 provider를 쓰면 키는 앱에 들어가므로 공개된 값으로 보고, provider 쪽에서 허용 범위를 제한한다. RPC는 잔액을 속일 수는 있어도 키를 훔칠 수는 없다(서명은 기기에서만).
