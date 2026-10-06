import { http, HttpResponse } from 'msw';

import type { AdminEventStatus, AdminPrize, MembershipRule } from '@entities/event';

import { env } from '@shared/config/env';

import { mockNow } from '../now';
import { mockEntryTicketTotals, mockEventHasEntries } from './entry';
import { mockEvents, sessionFixedTime } from './event';
import { recordMockTicketRefund } from './ticket';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

const okBody = (data: unknown) => ({
    success: true,
    code: 'SUCCESS',
    message: '성공했습니다.',
    data,
});
const failBody = (code: string, message: string) => ({ success: false, code, message, data: null });
const ok = (data: unknown, status = 200) => HttpResponse.json(okBody(data), { status });
const fail = (status: number, code: string, message: string) =>
    HttpResponse.json(failBody(code, message), { status });

/** ADR-009 — 유형과 무관하게 마감 + 5분 검토 후 자동으로 최초 발표한다 */
const ANNOUNCE_DELAY_MS = 5 * 60 * 1000;
const MINUTE = 60 * 1000;

/**
 * 관리자 목업의 이벤트 항목 — AdminEvent(spec AE01/AE02) + 내부 카운터.
 * entryCount·usedTicketTotal은 응답 DTO에 없고 취소 시 반환 수량 계산에만 쓴다.
 */
