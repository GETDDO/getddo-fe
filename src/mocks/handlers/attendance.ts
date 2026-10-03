import { http, HttpResponse } from 'msw';

import type { AttendancePolicy } from '@entities/attendance';

import { env } from '@shared/config/env';

import { mockNow } from '../now';
import { recordMockTicketGrant } from './ticket';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 출석 기준일은 00:00 KST에 바뀐다 — KST 날짜 문자열로 관리한다 (getddo-spec 공통 시간 기준)
const toDate = (date: Date) => new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
// 가상 시계 기준 — 시간 여행 시연에서 '오늘' 출석이 가상 날짜를 따라간다
const daysAgo = (days: number) => toDate(new Date(mockNow().getTime() - days * DAY_MS));

interface AttendanceState {
    checkedDates: string[];
    streak: number;
    /** 오늘 출석에서 이미 확정한 응모권 — 같은 날 재요청은 이 값을 그대로 돌려준다 */
    todayGranted: number;
}

// 시연용 초기 상태 — 어제까지 3일 연속 출석(중간에 하루 빠진 이력 포함)으로 시작한다
const seedState = (): AttendanceState => ({
    checkedDates: [daysAgo(5), daysAgo(3), daysAgo(2), daysAgo(1)],
    streak: 3,
    todayGranted: 0,
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

// 관리자가 설정하는 출석 정책 — getddo-spec 출석 규칙의 초기 설정(7·14·28일, 1·3·7장)
const policy: AttendancePolicy = {
    dailyRewardTickets: 1,
    streakBonuses: [
        { days: 7, rewardTickets: 1 },
        { days: 14, rewardTickets: 3 },
        { days: 28, rewardTickets: 7 },
    ],
};

export const attendanceHandlers = [
    // 관리자 정책 API가 없어 시연 화면을 위한 임시 조회 — spec의 attendances/* 네임스페이스 안에 둔다
    http.get(api('/attendances/policy'), () => HttpResponse.json(policy)),
    // AT01 초안 — 오늘 출석 여부 + 최근 기준일
    http.get(api('/attendances/today'), ({ request }) => {
        const state = stateFor(userIdOf(request));
        const today = toDate(mockNow());
        return HttpResponse.json({
            attended: state.checkedDates.includes(today),
            consecutiveDays: state.streak,
            checkedDates: state.checkedDates,
        });
    }),
    // AT02 초안 — 본문을 받지 않는다. 날짜·보상량은 서버 기준일·정책으로 정한다
    http.post(api('/attendances'), async ({ request }) => {
        // 본문이 붙어 오는 경우도 있으므로 소비해 두고, 출석 판정에는 쓰지 않는다
        await request.json().catch(() => null);

        const userId = userIdOf(request);
        const state = stateFor(userId);
        const today = toDate(mockNow());

        // 같은 기준일 재요청: 새로 지급하지 않고 이미 확정한 결과를 그대로 돌려준다 (AT02 명시)
        if (state.checkedDates.includes(today)) {
            return HttpResponse.json(
                {
                    attended: true,
                    consecutiveDays: state.streak,
                    ticketsGranted: state.todayGranted,
                },
                { status: 200 },
            );
        }

        state.checkedDates.push(today);
        state.streak += 1;

        const bonus = policy.streakBonuses.find((b) => b.days === state.streak);
        const tickets = policy.dailyRewardTickets + (bonus?.rewardTickets ?? 0);
        state.todayGranted = tickets;
        recordMockTicketGrant(userId, tickets, '매일 출석체크 리워드');

        return HttpResponse.json(
            { attended: true, consecutiveDays: state.streak, ticketsGranted: tickets },
            { status: 201 },
        );
    }),
];
