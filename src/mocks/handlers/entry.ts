import { http, HttpResponse } from 'msw';

import type { Entry, TicketsByGrade } from '@entities/entry';
import type { MembershipRule } from '@entities/event';
import type { TicketGrade } from '@entities/ticket';

import { ticketGradeSchema } from '@entities/ticket';
import { env } from '@shared/config/env';
import { IDEMPOTENCY_HEADER } from '@shared/lib/idempotencyKey';

import { mockNow } from '../now';
import {
    entryRuleOf,
    findMockEvent,
    getMockEventStatistics,
    mockEventEffectiveStatus,
    recordMockEventEntry,
} from './event';
import { fail, failBody, ok, okBody } from './response';
import { getMockAvailableTicketCountByGrade, recordMockTicketUse } from './ticket';
import { findMockVirtualUser } from './virtualUsers';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

// getddo-spec/05-api/entry.md 초안의 EntryReceipt — 계약 기준은 entities/entry의 entrySchema다
type EntryReceipt = Entry;

// 멤버십 규칙 비교 — 우수 < VIP < VVIP (getddo-spec 02-domain/event.md)
const MEMBERSHIP_RANK: Record<MembershipRule, number> = { excellent: 0, vip: 1, vvip: 2 };

const ZERO_TICKETS: TicketsByGrade = { BRONZE: 0, SILVER: 0, GOLD: 0 };

/**
 * E04 요청 본문의 tickets 맵을 세 등급이 채워진 모양으로 정규화한다 — 생략된 등급은 0이다.
 * 등급 외 키·정수가 아닌 값·음수가 있으면 형식 오류(null)다 (spec EntryRequest)
 */
function parseTickets(raw: unknown): TicketsByGrade | null {
    if (raw === undefined) return { ...ZERO_TICKETS };
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
    const tickets: TicketsByGrade = { ...ZERO_TICKETS };
    for (const [key, value] of Object.entries(raw)) {
        if (!(ticketGradeSchema.options as readonly string[]).includes(key)) return null;
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) return null;
        tickets[key as TicketGrade] = value;
    }
    return tickets;
}

const totalOf = (tickets: TicketsByGrade) => tickets.BRONZE + tickets.SILVER + tickets.GOLD;

const sameTickets = (a: TicketsByGrade, b: TicketsByGrade) =>
    ticketGradeSchema.options.every((grade) => a[grade] === b[grade]);

/**
 * 멱등키에 묶인 처음 처리 결과 — 성공뿐 아니라 업무 거절(4xx)도 저장한다.
 * 같은 키·같은 본문으로 다시 오면 재처리하지 않고 저장한 응답을 그대로 돌려준다 (E04 계약)
 */
