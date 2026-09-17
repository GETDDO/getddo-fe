import { http, HttpResponse } from 'msw';

import { env } from '@shared/config/env';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

export const notificationHandlers = [
    http.get(api('/notifications'), () =>
        HttpResponse.json([
            {
                id: 'ntf-1',
                title: '당첨자 발표 안내',
                body: '5G 프리미어 가입 감사 이벤트 당첨자가 발표되었습니다.',
                read: false,
                createdAt: '2026-09-17T02:00:00Z',
            },
        ]),
    ),
    http.post(api('/notifications/:notificationId/read'), ({ params }) =>
        HttpResponse.json({ id: params.notificationId, read: true }),
    ),
];
