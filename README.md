# GETDDO — LG유플러스 응모 이벤트 플랫폼 (Frontend)

가상 사용자 기반 응모/추첨 이벤트 플랫폼의 프론트엔드 레포지토리입니다.
요구사항·도메인 정책의 원본은 공용 명세 저장소 `getddo-spec`이며, 기획 맥락은 `docs/product-context.md`를 참고하세요.

## 기술 스택

| 구분            | 사용 기술                            |
| --------------- | ------------------------------------ |
| 언어/빌드       | TypeScript, React 19, Vite           |
| 라우팅          | React Router                         |
| 서버 상태       | TanStack Query                       |
| 클라이언트 상태 | Zustand, Redux Toolkit               |
| 스타일          | TailwindCSS v4, shadcn/ui            |
| 폼/검증         | React Hook Form, Zod                 |
| 테이블/날짜     | TanStack Table, react-day-picker     |
| 연출            | GSAP, Framer Motion, canvas-confetti |
| 테스트/목업     | Vitest, React Testing Library, MSW   |

## 폴더 구조 (FSD — Feature-Sliced Design)

레이어는 위에서 아래로만 참조할 수 있습니다: `app → pages → widgets → features → entities → shared`.
위반은 ESLint(`eslint-plugin-boundaries`)로 자동 차단됩니다.

```
src/
  app/        # 라우터, 전역 Provider, 전역 스타일, 가상 시계
  pages/      # 라우트 단위 화면 (라우트 1개 = 슬라이스 1개)
  widgets/    # 여러 feature/entity를 조합한 화면 블록
  features/   # 사용자가 수행하는 행동 단위 (응모하기, 출석하기 등)
  entities/   # 도메인 모델 + 기본 표시 UI (이벤트, 응모권, 당첨자 등)
  shared/     # 도메인을 모르는 공통 코드 (UI 키트, API 클라이언트, 유틸)
```

규칙:

- 같은 레이어의 다른 슬라이스끼리 서로 참조하지 않습니다 (공유가 필요하면 `shared`/`entities`로 내립니다).
- 슬라이스는 반드시 `index.ts`(공개 API)를 통해서만 import합니다. 내부 파일 직접 import는 ESLint가 차단합니다.
- `import.meta.env`는 `src/shared/config/env.ts`에서만 접근합니다.

## 시작하기

```bash
# 1. 패키지 설치 (Node 24 권장)
npm install

# 2. 환경변수 설정
cp .env.example .env.development

# 3. 개발 서버 실행 (MSW 목업 활성화 상태로 시작)
npm run dev

# 4. 테스트 실행
npm run test

# 5. 린트 검사
npm run lint

# 6. 프로덕션 빌드
npm run build
```

## 환경 변수

`.env.example`을 참고해 `.env.development` / `.env.production`을 만듭니다 (두 파일은 gitignore 대상).

| 변수명              | 설명                                                                 |
| ------------------- | -------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | 백엔드 API 베이스 URL. MSW 사용 시 `/api` (같은 origin이어야 가로챔) |
| `VITE_ENABLE_MSW`   | `true`일 경우 MSW 목업 서버 활성화 (백엔드 미준비 시 개발용)         |

## 협업 문서

- [CONTRIBUTING.md](./CONTRIBUTING.md) — 브랜치 전략, 커밋 컨벤션, PR 절차
- [AGENTS.md](./AGENTS.md) — 코드 작성 규칙 (FSD 의존 방향, 상태관리 기준, 금지사항). 팀원과 AI 에이전트 공용
- [CLAUDE.md](./CLAUDE.md) — Claude Code 진입점. AGENTS.md를 임포트하는 포인터 파일
- [docs/CONTEXT.md](./docs/CONTEXT.md) — 도메인 용어집과 판단 기준 (시간 규칙, 멱등키 대상, 임시 계약)
- [docs/adr/](./docs/adr/README.md) — 아키텍처 결정 기록 (FSD, MSW, 상태관리 분리 등)
- [docs/product-context.md](./docs/product-context.md) — 기획 맥락 (페르소나·유저플로우·비기능 요구사항)
- `../getddo-spec/` — 공용 명세 저장소 (요구사항·도메인 정책·공용 ADR의 원본)

## 팀원

| 이름   | 담당 영역     |
| ------ | ------------- |
| [이름] | [담당 도메인] |
| [이름] | [담당 도메인] |
