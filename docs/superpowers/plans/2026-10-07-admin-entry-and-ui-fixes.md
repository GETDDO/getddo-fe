# 관리자 진입 흐름 정리 + UI·목업 점검 수정 계획

> 작성일: 2026-10-07 / 점검 수단: claude CLI 읽기 전용 감사 + 수동 코드 확인
> 기준: spec `../getddo-spec/` 확정 정책 우선, API 초안은 "검토 대기"라 확정 시 재조정

## 완료 (이번 세션 — dev 작업 트리에 미커밋)

- [x] `LoginPage` — 관리자 선택 시 `/admin` 자동 이동 제거, 모두 `/`로 진입
- [x] `VirtualUserSwitcher` — 관리자로 전환 시 `/admin` 자동 이동 제거 (같은 정책 적용)
- [x] `UserLayout` 헤더 — 관리자 계정에만 `관리자 화면으로` 버튼 노출 (`hidden md:inline-flex`, secondary sm + LayoutDashboard 아이콘)
- [x] `UserLayout` 모바일 햄버거 메뉴 — 관리자 계정에만 구분선 + `관리자 화면으로` 항목
- [x] 검증: `format:check`·`lint`(경고 0)·`test:ci`(96개)·`build` 통과

## Task 1~5 실행 결과 (GD-102 — feat/GD-102)

### Task 1: 관리자 첫 화면 처리 — 대시보드 스텁 ✅

- [x] `AdminDashboardPage` — `widgets/adminStatSummary`를 `AdminStatSummary`로 구현해 채움. 진행 중/예정 이벤트(AE01 totalElements), 검토 대기 어뷰징, 감사 로그 건수 카드 + 각 관리 화면 링크
- [x] `widgets/adminStatSummary` 미사용 위젯 → 대시보드에서 사용 (제거 대신 활용)

### Task 2: 테이블 행 접근성·패턴 통일 ✅

- [x] `AdminEventTable` — '상세' 버튼 열 추가(키보드 접근), `stopPropagation`으로 행 클릭과 분리
- [x] `cursor-pointer`를 `onRowClick` 존재 시에만 부여하도록 통일

### Task 3: deprecated variant·UI 소품 정리 ✅

- [x] `variant="outline"` → `secondary` 일괄 + `button.tsx`의 `outline`·`default` variant 삭제. `ReviewAbuseDialog` 동적 variant도 `primary`/`secondary`로
- [x] `AdminEventDetailPage` — `bg-destructive` 클래스 → `variant="destructive"`, `pr-10` → `md:pr-10`, 이동 버튼 `Button asChild + Link`
- [x] `AdminEventFormPage` — 목록 이동 버튼 `asChild + Link`
- [x] `pages/admin/{dashboard,draw,banners}` — 중첩 `<main>` 제거 (대시보드는 위젯으로 교체, draw/banners는 div)
- [x] `LoginPage`·`VirtualUserSwitcher` — `outline-none` 제거하고 `ring-border-focus` 포커스 링으로 통일

### Task 4: 목업 ↔ spec 초안 정합성 ✅

- [x] 공통 `mocks/handlers/response.ts`(`ok`/`fail`/`okBody`/`failBody`) 신설, 기존 5개 핸들러의 로컬 사본 제거
- [x] `event.ts` — E01 `Page<EventSummary>` 봉투 + status 필터 + 페이지 파라미터
- [x] `ticket.ts` — T01 `/tickets/wallets/me`(월 지갑 모델: expiryMonth/validFrom/expiresAt/balance/status), T02 `/tickets/ledger/me`(Cursor). `entities/ticket` 전면 갱신 + 소비자(MyTickets, TicketHistoryCard, monthlyTicketSummary, TimeRaffleDetail) 정합
- [x] `game.ts` — 봉투 적용. G03/G04(playId 2단계)는 서버 발급 playId 계약 미정이라 단일 `/play`+멱등키 유지하며 TODO로 표시
- [x] `abuse.ts` — 목록 Page화, `/review` → AR03 `/decisions`(201, ReviewDecisionResult). UI의 allow/exclude는 ALLOW/CONFIRM+excludeFromEvent+userNoticeReason으로 변환
- [x] `draw.ts` — 명세 없는 구 경로 + 사용처 없음 → 삭제
- [x] `attendance.ts` — 봉투 적용. `AttendanceToday`/`AttendanceReceipt` 필드 정합은 계약 미확정으로 후속 작업이다 (CONTEXT.md 임시 상태 참조)
- [x] `banner.ts`·`virtualUsers.ts` — 봉투 적용
- [x] 공통 `pageSchema`/`cursorSchema`를 `shared/api/envelopeSchema.ts`에 두고 audit/adminEvent/event/mission이 재사용
- [x] 테스트 픽스처 갱신 — 봉투 파싱, `/tickets/wallets/me`, `/events?size=100`(페이지 기본값 20 넘는 목업 수 대응)

### Task 5: 인프라·기타 ✅/보류

- [x] `/ui-gallery` — `env.isDev`로 라우트 자체를 개발 전용 게이팅
- [x] `shared/test/setup.ts` — `window.scrollTo` noop 스텁 추가
- [ ] `index` 청크 618kB — 관리자 라우트는 이미 페이지별 lazy 분리됨. 사용자 번들은 vendor(react-dom·tanstack·radix·zod)가 대부분이라 `manualChunks` 벤더 분리가 필요하나 **빌드 설정 변경은 승인 게이트 대상**이라 후속 이슈로 보류
- [ ] (합의 필요) 로그인 상태 `/login` 재진입 정책 — 별도 합의 필요 항목으로 보류
- [ ] (저장소 정리) `feat/GD-26` stale 브랜치 — 오너 확인 필요, 보류

## 완료 기준 충족

- 검증 4종 통과: `format:check` ✅ `lint`(경고 0) ✅ `test:ci`(96개) ✅ `build` ✅
- Task 4는 목업+entity 스키마+호출 훅을 함께 수정했고 테스트를 갱신했다
- spec "검토 대기" 초안 기준 변경분(지갑·원장·decisions·attendance 필드)은 계약 확정 시 재조정 대상이다

## 완료 기준

- 검증 4종: `npm run format:check && npm run lint && npm run test:ci && npm run build`
- Task 4는 각 목업 변경 시 대응 `entities/*/model` zod 스키마와 호출 훅을 함께 수정하고 테스트를 둔다
- spec "검토 대기" 초안 기준 변경분은 계약 확정 시 재조정 대상으로 표시한다
