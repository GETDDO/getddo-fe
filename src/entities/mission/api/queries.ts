import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';
import { envelopeSchema } from '@shared/api/envelopeSchema';
import { queryPresets } from '@shared/api/queryPresets';

import type { MissionSummary } from '../model/types';

import { missionDetailSchema, missionSummarySchema } from '../model/types';

// spec 공통 계약 초안의 Page<T> 봉투 — items/page/size/totalElements (페이지는 1부터)
const missionPageSchema = z.object({
    items: z.array(missionSummarySchema),
    page: z.number().int(),
    size: z.number().int(),
    totalElements: z.number().int(),
});

export const MISSIONS_KEY = ['missions'] as const;

export const MISSIONS_API_PATH = '/missions';

export const missionApiPath = (missionId: string) => `${MISSIONS_API_PATH}/${missionId}`;

const MISSIONS_PAGE_SIZE = 50;

/**
 * 진행 중인 미션 목록 — Page<T>는 기본 20건씩이라 totalElements까지 전부 모은다.
 * 제출이 완료되면 features/submit-survey·submit-quiz가 이 쿼리를 무효화한다.
 */
export function useMissionList() {
    return useQuery({
        ...queryPresets.standard,
        queryKey: [...MISSIONS_KEY, 'list'],
        queryFn: async () => {
            const missions: MissionSummary[] = [];
            for (let page = 1; ; page += 1) {
                const { data } = await apiClient.get<unknown>(MISSIONS_API_PATH, {
                    params: { page, size: MISSIONS_PAGE_SIZE },
                });
                const parsed = envelopeSchema(missionPageSchema).parse(data).data;
                missions.push(...parsed.items);
                if (missions.length >= parsed.totalElements || parsed.items.length === 0) break;
            }
            return missions;
        },
    });
}

/** 미션 상세 — 문항·선택지 포함. 정답 필드는 계약상 응답에 없다 (M02) */
export function useMissionDetail(missionId: string) {
    return useQuery({
        ...queryPresets.standard,
        queryKey: [...MISSIONS_KEY, 'detail', missionId],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(missionApiPath(missionId));
            return envelopeSchema(missionDetailSchema).parse(data).data;
        },
    });
}
