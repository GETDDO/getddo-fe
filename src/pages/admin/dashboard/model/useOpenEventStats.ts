import { useQueries } from '@tanstack/react-query';

import type { EntryStatistics } from '@entities/entry';

import { ENTRIES_KEY, entryStatisticsApiPath, entryStatisticsSchema } from '@entities/entry';
import { apiClient } from '@shared/api/client';
import { envelopeSchema } from '@shared/api/envelopeSchema';
import { queryPresets } from '@shared/api/queryPresets';

/**
 * 진행 중 이벤트 여러 개의 응모 현황(E03)을 한 번에 — 막대 길이를 목록 안 최댓값에 맞추려고 함께 받는다.
 * 키는 useEntryStatistics와 같아 이벤트 화면과 캐시를 나눠 쓴다
 */
export function useOpenEventStats(eventIds: string[]): (EntryStatistics | null | undefined)[] {
    return useQueries({
        queries: eventIds.map((eventId) => ({
            ...queryPresets.realtime,
            queryKey: [...ENTRIES_KEY, 'statistics', eventId],
            queryFn: async () => {
                const { data } = await apiClient.get<unknown>(entryStatisticsApiPath(eventId));
                return envelopeSchema(entryStatisticsSchema).parse(data).data;
            },
        })),
        // 실패한 이벤트는 null — 그 줄만 '현황 없음'으로 두고 나머지는 그린다
        combine: (results) => results.map((result) => (result.isError ? null : result.data)),
    });
}
