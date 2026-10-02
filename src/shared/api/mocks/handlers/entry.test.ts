import { describe, expect, it } from 'vitest';

import { apiClient } from '@shared/api/client';
import { IDEMPOTENCY_HEADER } from '@shared/lib/idempotency-key';

// 목업은 모듈 수준 상태를 들고 있어 테스트끼리 영향을 준다.
// 이벤트별 누적 한도(ADR-010)가 걸리므로 한도를 쓰는 테스트는 서로 다른 이벤트를 쓴다.
/** 응모권 1장을 쓰는 진행 중 타임래플 */
const EVENT_ID = 'evt-004';
/** 위와 별개로 한도를 쓰는 테스트용 진행 중 타임래플 */
const OTHER_EVENT_ID = 'evt-003';

async function balance() {
    const { data } = await apiClient.get<{ balance: number }>('/tickets/balance');
    return data.balance;
}

function enter(key: string, ticketCount: unknown, eventId = EVENT_ID) {
    return apiClient.post(
        `/events/${eventId}/entries`,
        { ticketCount },
        { headers: { [IDEMPOTENCY_HEADER]: key }, validateStatus: () => true },
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

async function myEntries() {
    const { data } = await apiClient.get<Envelope<{ items: EntryReceipt[] }>>('/users/me/entries');
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
});
