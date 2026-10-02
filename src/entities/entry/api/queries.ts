import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';

import { entrySchema } from '../model/types';

// spec 공통 계약 초안의 Page<T> 봉투 — items/page/size/totalElements (페이지는 1부터)
const myEntryPageSchema = z.object({
    items: z.array(entrySchema),
    page: z.number().int(),
    size: z.number().int(),
    totalElements: z.number().int(),
});

const envelope = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({ success: z.literal(true), data: dataSchema });

/** 내가 응모한 내역 — 응모가 접수되면 features/enter-event가 이 쿼리를 무효화한다 */
export function useMyEntries() {
    return useQuery({
        queryKey: ['entries', 'me'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>('/users/me/entries');
            return envelope(myEntryPageSchema).parse(data).data.items;
        },
    });
}
