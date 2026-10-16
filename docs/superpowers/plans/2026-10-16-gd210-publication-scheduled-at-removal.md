# GD-210 발표 예정 시각 제거·발표 대기 전환 Implementation Plan

> **For agentic workers:** REQUIRED: dispatch a fresh subagent per task (recommended) or use the `executing-plans` skill to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자 화면과 계약 타입·목업에서 `publicationScheduledAt`(발표 예정 시각)을 완전히 제거하고, 마감 후 공개 전 상태를 spec 문구 '발표 대기'로 통일한다.

**Architecture:** getddo-spec GD-203·ADR-022로 모든 이벤트 응답(E01·E02·관리자)과 E08 공개 결과에서 `publicationScheduledAt`이 제외됐다. FE는 필드 소비를 먼저 전부 제거한 뒤 스키마·목업에서 필드를 지운다 — 스키마를 마지막에 지우면 `tsc`가 남은 소비처를 전부 잡아낸다. 발표 여부 판정은 기존 `status === 'drawn'` / `isPublished`만 쓴다.

**Tech Stack:** TypeScript, React 19, Zod, MSW, Vitest

**Spec:**

- `../getddo-spec/05-api/event.md` §추첨 시각과 발표 시각 구분 — 2026-10-15
- `../getddo-spec/05-api/drawing.md` §공개 결과와 본인 결과, §2026-10-14 관리자 수동 최초 공개
- `../getddo-spec/03-decisions/022-manual-initial-publication.md`
- `docs/CONTEXT.md` 64~65행 — 이미 신계약으로 갱신됨 (추가 문서 수정 불필요)

## Global Constraints

- 사용자 화면에 추첨·발표 **예정 시각·카운트다운·새 예정 시각**을 표시하지 않는다 (spec 원문).
- 발표 대기 문구는 spec 확정 문구 **'응모 마감 · 결과 발표 대기'**와 기존 칩·라벨의 **'발표 대기'**를 쓴다. '발표 예정'·'N시 발표'·'N시간 남음' 표현은 전부 제거한다.
- 목업의 `ANNOUNCE_DELAY_MS`(마감 +5분)은 유지한다 — 수동 공개가 없는 목업에서 "관리자가 그때 공개한 것"을 흉내 내는 내부 기준이며, 응답 필드로 노출하지 않는 것이 계약이다. `statusAt`의 `closed → drawn` 전환과 `buildResults`의 `isPublished` 전환은 그대로 둔다.
- 한 브랜치 = 한 Jira 이슈 → `fix/GD-210`을 `dev`에서 생성한다 (원격에 GD-210 브랜치 없음 확인 완료).
- 관리자 화면(`pages/admin`)은 이번 범위 밖 — `drawScheduledAt`은 PR #79에서 이미 반영됐다.
- `docs/CONTEXT.md`, `docs/product-context.md`, `docs/adr/ADR-0004`는 이미 ADR-022 기준으로 갱신돼 있다 — 문서 수정 없음.
- 검증 명령: `npm run format:check` → `npm run lint` → `npm run test:ci` → `npm run build` 전부 통과.

---

### Task 1: 타임래플 상세 화면 — 카운트다운·예정 시각 제거

**Files:**

- Delete: `src/pages/timeRaffleDetail/ui/AnnounceCountdown.tsx`
- Delete: `src/pages/timeRaffleDetail/ui/AnnounceCountdown.test.tsx`
- Modify: `src/pages/timeRaffleDetail/ui/MyResultCard.tsx`
- Create: `src/pages/timeRaffleDetail/ui/MyResultCard.test.tsx`
- Modify: `src/pages/timeRaffleDetail/ui/RaffleRulesCard.tsx` (39행, 46~48행)
- Modify: `src/pages/timeRaffleDetail/ui/EntryCompleteDialog.tsx` (9~10, 36~37, 54, 57, 65~69, 135행)
- Modify: `src/pages/timeRaffleDetail/TimeRaffleDetailPage.tsx` (37, 265행)

**Interfaces:**

