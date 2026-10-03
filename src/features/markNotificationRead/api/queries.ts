import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import {
    NOTIFICATIONS_API_PATH,
    NOTIFICATIONS_KEY,
    notificationReadResultSchema,
} from '@entities/notification';
import { apiClient } from '@shared/api/client';
import { envelopeSchema } from '@shared/api/envelopeSchema';

export function useMarkNotificationRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const { data } = await apiClient.put<unknown>(
                `${NOTIFICATIONS_API_PATH}/${notificationId}/read`,
            );
            return envelopeSchema(notificationReadResultSchema).parse(data).data;
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
            const { data } = await apiClient.put<unknown>(`${NOTIFICATIONS_API_PATH}/me/read-all`);
            return envelopeSchema(z.object({ updatedCount: z.number() })).parse(data).data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
        },
    });
}
