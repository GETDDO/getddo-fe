import { http, HttpResponse } from 'msw';

import { env } from '@shared/config/env';

import { recordMockTicketGrant } from './ticket';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

const DAY_MS = 24 * 60 * 60 * 1000;
// 출석 기준일은 00:00 UTC에 바뀐다 — UTC 날짜 문자열로 관리한다
const toDate = (date: Date) => date.toISOString().slice(0, 10);
const daysAgo = (days: number) => toDate(new Date(Date.now() - days * DAY_MS));

// 목업 세션 동안 유지되는 출석 상태 — 어제까지 3일 연속 출석한 상태에서 시작한다
const state = {
    checkedDates: [daysAgo(5), daysAgo(3), daysAgo(2), daysAgo(1)],
    streak: 3,
};

// 관리자가 설정하는 출석 정책 — getddo-spec 출석 규칙의 초기 설정(7·14·28일, 1·3·7장)
const policy = {
    dailyRewardTickets: 1,
    streakBonuses: [
        { days: 7, rewardTickets: 1 },
        { days: 14, rewardTickets: 3 },
        { days: 28, rewardTickets: 7 },
    ],
};

export const attendanceHandlers = [
    http.get(api('/attendance/policy'), () => HttpResponse.json(policy)),
    http.get(api('/attendance/me'), () => {
        const today = toDate(new Date());
        return HttpResponse.json({
            checkedToday: state.checkedDates.includes(today),
            streak: state.streak,
            checkedDates: state.checkedDates,
        });
    }),
    http.post(api('/attendance/check'), ({ request }) => {
        // 멱등키 전달 헤더명은 계약 확정 전 임시로 X-Idempotency-Key 사용 (ADR-0005)
        if (!request.headers.get('X-Idempotency-Key')) {
            return HttpResponse.json(
                { code: 'IDEMPOTENCY_KEY_REQUIRED', message: '멱등키가 필요합니다' },
                { status: 400 },
            );
        }
        const today = toDate(new Date());
        if (state.checkedDates.includes(today)) {
            return HttpResponse.json(
                { code: 'ALREADY_CHECKED_IN', message: '오늘은 이미 출석했습니다' },
                { status: 409 },
            );
        }
        state.checkedDates = [...state.checkedDates, today];
        state.streak += 1;
        recordMockTicketGrant(1, '매일 출석체크 리워드');
        return HttpResponse.json(
            { checkedToday: true, streak: state.streak, ticketsGranted: 1 },
            { status: 201 },
        );
    }),
];
