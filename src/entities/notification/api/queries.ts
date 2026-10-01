import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';

import { notificationCursorSchema, notificationReadResultSchema } from '../model/types';

// N01~N03만 /api/v1 확정 — 다른 도메인은 초안이라 전역 베이스 URL은 건드리지 않는다
const V1 = '/v1/notifications';

// 성공 응답 봉투에서 data만 꺼내는 최소 검증 — code/message는 소비하지 않는다
const envelope = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({ success: z.literal(true), data: dataSchema });

const NOTIFICATION_LIST_KEY = ['notifications', 'list'];

export function useNotificationList({
    isRead,
    size = 20,
}: { isRead?: boolean; size?: number } = {}) {
    return useInfiniteQuery({
        queryKey: [...NOTIFICATION_LIST_KEY, { isRead }],
        initialPageParam: undefined as string | undefined,
        queryFn: async ({ pageParam }) => {
            const { data } = await apiClient.get<unknown>(`${V1}/me`, {
                // cursor는 서버가 준 nextCursor를 그대로 전달한다 (클라이언트 생성·해석 금지)
                params: { cursor: pageParam, size, isRead },
            });
            return envelope(notificationCursorSchema).parse(data).data;
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });
}

export function useMarkNotificationRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const { data } = await apiClient.put<unknown>(`${V1}/${notificationId}/read`);
            return envelope(notificationReadResultSchema).parse(data).data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}
