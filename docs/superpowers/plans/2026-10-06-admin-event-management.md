# 관리자 이벤트 관리 화면 (GD-99) Implementation Plan

> **For agentic workers:** REQUIRED: dispatch a fresh subagent per task (recommended) or use the `executing-plans` skill to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/admin/events`에 관리자 이벤트 목록·상세·등록·수정·상태 운영(중단/재개/취소/삭제) 화면을 구현한다.

**Status (2026-10-06):** 구현 + 리뷰 반영 완료 — `77b580f`(초기 구현), `c749e7d`(기간 필터·운영 이력·오류 메시지), `34e7a09`(폼 변환 분리·계약 오류 수정). 검증 4종 통과. 남은 항목: dev 서버 수동 시연.

**Architecture:** FSD — 조회는 `entities/event`(관리자 모델은 spec AE01~AE08 모양의 `AdminEvent`), mutation은 새 슬라이스 `features/manageEvent`, 화면은 `pages/admin/*` 3개(목록/상세/폼). MSW 목업은 별도 관리자 스토어(`mocks/handlers/adminEvent.ts`)로 spec 모양을 그대로 구현한다.

**Tech Stack:** React 19, TanStack Query, @tanstack/react-table v9(`useTable`+`tableFeatures`+`createColumnHelper`), React Hook Form + zod, MSW, Vitest.

**Spec:** `../getddo-spec/05-api/event.md` (AE01~AE08, 검토 대기 초안), `../getddo-spec/05-api/common.md` (봉투·Page), `../getddo-spec/02-domain/event.md` (수정·삭제·중단·재개·취소 규칙), `../getddo-spec/00-requirements/functional-requirements.md` §1·§11

**Spec 동기화 (2026-10-06):** spec 최신화(`ea7e82a` 추첨 ERD·최초 발표 지연, `9cc15f9`/`7e1febc` 등급 응모권·담당 조정)를 확인했다. AE01~AE08 계약과 이벤트 도메인 규칙은 변경 없어 이 계획·구현에 영향이 없다. ADR-014(등급 응모권)는 추첨 가중치 계산만 바꾸고 `maxTicketsPerUser`는 실제 장수 기준 상한으로 유지된다 — 등급별 차감 선택 계약은 미결정이라 응모·지갑 UI에는 아직 반영하지 않는다. `docs/CONTEXT.md`·`docs/product-context.md`에 반영 완료.

## Global Constraints

- 응답 봉투 `{success, code, message, data}` — `envelopeSchema`로 검증, `Page<T>`는 `{items,page,size,totalElements}` 1-base (`mocks/handlers/entry.ts`의 `ok`/`fail` 패턴 재사용)
- 화면 시각 표시는 `formatKst`, 관리자 입력 시각은 KST `datetime-local` → UTC ISO 변환
- `new Date()` 직접 호출 금지 — 컴포넌트는 `useVirtualClock().now()`, 목업은 `mockNow()`
- `import type` 강제, import 정렬은 `eslint --fix`에 위임, `console.log` 금지
- 슬라이스 내부 파일 딥 임포트 금지 — `index.ts` 공개 API 경유. pages는 `index.ts` 없이 `XxxPage.tsx`가 공개 API
- 관리자 상태 enum은 spec 대문자(`SCHEDULED`…) — 사용자용 `EventStatus`(upcoming/open/closed/drawn)와 혼용 금지
- `max-w-280 flex-col gap-6 pr-10 pb-10` 페이지 컨테이너 패턴 (AdminAbuseReviewPage 기준)
- 검증: `npm run format:check && npm run lint && npm run test:ci && npm run build`

---

### Task 1: 관리자 이벤트 모델 + 조회 훅 (entities/event)

**Files:**

- Create: `src/entities/event/model/adminTypes.ts`
- Create: `src/entities/event/api/adminQueries.ts`
- Modify: `src/entities/event/index.ts`

**Interfaces:**

- Produces: `AdminEvent`, `AdminEventStatus`, `AdminPrize`, `EventType`, `MembershipRule`, `EventOperationResult`, `AdminEventsParams {page,size,keyword?,status?,eventType?,from?,to?}`, `ADMIN_EVENTS_KEY = ['admin','events']`, `ADMIN_EVENTS_API_PATH = '/admin/events'`, `adminEventApiPath(id)`, `useAdminEvents(params)`, `useAdminEvent(id)`

- [x] `adminTypes.ts` — spec DTO 그대로:

```ts
import { z } from 'zod';

// 관리자 이벤트 상태 — spec 05-api/event.md의 EventStatus 원문 (사용자용 단순화 enum과 별개)
export const adminEventStatusSchema = z.enum([
    'SCHEDULED',
    'OPEN',
    'CLOSED',
    'DRAW_CONFIRMED',
    'PUBLISHED',
    'SUSPENDED',
    'CANCELED',
    'REDRAWING',
    'NO_ENTRANTS',
    'NO_ELIGIBLE_ENTRANTS',
]);
export const eventTypeSchema = z.enum(['NO_TICKET', 'TICKET']);
export const membershipRuleSchema = z.enum(['excellent', 'vip', 'vvip']);

export const adminPrizeSchema = z.object({
    id: z.string(),
    rank: z.number().int().min(1),
    name: z.string(),
    description: z.string().nullable(),
    imageUrl: z.string().nullable(),
    winnerCount: z.number().int().min(1),
});

// AE01/AE02 응답 — AdminEvent = EventDetail + 감사 필드 (spec 초안)
export const adminEventSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    imageUrl: z.string().nullable(),
    imageKey: z.string().nullable(),
    eventType: eventTypeSchema,
    weightingEnabled: z.boolean(),
    maxTicketsPerUser: z.number().int().nullable(),
    membershipRule: membershipRuleSchema,
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    status: adminEventStatusSchema,
    publicationScheduledAt: z.iso.datetime(),
    serverTime: z.iso.datetime(),
    prizes: z.array(adminPrizeSchema),
    createdBy: z.string(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    suspendedFromStatus: z.enum(['SCHEDULED', 'OPEN']).nullable(),
    suspendedAt: z.iso.datetime().nullable(),
    canceledAt: z.iso.datetime().nullable(),
});

// AE06~AE08 응답
export const eventOperationResultSchema = z.object({
    eventId: z.string(),
    previousStatus: adminEventStatusSchema,
    status: adminEventStatusSchema,
    refundedTicketCount: z.number().int(),
    processedAt: z.iso.datetime(),
});

export type AdminEventStatus = z.infer<typeof adminEventStatusSchema>;
export type EventType = z.infer<typeof eventTypeSchema>;
export type MembershipRule = z.infer<typeof membershipRuleSchema>;
export type AdminPrize = z.infer<typeof adminPrizeSchema>;
export type AdminEvent = z.infer<typeof adminEventSchema>;
export type EventOperationResult = z.infer<typeof eventOperationResultSchema>;
```

- [x] `adminQueries.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';
import { envelopeSchema } from '@shared/api/envelopeSchema';
import { queryPresets } from '@shared/api/queryPresets';

import { adminEventSchema } from '../model/adminTypes';

const adminEventPageSchema = z.object({
    items: z.array(adminEventSchema),
    page: z.number().int(),
    size: z.number().int(),
    totalElements: z.number().int(),
});

export const ADMIN_EVENTS_KEY = ['admin', 'events'] as const;
export const ADMIN_EVENTS_API_PATH = '/admin/events';
export const adminEventApiPath = (eventId: string) => `${ADMIN_EVENTS_API_PATH}/${eventId}`;

export interface AdminEventsParams {
    page: number;
    size: number;
    keyword?: string;
    status?: string;
    eventType?: string;
    from?: string;
    to?: string;
}

// 관리자 목록·상태 운영은 가상 시계로 상태가 움직이므로 realtime 프리셋으로 서버 값을 따라간다
export function useAdminEvents(params: AdminEventsParams) {
    return useQuery({
        ...queryPresets.realtime,
        queryKey: [...ADMIN_EVENTS_KEY, 'list', params],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(ADMIN_EVENTS_API_PATH, { params });
            return envelopeSchema(adminEventPageSchema).parse(data).data;
        },
    });
}

export function useAdminEvent(eventId: string) {
    return useQuery({
        ...queryPresets.realtime,
        queryKey: [...ADMIN_EVENTS_KEY, 'detail', eventId],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(adminEventApiPath(eventId));
            return envelopeSchema(adminEventSchema).parse(data).data;
        },
        enabled: Boolean(eventId),
    });
}
```

- [x] `index.ts`에 위 항목들 named export 추가 (기존 export 유지)

- [x] 검증: `npm run lint` (타입 import·정렬 확인)

---

### Task 2: KST 입력 ↔ UTC 변환 헬퍼 (shared/lib/date)

**Files:**

- Modify: `src/shared/lib/date.ts`
- Modify: `src/shared/lib/date.test.ts`

**Interfaces:**

- Produces: `kstInputToUtcIso(local: string): string` — `datetime-local` 값("2026-10-07T15:00")을 KST로 해석해 UTC ISO(`Z`) 반환. `utcIsoToKstInput(iso: string): string` — 폼 초기값용 역변환("YYYY-MM-DDTHH:mm")

- [x] **Step 1: 실패 테스트** (`date.test.ts`에 추가):

```ts
it('datetime-local 입력을 KST로 해석해 UTC ISO로 변환한다', () => {
    expect(kstInputToUtcIso('2026-10-07T15:00')).toBe('2026-10-07T06:00:00.000Z');
});
it('UTC ISO를 datetime-local 입력값(KST)으로 되돌린다', () => {
    expect(utcIsoToKstInput('2026-10-07T06:00:00.000Z')).toBe('2026-10-07T15:00');
});
it('KST 자정 경계를 넘나들어도 날짜가 맞다', () => {
    expect(kstInputToUtcIso('2026-10-07T00:30')).toBe('2026-10-06T15:30:00.000Z');
    expect(utcIsoToKstInput('2026-10-06T15:30:00.000Z')).toBe('2026-10-07T00:30');
});
```

- [x] **Step 2:** `npx vitest run src/shared/lib/date.test.ts` → FAIL 확인
- [x] **Step 3: 구현** — `kstInputToUtcIso`: `new Date(`${local}:00+09:00`).toISOString()` (초가 이미 있는 입력은 그대로 오프셋 부여). `utcIsoToKstInput`: `toKst` 결과의 UTC 필드로 `YYYY-MM-DDTHH:mm` 조립
- [x] **Step 4:** 테스트 PASS 확인
- [x] 커밋: `77b580f`에 포함 (기능 단위 커밋 분리 대신 단일 커밋으로 정리)

---

### Task 3: 관리자 이벤트 MSW 핸들러 (AE01~AE08)

**Files:**

- Create: `src/mocks/handlers/adminEvent.ts`
- Create: `src/mocks/handlers/adminEvent.test.ts`
- Modify: `src/mocks/handlers/entry.ts` — `mockEventHasEntries` export 추가
- Modify: `src/mocks/handlers/index.ts` — `adminEventHandlers` 등록

**Interfaces:**

- Consumes: `adminEventSchema` 등 (Task 1), `mockEvents`(handlers/event.ts는 모듈 내부 — export 추가 필요 시 `mockEvents`를 named export로 전환), `mockNow`, entry.ts의 `entriesByUser` → `mockEventHasEntries(eventId)`
- Produces: `/admin/events` 계약의 임시 구현 — 목록 페이지네이션·필터, CRUD, 중단/재개/취소 상태 전이 + 반환 수량

**설계 메모 (구현자용):**

- 스토어 `mockAdminEvents`는 `mockEvents`를 1회 변환해 시드(`requiredTickets>0 → eventType:'TICKET'`, `weightingEnabled: TICKET 여부`, `maxTicketsPerUser: TICKET ? 5 : null`, `prizes: [{rank:1,name:prizeName,winnerCount}]`, `membershipRule:'excellent'`, tags에 '멤버십' 있으면 'vip') + 관리자 전용 시드 3~4건(SUSPENDED·CANCELED·NO_ENTRANTS·REDRAWING 각 1건, 시간 전이 상태를 덮지 않는 저장 상태)
- 내부 전용 필드 `entryCount`, `usedTicketTotal`(응답에서 제외) — 취소 시 `refundedTicketCount` 계산용
- `effectiveStatus(item, now)`: 저장 상태가 `SUSPENDED`면 `now>=endsAt` 시 `CANCELED`로 간주(중단 중 마감 자동 취소, 도메인 규칙), `SCHEDULED/OPEN/CLOSED`는 시간으로 재계산(`now<starts→SCHEDULED`, `now<ends→OPEN`, `now<ends+5min→CLOSED`, 이후 `PUBLISHED`), 나머지는 저장값
- 응답 직렬화 시 `status`/`serverTime`/`publicationScheduledAt`(=endsAt+5분)을 계산값으로 대체, 내부 필드 제거
- AE03 POST: 필드 검증(title 1~200, description 공백 불가, endsAt>startsAt, prizes 비어있지 않음·rank 중복 금지, NO_TICKET이면 weightingEnabled false·maxTicketsPerUser null) → 201 생성, id `crypto.randomUUID()`
- AE04 PUT: effectiveStatus가 SCHEDULED가 아니면 409 `STATE_CONFLICT`; 요청 startsAt이 기존보다 이르면 409
- AE05 DELETE: effectiveStatus SCHEDULED 아니면 409; `mockEventHasEntries` true면 409; 성공 시 두 스토어에서 제거, `data:null`
- AE06 suspend: reason 필수 공백 불가. SCHEDULED/OPEN→SUSPENDED(반환 0, suspendedFromStatus 기록), CLOSED 이후→즉시 CANCELED+반환(도메인 규칙), 그 외 409
- AE07 resume: SUSPENDED이고 now<endsAt만 허용 — now<startsAt이면 SCHEDULED, 아니면 OPEN으로 복귀. 그 외 409
- AE08 cancel: 어느 상태든 CANCELED, `refundedTicketCount=usedTicketTotal` 후 0으로 초기화
- `ok`/`fail` 헬퍼는 entry.ts와 같은 모양으로 이 파일에 둔다 (공용 추출은 별도 리팩토링 대상)

**사용자 목록 브리지 (결정됨):** 관리자 변경이 사용자 화면에도 보여야 한다 — admin 스토어는 `mockEvents`를 시드로 변환해 시작하고, mutation이 `mockEvents`에도 사용자 모양으로 반영한다.

- AE03/04 성공 시 `mockEvents`에 사용자 모양을 upsert한다: `requiredTickets = eventType==='TICKET' ? 1 : 0`, `prizeName` = 첫 경품명(복수면 `외 N종`), `winnerCount` = 합계, `participantCount/usedTicketCount/myEntryCount/myTicketCount = 0`, `tags` = membershipRule이 vip/vvip면 `['멤버십 혜택']` 아니면 `[]`, `bannerImageUrl/detailImageUrl/announceAt = null`
- AE05 성공 시 `mockEvents`에서도 제거 (연결 배너는 목업이 단일 항목이라 주석만)
- AE08 취소 시 사용자 `Event` 스키마가 CANCELED를 표현 못 하므로 `mockEvents`에서 제거한다 → 사용자 목록에서 사라지고 상세 조회는 EVENT_NOT_FOUND
- AE06/07 중단·재개는 사용자 목록에 유지하되 응모는 막아야 한다 — `mockEvents` 항목에 `entryBlocked: boolean` 플래그를 두고 `entry.ts`의 POST 핸들러가 `entryBlocked===true`면 409 `EVENT_NOT_OPEN`을 반환하게 한다 (도메인: 중단·취소가 먼저 확정되면 이후 응모 거절). resume 시 플래그 해제
- `entry.ts`에 `export function mockEventHasEntries(eventId: string)` 추가 — `entriesByUser` 전체를 순회해 해당 eventId의 ACCEPTED가 있으면 true

- [x] **Step 1: 실패 테스트** `adminEvent.test.ts` — apiClient로 검증:
    - 목록이 봉투+Page 모양이고 keyword/status/eventType 필터와 page·size가 동작한다
    - 생성 → 목록에 나타난다 / 잘못된 본문(빈 prizes, endsAt≤startsAt) → 400
    - SCHEDULED가 아닌 이벤트 PUT → 409; 시작 앞당김 → 409
    - suspend→SUSPENDED, resume→원래 시간대 상태, cancel→CANCELED+refundedTicketCount
    - 응모 이력 있는 이벤트 삭제 → 409 (seedEntry가 evt-001에 ACCEPTED를 만드므로, evt-001이 SCHEDULED가 되도록 별도 시드 or 시간 조정)
- [x] **Step 2:** `npx vitest run src/mocks/handlers/adminEvent.test.ts` → FAIL
- [x] **Step 3:** 구현 + `mockEventHasEntries` export + 핸들러 등록
- [x] **Step 4:** PASS + `npm run test:ci` 전체 회귀
- [x] 커밋: `77b580f`에 포함

---

### Task 4: 이벤트 목록 화면 (테이블 + 페이지)

**Files:**

- Create: `src/entities/event/ui/AdminEventTable.tsx`
- Modify: `src/entities/event/index.ts` — 테이블 export
- Modify: `src/pages/admin/events/AdminEventsPage.tsx`

**Interfaces:**

- Consumes: `useAdminEvents`, `AdminEvent`, `Pager`(`@shared/ui/pager` — current 0-base), `Select`(`@shared/ui/select`), `Input`, `Button`, `formatKst`
- Produces: `AdminEventTable({ events, onRowClick })`

**설계 메모:**

- 테이블은 AbuseCaseTable 패턴: `tableFeatures({})` + `createColumnHelper`, 표시 전용
- 컬럼: 제목(+id 캡션), 유형(NO_TICKET '응모권 미사용' / TICKET '응모권 사용' + 가중치 여부), 최소 멤버십, 응모 기간(`formatKst` 2행), 경품(개수·총 당첨 인원), 상태 칩, 생성일
- 상태 라벨 맵 `ADMIN_STATUS_META: Record<AdminEventStatus,{label,chipClass}>` — 테이블 파일 내 상수. 라벨: 진행 예정/진행 중/마감/추첨 확정·발표 대기/발표 완료/중단/취소/재추첨 중/응모자 없음/추첨 대상 없음. 칩은 status-pending(대기·예정)/approved(정상 진행)/rejected(중단·취소·종료) 계열 재사용
- 페이지: 필터 바(키워드 Input+검색 버튼, 상태 Select, 유형 Select, 초기화 버튼) → `useAdminEvents` → 테이블 → `Pager`. 필터 변경 시 page=1 리셋. 행 클릭/제목 클릭 → `useNavigate`로 `/admin/events/${id}`. 우상단 "새 이벤트 등록" 버튼 → `/admin/events/new`

- [x] AdminEventTable 구현
- [x] AdminEventsPage 구현 (기존 placeholder 교체) — 기간 필터(`from`/`to` date 입력 + KST 변환)는 `c749e7d`에서 추가
- [x] `npm run lint` 통과 — 수동 시연만 남음(`npm run dev` 후 `/admin/events`)
- [x] 커밋: `77b580f` + `c749e7d`에 포함

---

### Task 5: 이벤트 상태 운영 mutation + 사유 다이얼로그 (features/manageEvent)

**Files:**

- Create: `src/features/manageEvent/api/mutations.ts`
- Create: `src/features/manageEvent/ui/EventActionDialog.tsx`
- Create: `src/features/manageEvent/index.ts`

**Interfaces:**

- Consumes: `ADMIN_EVENTS_KEY`, `adminEventApiPath`, `eventOperationResultSchema`, `apiClient`, `Dialog`, `Input`, `Button`, `toast`(sonner)
- Produces: `useCreateEvent()`, `useUpdateEvent()`, `useDeleteEvent()`, `useSuspendEvent()`, `useResumeEvent()`, `useCancelEvent()`, `EventActionDialog({event, action: 'suspend'|'resume'|'cancel'|'delete'|null, open, onOpenChange})`

**설계 메모:**

- mutation 훅은 `useMutation` + 성공 시 `queryClient.invalidateQueries({queryKey: ADMIN_EVENTS_KEY})`
- 생성은 POST body=EventWriteRequest → `envelopeSchema(adminEventSchema)`로 파싱; 삭제는 DELETE → `envelopeSchema(z.null())`; 상태 운영은 POST `${path}/suspend|resume|cancel` body `{reason}` → `eventOperationResultSchema`
- `EventActionDialog`: ReviewAbuseDialog 패턴 — 액션별 제목/설명/확인 버튼 문구, suspend·resume·cancel은 reason 입력 필수(공백 불가), delete는 reason 없이 확인 문구만. 성공 시 toast + 닫기, 실패 시 `ApiError.message` 표시

- [x] mutations.ts 구현
- [x] EventActionDialog 구현 — CLOSED 중단 경고·서버 오류 메시지 표시는 `c749e7d`에서 추가
- [x] index.ts 공개 API 작성
- [x] `npm run lint` 통과
- [x] 커밋: `77b580f` + `c749e7d`에 포함

---

### Task 6: 이벤트 상세 화면 + 라우트

**Files:**

- Create: `src/pages/admin/eventDetail/AdminEventDetailPage.tsx`
- Modify: `src/app/routes/adminRoutes.tsx` — `events/:eventId` 라우트 추가

**Interfaces:**

- Consumes: `useAdminEvent`, `EventActionDialog`, `useVirtualClock().now()` (재개 가능 여부 판정: `status==='SUSPENDED' && now < endsAt`)
- 라우트: `path: 'events/:eventId'` → lazy AdminEventDetailPage

**설계 메모:**

- 정보 섹션(제목·유형·가중치·사용자당 상한·멤버십·기간·발표 예정·생성/수정 시각·중단/취소 이력) + 경품 목록 테이블(등수·이름·당첨 인원)
- 액션 버튼(도메인 규칙의 허용 상태만 노출): 수정(SCHEDULED만 → `/admin/events/${id}/edit`), 중단(SCHEDULED/OPEN/CLOSED — CLOSED일 때 "즉시 취소로 전환됩니다" 경고 문구), 재개(SUSPENDED && 마감 전), 취소(전 상태), 삭제(SCHEDULED만 — 응모 이력은 서버가 최종 판정, 409면 에러 표시)
- 목록으로 돌아가기 링크

- [x] AdminEventDetailPage 구현 — 발표 예정·중단/취소 이력 표시는 `c749e7d`에서 추가
- [x] 라우트 등록 + `npm run lint`
- [x] 커밋: `77b580f` + `c749e7d`에 포함

---

### Task 7: 이벤트 등록·수정 폼

**Files:**

- Create: `src/features/manageEvent/model/eventFormSchema.ts`
- Create: `src/features/manageEvent/lib/eventFormValues.ts`
- Create: `src/features/manageEvent/lib/eventFormValues.test.ts`
- Create: `src/features/manageEvent/ui/EventForm.tsx`
- Create: `src/pages/admin/eventForm/AdminEventFormPage.tsx`
- Modify: `src/app/routes/adminRoutes.tsx` — `events/new`, `events/:eventId/edit` 라우트
- Modify: `src/features/manageEvent/index.ts` — EventForm export

**Interfaces:**

- Produces: `eventFormSchema`(zod), `EventFormValues`, `formToRequest(values): EventWriteRequest 모양`, `adminEventToForm(event: AdminEvent): EventFormValues`, `EventForm({mode:'create'|'edit', initial?: AdminEvent})`

**설계 메모:**

- 폼 필드: title, description(textarea — `shared/ui`에 없으면 native `<textarea>`+기존 Input 스타일 클래스), imageKey(선택, URL/키 문자열 — 업로드 계약 미확정이므로 텍스트 입력 + 주석), eventType(Select), weightingEnabled(checkbox — NO_TICKET이면 강제 false·비활성), maxTicketsPerUser(TICKET+가중치일 때만 '사용자당 상한 없음(월말 소진용)' 체크박스 → 체크 시 null, 아니면 가중치 5·미가중치 1 고정 — spec 초안은 null을 "제안"으로 표시하므로 주석에 미확정 표시), membershipRule(Select), startsAtLocal/endsAtLocal(`datetime-local` + "한국 시간(KST) 기준" 안내), prizes(`useFieldArray` 행: rank·name·winnerCount·description + 삭제 버튼 + "경품 추가")
- zod 검증: rank 중복 금지(superRefine), endsAt>startsAt, NO_TICKET이면 weightingEnabled===false 강제
- `formToRequest`: `kstInputToUtcIso`로 startsAt/endsAt 변환, EventWriteRequest 모양(title,description,imageKey|null,eventType,weightingEnabled,maxTicketsPerUser,membershipRule,startsAt,endsAt,prizes[{id?(수정 시 기존),rank,name,description,imageKey,winnerCount}])
- edit 모드: `useAdminEvent`로 로드 → `adminEventToForm` 초기값, startsAt에 `min`(기존 시작 시각의 KST input값) + 안내 "시작 시각은 앞당길 수 없습니다". SCHEDULED가 아니면 폼 대신 안내+뒤로가기
- 제출: create→useCreateEvent(성공 시 상세로 이동), edit→useUpdateEvent. `react-hook-form` + `zodResolver` 사용
- 테스트 `eventFormValues.test.ts`: formToRequest의 NO_TICKET null 처리·KST→UTC 변환·빈 문자열→null 정규화, adminEventToForm 역변환

- [x] **Step 1·2:** `lib/eventFormValues.ts` + `eventFormValues.test.ts` — `34e7a09`에서 페이지 밖으로 분리하며 추가(9개 테스트, 유형×가중치 4분기·경품 id 보존 포함). 계획의 `features/manageEvent` 위치 대신 `pages/admin/eventForm/lib/`에 뒀다 — 페이지 전용 검증 로직이라 슬라이스 내부 배치가 적절하다고 판단
- [x] **Step 3:** EventForm 기능은 AdminEventFormPage에 내장(별도 `EventForm` 슬라이스 분리 안 함 — 재사용 소비자가 없어 과분할로 판단)
- [x] **Step 4:** `npm run lint` + `npm run test:ci` 통과
- [x] 커밋: `77b580f` + `34e7a09`에 포함

---

### Task 8: 전체 검증 + 마무리

- [x] `npm run format:check` — 필요 시 `npm run format`
- [x] `npm run lint` — 경고 0
- [x] `npm run test:ci` — 전체 PASS
- [x] `npm run build` — tsc + vite 성공
- [ ] 시연 수동 확인: `/admin/events` 목록 필터·페이지, 상세, 등록→목록 반영, 중단→재개→취소, 삭제
- [x] CONTEXT.md에 관리자 이벤트 계약(AE01~AE08 초안) 사용 중 명시 — `34e7a09`에 포함

## Self-Review 메모

- spec 커버: AE01~AE08 전부 목업+화면 대응. `prizeImages` 응답 필드는 화면 미사용 — 스키마에 포함하지 않고 파싱 통과(추가 필드 허용)로 둔다 → 포함하는 게 안전하면 adminPrizeSchema.imageKey로 대체 여부를 구현 시 판단
- 미반영 의도: 월말 소진용(maxTicketsPerUser null+TICKET+가중치)은 담당자 미확정 → 폼에 노출 안 함, 모델은 허용. 배너 캐스케이드 삭제는 banner 목업이 단일 항목이라 주석만 남김
