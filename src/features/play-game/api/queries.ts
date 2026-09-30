import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';
import { createIdempotencyKey } from '@shared/lib/idempotency-key';

import { playResultSchema } from '../model/types';

/**
 * 플레이 결과 제출 — 같은 플레이가 재시도로 두 번 반영되지 않게 멱등키를 붙인다.
 * TODO: 서버가 플레이 ID를 발급하는 계약이 정해지면 시작할 때 ID를 받아 함께 보낸다 (getddo-spec 게임 규칙)
 */
export function useSubmitGamePlay() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ gameId, score }: { gameId: string; score: number }) => {
            const { data } = await apiClient.post<unknown>(
                `/games/${gameId}/play`,
                { score },
                { headers: { 'X-Idempotency-Key': createIdempotencyKey() } },
            );
            return playResultSchema.parse(data);
        },
        onSuccess: () => {
            // 최고점·오늘 플레이·오늘 받은 응모권과, 보상으로 바뀐 응모권 잔액·이력을 다시 받아온다
            void queryClient.invalidateQueries({ queryKey: ['games'] });
            void queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
    });
}
