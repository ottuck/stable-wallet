# Roadmap

끝난 항목은 지운다. Phase 2까지가 1차 완성이다.

## Phase 1 — 테스트넷 지갑 (Polygon Amoy, Sepolia)

Amoy POL·USDC, 테스트넷 JPYC(JPYC Faucet), Sepolia ETH를 faucet에서 먼저 받는다.

### 키와 서명

- [ ] 같은 mnemonic을 MetaMask(테스트 지갑)에 import → 같은 주소
- [ ] 복구 문구 화면 스크린샷 차단(iOS에서 찍히면 감지 시 문구 재생성으로 보완, 차단 여부 재확인)
- [ ] 테스트 USDC `balanceOf`
- [ ] transfer 생성 → Face ID → 로컬 서명 → 전송 → receipt confirmed
- [ ] 앱을 닫았다 열어도 pending 거래가 확정으로 바뀐다
- [ ] 가스·잔액 부족, 잘못된 주소, RPC 끊김에서 서명 전에 막힌다

### 화면 (iPhone)

- [ ] Create(복구 문구 표시, 스크린샷 차단, 단어 확인) / Import
- [ ] 재설치: 앱 삭제 → 재설치 → "기존 지갑 계속 쓰기" 또는 Import로 복원
- [ ] Balance(native + USDC + JPYC), Send(검증·확인 화면·에러 문구), Receive(주소·복사·QR·네트워크 경고)
- [ ] 보내기 입력: 숫자 키패드(소수점·지우기·길게 눌러 비우기·최대), 붙여넣기·QR, "직접 입력" 때 키보드·키패드 전환, 작은 기기·큰 글씨·한국어/영어에서 한 화면에 들어가는지
- [ ] QR 스캔 → 수신자 입력(카메라 권한 요청, 거부 뒤 설정 안내 화면 포함)
- [ ] History: pending → confirmed/failed/dropped, 재시작 후 이어서 확인, 홈 최근 5건 → "전체 보기"
- [ ] 거래 상세: 확정·대기·실패 모양, 대기 중 확정되면 바뀌는지, 주소·hash 복사, 탐색기 링크
- [ ] 홈: 잔액 카드 안 수수료 한 줄(작은 기기·큰 글씨·영어에서 한 줄, 0회면 빨간 "수수료 부족"), 카드 밖 보내기·받기·스캔
- [ ] 한국어·영어: 기기 언어 자동, 홈 언어 버튼, 재시작 후 유지
- [ ] 개발용 빌드를 다시 만든 뒤 앱 이름·아이콘·스플래시, 다크 모드
- [ ] 헨리 코인: 전송 완료 때 뒤집히며 나타나는지(동작 줄이기에서는 바로 보이는지), 보낸 거래가 없는 빈 상태
- [ ] `src/platform` 경계 뒤 회귀: 기존 지갑이 열리고, Face ID 서명, 거래 기록·언어 유지, 붙여넣기·복사·공유·카메라 권한 설정 이동

### 완료 확인

- [ ] MetaMask → 앱 수신, 앱 → MetaMask 송금, explorer에서 확인

## Phase 2 — Polygon 메인넷 소액

전환 전:

- [ ] 개발용 지갑은 새로 만든다(개인 메인 지갑과 분리), 복구 문구를 종이에 백업
- [ ] 로그·SQLite에 secret이 없는지 확인
- [ ] 거래소 출금 조건 확인(지원 네트워크, 최소 금액, 수수료, travel rule)

실사용(소액: POL 가스용, USDC 수십 달러 미만, JPYC 몇천 엔):

- [ ] POL 먼저 입금 → 잔액
- [ ] 거래소/JPYC EX/MetaMask → 앱 (USDC, JPYC)
- [ ] 앱 → MetaMask, MetaMask → 앱
- [ ] 수수료 표시, confirmation, QR, history, 재시작, 복원

## 전시 데모

- [ ] 전시용 값(`demo/data.ts`)과 시작 화면(`?state=`) 정하기
- [ ] 전시 기기·브라우저에서 리허설
- [ ] GitHub 레포 공개 → `main` 보호 규칙(PR 필수·squash만, CI `check` 통과 필수, 강제 push·삭제 금지) 적용, 비밀 스캔 켜짐 확인
