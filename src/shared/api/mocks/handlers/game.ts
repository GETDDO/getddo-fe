import { http, HttpResponse } from 'msw';

import { env } from '@shared/config/env';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

export const gameHandlers = [
    http.get(api('/games'), () =>
        HttpResponse.json([
            { id: 'game-1', title: '룰렛 돌리기', dailyLimit: 3, remainingPlays: 3 },
            { id: 'game-2', title: '카드 뒤집기', dailyLimit: 1, remainingPlays: 1 },
        ]),
    ),
    http.post(api('/games/:gameId/play'), ({ params }) =>
        HttpResponse.json(
            { gameId: params.gameId, score: 1200, ticketsGranted: 1, remainingPlays: 2 },
            { status: 201 },
        ),
    ),
];
