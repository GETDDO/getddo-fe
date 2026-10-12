# GD-151 출석 AT01~AT03 계약 정합 Implementation Plan

> **For agentic workers:** REQUIRED: dispatch a fresh subagent per task (recommended) or use the `executing-plans` skill to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 출석 목업·타입·소비자를 getddo-spec의 AT01~AT03 계산 규칙과 `RewardReceipt.rewardType`(DAILY/STREAK) 계약에 정합시킨다.

**Architecture:** `entities/attendance`의 임시 계약(`checkedDates`·`ticketsGranted`·`/attendances/policy`)을 제거하고 spec DTO(`AttendanceToday`·`AttendanceMilestone`·`AttendanceReceipt`·`RewardReceipt`·`AttendanceMonth`)로 교체한다. 화면이 쓰던 `checkedDates`는 AT03 월별 조회로 대체하고, 보상 단계·일일 보상량은 AT01의 `milestones`·`dailyRewardTicketCount`에서 가져온다.

**Tech Stack:** TypeScript, React 19, TanStack Query, Zod v4(`z.iso.datetime()`), MSW, Vitest

**Spec:** `../getddo-spec/05-api/attendance.md`, `../getddo-spec/02-domain/attendance.md`, `../getddo-spec/03-decisions/016-attendance-bronze-tickets.md`

## Global Constraints

- 출석 기준일·기준월은 KST다 — 일일은 00:00 KST, 연속은 매월 1일 00:00 KST 경계.
- 연속 출석 일수는 같은 달 안에서만 센다(월 경계에서 0으로 초기화, `consecutiveDays`는 실제 연속 일수로 28 초과 가능).
- 같은 달 같은 단계 보상은 1회 — 연속이 끊겨도 `claimed`는 유지한다.
- 단계 일수는 1~28, 중복 없는 오름차순. 초기 설정: 7일 1장·14일 3장·28일 7장, 일일 보상 1장(브론즈 고정, ADR-016).
- AT03의 `month`는 필수 `YYYY-MM` — 누락·형식 오류는 400 `COMMON-002`. 기록 없는 달·미래 달은 오류가 아니라 빈 `attendanceDates`.
- 같은 기준일 AT02 재요청은 200으로 이미 확정한 영수증을 그대로 돌려준다(새 지급 없음).
- `RewardReceipt.milestoneDays`는 STREAK일 때만 값, DAILY이면 `null`. `grantedAt`/`expiresAt`은 보상 지급 시각·응모권 만료 시각(nullable).
- FSD 규칙: mocks는 entities·shared만 참조, 슬라이스 루트 `index.ts` 경유 import, `import type` 강제, 쿼리 키는 entities의 상수 재사용.
- 400 오류는 기존 목업과 같은 `fail(400, 'COMMON-002', message)` 형태.

---

### Task 1: entities/attendance — 스펙 DTO 스키마·쿼리 정합

**Files:**

- Modify: `src/entities/attendance/model/types.ts` (전면 교체)
- Modify: `src/entities/attendance/api/queries.ts`
- Modify: `src/entities/attendance/index.ts`

**Interfaces:**

- Produces (이후 태스크·소비자가 쓰는 이름):
    - `attendanceTodaySchema`/`AttendanceToday` — `{ attendanceDate, attended, consecutiveDays, dailyRewardTicketCount, milestones, nextResetAt, serverTime }`
    - `attendanceMilestoneSchema`/`AttendanceMilestone` — `{ milestoneDays, rewardTicketCount, claimed, claimedAt: string|null }`
    - `attendanceReceiptSchema`/`AttendanceReceipt` — `{ attendanceId, attendanceDate, consecutiveDays, rewards, createdAt }`
    - `rewardReceiptSchema`/`RewardReceipt` — `{ claimId, rewardType: 'DAILY'|'STREAK', milestoneDays: number|null, ticketCount, grantedAt, expiresAt }`
    - `attendanceMonthSchema`/`AttendanceMonth` — `{ month, attendanceDates, milestones, serverTime }`
    - `ATTENDANCES_KEY`, `ATTENDANCE_TODAY_KEY`, `ATTENDANCE_MONTHS_KEY`, `ATTENDANCES_API_PATH`, `ATTENDANCE_TODAY_API_PATH`
    - `useAttendanceToday()`, `useAttendanceMonth(month: string, options?: { enabled?: boolean })`

