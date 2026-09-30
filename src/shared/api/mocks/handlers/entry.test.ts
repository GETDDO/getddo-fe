import { describe, expect, it } from 'vitest';

import { apiClient } from '@shared/api/client';

/** evt-004 — 응모권 1장을 쓰는 진행 중 타임래플 */
const EVENT_ID = 'evt-004';

async function balance() {
    const { data } = await apiClient.get<{ balance: number }>('/tickets/balance');
    return data.balance;
}

function enter(key: string, ticketsUsed: unknown) {
    return apiClient.post(
        `/events/${EVENT_ID}/entries`,
        { ticketsUsed },
        { headers: { 'X-Idempotency-Key': key }, validateStatus: () => true },
    );
}

describe('응모 목업 핸들러', () => {
    it('같은 멱등키로 다시 보내면 응모권을 또 차감하지 않는다', async () => {
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

    it('같은 멱등키로 다른 수량을 보내면 거절한다', async () => {
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
            { ticketsUsed: 1 },
            { validateStatus: () => true },
        );

        expect(response.status).toBe(400);
    });
});
