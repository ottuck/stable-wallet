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

- [ ] 테스트 USDC `balanceOf` (Amoy POL·USDC faucet 필요)
- [ ] transfer 생성 → Face ID → 로컬 서명 → 전송 → receipt confirmed
- [ ] 앱을 닫았다 열어도 pending 거래가 확정으로 바뀐다
- [ ] 잔액·가스 부족이면 서명 버튼이 막힌다

### 기능 완성

- [ ] Create(복구 문구 표시, 스크린샷 차단, 단어 확인) / Import
- [ ] 재설치 규칙(PROJECT.md)
- [ ] Balance(native + USDC + JPYC, 테스트넷 JPYC는 JPYC Faucet)
- [ ] Send(검증·확인 화면·에러 문구)
- [ ] 보내기 입력: 숫자 키패드(소수점·지우기·길게 눌러 비우기·최대), 붙여넣기·QR, "직접 입력" 때 시스템 키보드와 키패드 전환, 작은 기기·큰 글씨·한국어/영어에서 한 화면에 들어가는지
- [ ] Receive(주소, 복사, QR, 네트워크 경고)
- [ ] QR 스캔 → 수신자 입력(카메라 권한 요청, 거부 뒤 설정 안내 화면 포함)
- [ ] History(pending → confirmed/failed/dropped, 재시작 후 이어서 확인)
- [ ] 한국어·영어 화면 확인(기기 언어 자동, 홈에서 언어 바꾸기, 재시작 후 유지)
- [ ] 개발용 빌드를 다시 만든 뒤 앱 이름·아이콘·스플래시, 다크 모드 화면 확인
- [ ] 헨리 코인: 전송 완료 때 뒤집히며 나타나는지(동작 줄이기를 켜면 바로 보이는지), 보낸 거래가 없는 홈의 빈 상태, 다크 모드

### Phase 1 완료 확인

- [ ] 생성 → 재시작 → 같은 지갑
- [ ] 앱 삭제 → 재설치 → 복원(Import 또는 기존 지갑 불러오기)
- [ ] MetaMask → 앱 수신, 앱 → MetaMask 송금, explorer에서 확인
- [ ] 가스 부족·잘못된 주소·RPC 끊김에서 서명 전에 막힌다

## Phase 2 — Polygon 메인넷 소액

전환 전:

- [x] USDC(native)·JPYC 메인넷 주소를 공식 출처로 확인하고 config에 출처 기록
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

## 전시 데모

- [x] `pnpm demo`: 웹에서 가짜 데이터로 지갑 전체 흐름(보내기 → 확정)을 휴대폰 틀 안에서 보여준다
- [ ] 전시용 값(`demo/data.ts`)과 시작 화면(`?state=`) 정하기
- [ ] 전시 기기·브라우저에서 리허설
- [x] 공개 웹 데모 안전장치: 고정 예시 문구(새 지갑·가져오기), 카메라·클립보드 안 씀, 받기 QR은 읽히지 않게, 복사·공유·가짜 거래 탐색기 링크는 안내, DEMO 띠, Face ID 장면
- [x] `wallet.portfolio-hub.dev` 배포: `main`에서 `pnpm demo:build`로 자동 배포되는지, 휴대폰·데스크톱 브라우저에서 첫 화면·새로고침·직접 주소(`/receive` 등)가 열리는지
- [ ] (선택) 받기 QR 가운데에 앱 아이콘: 넣는다면 `ecl="H"`, 로고는 QR 너비의 20% 안팎에 흰 여백
      (`react-native-qrcode-svg`의 `logo` 옵션, 새 패키지 없음). 아이폰 기본 카메라·앱 스캔 화면·다른 지갑 앱에서 읽히는지
      확인한 뒤 정한다. 칸이 촘촘해져 먼 거리·어두운 곳에서 인식이 느려질 수 있고, 망가지면 다른 주소가 아니라 인식 실패가 된다.
