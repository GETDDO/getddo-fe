import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';

import { missionSchema } from '../model/types';

const missionListSchema = z.array(missionSchema);

export const MISSIONS_KEY = ['missions'] as const;

export const MISSIONS_API_PATH = '/missions';

export function useMissionList() {
    return useQuery({
        queryKey: [...MISSIONS_KEY, 'list'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(MISSIONS_API_PATH);
            return missionListSchema.parse(data);
        },
    });
}
