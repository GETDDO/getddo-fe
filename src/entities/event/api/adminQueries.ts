import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';
import { envelopeSchema, pageSchema } from '@shared/api/envelopeSchema';
import { queryPresets } from '@shared/api/queryPresets';

import type { AdminEventStatus, EventType } from '../model/adminTypes';

import { adminEventSchema } from '../model/adminTypes';

const adminEventPageSchema = pageSchema(adminEventSchema);

export const ADMIN_EVENTS_KEY = ['admin', 'events'] as const;

// 관리자 이벤트 엔드포인트 — AE01~AE08 (getddo-spec 05-api/event.md 초안)
export const ADMIN_EVENTS_API_PATH = '/admin/events';
export const adminEventApiPath = (eventId: string) => `${ADMIN_EVENTS_API_PATH}/${eventId}`;

export interface AdminEventsParams {
    page: number;
    size: number;
    keyword?: string;
    status?: AdminEventStatus;
    eventType?: EventType;
    from?: string;
    to?: string;
}

// 관리자 목록·상태 운영은 가상 시계로 상태가 움직이므로 realtime 프리셋으로 서버 값을 따라간다
export function useAdminEvents(params: AdminEventsParams) {
    return useQuery({
        ...queryPresets.realtime,
        queryKey: [...ADMIN_EVENTS_KEY, 'list', params],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(ADMIN_EVENTS_API_PATH, { params });
            return envelopeSchema(adminEventPageSchema).parse(data).data;
        },
    });
}

export function useAdminEvent(eventId: string) {
    return useQuery({
        ...queryPresets.realtime,
        queryKey: [...ADMIN_EVENTS_KEY, 'detail', eventId],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(adminEventApiPath(eventId));
            return envelopeSchema(adminEventSchema).parse(data).data;
        },
        enabled: Boolean(eventId),
    });
}