- [ ] **Step 1: types.ts를 spec DTO로 교체**

```ts
import { z } from 'zod';

// getddo-spec 05-api/attendance.md AT01~AT03 초안 DTO와 같은 필드명을 쓴다

/** 연속 출석 단계 — 단계 일수는 1~28, 보상 수량은 1장 이상 (02-domain/attendance.md) */
export const attendanceMilestoneSchema = z.object({
    milestoneDays: z.number().int().min(1).max(28),
    rewardTicketCount: z.number().int().positive(),
    claimed: z.boolean(),
    claimedAt: z.iso.datetime().nullable(),
});

/** AT01 `GET /attendances/today` 응답 */
export const attendanceTodaySchema = z.object({
    attendanceDate: z.string(),
    attended: z.boolean(),
    consecutiveDays: z.number().int().nonnegative(),
    dailyRewardTicketCount: z.number().int().nonnegative(),
    milestones: z.array(attendanceMilestoneSchema),
    nextResetAt: z.iso.datetime(),
    serverTime: z.iso.datetime(),
});

/** AT02 영수증의 보상 1건 — rewardType이 보상 구분 필드다 */
export const rewardReceiptSchema = z.object({
    claimId: z.string(),
    rewardType: z.enum(['DAILY', 'STREAK']),
    milestoneDays: z.number().int().min(1).max(28).nullable(),
    ticketCount: z.number().int().nonnegative(),
    grantedAt: z.iso.datetime().nullable(),
    expiresAt: z.iso.datetime().nullable(),
});

/** AT02 `POST /attendances` 응답 — 같은 날 재요청은 이미 확정한 rewards를 그대로 돌려준다 */
export const attendanceReceiptSchema = z.object({
    attendanceId: z.string(),
    attendanceDate: z.string(),
    consecutiveDays: z.number().int().nonnegative(),
    rewards: z.array(rewardReceiptSchema),
    createdAt: z.iso.datetime(),
});

/** AT03 `GET /attendances?month=YYYY-MM` 응답 */
export const attendanceMonthSchema = z.object({
    month: z.string(),
    attendanceDates: z.array(z.string()),
    milestones: z.array(attendanceMilestoneSchema),
    serverTime: z.iso.datetime(),
});

export type AttendanceMilestone = z.infer<typeof attendanceMilestoneSchema>;
export type AttendanceToday = z.infer<typeof attendanceTodaySchema>;
export type RewardReceipt = z.infer<typeof rewardReceiptSchema>;
export type AttendanceReceipt = z.infer<typeof attendanceReceiptSchema>;
export type AttendanceMonth = z.infer<typeof attendanceMonthSchema>;
```

`attendanceStatusSchema`·`checkAttendanceResultSchema`·`attendancePolicySchema`와 `AttendanceStatus`·`CheckAttendanceResult`·`AttendancePolicy`는 삭제한다 — `/attendances/policy`는 spec에 없는 임시 조회였고, 일일 보상량·단계는 AT01에 포함된다.

- [ ] **Step 2: queries.ts를 AT01·AT03 훅으로 교체**

```ts
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';
import { envelopeSchema } from '@shared/api/envelopeSchema';
import { queryPresets } from '@shared/api/queryPresets';

import { attendanceMonthSchema, attendanceTodaySchema } from '../model/types';

export const ATTENDANCES_KEY = ['attendance'] as const;
export const ATTENDANCE_TODAY_KEY = [...ATTENDANCES_KEY, 'today'] as const;
export const ATTENDANCE_MONTHS_KEY = [...ATTENDANCES_KEY, 'months'] as const;

// 출석 도메인의 엔드포인트 — 출석 처리(POST)를 하는 feature/checkAttendance도 이 상수를 재사용한다
export const ATTENDANCES_API_PATH = '/attendances';
export const ATTENDANCE_TODAY_API_PATH = `${ATTENDANCES_API_PATH}/today`;

/** AT01 — 오늘 출석 여부·연속 일수·일일 보상량·이번 달 단계 */
export function useAttendanceToday() {
    return useQuery({
        // 화면을 열어 둔 채 기준일(00:00 KST)이 지나면 어제의 attended가 남아 버튼이 계속 비활성된다 — 주기적으로 다시 받는다
        ...queryPresets.realtime,
        queryKey: ATTENDANCE_TODAY_KEY,
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(ATTENDANCE_TODAY_API_PATH);
            return envelopeSchema(attendanceTodaySchema).parse(data).data;
        },
    });
}

/** AT03 — month는 KST 기준월 'YYYY-MM'이며 필수다. 기록 없는 달은 attendanceDates가 빈 목록 */
export function useAttendanceMonth(month: string, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: [...ATTENDANCE_MONTHS_KEY, month],
        enabled: options?.enabled ?? true,
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(ATTENDANCES_API_PATH, {
                params: { month },
            });
            return envelopeSchema(attendanceMonthSchema).parse(data).data;
        },
    });
}
```

