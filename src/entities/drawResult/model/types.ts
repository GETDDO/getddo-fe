import { z } from 'zod';

// getddo-spec 05-api/drawing.md의 PublicResults — 공개 결과 조회(E08) 계약
export const drawDisplayStatusSchema = z.enum([
    'WAITING',
    'PUBLISHED',
    'CANCELED',
    'NO_ENTRANTS',
    'NO_ELIGIBLE_ENTRANTS',
]);

/**
 * 공개된 당첨자.
 *
 * 서버가 마스킹해서 내려준다 — 원본 개인정보·사용자 ID·가중치·검토 사유는 담기지 않는다.
 * 화면에서 다시 가리거나 풀지 않고 받은 값을 그대로 쓴다 (마스킹 규칙은 담당자 계약).
 */
export const maskedWinnerSchema = z.object({
    maskedName: z.string(),
    maskedPhoneNum: z.string().nullable().optional(),
    maskedEmail: z.string().nullable().optional(),
});

export const publishedPrizeSchema = z.object({
    prizeId: z.string(),
    rank: z.number().int().positive(),
    name: z.string(),
    winnerCount: z.number().int().nonnegative(),
    /** 후보 부족으로 확정된 미충원 자리 — 재추첨·확인 대기를 여기에 넣지 않는다 */
    unfilledCount: z.number().int().nonnegative(),
    winners: z.array(maskedWinnerSchema),
});

/**
 * 이벤트의 공개 추첨 결과.
 *
 * 발표 전에는 isPublished=false, prizes=[]다. 예정 시각이 지났다는 사실만으로 공개하지 않으며,
 * publicationScheduledAt은 원래 예정 시각이라 실제 공개 시각(publishedAt)과 다를 수 있다.
 */
export const publicResultsSchema = z.object({
    eventId: z.string(),
    isPublished: z.boolean(),
    publicationScheduledAt: z.iso.datetime(),
    publishedAt: z.iso.datetime().nullable(),
    revision: z.number().int().nullable(),
    updatedAt: z.iso.datetime().nullable(),
    serverTime: z.iso.datetime(),
    displayStatus: drawDisplayStatusSchema,
    prizes: z.array(publishedPrizeSchema),
});

export type DrawDisplayStatus = z.infer<typeof drawDisplayStatusSchema>;
export type MaskedWinner = z.infer<typeof maskedWinnerSchema>;
export type PublishedPrize = z.infer<typeof publishedPrizeSchema>;
export type PublicResults = z.infer<typeof publicResultsSchema>;
