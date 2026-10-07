import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@shared/api/client';
import { envelopeSchema, pageSchema } from '@shared/api/envelopeSchema';
import { queryPresets } from '@shared/api/queryPresets';

import type { AbuseCase } from '../model/types';

import { abuseCaseSchema } from '../model/types';

const abuseCaseListSchema = envelopeSchema(pageSchema(abuseCaseSchema));

export const ABUSE_CASES_KEY = ['admin', 'abuse-cases'] as const;

// 어뷰징 도메인의 엔드포인트 — 검토 결정(POST decisions)을 하는 features/reviewAbuseCase도 이 상수를 재사용한다
export const ABUSE_CASES_API_PATH = '/admin/abuse-cases';
export const abuseCaseDecisionsApiPath = (caseId: string) =>
    `${ABUSE_CASES_API_PATH}/${caseId}/decisions`;

export function useAbuseCases() {
    return useQuery({
        // 검토 대기 목록은 항상 서버의 최신 상태여야 한다 — 캐시된 목록으로 심사하면 안 된다
        ...queryPresets.noCache,
        queryKey: ABUSE_CASES_KEY,
        queryFn: async () => {
            // 검토 화면은 전체를 한 번에 심사하므로 totalElements까지 모든 페이지를 모은다
            const cases: AbuseCase[] = [];
            for (let page = 1; ; page += 1) {
                const { data } = await apiClient.get<unknown>(ABUSE_CASES_API_PATH, {
                    params: { page, size: 20 },
                });
                const parsed = abuseCaseListSchema.parse(data).data;
                cases.push(...parsed.items);
                if (cases.length >= parsed.totalElements || parsed.items.length === 0) break;
            }
            return cases;
        },
    });
}
