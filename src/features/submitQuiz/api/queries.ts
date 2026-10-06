import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useRef } from 'react';

import type { MissionAnswer } from '@entities/mission';

import { MISSIONS_KEY, missionApiPath, missionSubmissionResultSchema } from '@entities/mission';
import { TICKETS_KEY } from '@entities/ticket';
import { apiClient } from '@shared/api/client';
import { envelopeSchema } from '@shared/api/envelopeSchema';
import { createIdempotencyKey, IDEMPOTENCY_HEADER } from '@shared/lib/idempotencyKey';

interface SubmitAttempt {
    answersJson: string;
    key: string;
}

/**
 * 퀴즈 미션 제출 (M03 초안).
 *
 * 오답(isCompleted=false)도 서버가 확정한 결과다 — 화면에서 "다시 시도"는 새 제출이므로
 * 응답을 받은 뒤에는 항상 새 멱등키를 쓴다. 네트워크 재시도만 같은 키를 유지한다.
 */
export function useSubmitQuiz(missionId: string) {
    const queryClient = useQueryClient();
    const attemptRef = useRef<SubmitAttempt | null>(null);

    return useMutation({
        mutationFn: async (answers: MissionAnswer[]) => {
            const answersJson = JSON.stringify(answers);
            if (attemptRef.current?.answersJson !== answersJson) {
                attemptRef.current = { answersJson, key: createIdempotencyKey() };
            }

            const { data } = await apiClient.post<unknown>(
                `${missionApiPath(missionId)}/submissions`,
                { answers },
                { headers: { [IDEMPOTENCY_HEADER]: attemptRef.current.key } },
            );
            return envelopeSchema(missionSubmissionResultSchema).parse(data).data;
        },
        onSuccess: (result) => {
            attemptRef.current = null;
            // 오답 제출은 완료 상태·잔액이 바뀌지 않는다 — 완료됐을 때만 갱신한다
            if (!result.isCompleted) return;
            return Promise.all([
                queryClient.invalidateQueries({ queryKey: MISSIONS_KEY }),
                queryClient.invalidateQueries({ queryKey: TICKETS_KEY }),
            ]);
        },
        onError: (error) => {
            if (isAxiosError(error) && error.response) {
                attemptRef.current = null;
            }
        },
    });
}
