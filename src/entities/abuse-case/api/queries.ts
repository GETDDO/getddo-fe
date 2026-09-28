import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';

import { abuseCaseSchema } from '../model/types';

const abuseCaseListSchema = z.array(abuseCaseSchema);

export const ABUSE_CASES_KEY = ['admin', 'abuse-cases'] as const;

export function useAbuseCases() {
    return useQuery({
        queryKey: ABUSE_CASES_KEY,
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>('/admin/abuse-cases');
            return abuseCaseListSchema.parse(data);
        },
    });
}
