import { describe, expect, it } from 'vitest';

import type { EventStatus } from '@entities/event';

import { apiClient } from '@shared/api/client';

interface EventResponse {
    id: string;
    title: string;
    status: EventStatus;
    startsAt: string;
    endsAt: string;
    announceAt: string;
    isTimeRaffle?: boolean;
}

// 목업 이벤트가 페이지 기본값(20)보다 많다 — 시연 플로우용 래플까지 모두 받도록 한 번에 넉넉히 요청한다
async function events() {
    const { data } = await apiClient.get<{ data: { items: EventResponse[] } }>('/events?size=100');
    return data.data.items;
}

describe('이벤트 목업 핸들러', () => {
    it('상태를 기간에서 다시 계산한다 — 적어 둔 status와 어긋나지 않는다', async () => {
        const now = Date.now();

        for (const event of await events()) {
            const starts = new Date(event.startsAt).getTime();
            const ends = new Date(event.endsAt).getTime();
            const announces = new Date(event.announceAt).getTime();

            const expected: EventStatus =
                now < starts
                    ? 'upcoming'
                    : now < ends
                      ? 'open'
                      : now < announces
                        ? 'closed'
                        : 'drawn';

            expect(event.status, `${event.id} ${event.title}`).toBe(expected);
        }
    });

    it('발표 예정 시각은 마감 + 5분이다 (ADR-009)', async () => {
        for (const event of await events()) {
            const gap = new Date(event.announceAt).getTime() - new Date(event.endsAt).getTime();
            expect(gap, event.id).toBe(5 * 60 * 1000);
        }
    });

    /*
     * 시연 데이터는 세션이 시작한 시각을 기준으로 잡혀 있다.
     * "오늘 몇 시"로 고정하면 늦은 시각에 열었을 때 해당 상태가 통째로 비므로,
     * 네 상태를 맡는 이벤트가 각각 제 역할을 하는지 지목해서 확인한다.
     */
    it('시연 플로우를 밟을 수 있도록 각 상태의 타임래플이 하나씩 있다', async () => {
        const byId = new Map((await events()).map((event) => [event.id, event]));

        expect(byId.get('evt-112')?.status, '응모할 수 있는 래플').toBe('open');
        expect(byId.get('evt-106')?.status, '발표를 기다리는 래플').toBe('closed');
        expect(byId.get('evt-105')?.status, '아직 열리지 않은 래플').toBe('upcoming');
        // 어제 끝난 래플이라 시각과 무관하게 항상 발표 완료다
        expect(byId.get('evt-107')?.status, '발표가 끝난 래플').toBe('drawn');
    });
});
