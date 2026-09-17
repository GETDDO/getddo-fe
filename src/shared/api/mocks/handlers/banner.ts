import { http, HttpResponse } from 'msw';

import { env } from '@shared/config/env';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

export const bannerHandlers = [
    http.get(api('/banners'), () =>
        HttpResponse.json([
            {
                id: 'bnr-1',
                title: '9월 응모 이벤트 오픈',
                imageUrl: null,
                linkUrl: '/events/evt-001',
                displayOrder: 1,
                visible: true,
            },
        ]),
    ),
];
