# 프로젝트 규칙 (AGENTS.md)

> 이 파일은 이 레포지토리에서 작업하는 모든 기여자(팀원·AI 에이전트)가 따라야 하는 규칙이다.
> 코드를 수정하기 전에 반드시 이 파일을 읽는다.

## 프로젝트 개요

- LG유플러스 응모 이벤트 플랫폼 프론트엔드 (가상 사용자 기반 응모/추첨 이벤트)
- 기술 스택: TypeScript, React 19, Vite 8, React Router 7, TanStack Query, Zustand, Redux Toolkit, TailwindCSS v4, shadcn/ui, React Hook Form + Zod
- 백엔드는 별도 레포 — API가 준비되기 전까지 MSW로 목업한다
- Node 24.x / npm

## 아키텍처 — FSD (Feature-Sliced Design)

레이어는 위에서 아래로만 참조 가능하며, ESLint(`eslint-plugin-boundaries`)가 커밋·CI에서 기계적으로 강제한다.

```
src/
  app/        # 라우터, 전역 Provider, 전역 스타일, 가상 시계
  pages/      # 라우트 단위 화면 — 라우트 1개 = 슬라이스 1개
  widgets/    # 여러 feature/entity를 조합한 화면 블록
  features/   # 사용자 행동 단위 (enter-event, check-attendance, ...)
  entities/   # 도메인 모델 + 기본 표시 UI (event, ticket, user, ...)
  shared/     # 도메인을 모르는 공통 코드 (ui, api, lib, config, types)
```

슬라이스 내부는 `ui/`, `model/`, `api/`, `lib/` 하위 폴더 + `index.ts`(공개 API)로 구성한다.

### 의존 방향

```
app → pages → widgets → features → entities → shared
```

금지 사항 (위반 시 `npm run lint`에서 error):

- 하위 → 상위 참조 ❌ (예: `entities → pages`)
- 같은 레이어의 다른 슬라이스 참조 ❌ (예: `features/enter-event → features/check-attendance`) — 공유가 필요하면 `shared`나 `entities`로 내린다
- 슬라이스 내부 파일 직접 import ❌ — 반드시 해당 슬라이스의 `index.ts`를 통해 import한다 (딥 임포트 금지)
- `import.meta.env` 직접 참조 ❌ — `@shared/config/env`의 `env` 객체만 사용한다

## 코드 작성 규칙

### 기존 코드 우선

- 새 컴포넌트/함수/유틸을 만들기 전에 **반드시 기존 구현을 먼저 검색**한다
- `shared/ui/`(shadcn/ui)와 `shared/lib/`에 이미 있는 것을 새로 만들지 않는다
- UI 컴포넌트가 필요하면 `npx shadcn add <component>`로 `shared/ui/`에 생성한다

### 컴포넌트

- shadcn/ui 컴포넌트(`@shared/ui/*`)를 우선 사용한다
- 300줄을 넘는 컴포넌트는 분할을 검토하고, 반복되는 UI는 공통 컴포넌트로 추출한다
- 색상은 시맨틱 토큰(`bg-primary`, `text-muted-foreground`)을 쓰고 임의 색상(`bg-blue-500`)을 쓰지 않는다

### API 호출

- 컴포넌트에서 fetch/axios를 직접 호출하지 않는다 — `entities/*/api/`의 TanStack Query 훅을 통해 호출한다
- 서버 응답은 Zod 스키마로 검증한다 (`entities/*/model/`에 정의)
- 시간은 서버에서 UTC로 받고, 화면 표시는 `shared/lib/date`의 KST 변환 함수를 사용한다
- 응모·추첨 등 중복 위험 요청에는 `shared/lib/idempotency-key`의 멱등키를 붙인다

### 상태 관리 (역할이 겹치지 않도록 구분)

