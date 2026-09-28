import { http, HttpResponse } from 'msw';

import { env } from '@shared/config/env';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

// 목업 세션 동안 유지되는 응모권 상태 — 출석 등 다른 목업이 지급을 기록하면 잔액·이력에 함께 반영된다
let balance = 5;
const ticketHistory = [
    {
        id: 'th-1',
        type: 'earn',
        amount: 1,
        reason: '출석 체크',
        createdAt: '2026-09-17T01:00:00Z',
    },
    {
        id: 'th-2',
        type: 'use',
        amount: -1,
        reason: '이벤트 응모',
        createdAt: '2026-09-16T09:30:00Z',
    },
    {
        id: 'th-3',
        type: 'earn',
        amount: 1,
        reason: '매일 출석체크 리워드',
        createdAt: '2026-09-15T00:30:00Z',
    },
    {
        id: 'th-4',
        type: 'use',
        amount: -3,
        reason: '닌텐도 스위치 2 래플 응모',
        createdAt: '2026-09-14T11:20:00Z',
    },
    {
        id: 'th-5',
        type: 'earn',
        amount: 1,
        reason: '공룡 달리기 게임 보상',
        createdAt: '2026-09-14T08:10:00Z',
    },
    {
        id: 'th-6',
        type: 'earn',
        amount: 2,
        reason: '5G 브랜드 퀴즈 정답',
        createdAt: '2026-09-13T05:45:00Z',
    },
    {
        id: 'th-7',
        type: 'earn',
        amount: 1,
        reason: '매일 출석체크 리워드',
        createdAt: '2026-09-13T00:05:00Z',
    },
    {
        id: 'th-8',
        type: 'use',
        amount: -2,
        reason: '스타벅스 e카드 래플 응모',
        createdAt: '2026-09-12T13:00:00Z',
    },
    {
        id: 'th-9',
        type: 'earn',
        amount: 1,
        reason: '알림 수신 동의 설문',
        createdAt: '2026-09-11T02:40:00Z',
    },
    {
        id: 'th-10',
        type: 'earn',
        amount: 1,
        reason: '룰렛 돌리기 게임 보상',
        createdAt: '2026-09-10T09:15:00Z',
    },
    {
        id: 'th-11',
        type: 'earn',
        amount: 1,
        reason: '7일 연속 출석 보너스',
        createdAt: '2026-09-07T00:10:00Z',
    },
    {
        id: 'th-12',
        type: 'use',
        amount: -1,
        reason: 'VVIP 데이터 쿠폰 래플 응모',
        createdAt: '2026-09-05T10:30:00Z',
    },
    {
        id: 'th-13',
        type: 'earn',
        amount: 1,
        reason: '매일 출석체크 리워드',
        createdAt: '2026-09-02T00:20:00Z',
    },
    {
        id: 'th-14',
        type: 'earn',
        amount: 1,
        reason: '매일 출석체크 리워드',
        createdAt: '2026-08-31T00:15:00Z',
    },
];

/** 다른 목업 핸들러(출석 등)에서 응모권 지급을 기록할 때 쓴다 */
export function recordMockTicketGrant(amount: number, reason: string) {
    balance += amount;
    ticketHistory.unshift({
        id: `th-mock-${Date.now()}`,
        type: amount >= 0 ? 'earn' : 'use',
        amount,
        reason,
        createdAt: new Date().toISOString(),
    });
}

export const ticketHandlers = [
    http.get(api('/tickets/balance'), () =>
        HttpResponse.json({
            balance,
            expiringThisMonth: 2,
        }),
    ),
    http.get(api('/tickets/history'), () => HttpResponse.json(ticketHistory)),
];
