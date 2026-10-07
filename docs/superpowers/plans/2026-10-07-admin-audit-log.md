# 관리자 감사 로그 조회 화면 구현 계획

**Goal:** 백오피스에서 감사 로그를 조회 전용으로 보는 화면(AU01 목록·AU02 상세)을 구현한다.

**Architecture:** FSD — `entities/audit` 신규 슬라이스(zod 스키마·TanStack Query 훅·테이블/드로어 UI) + `pages/admin/audit` 페이지 + MSW 핸들러. `AdminAbuseReviewPage`·`AdminEventsPage`·`entities/abuseCase` 패턴을 따른다.

**Tech Stack:** React 19, TanStack Query, @tanstack/react-table v9, zod v4, MSW, shadcn/ui(sheet 신규)

**Spec:** `getddo-spec/05-api/audit.md` (검토 대기 초안 — 조회 전용, 수정·삭제 API 없음), `getddo-spec/05-api/common.md` (응답 봉투·Page<T>)

## Global Constraints

- 봉투: `{success, code, message, data}` — `envelopeSchema(dataSchema).parse(res.data).data` (`adminQueries.ts` 패턴)
- `Page<T>` = `items/page/size/totalElements`, 페이지 1부터, 기본 정렬 `createdAt DESC, id DESC`, 기간 필터 `[from, to)`
- 경계: 다른 관리자 페이지·기존 mocks 핸들러 수정 금지 (handlers/index.ts 등록·routes·nav 등록은 요청 범위)
- `entities/audit`는 루트 `index.ts`만 공개 API. 표시 UI는 `ui/`, 정적 매핑은 `model/`
- `import type` 분리, `console.log` 금지, `import.meta.env` 직접 참조 금지 (`env` 객체 사용)

## 파일 구조

| 파일                                             | 책임                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `src/shared/ui/sheet.tsx`                        | shadcn sheet(우측 드로어) — `npx shadcn add sheet`로 생성, radix-ui Dialog 기반(기존 의존성)     |
| `src/entities/audit/model/types.ts`              | `auditLogSummarySchema`, `auditLogDetailSchema`, `AUDIT_ACTION_LABEL`, `AUDIT_TARGET_TYPE_LABEL` |
| `src/entities/audit/api/queries.ts`              | `AUDIT_KEY`, `AUDIT_LOGS_API_PATH`, `useAuditLogs(params)`, `useAuditLog(id)`                    |
| `src/entities/audit/ui/AuditLogTable.tsx`        | 목록 테이블(시각·작업·처리자·대상·사유), 행 클릭 콜백                                            |
| `src/entities/audit/ui/AuditLogDetailDrawer.tsx` | 상세 드로어 — 요약 필드 + beforeData/afterData JSON                                              |
| `src/entities/audit/index.ts`                    | 공개 API 배럴                                                                                    |
| `src/pages/admin/audit/AdminAuditPage.tsx`       | 필터(작업·대상유형·처리자·기간)+페이지네이션+드로어 상태                                         |
| `src/mocks/handlers/audit.ts`                    | 시드(추첨 실행·제외·당첨 취소·정책 변경)+AU01/AU02 핸들러                                        |
| `src/mocks/handlers/index.ts`                    | auditHandlers 등록                                                                               |
| `src/app/routes/adminRoutes.tsx`                 | `/admin/audit` lazy 라우트                                                                       |
| `src/app/layouts/adminNavItems.ts`               | 네비 항목(ScrollText, '감사 로그')                                                               |

### DTO (spec)

```ts
auditLogSummarySchema = z.object({
    id: z.string(),
    actorId: z.string().nullable(), // 처리자 — 시스템 작업은 null
    action: z.string(), // 예: DRAW_EXECUTE
    targetType: z.string(), // 예: event / entry / drawResult
    targetId: z.string(),
    reason: z.string().nullable(),
    requestId: z.string().nullable(),
    createdAt: z.iso.datetime(),
});
auditLogDetailSchema = auditLogSummarySchema.extend({
    beforeData: z.record(z.string(), z.unknown()).nullable(),
    afterData: z.record(z.string(), z.unknown()).nullable(),
});
```

시드 action 값: `DRAW_EXECUTE`(추첨 실행) / `ENTRY_EXCLUDE`(추첨 대상 제외) / `WIN_CANCEL`(당첨 취소) / `POLICY_UPDATE`(정책 변경) — 레이블 맵에 없는 action은 원문 그대로 표시(초안 계약 확장 대비).

### Task 1: shared/ui sheet + entities/audit 슬라이스

- `npx shadcn add sheet` (실패 시 dialog.tsx를 참조해 우측 고정 패널 변형을 직접 작성)
- model/api/ui/index 작성. `useAuditLogs`는 `queryPresets.standard`(감사 로그는 append-only — 30초 캐시로 충분), `useAuditLog`는 `enabled: Boolean(id)`
- 쿼리 파라미터는 `apiClient.get(path, { params })`로 전달 — undefined는 axios가 생략

### Task 2: mocks/handlers/audit.ts + 등록

- `ok`/`fail` 봉투 헬퍼(adminEvent.ts 동일 형태, 파일 내 로컬 정의), `api = ${env.apiBaseUrl}${path}`
- 시드 12건 내외 — 4종 action 골고루, actorId 일부 null(시스템 작업), POLICY_UPDATE는 beforeData/afterData 채움, createdAt은 mockNow 기준 과거로 분산
- AU01: actorId·action·targetType·targetId 정확 일치 필터 + from/to `[from,to)` on createdAt + page/size 슬라이스 → `ok({items, page, size, totalElements})`
- AU02: id 조회 → 없으면 `fail(404, 'RESOURCE_NOT_FOUND', ...)` — 상세는 동일 객체 + beforeData/afterData
- handlers/index.ts에 import·spread 등록

### Task 3: AdminAuditPage + 라우트·네비 등록

- 레이아웃 `flex max-w-280 flex-col gap-6 pr-10 pb-10`, 필터 행은 AdminEventsPage 패턴(action Select·targetType Select·처리자ID Input·기간 date input 2개 + 검색 버튼 — 검색 제출 시에만 params 확정, `kstInputToUtcIso`·nextDay 재사용 로직 페이지 내 복제 금지 — AdminEventsPage와 동일 코드를 그대로 쓴다)
- `Pager`로 `총 N건` + 페이지 이동, PAGE_SIZE 20
- 행 클릭 → `selected` 상태 → `AuditLogDetailDrawer`(Sheet) — 열릴 때 `useAuditLog(selected.id)`로 상세 조회, 로딩 중엔 요약만 표시
- adminRoutes.tsx abuse-review 뒤에 `path: 'audit'` lazy 등록, adminNavItems에 `{ to: '/admin/audit', label: '감사 로그', icon: ScrollText }` 추가(어뷰징 검토 뒤)

### Task 4: 검증

```bash
npm run format:check && npm run lint && npm run test:ci && npm run build
```
