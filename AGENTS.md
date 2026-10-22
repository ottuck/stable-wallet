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
pnpm exec expo install <pkg>   # 패키지 추가는 항상 이걸로(SDK 호환 버전). pnpm add 직접 금지(ethers 등 순수 JS 고정 버전 제외)
pnpm dlx expo-doctor       # 의존성·설정 진단
```

- 네이티브 설정(패키지, config plugin, `app.json`)이 바뀌면 개발용 빌드를 다시 만든다: `npx eas-cli build --profile development --platform ios` — Apple 로그인이 필요해 사용자가 실행한다.
- `ios/`, `android/`는 생성물이다. 손대지 않는다(`app.json`과 config plugin으로 설정).
- Expo API는 SDK마다 바뀐다. 기억에 의존하지 말고 `node_modules`의 타입이나 `https://docs.expo.dev/versions/v58.0.0/`을 확인한다.

## 코드 구조

- `src/app/` 화면(Expo Router) · `src/features/` 화면별 UI·hook · `src/core/` React를 모르는 지갑 로직.
- `core`는 `app`/`features`/React를 import하지 않는다. secure-store는 `core/keys`만 쓴다.
- 경로 별칭 `@/` = `src/`.

## 테스트

꼭 필요한 순수 로직(금액, 주소 검증, 키 파생 vector)만 `*.test.ts`로 둔다. 테스트를 늘리지 않는다. RPC·서명·화면은 테스트넷에서 ROADMAP 체크리스트로 확인한다.

## Git

- `main`에 직접 push하지 않는다. 브랜치(`feat/…`, `fix/…`, `docs/…`, `chore/…`) → PR → CI 통과 → squash merge.
- 작업을 끝내면 에이전트가 push → PR 생성 → CI 확인 → squash merge까지 사용자에게 다시 묻지 않고 진행한다(사용자가 위임함).
  CI가 실패하면 병합하지 않고 원인을 고친다. 병합 뒤에는 `main`을 받아 작업 브랜치를 정리한다.
- 커밋 메시지는 한국어 conventional commit(`feat: 지갑 생성 화면을 더한다`). 커밋은 리뷰 가능한 단위로 나눈다.
- PR 라벨: 종류(`feat`/`fix`/`docs`/`chore`) + 단계(`phase-1`/`phase-2`), 키·서명·저장을 건드리면 `security`.
- PR을 올리면 Codex(`chatgpt-codex-connector[bot]`)가 리뷰한다. **리뷰는 선택이다**: CI가 통과하면 병합하고, Codex 리뷰를
  따로 오래 기다리지 않는다. CI가 끝날 때 와 있는 지적은 코드를 직접 확인해 타당한 것만 같은 PR에 반영하고, 반영하지 않는
  지적은 해당 리뷰 스레드에 이유를 한 줄 답한다. 병합 뒤에 온 지적은 다음 PR에서 같은 기준으로 처리한다.
