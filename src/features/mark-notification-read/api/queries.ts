import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { NOTIFICATIONS_KEY, notificationReadResultSchema } from '@entities/notification';
import { apiClient } from '@shared/api/client';

// N01~N03만 /api/v1 확정 — 다른 도메인은 초안이라 전역 베이스 URL은 건드리지 않는다
const V1 = '/v1/notifications';

// 성공 응답 봉투에서 data만 꺼내는 최소 검증 — code/message는 소비하지 않는다
const envelope = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({ success: z.literal(true), data: dataSchema });

export function useMarkNotificationRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const { data } = await apiClient.put<unknown>(`${V1}/${notificationId}/read`);
            return envelope(notificationReadResultSchema).parse(data).data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
        },
    });
}

export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { data } = await apiClient.put<unknown>(`${V1}/me/read-all`);
            return envelope(z.object({ updatedCount: z.number() })).parse(data).data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
        },
    });
}
