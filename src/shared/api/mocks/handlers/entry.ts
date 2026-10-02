import { http, HttpResponse } from 'msw';

import { env } from '@shared/config/env';

import { findMockEvent, recordMockEventEntry } from './event';
import { getMockTicketBalance, recordMockTicketGrant } from './ticket';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

/** ADR-010 — 가중치 적용 이벤트는 사용자·이벤트별 누적 5장까지만 쓸 수 있다 */
const ENTRY_TICKET_LIMIT = 5;

interface EntryResponse {
    id: string;
    eventId: string;
    ticketsUsed: number;
    status: string;
    createdAt: string;
}

/** 내 응모 내역 한 줄 — 목록에서 이벤트 제목을 보여줘야 해서 접수 응답에 제목을 더한 모양이다 */
interface MyEntryResponse extends EntryResponse {
    eventTitle: string;
}

interface AcceptedEntry {
    eventId: string;
    ticketsUsed: number;
    body: EntryResponse;
}

/**
 * 이미 접수한 멱등키 — 같은 키로 다시 들어오면 차감하지 않고 처음 결과를 그대로 돌려준다.
 * 키만 있는지 확인하고 끝내면 재시도할 때마다 응모권이 또 빠져나간다.
 */
const acceptedByKey = new Map<string, AcceptedEntry>();

// 내 응모 내역 — 접수한 응모가 앞에 쌓인다 (목업 세션 동안 유지)
const myEntries: MyEntryResponse[] = [
    {
        id: 'entry-1',
        eventId: 'evt-001',
        eventTitle: '5G 프리미어 가입 감사 이벤트',
        ticketsUsed: 1,
        status: 'applied',
        createdAt: '2026-09-15T08:00:00Z',
    },
];

export const entryHandlers = [
    http.get(api('/entries/me'), () => HttpResponse.json(myEntries)),
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
        const body = (await request.json().catch(() => null)) as { ticketsUsed?: unknown } | null;
        const ticketsUsed = body?.ticketsUsed;
        // 숫자가 아닌 값을 임의로 1장으로 바꾸면 NaN이 그대로 잔액에 더해진다 — 받은 값을 그대로 검증한다
        if (typeof ticketsUsed !== 'number' || !Number.isInteger(ticketsUsed) || ticketsUsed < 0) {
            return HttpResponse.json(
                { code: 'INVALID_TICKETS_USED', message: '사용할 응모권 수가 올바르지 않습니다' },
                { status: 400 },
            );
        }

        const accepted = acceptedByKey.get(idempotencyKey);
        if (accepted) {
            // 같은 키에 다른 내용이 오면 재시도가 아니라 다른 요청이다
            if (accepted.eventId !== eventId || accepted.ticketsUsed !== ticketsUsed) {
                return HttpResponse.json(
                    {
                        code: 'IDEMPOTENCY_KEY_CONFLICT',
                        message: '같은 멱등키로 다른 응모를 보낼 수 없습니다',
                    },
                    { status: 409 },
                );
            }
            return HttpResponse.json(accepted.body, { status: 200 });
        }

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
        if (ticketsUsed > 0) {
            recordMockTicketGrant(-ticketsUsed, `${event.title} 응모`);
        }

        const responseBody: EntryResponse = {
            id: `entry-${Date.now()}`,
            eventId,
            ticketsUsed,
            status: 'applied',
            createdAt: new Date().toISOString(),
        };
        acceptedByKey.set(idempotencyKey, { eventId, ticketsUsed, body: responseBody });
        // 내 응모 내역에도 남겨야 응모 직후 목록에서 확인할 수 있다
        myEntries.unshift({ ...responseBody, eventTitle: event.title });

        return HttpResponse.json(responseBody, { status: 201 });
    }),
];
