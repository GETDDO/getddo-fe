import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';
import { envelopeSchema, pageSchema } from '@shared/api/envelopeSchema';
import { queryPresets } from '@shared/api/queryPresets';

import type { Event } from '../model/types';

import { eventSchema } from '../model/types';

const eventListSchema = envelopeSchema(pageSchema(eventSchema));

export const EVENTS_KEY = ['events'] as const;

// 이벤트 도메인의 엔드포인트 — 경로가 바뀌면 여기만 고친다 (다른 슬라이스는 이 상수를 재사용)
export const EVENTS_API_PATH = '/events';
export const eventApiPath = (eventId: string) => `${EVENTS_API_PATH}/${eventId}`;
export const eventEntriesApiPath = (eventId: string) => `${EVENTS_API_PATH}/${eventId}/entries`;

const EVENTS_PAGE_SIZE = 20;

export function useEventList() {
    return useQuery({
        ...queryPresets.realtime,
        queryKey: [...EVENTS_KEY, 'list'],
        queryFn: async () => {
            // Page는 기본 20건씩 자른다 — 목록 화면은 전체를 그리므로 totalElements까지 전부 모은다
            const events: Event[] = [];
            for (let page = 1; ; page += 1) {
                const { data } = await apiClient.get<unknown>(EVENTS_API_PATH, {
                    params: { page, size: EVENTS_PAGE_SIZE },
                });
                const parsed = eventListSchema.parse(data).data;
                events.push(...parsed.items);
                if (events.length >= parsed.totalElements || parsed.items.length === 0) break;
            }
            return events;
        },
        // 폴링은 이벤트 상태 전환(open → closed 등) 감지용이다. 응모 현황 수치는 E03(useEntryStatistics)이 맡는다 (ADR-0007)
    });
}

export function useEvent(eventId: string) {
    return useQuery({
        ...queryPresets.realtime,
        queryKey: [...EVENTS_KEY, 'detail', eventId],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(eventApiPath(eventId));
            return envelopeSchema(eventSchema).parse(data).data;
        },
        // 상태 전환 감지용 폴링 (ADR-0007) — 마감 상태도 결과 발표(closed → drawn) 전환을 감지해야 하므로 추첨 완료 전까지 30초 폴링을 유지한다
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            return status === 'drawn' ? false : queryPresets.realtime.refetchInterval;
        },
    });
}