- Produces: `MyResultCard({ entered }: { entered: boolean })` — `event` prop 제거
- Produces: `EntryCompleteDialog`의 props에서 `announceAt` 제거 (나머지 동일)

- [ ] **Step 1: MyResultCard를 발표 대기 표시로 바꾸는 실패 테스트 작성**

`MyResultCard.test.tsx` 신규:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MyResultCard } from './MyResultCard';

describe('MyResultCard', () => {
    it('공개 전에는 발표 대기 상태를 보여 주고 예정 시각은 표시하지 않는다', () => {
        render(<MyResultCard entered />);

        expect(screen.getByText('응모 마감 · 결과 발표 대기')).toBeInTheDocument();
        expect(screen.getByText('아직 발표 전이에요')).toBeInTheDocument();
        // 카운트다운·예정 시각은 계약에서 제외됐다 (ADR-022)
        expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    });

    it('응모한 사람에게는 결과 자리 안내를 보여 준다', () => {
        render(<MyResultCard entered />);
        expect(
            screen.getByText('결과가 공개되면 이 자리에서 바로 확인할 수 있어요.'),
        ).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: 테스트가 실패함을 확인**

Run: `npx vitest run src/pages/timeRaffleDetail/ui/MyResultCard.test.tsx`
Expected: FAIL — `MyResultCard`가 `event` prop을 요구하고 '응모 마감 · 결과 발표 대기'를 렌더하지 않음

- [ ] **Step 3: MyResultCard 수정 — AnnounceCountdown 대신 StatusDot**

```tsx
import { StatusDot } from '@shared/ui/status-dot';

/**
 * 발표를 기다리는 동안의 카드 — 마감 뒤 결과가 공개되기 전까지 보인다.
 * 고정 발표 예정 시각·카운트다운은 계약에서 제외됐다 (ADR-022) — 서버가 공개하면
 * 쿼리 폴링으로 갱신돼 이 카드가 결과 영역으로 바뀐다.
 */
export function MyResultCard({ entered }: { entered: boolean }) {
    return (
        <section className="bg-surface-page border-border-default flex flex-col items-center gap-4 rounded-2xl border p-8 text-center">
            <StatusDot tone="info">응모 마감 · 결과 발표 대기</StatusDot>
            <div className="flex flex-col gap-1">
                <p className="text-title-3 text-fg-primary">아직 발표 전이에요</p>
                <p className="text-body text-fg-secondary">
                    {entered
                        ? '결과가 공개되면 이 자리에서 바로 확인할 수 있어요.'
                        : '당첨자 명단이 공개되면 이 자리에서 확인할 수 있어요.'}
                </p>
            </div>
        </section>
    );
}
```

- [ ] **Step 4: AnnounceCountdown 컴포넌트와 테스트 삭제**

```bash
rm src/pages/timeRaffleDetail/ui/AnnounceCountdown.tsx src/pages/timeRaffleDetail/ui/AnnounceCountdown.test.tsx
```

- [ ] **Step 5: 호출부·문구 수정**

`TimeRaffleDetailPage.tsx`:

- 196행 `<MyResultCard event={event} entered={myResult?.result === 'PENDING'} />` → `<MyResultCard entered={myResult?.result === 'PENDING'} />`
- 265행 `announceAt={event.publicationScheduledAt ?? null}` 삭제
- 37행 `closed: '추첨 진행 중'` → `closed: '결과 발표 대기'` — 수동 공개 정책에서 closed는 '마감·발표 대기'를 뜻하며 '추첨 진행 중'은 ADR-009 시절 표현이다
- 193행 주석 `발표 대기 카드(남은 시간)` → `발표 대기 카드`로 표현 정리

`RaffleRulesCard.tsx`:

- 39행 `const announceAt = event.publicationScheduledAt;` 삭제
- 46~48행 조건 분기를 단일 문구로: `'마감 뒤 자동으로 추첨하고 발표해요.'`

`EntryCompleteDialog.tsx`:

- props 타입에서 `announceAt: string | null`과 주석 삭제, 구조분해에서 `announceAt,` 삭제
- 57행 `const { now } = useVirtualClock();` 삭제 (announceLabel 외 사용처 없음)
- 65~69행 `announceLabel` 블록 삭제
- 135행 `{announceLabel ? \`${announceLabel}에 발표해요\` : '마감 뒤 발표해요'}`→`마감 뒤 발표해요`
- 미사용 import 정리: `KST_HOUR_MINUTE, formatKst, formatKstDot, isSameKstDate`와 `useVirtualClock` 제거 (eslint --fix에 맡긴다)

- [ ] **Step 6: 테스트 통과 확인**

Run: `npx vitest run src/pages/timeRaffleDetail`
Expected: PASS (MyResultCard 신규 테스트 + 기존 파일들)

- [ ] **Step 7: 커밋**

```bash
git add -A src/pages/timeRaffleDetail
git commit -m "fix: 타임래플 상세의 발표 카운트다운을 발표 대기 표시로 전환 (GD-210)"
```

---

### Task 2: 타임래플 목록·홈 — '오늘 발표' 집계와 행 라벨 정리

**Files:**

- Modify: `src/pages/timeRaffle/ui/TimeRaffleHero.tsx` (139~155, 187~239행)
- Modify: `src/pages/timeRaffle/ui/ClosedRaffleList.tsx` (121~135행)
- Modify: `src/entities/event/ui/EventResultRow.tsx` (40행)

**Interfaces:**

- Produces: `AnnouncementStep`은 더 이상 가상 시계를 쓰지 않는다 — `useTickingNow`·`ANNOUNCE_TICK_MS` 삭제

- [ ] **Step 1: TimeRaffleHero의 AnnouncementStep을 상태 기반으로 교체**

예정 시각이 없으므로 '오늘 발표' 집계를 '발표 대기'(status `closed`) 집계로 바꾼다:

```tsx
/**
 * 발표를 기다리는 래플 수.
 *
 * 서버가 발표 예정 시각을 주지 않으므로(ADR-022) '오늘 몇 시 발표'는 셀 수 없다 —
 * 마감됐고 아직 공개 전인 래플(status closed)을 센다.
 */
function AnnouncementStep({
    closed,
    onSelect,
}: {
    closed: Event[];
    onSelect: (targetId: string) => void;
}) {
    const waiting = closed.filter((event) => event.status === 'closed');

    return (
        <StepCard
            label="발표 대기"
            count={waiting.length}
            targetId={RAFFLE_SECTION_IDS.closed}
            onSelect={onSelect}
            hint={
                waiting.length > 0
                    ? '결과 발표를 기다리고 있어요'
                    : closed.length > 0
                      ? '모두 발표 완료'
                      : '발표 대기 래플 없음'
            }
        />
    );
}
```

- [ ] **Step 2: useTickingNow·ANNOUNCE_TICK_MS와 미사용 import 제거**

`TimeRaffleHero.tsx`에서 139~155행(`ANNOUNCE_TICK_MS`, `useTickingNow`)을 지우고, 파일 상단의 `useEffect`, `useState`, `useVirtualClock` import가 다른 곳에서 쓰이지 않으면 제거한다 (`eslint --fix`로 확인).

- [ ] **Step 3: ClosedRaffleList 행 라벨 단순화**

129~135행을 아래로 교체 (`scheduledAt`·`now` 비교 제거 — `now`는 meta의 `kstDayLabel`이 계속 쓰므로 prop은 유지):

```tsx
// 발표 여부는 status로만 판단한다 — 예정 시각이 없고 실제 공개 전까지는 발표 대기다 (ADR-022)
const statusLabel = isDrawn ? '발표 완료' : '발표 대기';
```

- [ ] **Step 4: EventResultRow 문구를 spec 문구로 교체**

40행: `{drawn ? '종료' : '응모 마감 · 발표 예정'}` → `{drawn ? '종료' : '응모 마감 · 결과 발표 대기'}`

- [ ] **Step 5: 타임래플·엔티티 테스트 실행**

Run: `npx vitest run src/pages/timeRaffle src/entities/event`
Expected: PASS (기존 스냅샷·문구 단언이 있으면 새 문구로 갱신)

- [ ] **Step 6: 커밋**

```bash
git add -A src/pages/timeRaffle src/entities/event/ui
git commit -m "fix: 타임래플 목록·홈의 발표 예정 표현을 발표 대기로 통일 (GD-210)"
```

---

### Task 3: 내 응모 내역 — 발표 칸·타일·메타 정리

**Files:**

- Modify: `src/pages/myEntries/ui/EntryTableRow.tsx` (13~22, 29~33, 102~120행)
- Modify: `src/pages/myEntries/MyEntriesPage.tsx` (85~109, 224행)
- Modify: `src/pages/myPage/ui/RecentEntriesCard.tsx` (18~31행)
- Modify: `src/widgets/myEntryRows/lib/useMyEntryRows.ts` (69~78행)
- Modify: `src/widgets/myEntryRows/lib/latestWonAt.test.ts`

**Interfaces:**

- Produces: `EntryTableRow({ row }: { row: MyEntryRow })` — `now` prop 제거
- Produces: `latestWonAt(rows)`는 `event?.endsAt` 기준 — 계약에 발표 시각이 없으므로 '최근 당첨'의 근사로 실제 마감 시각을 쓴다

- [ ] **Step 1: latestWonAt 테스트를 endsAt 기준으로 갱신 (실패 확인)**

```ts
const row = (requestedAt: string, endsAt: string | null, result: MyEntryRow['result']) =>
    ({
        entry: { requestedAt },
        event: endsAt ? { endsAt } : undefined,
        result,
    }) as MyEntryRow;

describe('latestWonAt', () => {
    it('응모순이 아니라 마감 시각이 가장 늦은 당첨을 고른다', () => {
        // 계약에 발표 시각이 없다 — 마감 시각이 가장 최근에 공개된 당첨의 근사다
        const rows = [
            row('2026-10-12T00:00:00Z', '2026-10-12T01:00:00Z', 'LOST'),
            row('2026-10-10T00:00:00Z', '2026-10-10T01:00:00Z', 'WON'),
            row('2026-10-01T00:00:00Z', '2026-10-11T00:00:00Z', 'WON'),
        ];
        expect(latestWonAt(rows)).toBe('2026-10-11T00:00:00Z');
    });

    it('당첨이 없으면 undefined, 이벤트가 없으면 응모 시각을 쓴다', () => {
        expect(latestWonAt([row('2026-10-01T00:00:00Z', null, 'LOST')])).toBeUndefined();
        expect(latestWonAt([row('2026-10-01T00:00:00Z', null, 'WON')])).toBe(
            '2026-10-01T00:00:00Z',
        );
    });
});
```

Run: `npx vitest run src/widgets/myEntryRows` → FAIL (아직 `publicationScheduledAt`을 읽는다)

- [ ] **Step 2: useMyEntryRows의 latestWonAt을 endsAt 기준으로 변경**

```ts
/**
 * 당첨 줄 중 가장 최근 발표에 가까운 시각 — 계약에 발표 시각이 없으므로(ADR-022)
 * 마감 시각을 근사로 쓴다. 이벤트 정보가 없으면 응모 시각으로 대신한다
 */
export function latestWonAt(rows: readonly MyEntryRow[]): string | undefined {
    return rows
        .filter((row) => row.result === 'WON')
        .map((row) => row.event?.endsAt ?? row.entry.requestedAt)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}
```

- [ ] **Step 3: EntryTableRow의 발표 칸을 상태 문구로 교체**

- `remainingLabel` 함수(17~22행)와 `announceAt`·`untilAnnounce`(32~33행) 삭제, `now` prop 제거
- 102~120행 발표 칸:

```tsx
<div className="col-span-2 flex flex-col pl-16 md:col-span-1 md:pl-0">
    {result === 'PENDING' && !rejected ? (
        <span className="text-body-sm text-fg-primary">발표 대기</span>
    ) : (
        <span className="text-caption text-fg-tertiary hidden md:inline">—</span>
    )}
</div>
```

- 미사용 import 정리 (`formatKst`, `isSameKstDate`, `KST_HOUR_MINUTE` — `formatKstDot`은 53행이 계속 쓴다)

- [ ] **Step 4: MyEntriesPage 타일과 호출부 갱신**

- 88~92행 `nextAnnounce` 블록 삭제
- PENDING 타일 note:

```tsx
            note:
                pending.length > 0
                    ? '결과 발표를 기다리고 있어요'
                    : '발표를 기다리는 응모가 없어요',
```

- 93행 주석과 `lastWonAt` 호출은 유지 (함수 내부만 바뀜)
- 224행 `<EntryTableRow key={row.entry.id} row={row} now={now} />` → `now` prop 제거
- `isSameKstDate`, `KST_HOUR_MINUTE`가 미사용이면 import 정리 (`formatKst`는 51행 월 그룹이 계속 쓴다)

- [ ] **Step 5: RecentEntriesCard 메타에서 발표 시각 제거**

27~29행 제거 — 오른쪽 `MyResultBadge`가 '발표 대기'를 이미 보여 주므로 메타에 중복 표기하지 않는다. 18행 주석도 `// "09.17 · 겟또타임 · 응모권 1장"` 예시로 갱신한다.

- [ ] **Step 6: 테스트 실행**

Run: `npx vitest run src/pages/myEntries src/pages/myPage src/widgets/myEntryRows`
Expected: PASS

- [ ] **Step 7: 커밋**

```bash
git add -A src/pages/myEntries src/pages/myPage src/widgets/myEntryRows
git commit -m "fix: 내 응모 내역의 발표 시각 표시를 발표 대기 문구로 전환 (GD-210)"
```

---

### Task 4: 계약 스키마·목업에서 필드 제거 (tsc가 잔여 소비처 검증)

**Files:**

- Modify: `src/entities/event/model/types.ts` (20~25행)
- Modify: `src/entities/drawResult/model/types.ts` (35~44행)
- Modify: `src/mocks/handlers/event.ts` (975, 985~988, 1006행)
- Modify: `src/mocks/handlers/drawResult.ts` (97~121행)
- Modify: `src/mocks/handlers/event.test.ts` (13, 30, 45~51행)
- Modify: `src/mocks/handlers/drawResult.test.ts` (21~29, 125행)

- [ ] **Step 1: eventSchema·publicResultsSchema에서 필드 제거**

`entities/event/model/types.ts` 20~25행을 아래로 교체:

```ts
// 발표 예정 시각은 계약에서 제외됐다 (GD-203·ADR-022) — 사용자 화면에 예정 시각·카운트다운을 두지 않는다.
// 마감 후 공개 전 상태는 status='closed'와 E08의 isPublished로만 판단한다.
```

`entities/drawResult/model/types.ts` 38~39행 주석과 44행 필드 제거:

```ts
/**
 * 이벤트의 공개 추첨 결과.
 *
 * 발표 전에는 isPublished=false, prizes=[]다. 고정 발표 예정 시각은 계약에 없다 —
 * 화면은 공개 전까지 '발표 대기'만 표시한다 (ADR-022).
 */
export const publicResultsSchema = z.object({
    eventId: z.string(),
    isPublished: z.boolean(),
    publishedAt: z.iso.datetime().nullable(),
    ...
});
```

- [ ] **Step 2: tsc로 잔여 소비처 확인**

Run: `npx tsc -b` — Task 1~3이 끝났다면 `publicationScheduledAt` 관련 오류는 목업 파일에만 남아야 한다. 다른 파일에 오류가 나오면 계획에 없는 소비처다 — 멈추고 확인한다.

- [ ] **Step 3: 목업에서 필드 제거, 주석을 ADR-022 기준으로 갱신**

`mocks/handlers/event.ts`:

- 1006행 `publicationScheduledAt: ...` 삭제
- 975행 주석 `(ADR-009 — 마감 + 5분 자동 발표)` → `(ADR-022 — 수동 공개 대신, 목업은 마감 + 5분에 공개된 것처럼 흉내 낸다)`
- 986~988행 주석의 '발표 예정 시각을 싣는다' 표현 제거 — 응답에 싣는 건 재계산한 상태뿐

`mocks/handlers/drawResult.ts`:

- 113행 `publicationScheduledAt` 삭제
- 97~101행 주석 갱신: `scheduledAt`은 목업 내부의 공개 시점 흉내값이라 응답에 싣지 않는다는 설명

- [ ] **Step 4: 목업 테스트를 계약 가드로 교체**

`event.test.ts`:

- `EventResponse` 인터페이스에서 `publicationScheduledAt: string;` 제거
- 상태 재계산 테스트의 `announces`를 `new Date(event.endsAt).getTime() + ANNOUNCE_DELAY_MS`로 교체 (`ANNOUNCE_DELAY_MS`를 `./event`에서 import)
- '발표 예정 시각은 마감 + 5분이다 (ADR-009)' 테스트를 계약 가드로 교체:

```ts
it('이벤트 응답에 발표 예정 시각을 싣지 않는다 (GD-203)', async () => {
    for (const event of await events()) {
        expect(event, event.id).not.toHaveProperty('publicationScheduledAt');
    }
});
```

`drawResult.test.ts`:

- 첫 테스트에 `expect(data).not.toHaveProperty('publicationScheduledAt')` 추가 (E08 계약 가드)
- 125행 주석 '발표 예정 시각 전이다' → '공개 전이다'

- [ ] **Step 5: 테스트·타입 통과 확인**

Run: `npx tsc -b && npx vitest run src/mocks`
Expected: 오류 0, 목업 테스트 전부 PASS

- [ ] **Step 6: 커밋**

```bash
git add -A src/entities src/mocks
git commit -m "fix: 이벤트·추첨 결과 계약에서 발표 예정 시각 필드 제거 (GD-210)"
```

---

### Task 5: 전체 검증

- [ ] **Step 1: 전체 게이트**

```powershell
npm run format:check
npm run lint
npm run test:ci
npm run build
```

- [ ] **Step 2: 잔여 참조 없음 확인**

```bash
grep -rn "publicationScheduledAt" src/
grep -rn "발표 예정\|formatCountdown" src/pages src/widgets src/entities
```

`formatCountdown`은 `shared/lib/date.ts`의 공용 유틸로 남겨 둔다 — 이번에 지우면 CloseCountdownChip 외 재사용 가능성까지 건드리는 범위 확대다. 단 `src`에서 참조가 0이 되면 그 사실만 보고한다.

- [ ] **Step 3: 수동 브라우저 확인 (MSW)**

`VITE_ENABLE_MSW=true npm run dev`로 확인할 화면:

- 타임래플 목록 — '발표 대기' 칸 개수·힌트, 마감한 래플 행 라벨
- 타임래플 상세 (evt-106 발표 대기) — 발표 대기 카드 문구, 카운트다운 부재
- 응모 완료 모달 — '마감 뒤 발표해요'
- 마이페이지 응모 내역·내 응모 내역 — 발표 칸/타일 문구
- 홈 '발표 대기 · 결과' 행 문구

## Self-Review 메모

- spec 문구 '응모 마감 · 결과 발표 대기'는 MyResultCard·EventResultRow에 그대로 쓰고, 칩·타일·행 라벨은 기존 '발표 대기' 어휘를 유지한다 (동일 용어 규칙).
- 발표 후 당첨 표시는 E08/E09의 `isPublished`·`result`가 이미 담당한다 — 본 작업은 '예정 시각 표현' 제거만 다룬다.
- 알려진 근사치: MyEntriesPage '최근 당첨 MM.DD'는 이제 마감 시각을 보여 준다 — 실제 공개 시각이 아니라는 점을 주석에 남겼다. 더 정확한 값이 필요하면 E08 `publishedAt` 연결을 요구하는 별도 계약 논의가 필요하다 (이번 범위 밖).
