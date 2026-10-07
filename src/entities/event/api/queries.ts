import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';
import { envelopeSchema, pageSchema } from '@shared/api/envelopeSchema';
import { queryPresets } from '@shared/api/queryPresets';

import { eventSchema } from '../model/types';

const eventListSchema = envelopeSchema(pageSchema(eventSchema));

export const EVENTS_KEY = ['events'] as const;

// 이벤트 도메인의 엔드포인트 — 경로가 바뀌면 여기만 고친다 (다른 슬라이스는 이 상수를 재사용)
export const EVENTS_API_PATH = '/events';
export const eventApiPath = (eventId: string) => `${EVENTS_API_PATH}/${eventId}`;
export const eventEntriesApiPath = (eventId: string) => `${EVENTS_API_PATH}/${eventId}/entries`;

export function useEventList() {
    return useQuery({
        ...queryPresets.realtime,
        queryKey: [...EVENTS_KEY, 'list'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(EVENTS_API_PATH);
            // 목록 화면은 한 번에 전부 그리므로 Page.items만 꺼낸다 — 페이지네이션 UI가 생기면 page/size 파라미터를 넘긴다
            return eventListSchema.parse(data).data.items;
        },
        // 실시간 현황 자동 갱신 (getddo-spec 기능 요구사항 7절 — 갱신 주기는 구현 재량) — 홈 배너의 참여자/응모권 수를 주기적으로 다시 가져온다
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
        // 실시간 현황 자동 갱신 (기능 요구사항 7절) — 마감 상태도 결과 발표(closed → drawn) 전환을 감지해야 하므로 추첨 완료 전까지 30초 폴링을 유지한다
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            return status === 'drawn' ? false : queryPresets.realtime.refetchInterval;
        },
    });
}
