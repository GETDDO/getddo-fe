import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';
import { envelopeSchema } from '@shared/api/envelopeSchema';

import { virtualUserSchema } from '../model/types';

const virtualUserListSchema = envelopeSchema(z.array(virtualUserSchema));

export const VIRTUAL_USERS_KEY = ['virtual-users'] as const;

export const VIRTUAL_USERS_API_PATH = '/virtual-users';

export function useVirtualUsers() {
    return useQuery({
        queryKey: VIRTUAL_USERS_KEY,
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(VIRTUAL_USERS_API_PATH);
            return virtualUserListSchema.parse(data).data;
        },
    });
}
