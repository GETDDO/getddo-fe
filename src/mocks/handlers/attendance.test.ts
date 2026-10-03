import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@shared/api/client';

interface AttendanceResult {
    attended: boolean;
    consecutiveDays: number;
    ticketsGranted: number;
}

const check = (userId: string) =>
    apiClient.post<AttendanceResult>('/attendances', undefined, {
        headers: { 'X-User-ID': userId },
        validateStatus: () => true,
    });

const today = (userId: string) =>
    apiClient.get<{ attended: boolean; consecutiveDays: number }>('/attendances/today', {
        headers: { 'X-User-ID': userId },
    });

// 두 요청 사이에 KST 자정이 지나면 결과가 달라지므로 Date만 고정한다 — 타이머까지 가짜로 바꾸면 MSW 요청이 멈춘다
const freezeDate = (iso: string) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(iso));
};

afterEach(() => {
    vi.useRealTimers();
});

describe('출석 목업 핸들러', () => {
    it('같은 날 재요청은 새로 지급하지 않고 처음 결과를 200으로 돌려준다', async () => {
        freezeDate('2026-10-02T12:00:00Z'); // KST 21:00 — 자정 경계에서 멀리 둔다
        const userId = `user-att-${Date.now()}`;

        const first = await check(userId);
        expect(first.status).toBe(201);
        expect(first.data.ticketsGranted).toBeGreaterThan(0);

        const again = await check(userId);
        expect(again.status).toBe(200);
        expect(again.data).toEqual(first.data);
    });

    it('출석 상태는 사용자별로 분리된다', async () => {
        freezeDate('2026-10-02T12:00:00Z');
        const userA = `user-att-a-${Date.now()}`;
        const userB = `user-att-b-${Date.now()}`;

        const first = await check(userA);
        expect(first.status).toBe(201);

        // 다른 사용자는 첫 출석으로 새 보상을 받는다 — A의 출석이 B를 막지 않는다
        const second = await check(userB);
        expect(second.status).toBe(201);

        const statusA = await today(userA);
        expect(statusA.data.attended).toBe(true);
    });

    it('응모권 잔액·이력도 사용자별로 분리된다', async () => {
        freezeDate('2026-10-02T12:00:00Z');
        const userA = `user-tkt-a-${Date.now()}`;
        const userB = `user-tkt-b-${Date.now()}`;

        const { data: beforeB } = await apiClient.get<{ balance: number }>('/tickets/balance', {
            headers: { 'X-User-ID': userB },
        });

        // A가 출석 보상을 받아도 B의 잔액은 변하지 않는다
        await check(userA);
        const { data: afterB } = await apiClient.get<{ balance: number }>('/tickets/balance', {
            headers: { 'X-User-ID': userB },
        });
        expect(afterB.balance).toBe(beforeB.balance);

        const { data: afterA } = await apiClient.get<{ balance: number }>('/tickets/balance', {
            headers: { 'X-User-ID': userA },
        });
        expect(afterA.balance).toBeGreaterThan(beforeB.balance);
    });
});
