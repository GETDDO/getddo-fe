import { http, HttpResponse } from 'msw';

import { env } from '@shared/config/env';

import { findMockEvent, recordMockEventEntry } from './event';
import { getMockTicketBalance, recordMockTicketGrant } from './ticket';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

/** ADR-010 — 가중치 적용 이벤트는 사용자·이벤트별 누적 5장까지만 쓸 수 있다 */
const ENTRY_TICKET_LIMIT = 5;

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
    http.post(api('/events/:eventId/entries'), async ({ params, request }) => {
        const idempotencyKey = request.headers.get('X-Idempotency-Key');
        if (!idempotencyKey) {
            return HttpResponse.json(
                { code: 'IDEMPOTENCY_KEY_REQUIRED', message: '멱등키가 필요합니다' },
                { status: 400 },
            );
        }

        const eventId = String(params.eventId);
        const body = (await request.json().catch(() => null)) as { ticketsUsed?: number } | null;
        const ticketsUsed = Math.max(1, Math.trunc(body?.ticketsUsed ?? 1));

        const event = findMockEvent(eventId);
        if (!event) {
            return HttpResponse.json(
                { code: 'EVENT_NOT_FOUND', message: '이벤트를 찾을 수 없습니다' },
                { status: 404 },
            );
        }

        // 화면에서도 막고 있지만, 최종 접수 여부는 서버가 정한다는 원칙대로 여기서도 검사한다
        if (ticketsUsed > getMockTicketBalance()) {
            return HttpResponse.json(
                { code: 'INSUFFICIENT_TICKETS', message: '보유 응모권이 부족합니다' },
                { status: 400 },
            );
        }
        if ((event.myTicketCount ?? 0) + ticketsUsed > ENTRY_TICKET_LIMIT) {
            return HttpResponse.json(
                { code: 'ENTRY_LIMIT_EXCEEDED', message: '응모 한도를 초과했습니다' },
                { status: 400 },
            );
        }

        recordMockEventEntry(event, ticketsUsed);
        recordMockTicketGrant(-ticketsUsed, `${event.title} 응모`);

        return HttpResponse.json(
            {
                id: `entry-${Date.now()}`,
                eventId,
                ticketsUsed,
                status: 'applied',
                createdAt: new Date().toISOString(),
            },
            { status: 201 },
        );
    }),
];
