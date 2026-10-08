import { z } from 'zod';

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

export type DrawRunStatus = z.infer<typeof drawRunStatusSchema>;
export type DrawRun = z.infer<typeof drawRunSchema>;
export type CancellationSummary = z.infer<typeof cancellationSummarySchema>;
export type DrawResult = z.infer<typeof drawResultSchema>;
export type DrawRunDetail = z.infer<typeof drawRunDetailSchema>;
export type DrawCandidate = z.infer<typeof drawCandidateSchema>;
export type DrawVerification = z.infer<typeof drawVerificationSchema>;
