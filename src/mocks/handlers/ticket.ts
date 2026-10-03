import { http, HttpResponse } from 'msw';

import { env } from '@shared/config/env';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

interface TicketHistoryItem {
    id: string;
    type: string;
    amount: number;
    reason: string;
    createdAt: string;
}

// 시연용 초기 이력 — 사용자별 상태에 복사본으로 들어간다
const seedTicketHistory: TicketHistoryItem[] = [
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
        id: 'th-15',
        type: 'refund',
        amount: 2,
        reason: '이벤트 취소 응모권 반환',
        createdAt: '2026-09-16T05:00:00Z',
    },
    {
        id: 'th-16',
        type: 'revoke',
        amount: -1,
        reason: '부정 획득 응모권 회수',
        createdAt: '2026-09-15T07:00:00Z',
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
        // 9월 1일 00:00 KST — 8월분 지급 응모권의 월 경계 만료
        id: 'th-17',
        type: 'expire',
        amount: -2,
        reason: '응모권 월 만료',
        createdAt: '2026-08-31T15:00:00Z',
    },
    {
        id: 'th-14',
        type: 'earn',
        amount: 1,
        reason: '매일 출석체크 리워드',
        createdAt: '2026-08-31T00:15:00Z',
    },
];

// 목업 세션 동안 유지되는 응모권 상태 — X-User-ID별로 분리한다.
// 한 사용자의 출석 보상·응모 차감이 다른 사용자의 잔액·이력에 섞이지 않게 한다
interface TicketState {
    balance: number;
    history: TicketHistoryItem[];
}

const stateByUser = new Map<string, TicketState>();

const userIdOf = (request: Request) => request.headers.get('X-User-ID') ?? 'anonymous';

const stateFor = (userId: string): TicketState => {
    let state = stateByUser.get(userId);
    if (!state) {
        state = { balance: 10, history: [...seedTicketHistory] };
        stateByUser.set(userId, state);
    }
    return state;
};

/** 응모 목업이 차감 전에 잔액을 확인할 때 쓴다 */
export function getMockTicketBalance(userId: string) {
    return stateFor(userId).balance;
}

/** 다른 목업 핸들러(출석·게임 등)에서 응모권 지급을 기록할 때 쓴다 */
export function recordMockTicketGrant(userId: string, amount: number, reason: string) {
    const state = stateFor(userId);
    state.balance += amount;
    state.history.unshift({
        id: `th-mock-${crypto.randomUUID()}`,
        type: amount >= 0 ? 'earn' : 'use',
        amount,
        reason,
        createdAt: new Date().toISOString(),
    });
}

export const ticketHandlers = [
    http.get(api('/tickets/balance'), ({ request }) =>
        HttpResponse.json({
            balance: stateFor(userIdOf(request)).balance,
            expiringThisMonth: 2,
        }),
    ),
    http.get(api('/tickets/history'), ({ request }) =>
        HttpResponse.json(stateFor(userIdOf(request)).history),
    ),
];
