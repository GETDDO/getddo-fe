# GD-215 배포 실연동 계약 정합화 Implementation Plan

> **For agentic workers:** 이 계획을 작업 단위로 실행한다. 체크박스(`- [x]`)로 진행을 추적한다.

**Goal:** 배포 빌드(MSW 하이브리드 — 이벤트·응모·티켓·관리자 추첨은 실서버)에서 실서버 응답이 FE 구형 Zod 스키마와 불일치해 화면이 깨지는 문제와, 관리자 멤버십 헤더로 발생하는 409 USER-006을 해결한다.

**Architecture:** `entities/event`에 spec 원시 응답 스키마(EventSummary/EventDetail)와 화면용 `Event` 뷰모델로의 매퍼를 둔다. API 경계(`api/queries.ts`)에서 원시 응답을 parse한 뒤 매퍼로 변환해 기존 화면 계약(`Event[]`)은 그대로 유지한다. 목업 `event.ts`도 spec 모양 응답으로 전환해 dev·배포가 같은 매퍼를 탄다.

**Spec:**

- `../getddo-spec/05-api/event.md` — E01 `Page<EventSummary>`·E02 `EventDetail`(description·prizes 포함, 목록에는 없음)
- `../getddo-spec/05-api/common.md` — `X-User-Membership`: USER 필수·ADMIN 생략 가능
- `../getddo-spec/05-api/drawing.md` — AD06 `POST /admin/draws/{drawId}/publication` 본문 없음
- `../api-contract-audit-2026-10-16.md` — 불일치 근거 전체

## Global Constraints

- `adminEventSchema`는 건드리지 않는다 — 관리자 이벤트 화면 복구는 BE의 `drawScheduledAt` 리네임 배포 대기 항목이다.
- 목록(E01) 원시 응답에는 `description`·`prizes`가 없다 — 목록으로 파생되는 `prizeName`·`winnerCount`·`description`은 화면이 비어도 깨지지 않게 한다.
- `mockEventEffectiveStatus`는 응모 목업(`entry.ts`)이 화면 상태(`open` 등)를 기대하므로 내부 상태와 응답 DTO 상태를 분리한다.
- 브랜치 `fix/GD-215` (`dev`에서 생성 완료, 원격 동일 브랜치 없음 확인).
- 검증: `npm run format:check` → `npm run lint` → `npm run test:ci` → `npm run build` 전부 통과 후 `git diff` 확인.

---

### Task 1: ADMIN 세션은 X-User-Membership을 보내지 않는다

**Files:**

- Modify: `src/app/config/sessionSync.ts` — `user.role === 'ADMIN'`이면 멤버십 헤더 생략
- Modify: `src/app/config/sessionSync.test.ts` — 기존 ADMIN 테스트가 멤버십 헤더를 기대하므로 갱신 + USER는 보내는지 추가

- [x] Step 1: ADMIN 헤더 생략 실패 테스트 갱신
- [x] Step 2: 인터셉터 수정 — `if (user.role !== 'ADMIN') config.headers['X-User-Membership'] = user.membership;`

---

### Task 2: 이벤트 원시 응답 스키마 + 매퍼

**Files:**

- Create: `src/entities/event/model/contract.ts` — spec 원시 스키마
    - `eventPrizeSchema` — id/rank/name/description(null)/imageUrl(null)/winnerCount
    - `eventSummaryResponseSchema` — spec 필드 + 목업 시연 필드(`isTimeRaffle`, `raffleDetail`, `tags`, `myEntryCount`, `myTicketCount`, `detailImageUrl`, `isRecommended`)는 optional로 유지
    - `eventDetailResponseSchema` — summary 확장 + `description`·`maxTicketsPerUser`·`prizes` 필수
    - 상태는 `adminEventStatusSchema` 재사용
- Create: `src/entities/event/lib/toEvent.ts` — 원시 → `Event` 매퍼
    - `imageUrl → bannerImageUrl`
    - 상태: `SCHEDULED→upcoming, OPEN→open, CLOSED·DRAW_CONFIRMED·REDRAWING·CANCELED→closed, PUBLISHED·NO_ENTRANTS→drawn`
    - `prizes` → `prizeName`(rank 1순 이름, 2종 이상이면 `외 N종`)·`winnerCount`(합계); 없으면(목록) `undefined`
    - `requiredTickets`: `TICKET→1, NO_TICKET→0` (1회 차감 의미 — 가중치는 `maxTicketsPerUser`가 담당)
    - `maxTicketsPerUser`: 상세는 실값. 목록은 spec상 확정 조합만 채운다(`NO_TICKET→null, 가중치 미적용→1`) — 가중치 이벤트는 정수 상한·null(월말 소진용) 모두 가능해 `undefined`로 둔다 (CodeRabbit 리뷰 반영 — '5'로 근사하면 무제한이 '5장'으로 잘못 읽힌다)
    - `description`: 목록은 `''`로 채운다
- Create: `src/entities/event/lib/toEvent.test.ts` — 상태 매핑·이미지·경품 요약·응모권 파생·목록/상세 분리 검증
- Modify: `src/entities/event/model/types.ts` — `prizeName`·`winnerCount`를 optional로 완화 (목록이 채울 수 없음)
- Modify: `src/entities/event/api/queries.ts` — 원시 스키마 parse → `toEvent` 매핑
- Modify: `src/entities/event/index.ts` — 필요 export 추가

