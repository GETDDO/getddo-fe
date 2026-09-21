import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';

import { gameSchema } from '../model/types';

const gameListSchema = z.array(gameSchema);

export function useGameList() {
    return useQuery({
        queryKey: ['games', 'list'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>('/games');
            return gameListSchema.parse(data);
        },
    });
}
