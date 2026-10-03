import { lazy, Suspense } from 'react';

// 게임 엔진·캔버스·에셋 로더는 시작 시점에만 필요하므로 별도 청크로 나눠 유저 번들에서 뺀다
const TakkoRunGame = lazy(() =>
    import('./TakkoRunGame').then((m) => ({ default: m.TakkoRunGame })),
);

/** 게임 id에 맞는 미니게임 플레이 화면 — 있는지는 hasGamePlayer로 먼저 확인한다 */
export function GamePlayer({
    gameId,
    bestScore,
    onExit,
    onGameOver,
}: {
    gameId: string;
    bestScore?: number;
    onExit: () => void;
    onGameOver?: (score: number) => Promise<{ ticketsGranted: number } | void> | void;
}) {
    if (gameId === 'game-dino') {
        return (
            <Suspense fallback={null}>
                <TakkoRunGame bestScore={bestScore} onExit={onExit} onGameOver={onGameOver} />
            </Suspense>
        );
    }
    return null;
}
