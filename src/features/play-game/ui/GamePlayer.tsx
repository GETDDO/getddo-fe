import { TakkoRunGame } from './TakkoRunGame';

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
        return <TakkoRunGame bestScore={bestScore} onExit={onExit} onGameOver={onGameOver} />;
    }
    return null;
}
