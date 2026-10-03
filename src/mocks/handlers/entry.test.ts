import { describe, expect, it } from 'vitest';

import { apiClient } from '@shared/api/client';
import { IDEMPOTENCY_HEADER } from '@shared/lib/idempotencyKey';

// 목업은 모듈 수준 상태를 들고 있어 테스트끼리 영향을 준다.
// 이벤트별 누적 한도(ADR-010)가 걸리므로 한도를 쓰는 테스트는 서로 다른 이벤트를 쓴다.
/** 응모권 1장을 쓰는 진행 중 타임래플 */
const EVENT_ID = 'evt-004';
/** 위와 별개로 한도를 쓰는 테스트용 진행 중 타임래플 */
const OTHER_EVENT_ID = 'evt-003';
/** 응모권을 쓰지 않는 진행 중 이벤트 */
const FREE_EVENT_ID = 'evt-012';
const FREE_EVENT_ID_2 = 'evt-013';

async function balance() {
    const { data } = await apiClient.get<{ balance: number }>('/tickets/balance');
    return data.balance;
}

function enter(key: string, ticketCount: unknown, eventId = EVENT_ID, userId?: string) {
    return apiClient.post(
        `/events/${eventId}/entries`,
        { ticketCount },
        {
            headers: {
                [IDEMPOTENCY_HEADER]: key,
                ...(userId ? { 'X-User-ID': userId } : {}),
            },
            validateStatus: () => true,
        },
    );
}

interface EntryReceipt {
    id: string;
    eventId: string;
    eventTitle: string;
    requestedTicketCount: number;
    deductedTicketCount: number;
    status: string;
}

interface Envelope<T> {
    success: boolean;
    data: T;
}

async function myEntries(userId?: string) {
    const { data } = await apiClient.get<Envelope<{ items: EntryReceipt[] }>>('/users/me/entries', {
        headers: userId ? { 'X-User-ID': userId } : {},
    });
    return data.data.items;
}

describe('응모 목업 핸들러', () => {
    it('같은 멱등키로 다시내면 응모권을 또 차감하지 않는다', async () => {
        const key = `test-retry-${Date.now()}`;
        const before = await balance();

        const first = await enter(key, 1);
        expect(first.status).toBe(201);
        expect(await balance()).toBe(before - 1);

        // 응답이 유실돼 사용자가 같은 응모를 재시도한 상황
        const retry = await enter(key, 1);
        expect(retry.status).toBe(200);
        expect(retry.data).toEqual(first.data);
        expect(await balance()).toBe(before - 1);
    });

    it('같은 멱등키로 다른 수량을내면 거절한다', async () => {
        const key = `test-conflict-${Date.now()}`;
        await enter(key, 1);

        const conflict = await enter(key, 2);
        expect(conflict.status).toBe(409);
    });

    it('응모권 수가 숫자가 아니면 400으로 거절하고 잔액을 건드리지 않는다', async () => {
        const before = await balance();

        const response = await enter(`test-invalid-${Date.now()}`, 'abc');

        expect(response.status).toBe(400);
        expect(await balance()).toBe(before);
    });

    it('멱등키가 없으면 400으로 거절한다', async () => {
        const response = await apiClient.post(
            `/events/${EVENT_ID}/entries`,
            { ticketCount: 1 },
            { validateStatus: () => true },
        );

        expect(response.status).toBe(400);
    });

    it('접수한 응모가 내 응모 내역에 쌓인다', async () => {
        const before = await myEntries();

        const response = await enter(`test-list-${Date.now()}`, 2, OTHER_EVENT_ID);
        expect(response.status).toBe(201);

        const after = await myEntries();
        expect(after.length).toBe(before.length + 1);

        const latest = after[0];
        if (!latest) throw new Error('응모 내역이 비어 있습니다');
        expect(latest.id).toBe((response.data as Envelope<EntryReceipt>).data.id);
        expect(latest.eventId).toBe(OTHER_EVENT_ID);
        expect(latest.deductedTicketCount).toBe(2);
        // 목록에서 이벤트 이름을 보여줘야 하므로 제목이 함께 와야 한다
        expect(latest.eventTitle).not.toBe('');
    });

    it('업무 거절도 키에 묶여, 같은 키 재시도는 처음 거절을 그대로 돌려준다', async () => {
        const key = `test-reject-${Date.now()}`;

        // 잔액·한도를 넘는 수량 — 확정된 업무 거절이다
        const rejected = await enter(key, 9999);
        expect(rejected.status).toBe(409);

        // 같은 키·같은 본문 재시도는 재처리되지 않고 저장된 거절을 돌려준다
        const retry = await enter(key, 9999);
        expect(retry.status).toBe(409);
        expect(retry.data).toEqual(rejected.data);
    });

    it('응모권 사용 이벤트에 0장을 내면 거절한다', async () => {
        const response = await enter(`test-zero-${Date.now()}`, 0);
        expect(response.status).toBe(400);
    });

    it('응모권 미사용 이벤트는 0장만 받고 사용자당 한 번만 접수된다', async () => {
        const userId = `user-free-${Date.now()}`;

        // 미사용 이벤트에 응모권 수를 내면 거절
        const withTickets = await enter(`test-free-${Date.now()}`, 1, FREE_EVENT_ID, userId);
        expect(withTickets.status).toBe(400);

        const first = await enter(`test-free1-${Date.now()}`, 0, FREE_EVENT_ID, userId);
        expect(first.status).toBe(201);

        // 같은 사용자의 두 번째 접수는 거절된다
        const second = await enter(`test-free2-${Date.now()}`, 0, FREE_EVENT_ID, userId);
        expect(second.status).toBe(409);
    });

    it('응모 내역은 사용자별로 분리된다', async () => {
        const userA = `user-a-${Date.now()}`;
        const userB = `user-b-${Date.now()}`;

        const entered = await enter(`test-iso-${Date.now()}`, 0, FREE_EVENT_ID_2, userA);
        expect(entered.status).toBe(201);

        const bEntries = await myEntries(userB);
        expect(bEntries.some((entry) => entry.eventId === FREE_EVENT_ID_2)).toBe(false);

        const aEntries = await myEntries(userA);
        expect(aEntries.some((entry) => entry.eventId === FREE_EVENT_ID_2)).toBe(true);
    });
});
