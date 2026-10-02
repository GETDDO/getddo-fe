import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';

import { myEntrySchema } from '../model/types';

const myEntryListSchema = z.array(myEntrySchema);

/** 내가 응모한 내역 — 응모가 접수되면 features/enter-event가 이 쿼리를 무효화한다 */
export function useMyEntries() {
    return useQuery({
        queryKey: ['entries', 'me'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>('/entries/me');
            return myEntryListSchema.parse(data);
        },
    });
}
