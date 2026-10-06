import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AbuseDecision } from '@entities/abuseCase';

import { ABUSE_CASES_KEY, abuseCaseReviewApiPath, abuseCaseSchema } from '@entities/abuseCase';
import { apiClient } from '@shared/api/client';

interface ReviewAbuseCaseInput {
    caseId: string;
    decision: AbuseDecision;
    note: string;
}

export function useReviewAbuseCase() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ caseId, decision, note }: ReviewAbuseCaseInput) => {
            const { data } = await apiClient.post<unknown>(abuseCaseReviewApiPath(caseId), {
                decision,
                note,
            });
            return abuseCaseSchema.parse(data);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ABUSE_CASES_KEY });
        },
    });
}
