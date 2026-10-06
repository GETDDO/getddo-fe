import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';
import { queryPresets } from '@shared/api/queryPresets';

import { abuseCaseSchema } from '../model/types';

const abuseCaseListSchema = z.array(abuseCaseSchema);

export const ABUSE_CASES_KEY = ['admin', 'abuse-cases'] as const;

// 어뷰징 도메인의 엔드포인트 — 검토(POST review)를 하는 features/reviewAbuseCase도 이 상수를 재사용한다
export const ABUSE_CASES_API_PATH = '/admin/abuse-cases';
export const abuseCaseReviewApiPath = (caseId: string) =>
    `${ABUSE_CASES_API_PATH}/${caseId}/review`;

export function useAbuseCases() {
    return useQuery({
        // 검토 대기 목록은 항상 서버의 최신 상태여야 한다 — 캐시된 목록으로 심사하면 안 된다
        ...queryPresets.noCache,
        queryKey: ABUSE_CASES_KEY,
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(ABUSE_CASES_API_PATH);
            return abuseCaseListSchema.parse(data);
        },
    });
}