interface MockAdminEvent {
    id: string;
    title: string;
    description: string;
    imageUrl: string | null;
    imageKey: string | null;
    eventType: 'NO_TICKET' | 'TICKET';
    weightingEnabled: boolean;
    maxTicketsPerUser: number | null;
    membershipRule: MembershipRule;
    startsAt: string;
    endsAt: string;
    /** 저장 상태 — SCHEDULED/OPEN/CLOSED는 응답 시각에 시간으로 재계산된다 */
    status: AdminEventStatus;
    prizes: AdminPrize[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    suspendedFromStatus: 'SCHEDULED' | 'OPEN' | null;
    suspendedAt: string | null;
    canceledAt: string | null;
    entryCount: number;
    usedTicketTotal: number;
}

/**
 * 사용자 목업(mockEvents)을 관리자 모양으로 1회 변환해 시드한다.
 * 사용자 Event는 필드가 달라(requiredTickets·prizeName…) spec 계약과 별개라,
 * 관리자에서 만든 변경은 사용자 목록에 projection으로 다시 싣는다(아래 upsertUserProjection).
 */
function toAdminSeed(e: (typeof mockEvents)[number]): MockAdminEvent {
    const usesTicket = e.requiredTickets > 0;
    return {
        id: e.id,
        title: e.title,
        description: e.description,
        imageUrl: e.bannerImageUrl,
        imageKey: null,
        eventType: usesTicket ? 'TICKET' : 'NO_TICKET',
        weightingEnabled: usesTicket,
        maxTicketsPerUser: usesTicket ? 5 : null,
        membershipRule: e.tags?.includes('멤버십 혜택') ? 'vip' : 'excellent',
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        status: 'SCHEDULED',
        prizes: [
            {
                id: `${e.id}-prize-1`,
                rank: 1,
                name: e.prizeName,
                description: null,
                imageUrl: null,
                winnerCount: e.winnerCount,
            },
        ],
        createdBy: 'admin-01',
        createdAt: e.startsAt,
        updatedAt: e.startsAt,
        suspendedFromStatus: null,
        suspendedAt: null,
        canceledAt: null,
        entryCount: e.participantCount ?? 0,
        usedTicketTotal: e.usedTicketCount ?? 0,
    };
}

function adminSeed(
    over: Partial<MockAdminEvent> &
        Pick<MockAdminEvent, 'id' | 'title' | 'description' | 'status' | 'startsAt' | 'endsAt'>,
): MockAdminEvent {
    return {
        imageUrl: null,
        imageKey: null,
        eventType: 'TICKET',
        weightingEnabled: true,
        maxTicketsPerUser: 5,
        membershipRule: 'excellent',
        prizes: [],
        createdBy: 'admin-01',
        createdAt: over.startsAt,
        updatedAt: over.startsAt,
        suspendedFromStatus: null,
        suspendedAt: null,
        canceledAt: null,
        entryCount: 0,
        usedTicketTotal: 0,
        ...over,
    };
}

// 관리자 전용 시드 — 시간만으로는 나오지 않는 운영 상태(중단·취소·재추첨·대상 없음 종료)를 시연용으로 채운다
const extraSeeds: MockAdminEvent[] = [
    adminSeed({
        id: 'adm-901',
        title: '중단된 VIP 데이터 래플',
        description: '운영 정책 확인으로 일시 중단된 이벤트. 재개하면 응모를 다시 받는다.',
        membershipRule: 'vip',
        startsAt: sessionFixedTime('adm-901-starts', -24 * 60 * MINUTE),
        endsAt: sessionFixedTime('adm-901-ends', 48 * 60 * MINUTE),
        status: 'SUSPENDED',
        suspendedFromStatus: 'OPEN',
        suspendedAt: sessionFixedTime('adm-901-suspended', -60 * MINUTE),
        entryCount: 120,
        usedTicketTotal: 300,
        prizes: [
            {
                id: 'adm-901-p1',
                rank: 1,
                name: 'U+ 데이터 쿠폰 10GB',
                description: null,
                imageUrl: null,
                winnerCount: 5,
            },
        ],
    }),
    adminSeed({
        id: 'adm-902',
        title: '취소된 오픈 기념 이벤트',
        description: '경품 수급 문제로 취소된 이벤트.',
        startsAt: sessionFixedTime('adm-902-starts', -72 * 60 * MINUTE),
        endsAt: sessionFixedTime('adm-902-ends', -24 * 60 * MINUTE),
        status: 'CANCELED',
        canceledAt: sessionFixedTime('adm-902-canceled', -36 * 60 * MINUTE),
        entryCount: 45,
        prizes: [
            {
                id: 'adm-902-p1',
                rank: 1,
                name: '스타벅스 e카드',
                description: null,
                imageUrl: null,
                winnerCount: 30,
            },
        ],
    }),
    adminSeed({
        id: 'adm-903',
        title: '응모자 없이 종료된 이벤트',
        description: '마감까지 응모가 없어 자동 종료된 이벤트.',
        startsAt: sessionFixedTime('adm-903-starts', -50 * 60 * MINUTE),
        endsAt: sessionFixedTime('adm-903-ends', -26 * 60 * MINUTE),
        status: 'NO_ENTRANTS',
        prizes: [
            {
                id: 'adm-903-p1',
                rank: 1,
                name: '무너 스티커 팩',
                description: null,
                imageUrl: null,
                winnerCount: 10,
            },
        ],
    }),
    adminSeed({
        id: 'adm-904',
        title: '재추첨 진행 중인 래플',
        description: '당첨 취소에 따른 재추첨이 진행 중인 이벤트.',
        startsAt: sessionFixedTime('adm-904-starts', -80 * 60 * MINUTE),
        endsAt: sessionFixedTime('adm-904-ends', -30 * 60 * MINUTE),
        status: 'REDRAWING',
        entryCount: 800,
        usedTicketTotal: 1600,
        prizes: [
            {
                id: 'adm-904-p1',
                rank: 1,
                name: '닌텐도 스위치 2',
                description: null,
                imageUrl: null,
                winnerCount: 1,
            },
        ],
    }),
    adminSeed({
        id: 'adm-905',
        title: '발표 대기 중인 이벤트',
        description: '추첨이 확정되고 공개 명단 갱신을 기다리는 이벤트.',
        startsAt: sessionFixedTime('adm-905-starts', -70 * 60 * MINUTE),
        endsAt: sessionFixedTime('adm-905-ends', -20 * 60 * MINUTE),
        status: 'DRAW_CONFIRMED',
        entryCount: 540,
        usedTicketTotal: 1080,
        prizes: [
            {
                id: 'adm-905-p1',
                rank: 1,
                name: '에어팟 4',
                description: null,
                imageUrl: null,
                winnerCount: 3,
            },
        ],
    }),
];

const mockAdminEvents: MockAdminEvent[] = [...mockEvents.map(toAdminSeed), ...extraSeeds];

/**
 * 응답 시점의 운영 상태 — 서버가 시간·운영으로 바꾸는 값이라 저장값을 그대로 쓰지 않고 재계산한다.
 * 중단 중 마감이 지나면 도메인 규칙대로 자동 취소이므로 저장 상태에도 반영해 이후 재개를 막는다.
 */
function effectiveStatus(item: MockAdminEvent, now: number): AdminEventStatus {
    const starts = new Date(item.startsAt).getTime();
    const ends = new Date(item.endsAt).getTime();

    if (item.status === 'SUSPENDED') {
        if (now >= ends) {
            // 중단 중 마감 도달 — 자동 취소(응모권 반환 규칙 적용 대상). 저장 상태에 남겨 재개를 차단한다
            refundAndRelease(item);
            item.status = 'CANCELED';
            item.canceledAt = new Date(now).toISOString();
            item.updatedAt = new Date(now).toISOString();
            return 'CANCELED';
        }
        return 'SUSPENDED';
    }
    if (item.status === 'SCHEDULED' || item.status === 'OPEN' || item.status === 'CLOSED') {
        if (now < starts) return 'SCHEDULED';
        if (now < ends) return 'OPEN';
        if (now < ends + ANNOUNCE_DELAY_MS) return 'CLOSED';
        return 'PUBLISHED';
    }
    return item.status;
}

/** 응답 직렬화 — 내부 카운터를 빼고 계산된 상태·서버 시각·발표 예정을 싣는다 */
function toAdminResponse(item: MockAdminEvent, now: number) {
    const rest: Partial<MockAdminEvent> = { ...item };
    delete rest.entryCount;
    delete rest.usedTicketTotal;
    return {
        ...rest,
        status: effectiveStatus(item, now),
        publicationScheduledAt: new Date(
            new Date(item.endsAt).getTime() + ANNOUNCE_DELAY_MS,
        ).toISOString(),
        serverTime: new Date(now).toISOString(),
    };
}

/* ── 사용자 목록 브리지 ───────────────────────────────────────────────
 * 관리자 변경이 사용자 /events 목록에도 보여야 시연 흐름이 이어진다.
 * 사용자 Event 모양으로 변환해 mockEvents에 upsert/제거한다. */

function toUserProjection(item: MockAdminEvent) {
    return {
        id: item.id,
        title: item.title,
        description: item.description,
        bannerImageUrl: item.imageUrl,
        detailImageUrl: null,
        startsAt: item.startsAt,
        endsAt: item.endsAt,
        // status는 응답에서 시간으로 재계산된다 — 저장값은 의미 없는 placeholder
        status: 'upcoming' as const,
        requiredTickets: item.eventType === 'TICKET' ? 1 : 0,
        tags: item.membershipRule === 'excellent' ? [] : ['멤버십 혜택'],
        prizeName:
            item.prizes.length > 1
                ? `${item.prizes[0]?.name ?? ''} 외 ${item.prizes.length - 1}종`
                : (item.prizes[0]?.name ?? ''),
        winnerCount: item.prizes.reduce((sum, p) => sum + p.winnerCount, 0),
        participantCount: item.entryCount,
        usedTicketCount: item.usedTicketTotal,
        myEntryCount: 0,
        myTicketCount: 0,
    };
}

function upsertUserProjection(item: MockAdminEvent) {
    const existing = mockEvents.find((e) => e.id === item.id);
    const projection = toUserProjection(item);
    if (existing) Object.assign(existing, projection);
    else mockEvents.push(projection);
}

function removeUserProjection(eventId: string) {
    const index = mockEvents.findIndex((e) => e.id === eventId);
    if (index >= 0) mockEvents.splice(index, 1);
}

/**
 * 취소 정리 — 실제 차감분을 각 사용자 잔액에 되돌리고 반환 이력을 남긴 뒤 사용자 목록 projection을 제거한다.
 * refundedTicketCount는 시드된 사용 총량과 실제 환불 합계 중 큰 값으로 보낸다
 * (시드 응모자는 목업에 실제 지갑이 없어 잔액 반영 없이 합계만 표시한다).
 */
function refundAndRelease(item: MockAdminEvent): number {
    let refunded = 0;
    for (const [userId, count] of mockEntryTicketTotals(item.id)) {
        recordMockTicketRefund(userId, count, `${item.title} 이벤트 취소 응모권 반환`);
        refunded += count;
    }
    const total = Math.max(item.usedTicketTotal, refunded);
    item.usedTicketTotal = 0;
    removeUserProjection(item.id);
    return total;
}

// 중단은 목록에 남기고 응모만 막고(도메인 규칙: 이후 응모 거절), 취소는 사용자 모델이 표현 못 해 목록에서 제거한다
function setEntryBlocked(eventId: string, blocked: boolean) {
    const event = mockEvents.find((e) => e.id === eventId);
    if (event) event.entryBlocked = blocked;
}

/* ── 요청 본문 검증 — spec EventWriteRequest 제약을 목업도 그대로 적용한다 ── */

interface EventWriteBody {
    title?: unknown;
    description?: unknown;
    imageKey?: unknown;
    eventType?: unknown;
    weightingEnabled?: unknown;
    maxTicketsPerUser?: unknown;
    membershipRule?: unknown;
    startsAt?: unknown;
    endsAt?: unknown;
    prizes?: unknown;
}

interface PrizeWriteBody {
    id?: unknown;
    rank?: unknown;
    name?: unknown;
    winnerCount?: unknown;
    description?: unknown;
    imageKey?: unknown;
}

const isNonBlank = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isInt = (v: unknown, min = 1): v is number =>
    typeof v === 'number' && Number.isInteger(v) && v >= min;
const isInstant = (v: unknown): v is string =>
    typeof v === 'string' && !Number.isNaN(new Date(v).getTime());

function validatePrize(prize: PrizeWriteBody): string | null {
    if (!isInt(prize.rank)) return '경품 등수는 1 이상의 정수여야 합니다';
    if (!isNonBlank(prize.name) || prize.name.length > 200) return '경품명은 1~200자입니다';
    if (!isInt(prize.winnerCount)) return '당첨 인원은 1 이상의 정수여야 합니다';
    return null;
}

function validateWriteBody(body: EventWriteBody): string | null {
    if (!isNonBlank(body.title) || body.title.length > 200) return '이벤트 이름은 1~200자입니다';
    if (!isNonBlank(body.description)) return '이벤트 설명을 입력해야 합니다';
    if (
        body.imageKey != null &&
        (typeof body.imageKey !== 'string' || body.imageKey.length > 500)
    ) {
        return 'imageKey는 500자 이하의 문자열이어야 합니다';
    }
    if (body.eventType !== 'NO_TICKET' && body.eventType !== 'TICKET') {
        return 'eventType은 NO_TICKET 또는 TICKET이어야 합니다';
    }
    if (typeof body.weightingEnabled !== 'boolean')
        return 'weightingEnabled는 boolean이어야 합니다';
    if (body.eventType === 'NO_TICKET') {
        if (body.weightingEnabled !== false)
            return '응모권 미사용 이벤트는 가중치를 적용할 수 없습니다';
        if (body.maxTicketsPerUser !== null)
            return '응모권 미사용 이벤트의 maxTicketsPerUser는 null입니다';
    } else if (body.weightingEnabled === false) {
        if (body.maxTicketsPerUser !== 1) return '가중치 미적용 이벤트는 사용자당 1장입니다';
    } else if (
        body.maxTicketsPerUser !== null &&
        (!isInt(body.maxTicketsPerUser) || body.maxTicketsPerUser > 5)
    ) {
        return 'maxTicketsPerUser는 1~5의 정수 또는 null(월말 소진용)입니다';
    }
    if (!['excellent', 'vip', 'vvip'].includes(body.membershipRule as string)) {
        return 'membershipRule은 excellent/vip/vvip 중 하나입니다';
    }
    if (!isInstant(body.startsAt) || !isInstant(body.endsAt)) {
        return '시작·종료 시각은 오프셋이 있는 시각이어야 합니다';
    }
    if (new Date(body.endsAt).getTime() <= new Date(body.startsAt).getTime()) {
        return '종료 시각은 시작 시각보다 뒤여야 합니다';
    }
    if (!Array.isArray(body.prizes) || body.prizes.length === 0) {
        return '경품은 1개 이상 등록해야 합니다';
    }
    const ranks = new Set<number>();
    for (const prize of body.prizes as PrizeWriteBody[]) {
        const error = validatePrize(prize);
        if (error) return error;
        if (ranks.has(prize.rank as number)) return '같은 등수의 경품을 중복 등록할 수 없습니다';
        ranks.add(prize.rank as number);
    }
    return null;
}

function writeBodyToItem(body: EventWriteBody, id: string, nowIso: string): MockAdminEvent {
    const prizes = (body.prizes as PrizeWriteBody[]).map((p) => ({
        id: typeof p.id === 'string' && p.id ? p.id : crypto.randomUUID(),
        rank: p.rank as number,
        name: (p.name as string).trim(),
        description: typeof p.description === 'string' && p.description ? p.description : null,
        imageUrl: null,
        winnerCount: p.winnerCount as number,
    }));
    return {
        id,
        title: (body.title as string).trim(),
        description: (body.description as string).trim(),
        imageUrl: null,
        imageKey: (body.imageKey as string | null) ?? null,
        eventType: body.eventType as MockAdminEvent['eventType'],
        weightingEnabled: body.weightingEnabled as boolean,
        maxTicketsPerUser: body.maxTicketsPerUser as number | null,
        membershipRule: body.membershipRule as MembershipRule,
        startsAt: new Date(body.startsAt as string).toISOString(),
        endsAt: new Date(body.endsAt as string).toISOString(),
        status: 'SCHEDULED',
        prizes,
        createdBy: 'admin-01',
        createdAt: nowIso,
        updatedAt: nowIso,
        suspendedFromStatus: null,
        suspendedAt: null,
        canceledAt: null,
        entryCount: 0,
        usedTicketTotal: 0,
    };
}

const findItem = (eventId: unknown) => mockAdminEvents.find((e) => e.id === eventId);

const operationResult = (
    item: MockAdminEvent,
    previousStatus: AdminEventStatus,
    refunded: number,
    now: Date,
) => ({
    eventId: item.id,
    previousStatus,
    status: item.status,
    refundedTicketCount: refunded,
    processedAt: now.toISOString(),
});

const readReason = async (request: Request) => {
    const body = (await request.json().catch(() => null)) as { reason?: unknown } | null;
    return typeof body?.reason === 'string' ? body.reason.trim() : '';
};

export const adminEventHandlers = [
    // AE01 — 목록: keyword/status/eventType/from/to 필터 + Page<AdminEvent> 봉투 (페이지는 1부터)
    http.get(api('/admin/events'), ({ request }) => {
        const url = new URL(request.url);
        const now = mockNow().getTime();
        const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
        const size = Math.max(1, Number(url.searchParams.get('size')) || 20);
        const keyword = url.searchParams.get('keyword')?.trim().toLowerCase();
        const status = url.searchParams.get('status');
        const eventType = url.searchParams.get('eventType');
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');

        const filtered = mockAdminEvents
            .filter((item) => {
                if (status && effectiveStatus(item, now) !== status) return false;
                if (eventType && item.eventType !== eventType) return false;
                if (
                    keyword &&
                    !`${item.title} ${item.description}`.toLowerCase().includes(keyword)
                ) {
                    return false;
                }
                // 기간 필터 [from, to)는 응모 시작 시각 기준으로 해석한다
                if (from && new Date(item.startsAt) < new Date(from)) return false;
                if (to && new Date(item.startsAt) >= new Date(to)) return false;
                return true;
            })
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));

        return ok({
            items: filtered
                .slice((page - 1) * size, page * size)
                .map((item) => toAdminResponse(item, now)),
            page,
            size,
            totalElements: filtered.length,
        });
    }),

    // AE02 — 상세
    http.get(api('/admin/events/:eventId'), ({ params }) => {
        const item = findItem(params.eventId);
        if (!item) return fail(404, 'RESOURCE_NOT_FOUND', '이벤트를 찾을 수 없습니다');
        return ok(toAdminResponse(item, mockNow().getTime()));
    }),

    // AE03 — 등록: 이벤트와 경품이 함께 성공하거나 함께 실패한다
    http.post(api('/admin/events'), async ({ request }) => {
        const body = (await request.json().catch(() => null)) as EventWriteBody | null;
        if (!body) return fail(400, 'COMMON-002', '요청 본문이 올바르지 않습니다');
        const error = validateWriteBody(body);
        if (error) return fail(400, 'COMMON-002', error);

        const item = writeBodyToItem(body, crypto.randomUUID(), mockNow().toISOString());
        mockAdminEvents.unshift(item);
        upsertUserProjection(item);
        return ok(toAdminResponse(item, mockNow().getTime()), 201);
    }),

    // AE04 — 수정: 진행 예정 상태만, 시작 시각은 앞당길 수 없다
    http.put(api('/admin/events/:eventId'), async ({ params, request }) => {
        const item = findItem(params.eventId);
        if (!item) return fail(404, 'RESOURCE_NOT_FOUND', '이벤트를 찾을 수 없습니다');
        const now = mockNow().getTime();
        if (effectiveStatus(item, now) !== 'SCHEDULED') {
            return fail(409, 'STATE_CONFLICT', '진행 예정 상태의 이벤트만 수정할 수 있습니다');
        }
        const body = (await request.json().catch(() => null)) as EventWriteBody | null;
        if (!body) return fail(400, 'COMMON-002', '요청 본문이 올바르지 않습니다');
        const error = validateWriteBody(body);
        if (error) return fail(400, 'COMMON-002', error);
        if (new Date(body.startsAt as string).getTime() < new Date(item.startsAt).getTime()) {
            return fail(409, 'STATE_CONFLICT', '응모 시작 시각은 앞당길 수 없습니다');
        }

        const updated = writeBodyToItem(body, item.id, mockNow().toISOString());
        Object.assign(item, updated, {
            createdBy: item.createdBy,
            createdAt: item.createdAt,
            entryCount: item.entryCount,
            usedTicketTotal: item.usedTicketTotal,
        });
        upsertUserProjection(item);
        return ok(toAdminResponse(item, now));
    }),

    // AE05 — 삭제: 시작 전이며 응모 이력이 없을 때만 가능하다
    http.delete(api('/admin/events/:eventId'), ({ params }) => {
        const item = findItem(params.eventId);
        if (!item) return fail(404, 'RESOURCE_NOT_FOUND', '이벤트를 찾을 수 없습니다');
        if (effectiveStatus(item, mockNow().getTime()) !== 'SCHEDULED') {
            return fail(409, 'STATE_CONFLICT', '시작 전 이벤트만 삭제할 수 있습니다');
        }
        // 시드된 응모자 수(entryCount)와 실제 접수 이력을 모두 본다 — 시드만 있는 이벤트도 삭제를 막는다
        if (item.entryCount > 0 || mockEventHasEntries(item.id)) {
            return fail(409, 'STATE_CONFLICT', '응모 이력이 있는 이벤트는 삭제할 수 없습니다');
        }
        // 도메인 규칙: 연결된 배너도 함께 삭제 — 배너 목업이 단일 고정 항목이라 생략한다
        mockAdminEvents.splice(mockAdminEvents.indexOf(item), 1);
        removeUserProjection(item.id);
        return ok(null);
    }),

    // AE06 — 중단: SCHEDULED/OPEN → SUSPENDED, 마감 상태에 요청하면 즉시 취소+반환으로 전환한다
    http.post(api('/admin/events/:eventId/suspend'), async ({ params, request }) => {
        const item = findItem(params.eventId);
        if (!item) return fail(404, 'RESOURCE_NOT_FOUND', '이벤트를 찾을 수 없습니다');
        const reason = await readReason(request);
        if (!reason) return fail(400, 'COMMON-002', '사유를 입력해야 합니다');

        const now = mockNow();
        const previous = effectiveStatus(item, now.getTime());
        if (previous !== 'SCHEDULED' && previous !== 'OPEN' && previous !== 'CLOSED') {
            return fail(409, 'STATE_CONFLICT', '중단할 수 없는 상태입니다');
        }
        if (previous === 'CLOSED') {
            // 이미 마감된 이벤트의 중단 요청은 즉시 취소로 전환하고 같은 반환 규칙을 적용한다
            const refunded = refundAndRelease(item);
            item.status = 'CANCELED';
            item.canceledAt = now.toISOString();
            item.updatedAt = now.toISOString();
            return ok(operationResult(item, previous, refunded, now));
        }
        item.status = 'SUSPENDED';
        item.suspendedFromStatus = previous;
        item.suspendedAt = now.toISOString();
        item.updatedAt = now.toISOString();
        setEntryBlocked(item.id, true);
        return ok(operationResult(item, previous, 0, now));
    }),

    // AE07 — 재개: 마감 전 SUSPENDED만 허용, 현재 시각으로 SCHEDULED/OPEN 중 맞는 상태로 돌아간다
    http.post(api('/admin/events/:eventId/resume'), async ({ params, request }) => {
        const item = findItem(params.eventId);
        if (!item) return fail(404, 'RESOURCE_NOT_FOUND', '이벤트를 찾을 수 없습니다');
        const reason = await readReason(request);
        if (!reason) return fail(400, 'COMMON-002', '사유를 입력해야 합니다');

        const now = mockNow();
        const previous = effectiveStatus(item, now.getTime());
        if (item.status !== 'SUSPENDED' || now.getTime() >= new Date(item.endsAt).getTime()) {
            return fail(409, 'STATE_CONFLICT', '재개할 수 없는 상태입니다');
        }
        item.status = now.getTime() < new Date(item.startsAt).getTime() ? 'SCHEDULED' : 'OPEN';
        item.suspendedFromStatus = null;
        item.suspendedAt = null;
        item.updatedAt = now.toISOString();
        setEntryBlocked(item.id, false);
        return ok(operationResult(item, previous, 0, now));
    }),

    // AE08 — 취소: 상태와 관계없이 허용. 취소와 대상 차감분 반환이 함께 완료되어야 성공이다
    http.post(api('/admin/events/:eventId/cancel'), async ({ params, request }) => {
        const item = findItem(params.eventId);
        if (!item) return fail(404, 'RESOURCE_NOT_FOUND', '이벤트를 찾을 수 없습니다');
        const reason = await readReason(request);
        if (!reason) return fail(400, 'COMMON-002', '사유를 입력해야 합니다');

        const now = mockNow();
        const previous = effectiveStatus(item, now.getTime());
        // 이미 취소된 이벤트의 재취소는 멱등 성공 — 같은 차감분을 두 번 반환하지 않는다
        if (item.status === 'CANCELED') {
            return ok(operationResult(item, previous, 0, now));
        }
        const refunded = refundAndRelease(item);
        item.status = 'CANCELED';
        item.canceledAt = now.toISOString();
        item.updatedAt = now.toISOString();
        return ok(operationResult(item, previous, refunded, now));
    }),
];
