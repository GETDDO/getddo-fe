import { http, HttpResponse } from 'msw';

import type { Entry } from '@entities/entry';

import { env } from '@shared/config/env';
import { IDEMPOTENCY_HEADER } from '@shared/lib/idempotencyKey';

import { mockNow } from '../now';
import { findMockEvent, recordMockEventEntry } from './event';
import { getMockTicketBalance, recordMockTicketGrant } from './ticket';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

/** ADR-010 — 가중치 적용 이벤트는 사용자·이벤트별 누적 5장까지만 쓸 수 있다 */
const ENTRY_TICKET_LIMIT = 5;

// getddo-spec/05-api/entry.md 초안의 EntryReceipt — 계약 기준은 entities/entry의 entrySchema다
type EntryReceipt = Entry;

const okBody = (data: unknown) => ({
    success: true,
    code: 'SUCCESS',
    message: '성공했습니다.',
    data,
});

const failBody = (code: string, message: string) => ({
    success: false,
    code,
    message,
    data: null,
});

const ok = (data: unknown, status = 200) => HttpResponse.json(okBody(data), { status });

const fail = (status: number, code: string, message: string) =>
    HttpResponse.json(failBody(code, message), { status });

/**
 * 멱등키에 묶인 처음 처리 결과 — 성공뿐 아니라 업무 거절(4xx)도 저장한다.
 * 같은 키·같은 본문으로 다시 오면 재처리하지 않고 저장한 응답을 그대로 돌려준다 (E04 계약)
 */
interface StoredAttempt {
    userId: string;
    eventId: string;
    ticketCount: number;
    status: number;
    body: unknown;
}
const attempts = new Map<string, StoredAttempt>();

// 내 응모 내역 — X-User-ID별로 분리한다 (한 사용자의 응모가 다른 사용자에게 보이지 않도록)
const entriesByUser = new Map<string, EntryReceipt[]>();

const seedEntry = (): EntryReceipt => ({
    id: crypto.randomUUID(),
    eventId: 'evt-001',
    eventTitle: '갤럭시 버즈 위클리 래플',
    requestedTicketCount: 1,
    deductedTicketCount: 1,
    status: 'ACCEPTED',
    requestedAt: '2026-09-15T08:00:00Z',
    acceptedAt: '2026-09-15T08:00:00Z',
    rejectionCode: null,
    rejectionReason: null,
});

const userIdOf = (request: Request) => request.headers.get('X-User-ID') ?? 'anonymous';

/** 관리자 목업이 삭제 가능 여부(응모 이력 없음, 도메인 규칙)를 판정할 때 쓴다 */
export function mockEventHasEntries(eventId: string): boolean {
    for (const list of entriesByUser.values()) {
        if (list.some((entry) => entry.eventId === eventId && entry.status === 'ACCEPTED')) {
            return true;
        }
    }
    return false;
}

/** 관리자 목업이 취소 시 사용자별 실제 차감 합계를 환불할 때 쓴다 — 시드 카운터가 아닌 접수 기록이 근거다 */
export function mockEntryTicketTotals(eventId: string): Map<string, number> {
    const totals = new Map<string, number>();
    for (const [userId, list] of entriesByUser) {
        const sum = list
            .filter((entry) => entry.eventId === eventId && entry.status === 'ACCEPTED')
            .reduce((acc, entry) => acc + entry.deductedTicketCount, 0);
        if (sum > 0) totals.set(userId, sum);
    }
    return totals;
}

const myEntriesFor = (userId: string) => {
    let list = entriesByUser.get(userId);
    if (!list) {
        // 시연 첫 진입에도 목록이 비어 보이지 않게 사용자별 시드 하나를 둔다
        list = [seedEntry()];
        entriesByUser.set(userId, list);
    }
    return list;
};

