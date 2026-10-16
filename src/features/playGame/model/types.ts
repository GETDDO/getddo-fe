import { z } from 'zod';

import { ticketGradeSchema } from '@entities/ticket';

/**
 * 플레이 결과 제출 응답 — 백엔드 계약 확정 전 임시.
 * 서버가 점수를 판정해 최고점·오늘 플레이 수를 갱신하고, 오늘 첫 유효 플레이면 응모권 1장을 준다 (getddo-spec 게임 규칙)
 */
export const playResultSchema = z.object({
    gameId: z.string(),
    score: z.number().int().nonnegative(),
    bestScore: z.number().int().nonnegative(),
    todayPlayCount: z.number().int().nonnegative(),
    /** 이번 플레이로 받은 응모권 수 — 오늘 이미 받았으면 0 */
    ticketsGranted: z.number().int().nonnegative(),
    /** 이번 플레이로 받은 보상 — 서버가 추첨한 등급 응모권 1장 (getddo-spec 색깔 게임 연동 계약의 reward). 못 받았으면 null */
    reward: z
        .object({ ticketCount: z.number().int().positive(), grade: ticketGradeSchema })
        .nullish(),
});

export type PlayResult = z.infer<typeof playResultSchema>;

/** 게임이 끝났을 때 부르는 제출 함수 — 보상을 받았으면 받은 수와 등급을 돌려준다 */
export type GameOverHandler = (
    score: number,
) => Promise<Pick<PlayResult, 'ticketsGranted' | 'reward'> | void> | void;
