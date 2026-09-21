import { http, HttpResponse } from 'msw';

import { env } from '@shared/config/env';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

export const notificationHandlers = [
    http.get(api('/notifications'), () =>
        HttpResponse.json([
            {
                id: 'ntf-1',
                title: '무너 한정 굿즈 타임 래플 오픈 예정',
                body: '15:00에 무너 한정 굿즈 타임 래플이 오픈될 예정이에요.',
                read: false,
                createdAt: new Date(Date.now() - 60 * 1000).toISOString(),
            },
            {
                id: 'ntf-2',
                title: '당첨자 발표 안내',
                body: '5G 프리미어 가입 감사 이벤트 당첨자가 발표되었습니다.',
                read: false,
                createdAt: '2026-09-17T02:00:00Z',
            },
            {
                id: 'ntf-3',
                title: '응모권 지급 안내',
                body: '출석 체크로 응모권 1장이 지급되었습니다.',
                read: true,
                createdAt: '2026-09-16T00:10:00Z',
            },
        ]),
    ),
    http.post(api('/notifications/:notificationId/read'), ({ params }) =>
        HttpResponse.json({ id: params.notificationId, read: true }),
    ),
];
