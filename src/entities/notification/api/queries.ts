import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';

import { notificationSchema } from '../model/types';

const notificationListSchema = z.array(notificationSchema);
const NOTIFICATION_LIST_KEY = ['notifications', 'list'];

export function useNotificationList() {
    return useQuery({
        queryKey: NOTIFICATION_LIST_KEY,
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>('/notifications');
            return notificationListSchema.parse(data);
        },
    });
}

export function useMarkNotificationRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            await apiClient.post(`/notifications/${notificationId}/read`);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: NOTIFICATION_LIST_KEY });
        },
    });
}
