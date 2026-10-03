import { http, HttpResponse } from 'msw';

import { env } from '@shared/config/env';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

export const drawHandlers = [
    http.post(api('/admin/events/:eventId/draw'), ({ params }) =>
        HttpResponse.json(
            {
                drawResultId: `draw-${Date.now()}`,
                eventId: params.eventId,
                winners: [
                    { userId: 'user-101', rank: 1, prizeName: '갤럭시 버즈' },
                    { userId: 'user-204', rank: 2, prizeName: '스타벅스 쿠폰' },
                ],
                drawnAt: new Date().toISOString(),
            },
            { status: 201 },
        ),
    ),
    http.post(api('/admin/draws/:drawResultId/redraw'), ({ params }) =>
        HttpResponse.json(
            {
                drawResultId: params.drawResultId,
                redrawnAt: new Date().toISOString(),
                replacedWinners: [{ userId: 'user-310', rank: 2, prizeName: '스타벅스 쿠폰' }],
            },
            { status: 201 },
        ),
    ),
];
