import { http, HttpResponse } from 'msw';

import { env } from '@shared/config/env';

import { recordMockTicketGrant } from './ticket';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

// 게임 종류는 게임 담당자 확정 전 임시 목록 (getddo-spec 게임 규칙: '타코야끼 만들기'는 후보)
// dailyLimit은 홈 위젯 호환용, description·thumbnailUrl은 게임 카드·상세용 임시 계약
interface GameMeta {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string | null;
    dailyLimit: number;
}

const mockGames: GameMeta[] = [
    {
        id: 'game-dino',
        title: '타꼬런',
        description: '소스병과 꼬치를 뛰어넘으며 멀리 달려요',
        thumbnailUrl: '/images/games/takoyaki-run.jpg',
        dailyLimit: 1,
    },
    {
        id: 'game-takoyaki',
        title: '타코야끼 만들기',
        description: '타이밍 맞춰 뒤집어 노릇하게 구워요',
        thumbnailUrl: null,
        dailyLimit: 1,
    },
    {
        id: 'game-roulette',
        title: '룰렛 돌리기',
        description: '룰렛을 돌려 행운을 확인해요',
        thumbnailUrl: null,
        dailyLimit: 1,
    },
    {
        id: 'game-card',
        title: '카드 뒤집기',
        description: '같은 그림 카드 짝을 맞춰요',
        thumbnailUrl: null,
        dailyLimit: 1,
    },
    {
        id: 'game-mole',
        title: '두더지 잡기',
        description: '튀어나오는 두더지를 빠르게 잡아요',
        thumbnailUrl: null,
        dailyLimit: 1,
    },
];

// 플레이·보상 상태는 사용자별로 다르다 — 한 사용자의 보상 수령이 다른 사용자의 상태를 바꾸지 않는다
interface GamePlayState {
    bestScore?: number;
    todayPlayCount: number;
    rewardedToday: boolean;
    remainingPlays: number;
}

const seedPlayState: Record<string, GamePlayState> = {
    'game-dino': { bestScore: 0, todayPlayCount: 0, rewardedToday: false, remainingPlays: 1 },
    'game-takoyaki': {
        bestScore: 2589,
        todayPlayCount: 0,
        rewardedToday: false,
        remainingPlays: 1,
    },
    'game-roulette': {
        bestScore: 300,
        todayPlayCount: 2,
        rewardedToday: true,
        remainingPlays: 0,
    },
    'game-card': { bestScore: 960, todayPlayCount: 0, rewardedToday: false, remainingPlays: 1 },
    'game-mole': { todayPlayCount: 0, rewardedToday: false, remainingPlays: 1 },
};

const defaultPlayState = (): GamePlayState => ({
    todayPlayCount: 0,
    rewardedToday: false,
    remainingPlays: 1,
});

const userIdOf = (request: Request) => request.headers.get('X-User-ID') ?? 'anonymous';

const statesByUser = new Map<string, Map<string, GamePlayState>>();

const stateFor = (userId: string, gameId: string): GamePlayState => {
    let states = statesByUser.get(userId);
    if (!states) {
        states = new Map();
        statesByUser.set(userId, states);
    }
    let state = states.get(gameId);
    if (!state) {
        // 시연 첫 진입 시드 — 사용자마다 독립 복사본을 둔다
        state = { ...(seedPlayState[gameId] ?? defaultPlayState()) };
        states.set(gameId, state);
    }
    return state;
};

export const gameHandlers = [
    http.get(api('/games'), ({ request }) => {
        const userId = userIdOf(request);
        return HttpResponse.json(
            mockGames.map((game) => ({ ...game, ...stateFor(userId, game.id) })),
        );
    }),
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
        const userId = userIdOf(request);
        const state = stateFor(userId, game.id);

        const { score } = (await request.json()) as { score: number };
        state.bestScore = Math.max(state.bestScore ?? 0, score);
        state.todayPlayCount += 1;
        const ticketsGranted = state.rewardedToday ? 0 : 1;
        if (ticketsGranted > 0) {
            state.rewardedToday = true;
            state.remainingPlays = 0;
            recordMockTicketGrant(userId, ticketsGranted, `${game.title} 게임 보상`);
        }
        return HttpResponse.json(
            {
                gameId: game.id,
                score,
                bestScore: state.bestScore,
                todayPlayCount: state.todayPlayCount,
                ticketsGranted,
            },
            { status: 201 },
        );
    }),
];
