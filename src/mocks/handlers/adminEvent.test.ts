import { describe, expect, it } from 'vitest';

import { apiClient } from '@shared/api/client';
import { IDEMPOTENCY_HEADER } from '@shared/lib/idempotencyKey';

// 목업은 모듈 수준 상태를 들고 있어 테스트끼리 영향을 준다 — 변경 테스트는 새로 만든 이벤트로 독립시킨다
const call = (method: 'get' | 'post' | 'put' | 'delete', path: string, body?: unknown) =>
    apiClient.request<Envelope<unknown>>({
        method,
        url: path,
        data: body,
        validateStatus: () => true,
    });

interface Envelope<T> {
    success: boolean;
    data: T;
}

interface AdminEventBody {
    id: string;
    title: string;
    status: string;
    eventType: string;
    startsAt: string;
    endsAt: string;
    prizes: { rank: number; name: string; winnerCount: number }[];
}

interface EventOperationResult {
    eventId: string;
    previousStatus: string;
    status: string;
    refundedTicketCount: number;
}

const validBody = (over: Record<string, unknown> = {}) => ({
    title: '관리자 테스트 이벤트',
    description: '테스트용 이벤트입니다',
    imageKey: null,
    eventType: 'NO_TICKET',
    weightingEnabled: false,
    maxTicketsPerUser: null,
    membershipRule: 'excellent',
    startsAt: '2099-06-01T00:00:00Z',
    endsAt: '2099-06-02T00:00:00Z',
    prizes: [{ rank: 1, name: '테스트 경품', winnerCount: 3, description: null, imageKey: null }],
    ...over,
});

async function createEvent(over: Record<string, unknown> = {}) {
    const res = await call('post', '/admin/events', validBody(over));
    expect(res.status).toBe(201);
    return (res.data as Envelope<AdminEventBody>).data;
}

// 사용자 목록이 Page 봉투+페이지로 오므로 관리 목업 수(33건)를 덮는 size로 요청한다
async function userEventIds() {
    const { data } = await apiClient.get<{ data: { items: { id: string }[] } }>('/events?size=100');
    return data.data.items.map((e) => e.id);
}

