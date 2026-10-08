import { lazy, Suspense } from 'react';

import { GameImageButton } from './GameImageButton';

// 게임 엔진·캔버스·에셋 로더는 시작 시점에만 필요하므로 별도 청크로 나눠 유저 번들에서 뺀다
const TakkoRunGame = lazy(() =>
    import('./TakkoRunGame').then((m) => ({ default: m.TakkoRunGame })),
);
const ColorWordGame = lazy(() =>
    import('./ColorWordGame').then((m) => ({ default: m.ColorWordGame })),
);

/** 게임 코드를 내려받는 동안의 화면 — 게임 영역과 나가기 버튼을 유지해 느린 네트워크에서도 화면이 비거나 갇히지 않게 한다 (모든 게임 공통) */
function GameLoading({ onExit }: { onExit: () => void }) {
    return (
        <div className="bg-surface-page border-fg-primary relative aspect-[840/546] w-full overflow-hidden rounded-2xl border-2 shadow-md">
            <div className="absolute top-2 left-2">
                <GameImageButton kind="exit" size="small" onClick={onExit} />
            </div>
            <p className="text-body text-fg-secondary flex h-full items-center justify-center">
                게임을 불러오는 중이에요
            </p>
        </div>
    );
}

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
            <Suspense fallback={<GameLoading onExit={onExit} />}>
                <TakkoRunGame bestScore={bestScore} onExit={onExit} onGameOver={onGameOver} />
            </Suspense>
        );
    }
    if (gameId === 'game-color') {
        return (
            <Suspense fallback={<GameLoading onExit={onExit} />}>
                <ColorWordGame bestScore={bestScore} onExit={onExit} onGameOver={onGameOver} />
            </Suspense>
        );
    }
    return null;
}
