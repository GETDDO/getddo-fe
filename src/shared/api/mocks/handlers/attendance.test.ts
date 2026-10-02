import { describe, expect, it } from 'vitest';

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

describe('출석 목업 핸들러', () => {
    it('같은 날 재요청은 새로 지급하지 않고 처음 결과를 200으로 돌려준다', async () => {
        const userId = `user-att-${Date.now()}`;

        const first = await check(userId);
        expect(first.status).toBe(201);
        expect(first.data.ticketsGranted).toBeGreaterThan(0);

        const again = await check(userId);
        expect(again.status).toBe(200);
        expect(again.data).toEqual(first.data);
    });

    it('출석 상태는 사용자별로 분리된다', async () => {
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
});
