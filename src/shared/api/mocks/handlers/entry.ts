import { http, HttpResponse } from 'msw';

import { env } from '@shared/config/env';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

export const entryHandlers = [
    http.get(api('/entries/me'), () =>
        HttpResponse.json([
            {
                id: 'entry-1',
                eventId: 'evt-001',
                eventTitle: '5G 프리미어 가입 감사 이벤트',
                ticketsUsed: 1,
                status: 'applied',
                createdAt: '2026-09-15T08:00:00Z',
            },
        ]),
    ),
    // 반복 클릭 응모 누적 — 멱등키로 중복 요청을 식별한다 (전달 헤더명은 계약 확정 전 임시로 X-Idempotency-Key 사용)
    http.post(api('/events/:eventId/entries'), ({ params, request }) => {
        const idempotencyKey = request.headers.get('X-Idempotency-Key');
        if (!idempotencyKey) {
            return HttpResponse.json(
                { code: 'IDEMPOTENCY_KEY_REQUIRED', message: '멱등키가 필요합니다' },
                { status: 400 },
            );
        }
        return HttpResponse.json(
            {
                id: `entry-${Date.now()}`,
                eventId: params.eventId,
                ticketsUsed: 1,
                status: 'applied',
                createdAt: new Date().toISOString(),
            },
            { status: 201 },
        );
    }),
];
