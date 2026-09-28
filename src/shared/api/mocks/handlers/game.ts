import { http, HttpResponse } from 'msw';

import { env } from '@shared/config/env';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

// 게임 종류는 게임 담당자 확정 전 임시 목록 (getddo-spec 게임 규칙: '타코야끼 만들기'는 후보)
// dailyLimit·remainingPlays는 홈 위젯 호환용, description·thumbnailUrl·rewardedToday는 게임 카드용 임시 계약
const mockGames = [
    {
        id: 'game-dino',
        title: '공룡 달리기',
        description: '장애물을 피해 멀리 달리는 게임',
        thumbnailUrl: '/images/games/dino-run.png',
        rewardedToday: false,
        dailyLimit: 1,
        remainingPlays: 1,
    },
    {
        id: 'game-takoyaki',
        title: '타코야끼 만들기',
        description: '타이밍 맞춰 뒤집어 노릇하게 구워요',
        thumbnailUrl: null,
        rewardedToday: false,
        dailyLimit: 1,
        remainingPlays: 1,
    },
    {
        id: 'game-roulette',
        title: '룰렛 돌리기',
        description: '룰렛을 돌려 행운을 확인해요',
        thumbnailUrl: null,
        rewardedToday: true,
        dailyLimit: 1,
        remainingPlays: 0,
    },
    {
        id: 'game-card',
        title: '카드 뒤집기',
        description: '같은 그림 카드 짝을 맞춰요',
        thumbnailUrl: null,
        rewardedToday: false,
        dailyLimit: 1,
        remainingPlays: 1,
    },
    {
        id: 'game-mole',
        title: '두더지 잡기',
        description: '튀어나오는 두더지를 빠르게 잡아요',
        thumbnailUrl: null,
        rewardedToday: false,
        dailyLimit: 1,
        remainingPlays: 1,
    },
];

export const gameHandlers = [
    http.get(api('/games'), () => HttpResponse.json(mockGames)),
    http.post(api('/games/:gameId/play'), ({ params }) =>
        HttpResponse.json(
            { gameId: params.gameId, score: 1200, ticketsGranted: 1, remainingPlays: 2 },
            { status: 201 },
        ),
    ),
];
