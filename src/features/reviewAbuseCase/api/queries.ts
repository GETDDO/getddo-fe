import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AbuseDecision } from '@entities/abuseCase';

import {
    ABUSE_CASES_KEY,
    abuseCaseDecisionsApiPath,
    reviewDecisionResultSchema,
} from '@entities/abuseCase';
import { apiClient } from '@shared/api/client';
import { envelopeSchema } from '@shared/api/envelopeSchema';

interface ReviewAbuseCaseInput {
    caseId: string;
    decision: AbuseDecision;
    note: string;
}

export function useReviewAbuseCase() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ caseId, decision, note }: ReviewAbuseCaseInput) => {
            // spec AR03 — 화면의 allow/exclude를 계약의 ALLOW/CONFIRM+excludeFromEvent로 옮긴다.
            // 제외는 본인에게 안내될 사유(userNoticeReason)를 함께 보낸다
            const body =
                decision === 'exclude'
                    ? {
                          decision: 'CONFIRM',
                          reason: note,
                          excludeFromEvent: true,
                          userNoticeReason: note,
                      }
                    : { decision: 'ALLOW', reason: note };
            const { data } = await apiClient.post<unknown>(abuseCaseDecisionsApiPath(caseId), body);
            return envelopeSchema(reviewDecisionResultSchema).parse(data).data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ABUSE_CASES_KEY });
        },
    });
}