describe('관리자 이벤트 목업 핸들러', () => {
    it('목록이 Page 봉투 모양이고 필터와 페이지가 동작한다', async () => {
        const res = await call('get', '/admin/events', undefined);
        expect(res.status).toBe(200);

        const page = (res.data as Envelope<{ items: AdminEventBody[]; totalElements: number }>)
            .data;
        expect(page.items.length).toBeGreaterThan(0);
        expect(page.totalElements).toBeGreaterThanOrEqual(page.items.length);

        // 상태 필터 — 취소 상태 시드만 남아야 한다
        const canceled = await call('get', '/admin/events?status=CANCELED');
        const canceledItems = (canceled.data as Envelope<{ items: AdminEventBody[] }>).data.items;
        expect(canceledItems.length).toBeGreaterThan(0);
        expect(canceledItems.every((e) => e.status === 'CANCELED')).toBe(true);

        // 키워드 필터
        const searched = await call('get', `/admin/events?keyword=${encodeURIComponent('취소된')}`);
        const searchedItems = (searched.data as Envelope<{ items: AdminEventBody[] }>).data.items;
        expect(searchedItems.some((e) => e.id === 'adm-902')).toBe(true);

        // 페이지 슬라이스 — 2페이지는 1페이지와 다른 항목을 가진다
        const p1 = await call('get', '/admin/events?page=1&size=2');
        const p2 = await call('get', '/admin/events?page=2&size=2');
        const ids1 = (p1.data as Envelope<{ items: AdminEventBody[] }>).data.items.map((e) => e.id);
        const ids2 = (p2.data as Envelope<{ items: AdminEventBody[] }>).data.items.map((e) => e.id);
        expect(ids1.filter((id) => ids2.includes(id))).toHaveLength(0);
    });

    it('등록하면 관리자 목록과 사용자 목록 모두에 나타난다', async () => {
        const created = await createEvent();

        const detail = await call('get', `/admin/events/${created.id}`);
        expect((detail.data as Envelope<AdminEventBody>).data.title).toBe('관리자 테스트 이벤트');

        expect(await userEventIds()).toContain(created.id);
    });

    it('경품 없이 등록하거나 기간이 거꾸로면 400으로 거절한다', async () => {
        const noPrizes = await call('post', '/admin/events', validBody({ prizes: [] }));
        expect(noPrizes.status).toBe(400);

        const reversed = await call(
            'post',
            '/admin/events',
            validBody({ startsAt: '2099-06-02T00:00:00Z', endsAt: '2099-06-01T00:00:00Z' }),
        );
        expect(reversed.status).toBe(400);

        // 응모권 미사용 이벤트에 가중치는 올 수 없다
        const badCombo = await call('post', '/admin/events', validBody({ weightingEnabled: true }));
        expect(badCombo.status).toBe(400);
    });

    it('같은 등수의 경품을 중복 등록하면 400으로 거절한다', async () => {
        const res = await call(
            'post',
            '/admin/events',
            validBody({
                prizes: [
                    { rank: 1, name: 'A', winnerCount: 1 },
                    { rank: 1, name: 'B', winnerCount: 2 },
                ],
            }),
        );
        expect(res.status).toBe(400);
    });

    it('진행 예정 이벤트는 수정할 수 있지만 시작 시각을 앞당길 수 없다', async () => {
        const created = await createEvent();

        const edited = await call(
            'put',
            `/admin/events/${created.id}`,
            validBody({ title: '수정된 제목' }),
        );
        expect(edited.status).toBe(200);
        expect((edited.data as Envelope<AdminEventBody>).data.title).toBe('수정된 제목');

        const earlier = await call(
            'put',
            `/admin/events/${created.id}`,
            validBody({ startsAt: '2099-05-01T00:00:00Z' }),
        );
        expect(earlier.status).toBe(409);
    });

    it('진행 중인 이벤트는 수정할 수 없다', async () => {
        // evt-001은 진행 중(open) 시드다
        const res = await call('put', '/admin/events/evt-001', validBody());
        expect(res.status).toBe(409);
    });

    it('취소하면 CANCELED가 되고 사용자 목록에서 사라진다', async () => {
        const created = await createEvent();
        expect(await userEventIds()).toContain(created.id);

        const res = await call('post', `/admin/events/${created.id}/cancel`, {
            reason: '경품 수급 문제',
        });
        expect(res.status).toBe(200);
        const result = (res.data as Envelope<EventOperationResult>).data;
        expect(result.status).toBe('CANCELED');

        expect(await userEventIds()).not.toContain(created.id);
    });

    it('취소를 반복해도 차감된 응모권을 한 번만 반환한다', async () => {
        const userId = `cancel-${Date.now()}`;
        const created = await createEvent({
            eventType: 'TICKET',
            weightingEnabled: true,
            maxTicketsPerUser: 5,
        });

        // 사용자가 응모권 3장으로 응모한다 (잔액 10 → 7)
        const entered = await apiClient.post(
            `/events/${created.id}/entries`,
            { ticketCount: 3 },
            {
                headers: {
                    [IDEMPOTENCY_HEADER]: `cancel-${Date.now()}`,
                    'X-User-ID': userId,
                },
                validateStatus: () => true,
            },
        );
        expect(entered.status).toBe(201);

        const balanceOf = async () =>
            (
                await apiClient.get<{ data: { availableBalance: number } }>('/tickets/wallets/me', {
                    headers: { 'X-User-ID': userId },
                })
            ).data.data.availableBalance;

        const first = await call('post', `/admin/events/${created.id}/cancel`, {
            reason: '경품 수급 문제',
        });
        const firstResult = (first.data as Envelope<EventOperationResult>).data;
        expect(firstResult.refundedTicketCount).toBe(3);
        expect(await balanceOf()).toBe(10);

        // 재취소는 멱등하게 성공하지만 반환 수량은 0이고 잔액도 변하지 않는다
        const second = await call('post', `/admin/events/${created.id}/cancel`, {
            reason: '취소 재요청',
        });
        expect(second.status).toBe(200);
        expect((second.data as Envelope<EventOperationResult>).data.refundedTicketCount).toBe(0);
        expect(await balanceOf()).toBe(10);
    });

    it('사유 없이 상태 운영을 요청하면 400으로 거절한다', async () => {
        const created = await createEvent();
        const res = await call('post', `/admin/events/${created.id}/cancel`, { reason: '  ' });
        expect(res.status).toBe(400);
    });

    it('응모 이력이 없는 진행 예정 이벤트만 삭제된다', async () => {
        const deletable = await createEvent();
        const withEntry = await createEvent({ title: '응모 이력 있는 이벤트' });

        // withEntry에 응모를 넣는다 (NO_TICKET은 0장으로 접수)
        const entered = await apiClient.post(
            `/events/${withEntry.id}/entries`,
            { ticketCount: 0 },
            {
                headers: {
                    [IDEMPOTENCY_HEADER]: `del-${Date.now()}`,
                    'X-User-ID': `del-test-${Date.now()}`,
                },
                validateStatus: () => true,
            },
        );
        expect(entered.status).toBe(201);

        const blocked = await call('delete', `/admin/events/${withEntry.id}`);
        expect(blocked.status).toBe(409);

        const removed = await call('delete', `/admin/events/${deletable.id}`);
        expect(removed.status).toBe(200);
        expect(await userEventIds()).not.toContain(deletable.id);

        // 이미 시작한 이벤트는 삭제할 수 없다
        const started = await call('delete', '/admin/events/evt-001');
        expect(started.status).toBe(409);
    });
});
