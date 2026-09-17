import { http, HttpResponse } from 'msw';

import { env } from '@shared/config/env';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

export const ticketHandlers = [
    http.get(api('/tickets/balance'), () =>
        HttpResponse.json({
            balance: 5,
            expiringThisMonth: 2,
        }),
    ),
    http.get(api('/tickets/history'), () =>
        HttpResponse.json([
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
        ]),
    ),
];
