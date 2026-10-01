import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';

import { eventSchema } from '../model/types';

const eventListSchema = z.array(eventSchema);

export function useEventList() {
    return useQuery({
        queryKey: ['events', 'list'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>('/events');
            return eventListSchema.parse(data);
        },
        // 실시간 현황 자동 갱신 (getddo-spec 기능 요구사항 7절 — 갱신 주기는 구현 재량) — 홈 배너의 참여자/응모권 수를 주기적으로 다시 가져온다
        refetchInterval: 30_000,
    });
}

export function useEvent(eventId: string) {
    return useQuery({
        queryKey: ['events', 'detail', eventId],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(`/events/${eventId}`);
            return eventSchema.parse(data);
        },
        // 실시간 현황 자동 갱신 (기능 요구사항 7절) — 마감 상태도 결과 발표(closed → drawn) 전환을 감지해야 하므로 추첨 완료 전까지 30초 폴링을 유지한다
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            return status === 'drawn' ? false : 30_000;
        },
    });
}