- [ ] **Step 3: index.ts 공개 API 갱신**

```ts
export {
    ATTENDANCE_MONTHS_KEY,
    ATTENDANCE_TODAY_API_PATH,
    ATTENDANCE_TODAY_KEY,
    ATTENDANCES_API_PATH,
    ATTENDANCES_KEY,
    useAttendanceMonth,
    useAttendanceToday,
} from './api/queries';
export {
    attendanceMilestoneSchema,
    attendanceMonthSchema,
    attendanceReceiptSchema,
    attendanceTodaySchema,
    rewardReceiptSchema,
} from './model/types';
export type {
    AttendanceMilestone,
    AttendanceMonth,
    AttendanceReceipt,
    AttendanceToday,
    RewardReceipt,
} from './model/types';
```

- [ ] **Step 4: 타입 체크 — 아직 소비자는 구 계약이라 에러가 나는 것이 정상**

Run: `npx tsc -b --pretty false 2>&1 | head -30`
Expected: `useAttendanceStatus`·`useAttendancePolicy`·`checkedDates` 등 구 이름을 쓰는 소비자 파일에서 에러 — Task 2·3에서 해소한다. 이 단계에서 커밋하지 않는다.

### Task 2: mocks/handlers/attendance.ts — AT01~AT03 계산 규칙

**Files:**

- Modify: `src/mocks/handlers/attendance.ts` (전면 교체)

**Interfaces:**

- Consumes: Task 1의 `AttendanceMilestone`/`AttendanceReceipt`/`RewardReceipt` 타입, `@shared/lib/date`의 `kstNextMonthStart`, `./response`의 `ok`/`fail`, `./ticket`의 `recordMockTicketGrant`
- Produces: AT01 `GET /attendances/today`, AT02 `POST /attendances`, AT03 `GET /attendances?month=`

- [ ] **Step 1: 핸들러 전면 교체**

