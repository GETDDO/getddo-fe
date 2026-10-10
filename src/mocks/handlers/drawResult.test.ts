import { describe, expect, it } from 'vitest';

import type { PublicResults } from '@entities/drawResult';

import { publicResultsSchema } from '@entities/drawResult';
import { apiClient } from '@shared/api/client';

async function results(eventId: string): Promise<PublicResults> {
    const { data } = await apiClient.get<unknown>(`/events/${eventId}/results`);
    return publicResultsSchema.parse((data as { data: unknown }).data);
}

// 어제 끝난 래플이라 시각과 무관하게 항상 발표 완료다
const DRAWN_EVENT_ID = 'evt-107';
// 기준 시각 +2시간에 열리는 래플이라 아직 발표 전이다
const PENDING_EVENT_ID = 'evt-105';

describe('공개 추첨 결과 목업 (E08)', () => {
    it('발표 전에는 명단과 공개 정보를 하나도 싣지 않는다', async () => {
        const data = await results(PENDING_EVENT_ID);

        expect(data.isPublished).toBe(false);
        expect(data.displayStatus).toBe('WAITING');
        expect(data.prizes).toEqual([]);
        expect(data.publishedAt).toBeNull();
        expect(data.revision).toBeNull();
    });

    it('발표 뒤에는 등수 내림차순으로 명단을 준다', async () => {
        const data = await results(DRAWN_EVENT_ID);

        expect(data.isPublished).toBe(true);
        expect(data.displayStatus).toBe('PUBLISHED');
        expect(data.prizes.length).toBeGreaterThan(0);

        const ranks = data.prizes.map((prize) => prize.rank);
        expect(ranks).toEqual([...ranks].sort((a, b) => b - a));
    });

    it('당첨자는 마스킹된 값만 담는다', async () => {
        const [prize] = (await results(DRAWN_EVENT_ID)).prizes;
        const winner = prize?.winners[0];

        expect(winner).toBeDefined();
        expect(winner?.maskedName).toMatch(/\*/);
        expect(winner?.maskedPhoneNum).toMatch(/^\d{4}$/);
        // 원본 개인정보·사용자 ID는 공개 결과에 담기지 않는다 (05-api/drawing.md)
        expect(winner).not.toHaveProperty('userId');
    });

    it('같은 이벤트를 다시 조회해도 명단이 바뀌지 않는다', async () => {
        const first = await results(DRAWN_EVENT_ID);
        const second = await results(DRAWN_EVENT_ID);

        expect(second.prizes).toEqual(first.prizes);
    });

    it('없는 이벤트는 404로 답한다', async () => {
        await expect(results('evt-nope')).rejects.toMatchObject({
            status: 404,
            code: 'EVENT_NOT_FOUND',
        });
    });
});
