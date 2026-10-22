# Henry Wallet — 에이전트 작업 규칙

개인용 self-custody EVM stablecoin 지갑(Expo SDK 58, React Native, TypeScript). iPhone 개발용 빌드가 기준.

- 명세: `docs/PROJECT.md` — 범위·보안 모델·구조·송금 규칙. 코드를 바꾸기 전에 읽는다.
- 진행: `docs/ROADMAP.md` — 단계별 체크리스트. 끝난 항목은 같은 PR에서 체크한다.
- 문서는 이 4개(README, AGENTS, PROJECT, ROADMAP)만 둔다. 결정이 바뀌면 코드와 같은 커밋에서 고치고, 지금 상태만 적는다.

## 절대 규칙 (보안)

- mnemonic·private key를 `core/keys` 밖으로 넘기지 않는다(예외: 새 지갑의 복구 문구 표시 화면, 서명은 `withSigner` 콜백 안에서만). 로그·에러 메시지·SQLite·AsyncStorage·클립보드·`.env`·Git에 남기지 않는다. `src`에서 `console.*` 금지(lint 에러).
- 토큰 금액은 `bigint`와 `parseUnits`/`formatUnits`로만 다룬다. `number`로 계산하지 않는다.
- 암호 primitive를 직접 구현하지 않는다(ethers 사용).
- 토큰·네트워크 주소는 공식 출처나 체인 조회로 확인하고 config에 출처를 남긴다. 기억으로 쓰지 않는다.
- 새 의존성은 꼭 필요할 때만, 정확한 버전으로. 키·서명 경로에는 새 패키지를 들이지 않는다.

## 명령

```bash
pnpm start                 # Metro (개발용 빌드에서 연다, Expo Go 아님)
pnpm check                 # lint + typecheck + test + format:check — 끝내기 전에 통과시킨다
pnpm demo                  # 가짜 데이터 웹 데모(휴대폰 틀) — 전시·화면 확인용, demo/ 참고
pnpm exec expo install <pkg>   # 패키지 추가는 항상 이걸로(SDK 호환 버전). pnpm add 직접 금지(ethers 등 순수 JS 고정 버전 제외)
pnpm dlx expo-doctor       # 의존성·설정 진단
```

- 네이티브 설정(패키지, config plugin, `app.json`)이 바뀌면 개발용 빌드를 다시 만든다: `npx eas-cli build --profile development --platform ios` — Apple 로그인이 필요해 사용자가 실행한다.
- `ios/`, `android/`는 생성물이다. 손대지 않는다(`app.json`과 config plugin으로 설정).
- Expo API는 SDK마다 바뀐다. 기억에 의존하지 말고 `node_modules`의 타입이나 `https://docs.expo.dev/versions/v58.0.0/`을 확인한다.

## 코드 구조

- `src/app/` 화면(Expo Router) · `src/features/` 화면별 UI·hook · `src/core/` React를 모르는 지갑 로직.
- 지갑 로직(거래 순서·저장·검증)은 화면에 두지 않고 `core`에 둔다. 서버가 없어도 서비스(core)와 화면을 나눈다. 거래 흐름은 `core/transfer.ts`(서명 → 전송 전 pending 저장 → 전송 → 확인)에만 있고 화면은 부르기만 한다.
- `core`는 `app`/`features`/React를 import하지 않는다. secure-store는 `core/keys`만 쓴다.
- 경로 별칭 `@/` = `src/`.
- 화면 문구는 `src/features/i18n/messages.ts`에만 둔다(한국어 `ko`가 기준, 영어 `en`은 같은 모양). 컴포넌트에 문구를 직접 쓰지 않고 `useT()`로 읽는다. 문구를 더하면 두 언어를 같이 더한다.
- `demo/`는 전시용 가짜 데이터와 가짜 경계(db·history·vault·provider)만 둔다. `src`는 `demo`를 import하지 않는다. 그 네 파일의 export를 바꾸면 `demo/stubs`도 같이 고친다.

## 문서 갱신

- PR을 끝내기 전에 `docs/ROADMAP.md`(끝난 항목 체크, 새로 확인할 항목 추가)와 `docs/PROJECT.md`(결정·구조·UI·송금 규칙이 바뀐 부분)를
  코드와 맞춰 같은 PR에서 고친다. 바뀐 게 없어 보여도 한 번 훑어 본다.
- 여러 PR이 쌓였거나 phase를 마칠 때는 README·AGENTS까지 4개 문서를 코드와 대조해 점검하고, 어긋난 곳을 고치는 `docs/…` PR을 따로 올린다.
- 문서에는 지금 상태만 적는다. 지난 경위·계획 변경 이력은 쓰지 않는다.

## 테스트

꼭 필요한 순수 로직(금액, 주소 검증, 키 파생 vector)만 `*.test.ts`로 둔다. 틀리면 돈을 잃는 곳에만 쓰고, 화면·스타일·문구·설정 변경에는 쓰지 않는다. 테스트를 늘리지 않는다 — 새로 쓰기 전에 "이게 없으면 돈이 위험한가"를 먼저 묻고, 아니면 쓰지 않는다. 필요 없어진 테스트는 지운다. RPC·서명·화면은 테스트넷에서 ROADMAP 체크리스트로 확인한다.

## Git

- `main`에 직접 push하지 않는다. 브랜치(`feat/…`, `fix/…`, `docs/…`, `chore/…`) → PR → CI 통과 → squash merge.
- 작업을 끝내면 에이전트가 push → PR 생성 → CI 확인 → squash merge까지 사용자에게 다시 묻지 않고 진행한다(사용자가 위임함).
  "별문제 없음"은 CI 통과 · 충돌 없음 · 타당한 리뷰 지적이 모두 반영됨을 뜻한다. CI가 실패하면 병합하지 않고 원인을 고친다.
  사용자의 결정이 필요한 일(범위가 불분명함, 보안 설계 판단, 되돌리기 어려운 변경)은 병합 전에 묻는다.
  병합 뒤에는 `main`을 받아 작업 브랜치를 정리한다.
- 커밋 메시지는 한국어 conventional commit(`feat: 지갑 생성 화면을 더한다`). 커밋은 의미 있는 단위(한 가지 목적)로 나누고, 서로 다른
  변경(예: 이름 변경과 UI 개선, 기능과 문서 정리)을 한 커밋에 섞지 않는다.
- PR 라벨은 PR을 올릴 때 바로 단다(`gh pr create --label …`): 종류(`feat`/`fix`/`docs`/`chore`) + 단계(`phase-1`/`phase-2`), 키·서명·저장을 건드리면 `security`.
- PR을 올리면 Codex(`chatgpt-codex-connector[bot]`)가 리뷰한다. **리뷰는 선택이다**: CI가 통과하면 병합하고, Codex 리뷰를
  따로 오래 기다리지 않는다. CI가 끝날 때 와 있는 지적은 코드를 직접 확인해 타당한 것만 같은 PR에 반영하고, 반영하지 않는
  지적은 해당 리뷰 스레드에 이유를 한 줄 답한다. 병합 뒤에 온 지적은 다음 PR에서 같은 기준으로 처리한다.
