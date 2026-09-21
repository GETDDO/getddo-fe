import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';

import { missionSchema } from '../model/types';

const missionListSchema = z.array(missionSchema);

export function useMissionList() {
    return useQuery({
        queryKey: ['missions', 'list'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>('/missions');
            return missionListSchema.parse(data);
        },
    });
}
