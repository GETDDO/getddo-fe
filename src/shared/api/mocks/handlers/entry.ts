import { http, HttpResponse } from 'msw';

import { env } from '@shared/config/env';
import { IDEMPOTENCY_HEADER } from '@shared/lib/idempotency-key';

import { findMockEvent, recordMockEventEntry } from './event';
import { getMockTicketBalance, recordMockTicketGrant } from './ticket';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

/** ADR-010 — 가중치 적용 이벤트는 사용자·이벤트별 누적 5장까지만 쓸 수 있다 */
const ENTRY_TICKET_LIMIT = 5;

// getddo-spec/05-api/entry.md 초안의 EntryReceipt 모양
interface EntryReceipt {
    id: string;
    eventId: string;
    eventTitle: string;
    requestedTicketCount: number;
    deductedTicketCount: number;
    status: 'ACCEPTED' | 'REJECTED';
    requestedAt: string;
    acceptedAt: string | null;
    rejectionCode: string | null;
    rejectionReason: string | null;
}

interface AcceptedEntry {
    eventId: string;
    ticketCount: number;
    body: EntryReceipt;
}

const ok = (data: unknown, status = 200) =>
    HttpResponse.json(
        { success: true, code: 'SUCCESS', message: '성공했습니다.', data },
        { status },
    );

const fail = (status: number, code: string, message: string) =>
    HttpResponse.json({ success: false, code, message, data: null }, { status });

/**
 * 이미 접수한 멱등키 — 같은 키로 다시 들어오면 차감하지 않고 처음 결과를 그대로 돌려준다.
 * 키만 있는지 확인하고 끝내면 재시도할 때마다 응모권이 또 빠져나간다.
 */
const acceptedByKey = new Map<string, AcceptedEntry>();

// 내 응모 내역 — 접수한 응모가 앞에 쌓인다 (목업 세션 동안 유지)
const myEntries: EntryReceipt[] = [
    {
        id: '3f4a1b2c-1001-4000-8000-000000000001',
        eventId: 'evt-001',
        eventTitle: '갤럭시 버즈 위클리 래플',
        requestedTicketCount: 1,
        deductedTicketCount: 1,
        status: 'ACCEPTED',
        requestedAt: '2026-09-15T08:00:00Z',
        acceptedAt: '2026-09-15T08:00:00Z',
        rejectionCode: null,
        rejectionReason: null,
    },
];

export const entryHandlers = [
    // E06 초안 — Page<EntryReceipt> 봉투. 목업은 필터 없이 전체를 1페이지로 돌려준다
    http.get(api('/users/me/entries'), () =>
        ok({
            items: myEntries,
            page: 1,
            size: myEntries.length || 20,
            totalElements: myEntries.length,
        }),
    ),
    http.post(api('/events/:eventId/entries'), async ({ params, request }) => {
        const idempotencyKey = request.headers.get(IDEMPOTENCY_HEADER);
        if (!idempotencyKey) {
            return fail(400, 'COMMON-002', '멱등키가 필요합니다');
        }

        const eventId = String(params.eventId);
        const body = (await request.json().catch(() => null)) as { ticketCount?: unknown } | null;
        const ticketCount = body?.ticketCount;
        // 숫자가 아닌 값을 임의로 1장으로 바꾸면 NaN이 그대로 잔액에 더해진다 — 받은 값을 그대로 검증한다
        if (typeof ticketCount !== 'number' || !Number.isInteger(ticketCount) || ticketCount < 0) {
            return fail(400, 'COMMON-002', '응모할 응모권 수가 올바르지 않습니다');
        }

        const accepted = acceptedByKey.get(idempotencyKey);
        if (accepted) {
            // 같은 키에 다른 내용이 오면 재시도가 아니라 다른 요청이다
            if (accepted.eventId !== eventId || accepted.ticketCount !== ticketCount) {
                return fail(
                    409,
                    'IDEMPOTENCY_CONFLICT',
                    '같은 멱등키로 다른 응모를 보낼 수 없습니다',
                );
            }
            // 접수 성공 건의 동일 요청 재전송 — 기존 영수증을 200으로 돌려준다 (E04)
            return ok(accepted.body);
        }

        const event = findMockEvent(eventId);
        if (!event) {
            return fail(404, 'EVENT_NOT_FOUND', '이벤트를 찾을 수 없습니다');
        }

        // 화면에서도 막고 있지만, 최종 접수 여부는 서버가 정한다는 원칙대로 여기서도 검사한다
        if (ticketCount > getMockTicketBalance()) {
            return fail(409, 'INSUFFICIENT_TICKETS', '보유 응모권이 부족합니다');
        }
        if ((event.myTicketCount ?? 0) + ticketCount > ENTRY_TICKET_LIMIT) {
            return fail(409, 'TICKET_LIMIT_EXCEEDED', '응모 한도를 초과했습니다');
        }

        recordMockEventEntry(event, ticketCount);
        if (ticketCount > 0) {
            recordMockTicketGrant(-ticketCount, `${event.title} 응모`);
        }

        const now = new Date().toISOString();
        const responseBody: EntryReceipt = {
            id: crypto.randomUUID(),
            eventId,
            eventTitle: event.title,
            requestedTicketCount: ticketCount,
            deductedTicketCount: ticketCount,
            status: 'ACCEPTED',
            requestedAt: now,
            acceptedAt: now,
            rejectionCode: null,
            rejectionReason: null,
        };
        acceptedByKey.set(idempotencyKey, { eventId, ticketCount, body: responseBody });
        // 내 응모 내역에도 남겨야 응모 직후 목록에서 확인할 수 있다
        myEntries.unshift(responseBody);

        return ok(responseBody, 201);
    }),
];
