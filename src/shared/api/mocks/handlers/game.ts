import { http, HttpResponse } from 'msw';

import { env } from '@shared/config/env';

import { recordMockTicketGrant } from './ticket';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

// 게임 종류는 게임 담당자 확정 전 임시 목록 (getddo-spec 게임 규칙: '타코야끼 만들기'는 후보)
// dailyLimit·remainingPlays는 홈 위젯 호환용, description·thumbnailUrl·rewardedToday·bestScore·todayPlayCount는 게임 카드·상세용 임시 계약
const mockGames = [
    {
        id: 'game-dino',
        bestScore: 0,
        todayPlayCount: 0,
        title: '타꼬런',
        description: '소스병과 꼬치를 뛰어넘으며 멀리 달려요',
        thumbnailUrl: '/images/games/takoyaki-run.jpg',
        rewardedToday: false,
        dailyLimit: 1,
        remainingPlays: 1,
    },
    {
        id: 'game-takoyaki',
        bestScore: 2589,
        todayPlayCount: 0,
        title: '타코야끼 만들기',
        description: '타이밍 맞춰 뒤집어 노릇하게 구워요',
        thumbnailUrl: null,
        rewardedToday: false,
        dailyLimit: 1,
        remainingPlays: 1,
    },
    {
        id: 'game-roulette',
        bestScore: 300,
        todayPlayCount: 2,
        title: '룰렛 돌리기',
        description: '룰렛을 돌려 행운을 확인해요',
        thumbnailUrl: null,
        rewardedToday: true,
        dailyLimit: 1,
        remainingPlays: 0,
    },
    {
        id: 'game-card',
        bestScore: 960,
        todayPlayCount: 0,
        title: '카드 뒤집기',
        description: '같은 그림 카드 짝을 맞춰요',
        thumbnailUrl: null,
        rewardedToday: false,
        dailyLimit: 1,
        remainingPlays: 1,
    },
    {
        id: 'game-mole',
        todayPlayCount: 0,
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
    // 플레이 결과 — 새로고침 전까지 최고점·오늘 플레이·보상 여부를 기억한다.
    // 게임별 하루 1회 응모권 1장: 오늘 첫 유효 플레이에만 지급한다 (getddo-spec 게임 규칙)
    http.post(api('/games/:gameId/play'), async ({ params, request }) => {
        const game = mockGames.find((item) => item.id === params.gameId);
        if (!game) {
            return HttpResponse.json(
                { code: 'GAME_NOT_FOUND', message: '게임을 찾을 수 없습니다' },
                { status: 404 },
            );
        }
        const { score } = (await request.json()) as { score: number };
        game.bestScore = Math.max(game.bestScore ?? 0, score);
        game.todayPlayCount += 1;
        const ticketsGranted = game.rewardedToday ? 0 : 1;
        if (ticketsGranted > 0) {
            game.rewardedToday = true;
            game.remainingPlays = 0;
            recordMockTicketGrant(
                request.headers.get('X-User-ID') ?? 'anonymous',
                ticketsGranted,
                `${game.title} 게임 보상`,
            );
        }
        return HttpResponse.json(
            {
                gameId: game.id,
                score,
                bestScore: game.bestScore,
                todayPlayCount: game.todayPlayCount,
                ticketsGranted,
            },
            { status: 201 },
        );
    }),
];