```ts
import { http } from 'msw';

import type { AttendanceMilestone, AttendanceReceipt, RewardReceipt } from '@entities/attendance';

import { env } from '@shared/config/env';
import { kstNextMonthStart } from '@shared/lib/date';

import { mockNow } from '../now';
import { fail, ok } from './response';
import { recordMockTicketGrant } from './ticket';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

// 출석 기준일은 00:00 KST에 바뀐다 — KST 날짜 문자열로 관리한다 (getddo-spec 공통 시간 기준)
const toDate = (date: Date) => new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
// 가상 시계 기준 — 시간 여행 시연에서 '오늘' 출석이 가상 날짜를 따라간다
const daysAgo = (days: number) => toDate(new Date(mockNow().getTime() - days * DAY_MS));

// KST 날짜 문자열(YYYY-MM-DD)의 전날 — 날짜끼리만 다루므로 UTC 자정 기준으로 하루를 뺀다
const prevDate = (date: string) => {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
};

// 다음 출석 기준일이 시작되는 시각(다음 KST 자정) — AT01 nextResetAt
const nextKstMidnight = (now: Date) => {
    const k = new Date(now.getTime() + KST_OFFSET_MS);
    return new Date(
        Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate() + 1) - KST_OFFSET_MS,
    ).toISOString();
};

interface AttendanceState {
    /** 출석 기준일(KST YYYY-MM-DD) 목록 */
    checkedDates: string[];
    /** 월(YYYY-MM) → milestoneDays → 지급 시각 — 같은 단계 보상은 그 달에 한 번만 지급한다 */
    claimedMilestones: Map<string, Map<number, string>>;
    /** 같은 기준일 재요청에 그대로 돌려줄 영수증 — 기준일이 바뀌면 폐기한다 */
    todayReceipt: { date: string; receipt: AttendanceReceipt } | null;
}

// 시연용 초기 상태 — 어제까지 3일 연속 출석(중간에 하루 빠진 이력 포함)으로 시작한다
const seedState = (): AttendanceState => ({
    checkedDates: [daysAgo(5), daysAgo(3), daysAgo(2), daysAgo(1)],
    claimedMilestones: new Map(),
    todayReceipt: null,
});

// X-User-ID별로 분리한다 — 한 사용자의 출석이 다른 사용자에게 보이거나 보상을 막지 않도록
const stateByUser = new Map<string, AttendanceState>();

const userIdOf = (request: Request) => request.headers.get('X-User-ID') ?? 'anonymous';

const stateFor = (userId: string) => {
    let state = stateByUser.get(userId);
    if (!state) {
        state = seedState();
        stateByUser.set(userId, state);
    }
    return state;
};

// getddo-spec 출석 규칙의 초기 설정 — 관리자 정책 API(AP01~AP04)가 오면 저장소가 된다
const policy = {
    dailyRewardTickets: 1,
    streakBonuses: [
        { days: 7, rewardTickets: 1 },
        { days: 14, rewardTickets: 3 },
        { days: 28, rewardTickets: 7 },
    ],
};

// endDate를 끝으로 같은 달 안에서 이어지는 출석 일수 — 연속 출석은 매월 초기화되므로 월 경계에서 끊긴다
const streakEndingAt = (dates: ReadonlySet<string>, endDate: string) => {
    const month = endDate.slice(0, 7);
    let count = 0;
    for (
        let cursor = endDate;
        cursor.startsWith(month) && dates.has(cursor);
        cursor = prevDate(cursor)
    ) {
        count += 1;
    }
    return count;
};

// AT01 consecutiveDays — 오늘 출석했으면 오늘까지, 아니면 어제(같은 달)까지 이어지는 일수.
// 어제가 지난달이거나 출석이 없으면 0이다 (spec AT01·AT03 계산 규칙)
const currentStreak = (dates: ReadonlySet<string>, today: string) => {
    const yesterday = prevDate(today);
    if (dates.has(today)) return streakEndingAt(dates, today);
    return yesterday.startsWith(today.slice(0, 7)) && dates.has(yesterday)
        ? streakEndingAt(dates, yesterday)
        : 0;
};

// 그 달에 적용되는 단계 묶음에 claimed를 붙인다 — mock은 단일 묶음이라 달마다 같은 단계다
const milestonesFor = (state: AttendanceState, month: string): AttendanceMilestone[] =>
    policy.streakBonuses.map((bonus) => {
        const claimedAt = state.claimedMilestones.get(month)?.get(bonus.days) ?? null;
        return {
            milestoneDays: bonus.days,
            rewardTicketCount: bonus.rewardTickets,
            claimed: claimedAt !== null,
            claimedAt,
        };
    });

export const attendanceHandlers = [
    // AT01 초안 — 오늘 출석 여부·연속 일수·일일 보상량·이번 달 단계·다음 초기화 시각
    http.get(api('/attendances/today'), ({ request }) => {
        const now = mockNow();
        const today = toDate(now);
        const state = stateFor(userIdOf(request));
        const dates = new Set(state.checkedDates);
        return ok({
            attendanceDate: today,
            attended: dates.has(today),
            consecutiveDays: currentStreak(dates, today),
            dailyRewardTicketCount: policy.dailyRewardTickets,
            milestones: milestonesFor(state, today.slice(0, 7)),
            nextResetAt: nextKstMidnight(now),
            serverTime: now.toISOString(),
        });
    }),
    // AT02 초안 — 본문을 받지 않는다. 날짜·보상량은 서버 KST 기준일·정책으로 정한다
    http.post(api('/attendances'), async ({ request }) => {
        // 본문이 붙어 오는 경우도 있으므로 소비해 두고, 출석 판정에는 쓰지 않는다
        await request.json().catch(() => null);

        const userId = userIdOf(request);
        const state = stateFor(userId);
        const now = mockNow();
        const today = toDate(now);
        const month = today.slice(0, 7);
        const dates = new Set(state.checkedDates);

        // 같은 기준일 재요청: 새로 지급하지 않고 이미 확정한 영수증을 그대로 돌려준다 (AT02 명시)
        if (state.todayReceipt?.date === today) {
            return ok(state.todayReceipt.receipt, 200);
        }

        state.checkedDates.push(today);
        const yesterday = prevDate(today);
        const consecutiveDays =
            (yesterday.startsWith(month) ? streakEndingAt(dates, yesterday) : 0) + 1;

        const nowIso = now.toISOString();
        // 응모권은 다음 달 1일 00:00 KST에 만료한다 (getddo-spec ticket.md 월 만료 정책)
        const expiresAt = kstNextMonthStart(now).toISOString();
        const rewards: RewardReceipt[] = [
            {
                claimId: crypto.randomUUID(),
                rewardType: 'DAILY',
                milestoneDays: null,
                ticketCount: policy.dailyRewardTickets,
                grantedAt: nowIso,
                expiresAt,
            },
        ];

        // 연속 단계 도달 시 STREAK 보상 — 같은 달 같은 단계는 한 번만 지급한다
        const bonus = policy.streakBonuses.find((b) => b.days === consecutiveDays);
        if (bonus && !state.claimedMilestones.get(month)?.has(bonus.days)) {
            let claimed = state.claimedMilestones.get(month);
            if (!claimed) {
                claimed = new Map();
                state.claimedMilestones.set(month, claimed);
            }
            claimed.set(bonus.days, nowIso);
            rewards.push({
                claimId: crypto.randomUUID(),
                rewardType: 'STREAK',
                milestoneDays: bonus.days,
                ticketCount: bonus.rewardTickets,
                grantedAt: nowIso,
                expiresAt,
            });
        }

        const receipt: AttendanceReceipt = {
            attendanceId: crypto.randomUUID(),
            attendanceDate: today,
            consecutiveDays,
            rewards,
            createdAt: nowIso,
        };
        state.todayReceipt = { date: today, receipt };

        const total = rewards.reduce((sum, reward) => sum + reward.ticketCount, 0);
        if (total > 0) recordMockTicketGrant(userId, total, '매일 출석체크 리워드');

        return ok(receipt, 201);
    }),
    // AT03 초안 — month는 필수 'YYYY-MM'. 기록 없는 달·미래 달은 오류가 아니라 빈 목록이다
    http.get(api('/attendances'), ({ request }) => {
        const month = new URL(request.url).searchParams.get('month');
        if (!month || !MONTH_PATTERN.test(month)) {
            return fail(400, 'COMMON-002', 'month는 YYYY-MM 형식이어야 합니다');
        }
        const state = stateFor(userIdOf(request));
        return ok({
            month,
            attendanceDates: state.checkedDates.filter((date) => date.startsWith(month)).sort(),
            milestones: milestonesFor(state, month),
            serverTime: mockNow().toISOString(),
        });
    }),
];
```

