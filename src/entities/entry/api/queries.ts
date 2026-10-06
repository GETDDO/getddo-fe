import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';
import { envelopeSchema } from '@shared/api/envelopeSchema';

import { entrySchema } from '../model/types';

// spec 공통 계약 초안의 Page<T> 봉투 — items/page/size/totalElements (페이지는 1부터)
const myEntryPageSchema = z.object({
    items: z.array(entrySchema),
    page: z.number().int(),
    size: z.number().int(),
    totalElements: z.number().int(),
});

export const ENTRIES_KEY = ['entries'] as const;

export const MY_ENTRIES_API_PATH = '/users/me/entries';

const ENTRIES_PAGE_SIZE = 50;

/**
 * 내가 응모한 내역 — 응모가 접수되면 features/enter-event가 이 쿼리를 무효화한다.
 * Page<T>는 기본 20건씩이라 totalElements까지 전부 모아야 합계·목록이 정확하다
 */
export function useMyEntries() {
    return useQuery({
        queryKey: [...ENTRIES_KEY, 'me'],
        queryFn: async () => {
            const entries = [];
            // 페이지는 1부터 시작한다 (spec 공통 계약)
            for (let page = 1; ; page += 1) {
                const { data } = await apiClient.get<unknown>(MY_ENTRIES_API_PATH, {
                    params: { page, size: ENTRIES_PAGE_SIZE },
                });
                const parsed = envelopeSchema(myEntryPageSchema).parse(data).data;
                entries.push(...parsed.items);
                if (entries.length >= parsed.totalElements || parsed.items.length === 0) break;
            }
            return entries;
        },
    });
}