- [x] Step 1: 매퍼 실패 테스트 작성
- [x] Step 2: contract.ts + toEvent.ts 구현
- [x] Step 3: `Event` 뷰모델 필드 완화 + 소비처 수정 (아래 Task 3)

---

### Task 3: 목록에서 비는 필드의 화면 소비처 정리

`prizeName`/`winnerCount`가 `undefined`일 수 있으므로:

- Modify: `src/entities/event/ui/FeaturedEventCard.tsx` — `winnerCount != null ? N명 : '-'`
- Modify: `src/entities/event/ui/UpcomingEventCard.tsx` — 당첨 인원 부분 조건부
- Modify: `src/pages/timeRaffle/ui/LiveRaffleCard.tsx`, `LiveRaffleCompactCard.tsx`, `ClosedRaffleList.tsx` — 동일 패턴
- Modify: `src/pages/timeRaffle/lib/raffleFormat.ts` — `winnerCount` 없으면 당첨 인원 구절 생략
- Modify: `src/pages/timeRaffleDetail/ui/RaffleDetailsCard.tsx` — `prizeName ?? null`, 당첨 인원 행 조건부

- [x] Step 1: 위 파일들 조건부 렌더로 수정, `tsc`로 누락 소비처 확인

---

### Task 4: 목업 이벤트 응답을 spec 모양으로 전환

**Files:**

- Modify: `src/mocks/handlers/event.ts`
    - `statusAt`(화면 상태)는 내부용으로 유지 — `mockEventEffectiveStatus`·응모 핸들러가 사용
    - 응답용 `specStatusAt`: `upcoming→SCHEDULED, open→OPEN, closed→CLOSED, drawn→PUBLISHED`
    - `toResponse`를 spec `EventDetail` 모양으로 재작성 (`imageUrl`, 원시 enum, `prizes[]`, `serverTime` 포함)
    - E01 목록 항목은 `description`·`prizes`를 뺀 `EventSummary` 모양
    - `status` 쿼리 필터는 spec enum 기준으로 유지
- Modify: `src/mocks/handlers/event.test.ts` — 원시 상태값(`OPEN`/`CLOSED`/`SCHEDULED`/`PUBLISHED`) 기대로 갱신, 목록에 `description`/`prizes` 부재·상세에 존재 검증 추가

- [x] Step 1: 테스트 갱신 → 실패 확인
- [x] Step 2: 핸들러 전환 → 통과 확인
- [x] Step 3: `adminEvent.ts`의 `toUserProjection`·시드 경로가 새 응답과 호환되는지 확인 (`userEventIds` 테스트 포함)

---

### Task 5: 추첨 실행 상태 enum 확장

**Files:**

- Modify: `src/entities/drawResult/model/types.ts` — `drawRunStatusSchema`에 `NO_ENTRIES`·`NO_CANDIDATES` 추가
- Modify: `src/entities/drawResult/model/runStatus.ts` — `DRAW_RUN_STATUS_META`에 두 상태의 라벨·칩 추가 (`isDrawRunInProgress`에는 미포함 — 종료 상태)

- [x] Step 1: 스키마 + 메타 추가, `tsc` 확인

---

### Task 6: 관리자 응모권 nullable 완화

**Files:**

- Modify: `src/entities/ticket/model/admin.ts` — `latestHistoryStatus`·`targetExpiresAt`에 `.nullable()`
- Modify: `src/entities/ticket/ui/AdminTicketTables.tsx` — `MismatchValue`의 `status` null 처리('이력 없음'), `formatKst(row.targetExpiresAt)` null 가드
- Modify: `src/entities/ticket/ui/TicketConsistencyDrawer.tsx` — 동일 가드
- Modify: `src/entities/ticket/model/admin.test.ts` — null 통과 케이스 추가

- [x] Step 1: 스키마 nullable + 소비처 가드 + 테스트

---

### Task 7: AD06 공개 호출에서 reason 본문 제거

**Files:**

- Modify: `src/features/runRedraw/api/queries.ts` — `PublishRedrawInput`에서 `reason` 제거, 본문 없이 POST
- Modify: `src/features/runRedraw/ui/PublishRedrawDialog.tsx` — 사유 입력·검증 제거, 확인 전용 다이얼로그로 단순화
- Modify: `src/mocks/handlers/draw.ts` — AD06이 본문을 요구하지 않도록 수정, AD07 변경 이력의 `reason`은 연결된 취소 사유(`run.detail.cancellations[0].reason`)를 사용 (spec: "본문 없이 연결 취소 사유를 사용")
- Modify: `src/mocks/handlers/draw.test.ts` — 빈 사유 400 케이스 제거, 본문 없는 호출과 이력 사유 기대값 갱신

- [x] Step 1: 테스트 갱신 → 실패 확인
- [x] Step 2: 목업 + 쿼리 + 다이얼로그 수정 → 통과 확인

---

### Task 8: 전체 검증

- [x] `npm run format:check`
- [x] `npm run lint`
- [x] `npm run test:ci`
- [x] `npm run build`
- [x] `git diff` 최종 검토