interface StoredAttempt {
    userId: string;
    eventId: string;
    tickets: TicketsByGrade;
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
    requestedTicketsByGrade: { BRONZE: 1, SILVER: 0, GOLD: 0 },
    deductedTicketCount: 1,
    deductedTicketsByGrade: { BRONZE: 1, SILVER: 0, GOLD: 0 },
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

/** 이 이벤트에 접수된 내 응모 — E04의 1회 제한·누적 상한 판정과 E07의 usedTicketCount가 같은 근거를 쓴다 */
const myAcceptedFor = (userId: string, eventId: string) =>
    myEntriesFor(userId).filter(
        (entry) => entry.eventId === eventId && entry.status === 'ACCEPTED',
    );

const usedTicketCountOf = (userId: string, eventId: string) =>
    myAcceptedFor(userId, eventId).reduce((sum, entry) => sum + entry.deductedTicketCount, 0);

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
    // E03 — 이벤트별 응모 현황. 당첨 확률은 반환하지 않는다
    http.get(api('/events/:eventId/statistics'), ({ params, request }) => {
        const event = findMockEvent(String(params.eventId));
        if (!event) {
            return fail(404, 'ENTRY-004', '이벤트를 찾을 수 없습니다');
        }
        // 본인 차감 수는 공유 이벤트 카운터가 아니라 요청 사용자의 접수 기록에서 센다
        const mySpentTicketCount = usedTicketCountOf(userIdOf(request), event.id);
        return ok({ ...getMockEventStatistics(event), mySpentTicketCount });
    }),
    // E07 — 응모 자격 조회. 서버가 판정한 불가 사유를 모두 돌려준다 (화면은 사전 차단보다 결과 안내에 쓴다)
    http.get(api('/events/:eventId/eligibility'), ({ params, request }) => {
        const event = findMockEvent(String(params.eventId));
        if (!event) {
            return fail(404, 'ENTRY-004', '이벤트를 찾을 수 없습니다');
        }
        const userId = userIdOf(request);
        const user = findMockVirtualUser(userId);
        const rule = entryRuleOf(event);
        const reasons: string[] = [];

        if (user?.role === 'ADMIN') reasons.push('ADMIN_ENTRY_FORBIDDEN');
        if (
            MEMBERSHIP_RANK[user?.membership ?? 'excellent'] < MEMBERSHIP_RANK[rule.membershipRule]
        ) {
            reasons.push('ENTRY_MEMBERSHIP_NOT_MET');
        }
        if (mockEventEffectiveStatus(event) !== 'open') reasons.push('EVENT_NOT_OPEN');

        const usedTicketCount = usedTicketCountOf(userId, event.id);
        const onceOnly = rule.eventType === 'NO_TICKET' || !rule.weightingEnabled;
        if (onceOnly && myAcceptedFor(userId, event.id).length > 0) {
            reasons.push('ALREADY_ENTERED');
        }

        const availableByGrade = getMockAvailableTicketCountByGrade(userId);
        if (rule.eventType === 'TICKET') {
            if (rule.weightingEnabled) {
                if (rule.maxTicketsPerUser !== null && usedTicketCount >= rule.maxTicketsPerUser) {
                    reasons.push('TICKET_LIMIT_EXCEEDED');
                }
                if (totalOf(availableByGrade) < 1) reasons.push('INSUFFICIENT_TICKETS');
            } else if (availableByGrade.BRONZE < 1) {
                reasons.push('BRONZE_REQUIRED');
            }
        }

        // 미사용 이벤트는 수량 관련 값이 0이다 — 1회 제한은 reasons·canEnter로 확인한다 (spec E07)
        const isFree = rule.eventType === 'NO_TICKET';
        const remainingTicketLimit = isFree
            ? 0
            : rule.maxTicketsPerUser === null
              ? null
              : Math.max(0, rule.maxTicketsPerUser - usedTicketCount);
        const availableTicketBalance = isFree
            ? 0
            : rule.weightingEnabled
              ? totalOf(availableByGrade)
              : availableByGrade.BRONZE;

        return ok({
            eventId: event.id,
            canEnter: reasons.length === 0,
            reasons,
            usedTicketCount,
            remainingTicketLimit,
            availableTicketBalance,
            serverTime: mockNow().toISOString(),
        });
    }),
    // E04 — 응모 접수. 등급별 장수 맵(tickets)을 이벤트 유형별 규칙으로 검증해 차감한다 (GD-150)
    http.post(api('/events/:eventId/entries'), async ({ params, request }) => {
        const idempotencyKey = request.headers.get(IDEMPOTENCY_HEADER);
        if (!idempotencyKey) {
            return fail(400, 'COMMON-002', '멱등키가 필요합니다');
        }
        const userId = userIdOf(request);
        const eventId = String(params.eventId);

        const body = (await request.json().catch(() => null)) as { tickets?: unknown } | null;
        const tickets = parseTickets(body?.tickets);
        if (!tickets) {
            return fail(400, 'ENTRY-001', '응모권 장수 맵이 올바르지 않습니다');
        }

        const attempt = attempts.get(idempotencyKey);
        if (attempt) {
            // 같은 키에 다른 내용이 오면 재시도가 아니라 다른 요청이다
            if (
                attempt.userId !== userId ||
                attempt.eventId !== eventId ||
                !sameTickets(attempt.tickets, tickets)
            ) {
                return fail(409, 'ENTRY-009', '같은 멱등키로 다른 응모를 보낼 수 없습니다');
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
                tickets,
                status,
                body: responseBody,
            });
            return HttpResponse.json(responseBody as object, { status });
        };

        const event = findMockEvent(eventId);
        if (!event) {
            return remember(404, failBody('ENTRY-004', '이벤트를 찾을 수 없습니다'));
        }
        const rule = entryRuleOf(event);

        // 시연용 사용자 문맥 — 헤더 멤버십이 오면 등록된 멤버십과 같아야 한다 (05-api/common.md)
        const user = findMockVirtualUser(userId);
        const requestedMembership = request.headers.get('X-User-Membership');
        if (user && requestedMembership && requestedMembership !== user.membership) {
            return fail(409, 'USER_MEMBERSHIP_MISMATCH', '사용자 멤버십 정보가 일치하지 않습니다');
        }
        if (user?.role === 'ADMIN') {
            return remember(403, failBody('ENTRY-002', '관리자는 이벤트에 응모할 수 없습니다'));
        }
        if (
            MEMBERSHIP_RANK[user?.membership ?? 'excellent'] < MEMBERSHIP_RANK[rule.membershipRule]
        ) {
            return remember(403, failBody('ENTRY-003', '응모 가능한 멤버십 등급이 아닙니다'));
        }
        if (mockEventEffectiveStatus(event) !== 'open') {
            return remember(409, failBody('ENTRY-005', '지금은 응모할 수 있는 시간이 아닙니다'));
        }

        const total = totalOf(tickets);
        // 사용자당 1회 제한 — 미사용·가중치 미적용 이벤트
        const onceOnly = rule.eventType === 'NO_TICKET' || !rule.weightingEnabled;
        if (onceOnly && myAcceptedFor(userId, eventId).length > 0) {
            return remember(409, failBody('ENTRY-006', '이미 응모한 이벤트입니다'));
        }

        if (rule.eventType === 'NO_TICKET') {
            if (total !== 0) {
                return remember(
                    400,
                    failBody('ENTRY-001', '응모권 미사용 이벤트는 응모권을 쓸 수 없습니다'),
                );
            }
        } else if (!rule.weightingEnabled) {
            // 브론즈 1장 고정 — 다른 등급·장수나 브론즈 부족은 모두 BRONZE_REQUIRED로 구분 안내한다
            const bronzeOnly = tickets.BRONZE === 1 && tickets.SILVER === 0 && tickets.GOLD === 0;
            if (!bronzeOnly || getMockAvailableTicketCountByGrade(userId).BRONZE < 1) {
                return remember(
                    409,
                    failBody('ENTRY-008', '이 이벤트는 브론즈 응모권 1장으로만 응모할 수 있습니다'),
                );
            }
        } else {
            if (total < 1) {
                return remember(400, failBody('ENTRY-001', '응모권을 1장 이상 골라야 합니다'));
            }
            // 누적 상한은 시드 카운터가 아닌 접수 기록으로 센다 — 월말 소진용(null)은 상한이 없다
            if (
                rule.maxTicketsPerUser !== null &&
                usedTicketCountOf(userId, eventId) + total > rule.maxTicketsPerUser
            ) {
                return remember(409, failBody('ENTRY-007', '이 이벤트의 응모 한도를 초과했습니다'));
            }
            const available = getMockAvailableTicketCountByGrade(userId);
            const lacksGrade = ticketGradeSchema.options.some(
                (grade) => tickets[grade] > available[grade],
            );
            if (lacksGrade) {
                return remember(409, failBody('TICKET-006', '등급별 보유 응모권이 부족합니다'));
            }
        }

        // 영수증 ID는 멱등키다 — 같은 키의 재전송이 같은 접수 건을 가리키게 한다 (ADR-0005)
        const entryId = idempotencyKey;
        recordMockEventEntry(event, total);
        if (total > 0) {
            // 한 응모에 여러 등급을 쓰면 장마다 USE 이력이 생기고 같은 eventEntryId를 가진다 (spec T02)
            recordMockTicketUse(userId, tickets, `${event.title} 응모`, {
                eventId,
                eventEntryId: entryId,
            });
        }

        const now = mockNow().toISOString();
        const responseBody: EntryReceipt = {
            id: entryId,
            eventId,
            eventTitle: event.title,
            requestedTicketCount: total,
            requestedTicketsByGrade: { ...tickets },
            deductedTicketCount: total,
            deductedTicketsByGrade: { ...tickets },
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
