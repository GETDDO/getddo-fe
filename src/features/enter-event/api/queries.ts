import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import { entrySchema } from '@entities/entry';
import { apiClient } from '@shared/api/client';
import { createIdempotencyKey } from '@shared/lib/idempotency-key';

interface EntryAttempt {
    ticketsUsed: number;
    key: string;
}

/**
 * 이벤트에 응모한다.
 *
 * 응답이 유실되거나 타임아웃된 뒤 같은 수량으로 다시 누르는 것은 새 응모가 아니라 재시도다.
 * 그때 키를 새로 만들면 서버가 멱등 처리를 해도 별개 요청으로 보고 응모권을 또 차감한다.
 * 그래서 수량이 같은 동안에는 키를 유지하고, 접수에 성공하거나 수량을 바꾸면 새로 만든다 (ADR-0005).
 */
export function useEnterEvent(eventId: string) {
    const queryClient = useQueryClient();
    const attemptRef = useRef<EntryAttempt | null>(null);

    return useMutation({
        mutationFn: async (ticketsUsed: number) => {
            if (attemptRef.current?.ticketsUsed !== ticketsUsed) {
                attemptRef.current = { ticketsUsed, key: createIdempotencyKey() };
            }

            const { data } = await apiClient.post<unknown>(
                `/events/${eventId}/entries`,
                { ticketsUsed },
                { headers: { 'X-Idempotency-Key': attemptRef.current.key } },
            );
            return entrySchema.parse(data);
        },
        onSuccess: () => {
            // 다음 응모는 재시도가 아니라 새 건이다
            attemptRef.current = null;

            // Promise를 반환하면 갱신이 끝날 때까지 isPending이 유지된다.
            // 먼저 완료 안내를 열어 버리면 갱신 전 남은 한도로 추가 응모를 시작하게 된다.
            return Promise.all([
                queryClient.invalidateQueries({ queryKey: ['events'] }),
                queryClient.invalidateQueries({ queryKey: ['tickets'] }),
                queryClient.invalidateQueries({ queryKey: ['entries'] }),
            ]);
        },
    });
}
