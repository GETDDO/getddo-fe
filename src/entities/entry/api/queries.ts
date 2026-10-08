import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';
import { envelopeSchema } from '@shared/api/envelopeSchema';
import { queryPresets } from '@shared/api/queryPresets';

import { entrySchema, entryStatisticsSchema } from '../model/types';

// spec 공통 계약 초안의 Page<T> 봉투 — items/page/size/totalElements (페이지는 1부터)
const myEntryPageSchema = z.object({
    items: z.array(entrySchema),
    page: z.number().int(),
    size: z.number().int(),
    totalElements: z.number().int(),
});

export const ENTRIES_KEY = ['entries'] as const;

export const MY_ENTRIES_API_PATH = '/users/me/entries';

const ENTRIES_PAGE_SIZE = 50;

/**
 * 내가 응모한 내역 — 응모가 접수되면 features/enter-event가 이 쿼리를 무효화한다.
 * Page<T>는 기본 20건씩이라 totalElements까지 전부 모아야 합계·목록이 정확하다
 */
export function useMyEntries() {
    return useQuery({
        queryKey: [...ENTRIES_KEY, 'me'],
        queryFn: async () => {
            const entries = [];
            // 페이지는 1부터 시작한다 (spec 공통 계약)
            for (let page = 1; ; page += 1) {
                const { data } = await apiClient.get<unknown>(MY_ENTRIES_API_PATH, {
                    params: { page, size: ENTRIES_PAGE_SIZE },
                });
                const parsed = envelopeSchema(myEntryPageSchema).parse(data).data;
                entries.push(...parsed.items);
                if (entries.length >= parsed.totalElements || parsed.items.length === 0) break;
            }
            return entries;
        },
    });
}

export const entryStatisticsApiPath = (eventId: string) => `/events/${eventId}/statistics`;

interface EntryStatisticsOptions {
    /** 응모 진행 중(open) 이벤트인가 — true일 때만 30초 폴링한다 (ADR-0007) */
    isOpen?: boolean;
    /** 홈 배너처럼 여러 이벤트가 겹쳐 보이는 곳에서 현재 보이는 항목만 켠다 */
    enabled?: boolean;
}

/**
 * 이벤트 응모 현황(E03). 이벤트 쿼리와 분리해 현황 수치만 가볍게 다시 받는다.
 * 폴링은 open 이벤트에만 건다 — 그 외 상태는 값이 더 늘지 않는다. 백그라운드 탭은 TanStack Query 기본값대로 쉰다
 */
export function useEntryStatistics(
    eventId: string,
    { isOpen = false, enabled = true }: EntryStatisticsOptions = {},
) {
    return useQuery({
        ...queryPresets.realtime,
        queryKey: [...ENTRIES_KEY, 'statistics', eventId],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(entryStatisticsApiPath(eventId));
            return envelopeSchema(entryStatisticsSchema).parse(data).data;
        },
        enabled,
        refetchInterval: isOpen ? queryPresets.realtime.refetchInterval : false,
    });
}