spec에 없는 임시 `GET /attendances/policy` 핸들러는 제거한다 — 일일 보상량·단계는 AT01이 준다.

- [ ] **Step 2: 목업 테스트 갱신 (Task 4의 attendance.test.ts와 함께 확인)**

Task 4에서 테스트를 다 쓰고 실행한다.

### Task 3: features/checkAttendance + 소비자 정합

**Files:**

- Modify: `src/features/checkAttendance/api/queries.ts`
- Modify: `src/features/checkAttendance/ui/AttendanceCheckCard.tsx`
- Modify: `src/widgets/ticketBalance/ui/TicketBalanceWidget.tsx`

**Interfaces:**

- Consumes: Task 1의 `attendanceReceiptSchema`, `useAttendanceToday`, `useAttendanceMonth`, `ATTENDANCE_TODAY_KEY`, `ATTENDANCE_MONTHS_KEY`

- [ ] **Step 1: feature mutation을 AttendanceReceipt로 교체**

`src/features/checkAttendance/api/queries.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
    ATTENDANCE_MONTHS_KEY,
    ATTENDANCE_TODAY_KEY,
    ATTENDANCES_API_PATH,
    attendanceReceiptSchema,
} from '@entities/attendance';
import { TICKETS_KEY } from '@entities/ticket';
import { apiClient } from '@shared/api/client';
import { envelopeSchema } from '@shared/api/envelopeSchema';

/**
 * 오늘 출석 — 출석은 사용자·KST 기준일로 재처리하므로 멱등키를 쓰지 않는다 (ADR-0005, spec 공통 계약).
 * 같은 날 재요청은 서버가 200으로 기존 영수증을 돌려준다.
 * minDurationMs를 주면 응답이 빨라도 그 시간이 지난 뒤에 완료·갱신된다 — 굽는 연출이 끝나기 전에 화면 곳곳이 먼저 바뀌지 않게 한다
 */
export function useCheckAttendance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ minDurationMs = 0 }: { minDurationMs?: number } = {}) => {
            const [{ data }] = await Promise.all([
                apiClient.post<unknown>(ATTENDANCES_API_PATH),
                new Promise((resolve) => setTimeout(resolve, minDurationMs)),
            ]);
            return envelopeSchema(attendanceReceiptSchema).parse(data).data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ATTENDANCE_TODAY_KEY });
            void queryClient.invalidateQueries({ queryKey: ATTENDANCE_MONTHS_KEY });
            // 출석 보상이 응모권으로 지급되므로 잔액·이력도 다시 받아온다
            void queryClient.invalidateQueries({ queryKey: TICKETS_KEY });
        },
    });
}
```

