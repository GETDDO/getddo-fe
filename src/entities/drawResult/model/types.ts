import { z } from 'zod';

// getddo-spec 05-api/drawing.md의 PublicResults — 공개 결과 조회(E08) 계약
// NO_ELIGIBLE_ENTRANTS는 신규 응답에서 생성하지 않지만, 과거 응답 파싱이 깨지지 않도록 값만 남긴다 (ADR-018)
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

// ── 관리자 추첨 관리(GD-125) — getddo-spec 05-api/drawing.md AD01~AD09 ──
// 추첨 실행 상태 — getddo-spec 05-api/drawing.md DrawRun (검토 대기 초안)
export const drawRunStatusSchema = z.enum(['PREPARING', 'READY', 'RUNNING', 'CONFIRMED', 'FAILED']);
export const drawExecutionTypeSchema = z.enum(['AUTO', 'MANUAL']);

export const drawRunSchema = z.object({
    id: z.string(),
    eventId: z.string(),
    runNumber: z.number().int(),
    executionType: drawExecutionTypeSchema,
    status: drawRunStatusSchema,
    // 이벤트의 최초 실행 ID — 시간상 직전 실행이나 취소 원본 실행이 아니다
    originalDrawId: z.string().nullable(),
    startedAt: z.iso.datetime().nullable(),
    confirmedAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
});

export const cancellationSummarySchema = z.object({
    id: z.string(),
    canceledDrawResultId: z.string(),
    canceledDrawRunId: z.string(),
    canceledBy: z.string(),
    reason: z.string(),
    canceledAt: z.iso.datetime(),
});

export const drawResultSchema = z.object({
    id: z.string(),
    prizeId: z.string(),
    prizeRank: z.number().int(),
    slotNumber: z.number().int(),
    selectionOrder: z.number().int().nullable(),
    resultType: z.enum(['SELECTED', 'UNFILLED']),
    candidateId: z.string().nullable(),
    userId: z.string().nullable(),
    // 실제 공개 명단에 반영된 이력 — 현재 명단 포함 여부가 아니다
    wasPublished: z.boolean(),
    isCanceled: z.boolean(),
});

export const drawRunDetailSchema = drawRunSchema.extend({
    algorithmVersion: z.string().nullable(),
    rulesSnapshot: z.record(z.string(), z.unknown()).nullable(),
    snapshotFixedAt: z.iso.datetime().nullable(),
    cancellations: z.array(cancellationSummarySchema),
    results: z.array(drawResultSchema),
    failureCount: z.number().int(),
    lastFailureCode: z.string().nullable(),
    lastFailureMessage: z.string().nullable(),
    lastFailedAt: z.iso.datetime().nullable(),
    lastFailureTraceId: z.string().nullable(),
});

// ticketCount는 실제 차감 장수, weight는 등급 가중치 합(브론즈 1·실버 3·골드 5)으로 서로 다른 값이다
export const drawCandidateSchema = z.object({
    id: z.string(),
    participantId: z.string(),
    userId: z.string(),
    ticketCount: z.number().int(),
    weight: z.number().int(),
    entrySnapshot: z.record(z.string(), z.unknown()),
    eligibilitySnapshot: z.record(z.string(), z.unknown()),
});

export const drawVerificationSchema = z.object({
    id: z.string(),
    drawRunId: z.string(),
    passed: z.boolean(),
    checks: z.array(z.object({ code: z.string(), passed: z.boolean(), message: z.string() })),
    verifiedAt: z.iso.datetime(),
    verifiedBy: z.string(),
});

// 확정 결과 항목 — getddo-spec 05-api/drawing.md GD-138 절(AD09)·GD-87 절(최초 재개). DrawResult와 필드명이 다르다(resultId·rank)
export const drawConfirmationResultSchema = z.object({
    resultId: z.string(),
    prizeId: z.string(),
    rank: z.number().int(),
    slotNumber: z.number().int(),
    selectionOrder: z.number().int().nullable(),
    candidateId: z.string().nullable(),
    userId: z.string().nullable(),
    resultType: z.enum(['SELECTED', 'UNFILLED']),
});

export const drawConfirmationSchema = z.object({
    confirmedAt: z.iso.datetime(),
    results: z.array(drawConfirmationResultSchema),
});

/**
 * 추첨 실행 시작·재개 응답 (최초 재개 `POST /admin/draws/{runId}/resume`, AD09 공통).
 * confirmation은 확정 전 null이고, 확정(200)이면 저장된 결과를 그대로 돌려준다 — 202는 확정 성공을 보장하지 않는다.
 */
export const drawExecutionResponseSchema = z.object({
    runId: z.string(),
    status: drawRunStatusSchema,
    confirmation: drawConfirmationSchema.nullable(),
});

export type DrawRunStatus = z.infer<typeof drawRunStatusSchema>;
export type DrawRun = z.infer<typeof drawRunSchema>;
export type CancellationSummary = z.infer<typeof cancellationSummarySchema>;
export type DrawResult = z.infer<typeof drawResultSchema>;
export type DrawRunDetail = z.infer<typeof drawRunDetailSchema>;
export type DrawCandidate = z.infer<typeof drawCandidateSchema>;
export type DrawVerification = z.infer<typeof drawVerificationSchema>;
export type DrawConfirmationResult = z.infer<typeof drawConfirmationResultSchema>;
export type DrawConfirmation = z.infer<typeof drawConfirmationSchema>;
export type DrawExecutionResponse = z.infer<typeof drawExecutionResponseSchema>;

// getddo-spec 05-api/drawing.md E09 MyResult — 본인 결과. 공개 전에는 당첨 여부를 PENDING으로 감춘다.
// EXCLUDED는 ADR-018로 계약에서 빠졌지만 과거 응답 파싱이 깨지지 않도록 값만 남긴다
export const myResultStatusSchema = z.enum([
    'NOT_ENTERED',
    'PENDING',
    'WON',
    'LOST',
    'CANCELED',
    'EXCLUDED',
]);

// spec의 Prize — 본인 결과 화면에 필요한 식별·등수·이름만 검증한다
export const myResultPrizeSchema = z.object({
    prizeId: z.string(),
    rank: z.number().int().positive(),
    name: z.string(),
});

export const myResultSchema = z.object({
    eventId: z.string(),
    result: myResultStatusSchema,
    prize: myResultPrizeSchema.nullable(),
    isPublished: z.boolean(),
    revision: z.number().int().nullable(),
    serverTime: z.iso.datetime(),
});

export type MyResultStatus = z.infer<typeof myResultStatusSchema>;
export type MyResult = z.infer<typeof myResultSchema>;
