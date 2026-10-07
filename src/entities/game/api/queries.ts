import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@shared/api/client';
import { envelopeSchema } from '@shared/api/envelopeSchema';

import { gameSchema } from '../model/types';

const gameListSchema = envelopeSchema(z.array(gameSchema));

export const GAMES_KEY = ['games'] as const;

// 게임 도메인의 엔드포인트 — 플레이 제출을 하는 features/playGame도 이 상수를 재사용한다
export const GAMES_API_PATH = '/games';
export const gamePlayApiPath = (gameId: string) => `${GAMES_API_PATH}/${gameId}/play`;

export function useGameList() {
    return useQuery({
        queryKey: [...GAMES_KEY, 'list'],
        queryFn: async () => {
            const { data } = await apiClient.get<unknown>(GAMES_API_PATH);
            return gameListSchema.parse(data).data;
        },
    });
}
