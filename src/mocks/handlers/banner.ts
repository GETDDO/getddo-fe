import { http } from 'msw';

import { env } from '@shared/config/env';

import { ok } from './response';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

export const bannerHandlers = [
    // B01 초안 — 공개 배너 목록 (spec 초안은 배열을 data에 싣는다)
    http.get(api('/banners'), () =>
        ok([
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