- [ ] **Step 2: AttendanceCheckCard를 AT01+AT03 데이터로 전환**

변경 부분만 (`AttendanceCheckCard.tsx`):

import 교체:

```ts
import { useAttendanceMonth, useAttendanceToday } from '@entities/attendance';
```

훅 사용부 (기존 `useAttendanceStatus`/`useAttendancePolicy`/`bonusRewards` 블록 교체):

```ts
const { data: status, isPending, isError } = useAttendanceToday();
const checkAttendance = useCheckAttendance();
// 출석 판정은 서버가 하고, 여기서는 표시용 날짜 계산에만 쓴다
const clock = useVirtualClock();
const [now, setNow] = useState(() => clock.now());
// 가상 시계 오버라이드가 바뀌면 렌더 단계에서 즉시 갱신한다 (effect setState는 lint 금지)
const [lastClock, setLastClock] = useState(clock);
if (lastClock !== clock) {
    setLastClock(clock);
    setNow(clock.now());
}
const today = toAttendanceDate(now);
const month = today.slice(0, 7);
// 최근 7일이 지난달에 걸치면 그 달 출석일도 같이 받는다 — 주간 스트립이 월 경계를 넘을 수 있다
const weekStartMonth = toAttendanceDate(new Date(now.getTime() - 6 * DAY_MS)).slice(0, 7);
const { data: monthData } = useAttendanceMonth(month);
const { data: prevMonthData } = useAttendanceMonth(weekStartMonth, {
    enabled: weekStartMonth !== month,
});
const checkedDates = [
    ...(prevMonthData?.attendanceDates ?? []),
    ...(monthData?.attendanceDates ?? []),
];
// 연속 출석 보상일과 추가 응모권 수는 이번 달 단계 묶음(AT01 milestones)에서 받는다
const bonusRewards: ReadonlyMap<number, number> = status
    ? new Map(status.milestones.map((m) => [m.milestoneDays, m.rewardTicketCount]))
    : DEFAULT_BONUS_REWARDS;
const bonusDays: ReadonlySet<number> = new Set(bonusRewards.keys());
```

파일 상단에 `const DAY_MS = 24 * 60 * 60 * 1000;` 추가.

주의: 기존 `const clock = useVirtualClock(); const [now, setNow]...` 블록이 아래에 따로 있으므로 중복 선언이 되지 않게 기존 블록을 이 위치로 통합한다.

`handleCheck`의 결과 사용부:

```ts
const receipt = await checkAttendance.mutateAsync({
    minDurationMs: BAKING_MIN_MS,
});
const granted = receipt.rewards.reduce((sum, reward) => sum + reward.ticketCount, 0);
setRevealDate(today);
toast.success(`출석 완료! 응모권 ${granted}장을 받았어요.`);
```

`shownDates`·`countMonthlyAttendance` 호출부:

```ts
const shownDates = baking ? checkedDates.filter((date) => date !== today) : checkedDates;
```

```ts
            monthly={countMonthlyAttendance(checkedDates, status.attended, now)}
```

(`status.checkedDates` 참조를 모두 `checkedDates` 지역 변수로 바꾼다.)

- [ ] **Step 3: TicketBalanceWidget의 출석 카드 정합**

```ts
import { useAttendanceToday } from '@entities/attendance';
```

```ts
const { data: attendance } = useAttendanceToday();
```

