# Roadmap

Phase 2까지가 1차 완성이다. Phase 3·4는 선택.

## Phase 1 — 테스트넷 지갑 (Polygon Amoy, Sepolia)

### PoC 1 — 키와 잔액

- [x] 개발용 빌드가 iPhone에서 뜬다
- [x] 지갑 생성 → 주소 표시 → secure-store 저장
- [x] 앱 재시작 → 같은 주소
- [ ] 같은 mnemonic을 MetaMask에 import → 같은 주소
- [x] Amoy/Sepolia native 잔액 조회
- [x] 생성·파생 소요 시간 확인 — 생성 0.9초, Face ID 포함 서명 키 2.3초. 지금은 그대로 두고 송금 체감이 느리면 `react-native-quick-crypto` 검토
- [ ] 복구 문구 화면 스크린샷 차단(iOS에서 찍힘 → 감지 시 문구 재생성으로 보완, 차단 여부 재확인)

### PoC 2 — ERC-20 전송

- [ ] 테스트 USDC `balanceOf`
- [ ] transfer 생성 → Face ID → 로컬 서명 → 전송 → receipt confirmed

### 기능 완성

- [ ] Create(복구 문구 표시, 스크린샷 차단, 단어 확인) / Import
- [ ] 재설치 규칙(PROJECT.md)
- [ ] Balance(native + USDC + JPYC 테스트 토큰)
- [ ] Send(검증·확인 화면·에러 문구)
- [ ] Receive(주소, 복사, QR, 네트워크 경고)
- [ ] QR 스캔 → 수신자 입력
- [ ] History(pending → confirmed/failed/dropped, 재시작 후 이어서 확인)

### Phase 1 완료 확인

- [ ] 생성 → 재시작 → 같은 지갑
- [ ] 앱 삭제 → 재설치 → 복원(Import 또는 기존 지갑 불러오기)
- [ ] MetaMask → 앱 수신, 앱 → MetaMask 송금, explorer에서 확인
- [ ] 가스 부족·잘못된 주소·RPC 끊김에서 서명 전에 막힌다

## Phase 2 — Polygon 메인넷 소액

전환 전:

- [ ] USDC(native)·JPYC 메인넷 주소를 공식 출처로 확인하고 config에 출처 기록
- [ ] 개발용 지갑은 새로 만든다(개인 메인 지갑과 분리), 복구 문구를 종이에 백업
- [ ] 로그·SQLite에 secret이 없는지 확인
- [ ] 거래소 출금 조건 확인(지원 네트워크, 최소 금액, 수수료, travel rule)

실사용(소액: POL 가스용, USDC 수십 달러 미만, JPYC 몇천 엔):

- [ ] POL 먼저 입금 → 잔액
- [ ] 거래소/JPYC EX/MetaMask → 앱 (USDC, JPYC)
- [ ] 앱 → MetaMask, MetaMask → 앱
- [ ] 수수료 표시, confirmation, QR, history, 재시작, 복원

## Phase 3 — Ethereum 메인넷 (선택)

config만으로 동작하는지 확인. 새 기능 없음.

## Phase 4 — Native Bitcoin (선택)

`core/btc`(UTXO, coin selection, PSBT). EVM 계정 모델과 비교 학습용.
