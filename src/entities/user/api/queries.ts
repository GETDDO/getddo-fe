import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';

import { virtualUserSchema } from '../model/types';

const virtualUserListSchema = z.array(virtualUserSchema);

export const VIRTUAL_USERS_KEY = ['virtual-users'] as const;

export function useVirtualUsers() {
    return useQuery({
        queryKey: VIRTUAL_USERS_KEY,
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>('/virtual-users');
            return virtualUserListSchema.parse(data);
        },
    });
}
