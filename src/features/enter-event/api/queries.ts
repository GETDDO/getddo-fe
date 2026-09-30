import { useMutation, useQueryClient } from '@tanstack/react-query';

import { entrySchema } from '@entities/entry';
import { apiClient } from '@shared/api/client';
import { createIdempotencyKey } from '@shared/lib/idempotency-key';

/**
 * 이벤트에 응모한다. 연타·재시도로 이중 차감되지 않도록 멱등키를 붙인다 (ADR-0005).
 * 성공하면 응모 현황(이벤트)과 응모권 잔액·이력을 다시 받아온다.
 */
export function useEnterEvent(eventId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ticketsUsed: number) => {
            const { data } = await apiClient.post<unknown>(
                `/events/${eventId}/entries`,
                { ticketsUsed },
                { headers: { 'X-Idempotency-Key': createIdempotencyKey() } },
            );
            return entrySchema.parse(data);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['events'] });
            void queryClient.invalidateQueries({ queryKey: ['tickets'] });
            void queryClient.invalidateQueries({ queryKey: ['entries'] });
        },
    });
}
