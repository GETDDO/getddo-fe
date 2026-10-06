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
 * 설문 미션 제출 (M03 초안).
 *
 * 응답이 유실된 뒤 같은 답변으로 다시 누르는 것은 새 제출이 아니라 재시도다.
 * 답변이 같은 동안에는 멱등키를 유지하고, 서버가 응답을 돌려준 뒤에는 새로 만든다 (ADR-0005 패턴).
 */
export function useSubmitSurvey(missionId: string) {
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
        onSuccess: () => {
            attemptRef.current = null;
            // 설문은 유효 제출이 곧 완료다 — 완료 상태와 보상으로 바뀐 잔액을 다시 받아온다
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
