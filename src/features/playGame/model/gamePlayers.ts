// 플레이 화면이 있는 게임 — 게임 id별 구현은 ui/GamePlayer에서 고른다 (다른 게임은 만들면 여기에 더한다)
const PLAYABLE_GAME_IDS = new Set(['game-dino']);

export const hasGamePlayer = (gameId: string) => PLAYABLE_GAME_IDS.has(gameId);
