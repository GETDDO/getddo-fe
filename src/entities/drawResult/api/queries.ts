import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';
import { envelopeSchema } from '@shared/api/envelopeSchema';
import { queryPresets } from '@shared/api/queryPresets';

import { publicResultsSchema } from '../model/types';

export const DRAW_RESULTS_KEY = ['draw-results'] as const;

// getddo-spec 05-api/drawing.md E08 — 공개 결과 조회
export const eventResultsApiPath = (eventId: string) => `/events/${eventId}/results`;

/**
 * 이벤트의 공개 추첨 결과.
 *
 * 발표가 지연될 수 있어 예정 시각이 지나도 공개 전일 수 있다. 그래서 공개 전에는 계속
 * 따라가다가, 공개된 뒤에는 폴링을 멈춘다 — 결과는 revision이 바뀔 때만 달라진다.
 */
export function useEventResults(eventId: string, enabled = true) {
    return useQuery({
        ...queryPresets.realtime,
        queryKey: [...DRAW_RESULTS_KEY, eventId],
        enabled,
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(eventResultsApiPath(eventId));
            return envelopeSchema(publicResultsSchema).parse(data).data;
        },
        refetchInterval: (query) =>
            query.state.data?.isPublished ? false : queryPresets.realtime.refetchInterval,
    });
}
