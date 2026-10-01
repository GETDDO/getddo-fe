import { describe, expect, it } from 'vitest';

import { apiClient } from '@shared/api/client';

/**
 * 이벤트 상태 — entities/event의 eventStatusSchema와 같은 값이다.
 * shared는 entities를 참조할 수 없어(FSD) 목업 쪽에 따로 적어 둔다.
 */
type MockEventStatus = 'upcoming' | 'open' | 'closed' | 'drawn';

interface EventResponse {
    id: string;
    title: string;
    status: MockEventStatus;
    startsAt: string;
    endsAt: string;
    announceAt: string;
    isTimeRaffle?: boolean;
}

async function events() {
    const { data } = await apiClient.get<EventResponse[]>('/events');
    return data;
}

describe('이벤트 목업 핸들러', () => {
    it('상태를 기간에서 다시 계산한다 — 적어 둔 status와 어긋나지 않는다', async () => {
        const now = Date.now();

        for (const event of await events()) {
            const starts = new Date(event.startsAt).getTime();
            const ends = new Date(event.endsAt).getTime();
            const announces = new Date(event.announceAt).getTime();

            const expected: MockEventStatus =
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

    it('시연 플로우를 밟을 수 있도록 각 상태의 타임래플이 지금 하나씩은 있다', async () => {
        const raffles = (await events()).filter((event) => event.isTimeRaffle);
        const statuses = new Set(raffles.map((event) => event.status));

        // 진행 중(응모) · 마감(발표 대기) · 발표 완료가 동시에 보여야 흐름을 한 화면에서 확인할 수 있다
        expect(statuses.has('open'), '진행 중인 래플').toBe(true);
        expect(statuses.has('closed'), '발표 대기 중인 래플').toBe(true);
        expect(statuses.has('drawn'), '발표 완료된 래플').toBe(true);
        expect(statuses.has('upcoming'), '오픈 예정 래플').toBe(true);
    });
});
