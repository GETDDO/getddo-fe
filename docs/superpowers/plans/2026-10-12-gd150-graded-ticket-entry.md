# GD-150 — 응모 요청·영수증을 등급별 장수 모델로 전환

**목표:** E04 요청을 `ticketCount` 스칼라 → `tickets` 등급별 장수 맵(`{"BRONZE":1,...}`)으로 전환하고, `EntryReceipt`에 `requestedTicketsByGrade`·`deductedTicketsByGrade`를 추가한다. E07 자격 조회를 도입하고 목업을 `ENTRY-001~009`·`TICKET-006` 계약에 맞춘다.

**스펙:** `getddo-spec/05-api/entry.md`(E04·E07), `05-api/common.md`(오류 코드), `02-domain/entry.md`, `02-domain/ticket.md`

**확정 사항(사용자 승인 2026-10-12):**

- 목업 이벤트 유형: `requiredTickets`로 파생 — 0=미사용, 1=사용·미적용(브론즈 1장·1회), ≥2=일반 가중치(누적 5). 관리자 시드도 같은 규칙.
- UI: 가중치 이벤트는 등급별 스테퍼, 미적용은 브론즈 1장 고정 표시.
- E07: 훅+목업+타임래플 상세 연동.
- 관리자 응모 금지(ENTRY-002)·멤버십 미달(ENTRY-003) 둘 다 목업에 구현 — 가상 사용자에 멤버십 추가.

**범위 밖:** 거절 이력(E05/E06)·거절 재전송 4xx(GD-145)·429(GD-146)·미션 보상 수량 정책. `requiredTickets` 등 구 필드 전체 제거는 별도 작업.

---

## 변경 파일·책임

### 계약/모델

| 파일                                         | 책임                                                                                                              |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `entities/entry/model/types.ts`              | `ticketsByGradeSchema`(3등급 필수 맵), `EntryTickets`(요청 부분 맵), 영수증 등급별 필드, `entryEligibilitySchema` |
| `entities/entry/api/queries.ts` + `index.ts` | `useEntryEligibility`(E07) + `['entries','eligibility',eventId]` 키                                               |
| `entities/event/model/types.ts`              | `eventType`/`weightingEnabled`/`maxTicketsPerUser`/`membershipRule` 추가(`adminTypes` 스키마 재사용)              |
| `entities/user/model/types.ts` + `index.ts`  | `membership` 필드·스키마 추가                                                                                     |
| `app/config/sessionSync.ts`                  | `X-User-Membership` 헤더 부착                                                                                     |
| `shared/api/errorMessage.ts`                 | `ENTRY-001~009`·`TICKET-006` 매핑 추가                                                                            |

### 목업

| 파일                             | 책임                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `mocks/handlers/event.ts`        | `MockEvent` 옵션 필드 + `entryRuleOf` 파생 헬퍼 + 유효 상태 헬퍼 export + 응답에 4필드 포함              |
| `mocks/handlers/virtualUsers.ts` | 가상 사용자에 멤버십, `findMockVirtualUser` export                                                       |
| `mocks/handlers/ticket.ts`       | `recordMockTicketUse`를 등급 맵 차감(등급 내 만료 임박순)으로, `getMockAvailableTicketCountByGrade` 추가 |
| `mocks/handlers/adminEvent.ts`   | `toAdminSeed`/`toUserProjection`을 `entryRuleOf` 기반으로 통일, projection에 4필드 반영                  |
| `mocks/handlers/entry.ts`        | E04 재작성(tickets 맵·유형별 규칙·오류 코드·id=멱등키) + E07 핸들러 추가                                 |

### 화면

| 파일                                                       | 책임                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| `features/enterEvent/api/queries.ts`                       | `mutate(tickets)` — 같은 맵 동안 멱등키 유지         |
| `pages/timeRaffleDetail/TimeRaffleDetailPage.tsx`          | E07 연동, 등급별 선택 상태, 규칙별 분기              |
| `pages/timeRaffleDetail/ui/GradeTicketSteppers.tsx` (신규) | 등급별 수량 선택 — 등급별 보유량·남은 누적 상한 반영 |
| `ui/QuantityStepper.tsx`                                   | `label` prop으로 등급별 aria-label 재사용            |
| `ui/EntryConfirmDialog.tsx`                                | 등급별 사용 내역 표시                                |
| `ui/InsufficientTicketsDialog.tsx`                         | 브론즈 필요(`BRONZE_REQUIRED`) 안내 변형             |
| `ui/MyTicketCard.tsx`                                      | 등급별 보유 장수 표시                                |

### 테스트/문서

- `mocks/handlers/entry.test.ts` — tickets 맵 계약으로 재작성 + 신규 케이스
- `mocks/handlers/adminEvent.test.ts` — 응모 호출 2곳을 tickets 맵으로
- `entities/entry/api/queries.test.tsx` — E07 파싱 케이스
- `docs/CONTEXT.md` — 응모 계약 표기 갱신

## E04 목업 검증 순서

봉투 → 멱등키 재생 → 이벤트 404(`ENTRY-004`) → `X-User-Membership` 불일치 409 → 관리자 403(`ENTRY-002`) → 멤버십 403(`ENTRY-003`) → 미오픈 409(`ENTRY-005`) → 1회 제한 중복 409(`ENTRY-006`) → 페이로드 규칙(미사용=합계0, 미적용={BRONZE:1}·부족 시 `ENTRY-008`, 가중치=합계≥1→누적 상한 `ENTRY-007`→등급별 부족 `TICKET-006`) → 차감 접수 201.

## 미확정 잔여

- 멤버십 헤더↔DB 불일치 처리는 entry 핸들러에만 적용(공통 처리는 BE 담당자).
- `availableTicketBalance`: 등급 제약을 반영한 보유 장수(남은 상한과의 min은 아님) — spec 문구 해석.