출석 카드의 `rewardTickets: 1`을 `rewardTickets: attendance.dailyRewardTicketCount`로 바꾼다 — 일일 보상량은 AT01이 준다.

- [ ] **Step 4: 타입 체크**

Run: `npx tsc -b --pretty false 2>&1 | head -30`
Expected: PASS (에러 없음)

### Task 4: 목업 테스트 갱신 + CONTEXT.md

**Files:**

- Modify: `src/mocks/handlers/attendance.test.ts` (전면 교체)
- Modify: `docs/CONTEXT.md` (출석 DTO 항목 갱신)

- [ ] **Step 1: attendance.test.ts를 새 계약으로 교체**

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@shared/api/client';

interface RewardReceipt {
    claimId: string;
    rewardType: 'DAILY' | 'STREAK';
    milestoneDays: number | null;
    ticketCount: number;
    grantedAt: string | null;
    expiresAt: string | null;
}

interface AttendanceReceipt {
    attendanceId: string;
    attendanceDate: string;
    consecutiveDays: number;
    rewards: RewardReceipt[];
    createdAt: string;
}

interface AttendanceToday {
    attendanceDate: string;
    attended: boolean;
    consecutiveDays: number;
    dailyRewardTicketCount: number;
    milestones: {
        milestoneDays: number;
        rewardTicketCount: number;
        claimed: boolean;
        claimedAt: string | null;
    }[];
    nextResetAt: string;
    serverTime: string;
}

const headers = (userId: string) => ({ 'X-User-ID': userId });
const uniqueUser = () => `user-att-${crypto.randomUUID()}`;

const check = (userId: string) =>
    apiClient.post<{ data: AttendanceReceipt }>('/attendances', undefined, {
        headers: headers(userId),
        validateStatus: () => true,
    });

const today = (userId: string) =>
    apiClient.get<{ data: AttendanceToday }>('/attendances/today', {
        headers: headers(userId),
    });

const month = (userId: string, value?: string) =>
    apiClient.get<{
        data: { month: string; attendanceDates: string[] };
    }>('/attendances', {
        headers: headers(userId),
        params: value === undefined ? {} : { month: value },
        validateStatus: () => true,
    });

// 두 요청 사이에 KST 자정이 지나면 결과가 달라지므로 Date만 고정한다 — 타이머까지 가짜로 바꾸면 MSW 요청이 멈춘다
const freezeDate = (iso: string) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(iso));
};

// KST 자정(전날 UTC 15:00)에서 충분히 멀리 둔 시각 — 2026-10-02 21:00 KST
const freezeAt = (isoUtcDate: string) => freezeDate(`${isoUtcDate}T12:00:00Z`);

afterEach(() => {
    vi.useRealTimers();
});