| 데이터 종류                                         | 도구                                        |
| --------------------------------------------------- | ------------------------------------------- |
| 서버에서 받아오는 데이터 (이벤트 목록, 응모권 잔액) | TanStack Query                              |
| 화면 국한 가벼운 상태 (모달 열림, 가상 시계 값)     | Zustand                                     |
| 여러 화면에 걸친 복잡한 전역 플로우                 | Redux Toolkit                               |
| 폼 상태                                             | React Hook Form (전역 상태로 만들지 않는다) |

### 스타일

- TailwindCSS v4 + shadcn/ui, `@custom-variant dark` 기반 다크모드
- 조건부 클래스는 `cn()`(`@shared/lib/utils`)으로 조합한다
- Prettier가 포맷을 강제한다: 세미콜론, 싱글 쿼트, 4칸 들여쓰기 (커밋 시 자동 적용)

### 타입·import

- 타입 import는 `import type`으로만 한다 (ESLint가 강제 — `verbatimModuleSyntax`와 짝)
- import 정렬은 ESLint(`perfectionist/sort-imports`)가 강제한다 — 외부 패키지 → 내부 alias(`@app`~`@shared`) → 상대경로 순. 수동 정렬 금지, `eslint --fix`에 맡긴다
- `console.log` 금지 — `console.warn`/`console.error`만 허용. 디버깅 로그는 커밋 전에 지운다

> 협업 프로세스 상세(브랜치 라이프사이클, PR 절차, 리뷰 규칙)는 [CONTRIBUTING.md](./CONTRIBUTING.md) 참조.
> 아래는 작업 시 반드시 지켜야 하는 규칙의 요약본이다.

## 브랜치 전략

- `main` — 배포/시연 가능한 안정 버전
- `dev` — 개발 통합 브랜치
- 작업 브랜치 — `dev`에서 생성, `<타입>/<Jira 이슈 키>` 형식, Jira 키는 대문자 유지
    - `feat/GD-123`, `fix/GD-45`, `refactor/GD-67`, `chore/GD-1`, `docs/GD-12`

## 커밋 컨벤션

Conventional Commits + 팀 확장 타입. `commit-msg` 훅의 commitlint가 강제한다.

```
<타입>: <제목>          예) feat: 응모 버튼 멱등키 적용
<타입>(<스코프>): <제목>  예) fix(ticket): 만료일 표시 오류 수정
```

허용 타입: `feat` `fix` `docs` `style` `refactor` `test` `chore` `design` `comment` `rename` `remove` `!HOTFIX` `build` `ci` `perf` `revert`

## PR 규칙

- 작업 브랜치 → `dev` 대상으로 PR 생성
- 머지 조건: CI(lint·format·test·build) 통과 + 최소 1명 리뷰 + Squash and Merge
- PR 템플릿(`.github/pull_request_template.md`)의 관련 이슈·작업 내용·테스트 결과·리뷰 포인트·체크리스트를 모두 채운다

## 검증 명령

작업 완료 전에 아래를 모두 통과시킨다 (CI와 동일한 검사):

```bash
npm run format:check  # Prettier
npm run lint          # ESLint — FSD 규칙 포함, 경고 0개 기준
npm run test:ci       # Vitest
npm run build         # tsc -b && vite build
```

커밋 시 pre-commit 훅이 lint-staged(ESLint --fix + Prettier)를 자동 실행한다.

## 금지 사항

- 새 상태관리·UI 라이브러리를 임의로 추가하지 않는다 (추가가 필요하면 팀 합의 후)
- 기존 컴포넌트/유틸과 유사한 것을 새로 만들지 않는다
- API 스키마·연동 계약을 임의로 변경하지 않는다
- 타입 에러를 `any`로 해결하지 않는다
- ESLint 규칙을 임의로 disable하지 않는다 (특히 `boundaries/*`)
- 테스트를 삭제해서 빌드를 통과시키지 않는다
- `.env*` 파일에 실제 비밀값을 넣거나 커밋하지 않는다 (`.env.example`만 커밋)
- `main`에 직접 커밋하지 않는다
- 요구사항이 불명확하면 추측하지 않는다 — 기획 문서와 기존 코드를 먼저 확인하고, 없으면 팀에 질문한다