export const entryHandlers = [
    // E06 초안 — Page<EntryReceipt> 봉투, page·size 파라미터를 적용한다 (페이지는 1부터)
    http.get(api('/users/me/entries'), ({ request }) => {
        const all = myEntriesFor(userIdOf(request));
        const url = new URL(request.url);
        const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
        const size = Math.max(1, Number(url.searchParams.get('size')) || 20);
        return ok({
            items: all.slice((page - 1) * size, page * size),
            page,
            size,
            totalElements: all.length,
        });
    }),
    http.post(api('/events/:eventId/entries'), async ({ params, request }) => {
        const idempotencyKey = request.headers.get(IDEMPOTENCY_HEADER);
        if (!idempotencyKey) {
            return fail(400, 'COMMON-002', '멱등키가 필요합니다');
        }
        const userId = userIdOf(request);

        const eventId = String(params.eventId);
        const body = (await request.json().catch(() => null)) as { ticketCount?: unknown } | null;
        const ticketCount = body?.ticketCount;
        // 숫자가 아닌 값을 임의로 1장으로 바꾸면 NaN이 그대로 잔액에 더해진다 — 받은 값을 그대로 검증한다
        if (typeof ticketCount !== 'number' || !Number.isInteger(ticketCount) || ticketCount < 0) {
            return fail(400, 'COMMON-002', '응모할 응모권 수가 올바르지 않습니다');
        }

        const attempt = attempts.get(idempotencyKey);
        if (attempt) {
            // 같은 키에 다른 내용이 오면 재시도가 아니라 다른 요청이다
            if (
                attempt.userId !== userId ||
                attempt.eventId !== eventId ||
                attempt.ticketCount !== ticketCount
            ) {
                return fail(
                    409,
                    'IDEMPOTENCY_CONFLICT',
                    '같은 멱등키로 다른 응모를 보낼 수 없습니다',
                );
            }
            // 같은 요청의 재전송 — 접수든 거절이든 처음 결과를 그대로 돌려준다 (E04).
            // 이미 접수된 건의 재전송이므로 201은 200으로 내려준다
            const status = attempt.status === 201 ? 200 : attempt.status;
            return HttpResponse.json(attempt.body as object, { status });
        }

        // 여기서부터는 키에 처음 묶이는 새 요청 — 업무 거절도 결과를 키에 저장한다
        const remember = (status: number, responseBody: unknown) => {
            attempts.set(idempotencyKey, {
                userId,
                eventId,
                ticketCount,
                status,
                body: responseBody,
            });
            return HttpResponse.json(responseBody as object, { status });
        };

        const event = findMockEvent(eventId);
        if (!event) {
            return remember(404, failBody('EVENT_NOT_FOUND', '이벤트를 찾을 수 없습니다'));
        }
        // 관리자 중단이 먼저 확정된 이벤트는 이후 응모를 거절한다 (getddo-spec 02-domain/event.md)
        if (event.entryBlocked) {
            return remember(409, failBody('EVENT_NOT_OPEN', '중단된 이벤트입니다'));
        }

        // 이벤트 유형별 수량 규칙 — 응모권 사용 이벤트는 1장 이상, 미사용 이벤트는 0장만 받는다
        const usesTickets = event.requiredTickets > 0;
        if (usesTickets && ticketCount < 1) {
            return remember(
                400,
                failBody('COMMON-002', '응모권 사용 이벤트는 1장 이상 응모해야 합니다'),
            );
        }
        if (!usesTickets && ticketCount !== 0) {
            return remember(
                400,
                failBody('COMMON-002', '응모권 미사용 이벤트는 응모권을 쓸 수 없습니다'),
            );
        }
        // 응모권 미사용 이벤트는 사용자당 한 번만 접수된다
        if (
            !usesTickets &&
            myEntriesFor(userId).some(
                (entry) => entry.eventId === eventId && entry.status === 'ACCEPTED',
            )
        ) {
            return remember(409, failBody('DUPLICATE_ENTRY', '이미 응모한 이벤트입니다'));
        }

        // 화면에서도 막고 있지만, 최종 접수 여부는 서버가 정한다는 원칙대로 여기서도 검사한다
        if (ticketCount > getMockTicketBalance(userId)) {
            return remember(409, failBody('INSUFFICIENT_TICKETS', '보유 응모권이 부족합니다'));
        }
        if ((event.myTicketCount ?? 0) + ticketCount > ENTRY_TICKET_LIMIT) {
            return remember(409, failBody('TICKET_LIMIT_EXCEEDED', '응모 한도를 초과했습니다'));
        }

        recordMockEventEntry(event, ticketCount);
        if (ticketCount > 0) {
            recordMockTicketGrant(userId, -ticketCount, `${event.title} 응모`);
        }

        const now = mockNow().toISOString();
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
        // 내 응모 내역에도 남겨야 응모 직후 목록에서 확인할 수 있다
        myEntriesFor(userId).unshift(responseBody);

        return remember(201, okBody(responseBody));
    }),
];