describe('출석 목업 핸들러', () => {
    it('첫 출석은 DAILY 보상을 담은 영수증을 201로 돌려준다', async () => {
        freezeAt('2026-10-02');
        const userId = uniqueUser();

        const res = await check(userId);
        expect(res.status).toBe(201);
        const receipt = res.data.data;
        expect(receipt.attendanceDate).toBe('2026-10-02');
        // 시드는 어제까지 3일 연속 — 오늘은 4일째
        expect(receipt.consecutiveDays).toBe(4);
        expect(receipt.rewards).toEqual([
            expect.objectContaining({
                rewardType: 'DAILY',
                milestoneDays: null,
                ticketCount: 1,
            }),
        ]);
    });

    it('같은 날 재요청은 새로 지급하지 않고 처음 영수증을 200으로 돌려준다', async () => {
        freezeAt('2026-10-02');
        const userId = uniqueUser();

        const first = await check(userId);
        const again = await check(userId);
        expect(again.status).toBe(200);
        expect(again.data).toEqual(first.data);
    });

    it('연속 단계에 도달하면 STREAK 보상을 붙이고 그 달에는 한 번만 지급한다', async () => {
        const userId = uniqueUser();
        // 시드 3일에서 시작해 4·5·6·7일째를 채운다 — 7일째에 첫 단계 보상
        const days = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'];
        let last: Awaited<ReturnType<typeof check>> | null = null;
        for (const day of days) {
            freezeAt(day);
            last = await check(userId);
        }

        expect(last?.status).toBe(201);
        expect(last?.data.data.consecutiveDays).toBe(7);
        expect(last?.data.data.rewards).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ rewardType: 'DAILY', ticketCount: 1 }),
                expect.objectContaining({
                    rewardType: 'STREAK',
                    milestoneDays: 7,
                    ticketCount: 1,
                }),
            ]),
        );

        const status = await today(userId);
        expect(status.data.data.consecutiveDays).toBe(7);
        expect(status.data.data.milestones).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ milestoneDays: 7, claimed: true }),
                expect.objectContaining({ milestoneDays: 14, claimed: false }),
            ]),
        );
    });

    it('AT01은 출석 기준일·일일 보상량·다음 초기화 시각을 준다', async () => {
        freezeAt('2026-10-02');
        const userId = uniqueUser();

        const { data } = await today(userId);
        const status = data.data;
        expect(status.attendanceDate).toBe('2026-10-02');
        expect(status.attended).toBe(false);
        // 어제까지 3일 연속 시드
        expect(status.consecutiveDays).toBe(3);
        expect(status.dailyRewardTicketCount).toBe(1);
        expect(status.nextResetAt > status.serverTime).toBe(true);
    });

    it('AT03은 month가 없거나 형식이 아니면 400, 맞으면 그 달 출석일을 준다', async () => {
        freezeAt('2026-10-02');
        const userId = uniqueUser();

        expect((await month(userId)).status).toBe(400);
        expect((await month(userId, '2026-1')).status).toBe(400);
        expect((await month(userId, '2026-13')).status).toBe(400);

        await check(userId);
        const { status, data } = await month(userId, '2026-10');
        expect(status).toBe(200);
        expect(data.data.attendanceDates).toContain('2026-10-02');

        // 기록이 없는 달은 오류가 아니라 빈 목록이다
        const empty = await month(userId, '2026-09');
        expect(empty.status).toBe(200);
        expect(empty.data.data.attendanceDates).toEqual([]);
    });

    it('출석 상태와 응모권 잔액은 사용자별로 분리된다', async () => {
        freezeAt('2026-10-02');
        const userA = uniqueUser();
        const userB = uniqueUser();

        const first = await check(userA);
        expect(first.status).toBe(201);

        // 다른 사용자는 첫 출석으로 새 보상을 받는다 — A의 출석이 B를 막지 않는다
        const second = await check(userB);
        expect(second.status).toBe(201);

        const { data: beforeB } = await apiClient.get<{
            data: { availableBalance: number };
        }>('/tickets/wallets/me', { headers: headers(userB) });
        const { data: afterA } = await apiClient.get<{
            data: { availableBalance: number };
        }>('/tickets/wallets/me', { headers: headers(userA) });
        expect(afterA.data.availableBalance).toBeGreaterThan(beforeB.data.availableBalance);
    });
});
```

- [ ] **Step 2: CONTEXT.md 출석 DTO 항목 갱신**

`docs/CONTEXT.md`의 "출석 DTO — `mocks/handlers/attendance.ts`는 응답 봉투만 맞췄고…(GD-102 잔여)" 항목을 새 계약 반영 내용으로 교체한다:

```md
- 출석 DTO — AT01~AT03 계약을 맞췄다. `AttendanceToday`(attendanceDate·dailyRewardTicketCount·milestones·nextResetAt)와 `AttendanceReceipt`(rewards[]의 `rewardType` DAILY/STREAK·`milestoneDays`)는 entities/attendance 스키마가 기준이고, 주간 도트가 쓰던 `checkedDates`는 AT03 월별 조회(`attendanceDates`)로 대체했다. 보상의 응모권 등급(브론즈) 공개 필드는 아직 DTO에 없다 — 담당자 검토 대기 (ADR-016, `pending-decisions.md`의 "등급 응모권")
```

- [ ] **Step 3: 전체 검증**

```bash
npm run format:check && npm run lint && npm run test:ci && npm run build
```

Expected: 전부 통과 (lint 경고 0개)

- [ ] **Step 4: 커밋**

```bash
git add src/entities/attendance src/mocks/handlers/attendance.ts src/mocks/handlers/attendance.test.ts src/features/checkAttendance src/widgets/ticketBalance docs/CONTEXT.md docs/superpowers/plans/2026-10-12-gd151-attendance-contract.md
git commit -m "feat: 출석 목업·타입을 AT01~AT03 계약과 보상 구분 필드에 정합"
```
